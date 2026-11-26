// Growth (/admin/growth): what your DMs and posts do for the account itself. Followers over time, the account's reach
// and engagement from Instagram's insights, which posts pull comments (and how many of those became DMs), and the one
// thing no other report shows: contacts who weren't following you when Relay first checked, and followed after your
// automation DM'd them.
//
// What Instagram allows (Instagram API with Instagram Login, insights permission): account totals for up to 30 days
// (reach, views, accounts engaged, interactions, profile link taps, follows and unfollows), per-post insights, the
// account's follower count, and `is_user_follow_business` for people who messaged you. It never says WHO followed or
// WHY, so "followed after a DM" is an observation (not following at first check, following later), shown as that.

import { esc, page, type Role } from "./admin";
import { barRow, CHART_JS, lineChart } from "./charts";
import * as db from "./db";
import { graph } from "./meta";
import type { Env } from "./setter";
import { icon } from "./theme";

const DAY = 86_400_000;
const HOUR = 3_600_000;
const CACHE_MS = 3 * HOUR;

const auth = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

// ------------------------------------------------------------------------------------------------ cron: followers

// One reading of the follower count per UTC day (refreshed every 3 hours, so the day keeps its latest value).
export async function snapshotFollowers(env: Env, now: number): Promise<void> {
  const token = await db.getSetting(env.DB, "ig_token");
  if (!token) return;
  const day = Math.floor(now / DAY);
  const last = await env.DB.prepare(`SELECT at FROM follower_snapshots WHERE day = ?1`).bind(day).first<{ at: number }>();
  if (last && now - last.at < CACHE_MS) return;
  const a = await graph<{ followers_count?: number; follows_count?: number; media_count?: number }>(`/me?fields=followers_count,follows_count,media_count`, auth(token));
  if (typeof a.followers_count !== "number") return;
  await env.DB.prepare(
    `INSERT INTO follower_snapshots (day, followers, follows, media, at) VALUES (?1, ?2, ?3, ?4, ?5)
     ON CONFLICT(day) DO UPDATE SET followers = ?2, follows = ?3, media = ?4, at = ?5`,
  )
    .bind(day, a.followers_count, a.follows_count ?? null, a.media_count ?? null, now)
    .run();
}

// Follow status of people an automation reached in the last 21 days: first check soon after the DM, then every 6
// hours while they aren't following. 25 per run keeps the cron well inside its subrequest budget.
export async function checkFollows(env: Env, now: number): Promise<number> {
  const token = await db.getSetting(env.DB, "ig_token");
  if (!token) return 0;
  const { results } = await env.DB.prepare(
    `SELECT DISTINCT l.subscriber_id AS id, l.follows AS f FROM flow_starts s JOIN leads l ON l.subscriber_id = s.subscriber_id
     WHERE s.status = 'sent' AND s.created_at >= ?1 AND l.members IS NULL AND l.subscriber_id NOT LIKE 'g:%' AND l.subscriber_id NOT LIKE 'fb:%'
       AND (l.follow_checked_at IS NULL OR (COALESCE(l.follows, 0) = 0 AND l.follow_checked_at < ?2))
     LIMIT 25`,
  )
    .bind(now - 21 * DAY, now - 6 * HOUR)
    .all<{ id: string; f: number | null }>();
  for (const r of results) {
    let yes: boolean | null = null;
    try {
      const p = await graph<{ is_user_follow_business?: boolean }>(`/${encodeURIComponent(r.id)}?fields=is_user_follow_business`, auth(token));
      if (typeof p.is_user_follow_business === "boolean") yes = p.is_user_follow_business;
    } catch {
      yes = null;
    }
    await env.DB.prepare(
      `UPDATE leads SET follow_checked_at = ?2,
         follows = COALESCE(?3, follows),
         follow_first = COALESCE(follow_first, ?3),
         follows_at = CASE WHEN follows_at IS NULL AND ?3 = 1 AND follow_first = 0 THEN ?2 ELSE follows_at END
       WHERE subscriber_id = ?1`,
    )
      .bind(r.id, now, yes === null ? null : yes ? 1 : 0)
      .run();
  }
  return results.length;
}

// --------------------------------------------------------------------------------------------- insights (cached)

export interface Post {
  id: string;
  caption: string;
  permalink: string | null;
  type: string | null;
  thumb: string | null;
  at: number;
  likes: number | null;
  comments: number | null;
  reach: number | null;
  views: number | null;
  saved: number | null;
  shares: number | null;
}
export interface GrowthCache {
  at: number;
  totals: Record<string, number>; // account insights, last 30 days
  follows: number | null;
  unfollows: number | null;
  posts: Post[];
  error: string | null; // why insights couldn't be read (permission missing, etc.)
}

const ACCOUNT_METRICS = ["reach", "views", "accounts_engaged", "total_interactions", "profile_links_taps", "likes", "comments", "shares", "saves", "replies"];

async function fetchGrowth(token: string, now: number): Promise<GrowthCache> {
  const until = Math.floor(now / 1000);
  const since = until - 30 * 86400 + 120;
  const base = `period=day&metric_type=total_value&since=${since}&until=${until}`;
  const out: GrowthCache = { at: now, totals: {}, follows: null, unfollows: null, posts: [], error: null };
  try {
    const r = await graph<{ data: { name: string; total_value?: { value?: number } }[] }>(`/me/insights?metric=${ACCOUNT_METRICS.join(",")}&${base}`, auth(token));
    for (const m of r.data ?? []) if (typeof m.total_value?.value === "number") out.totals[m.name] = m.total_value.value;
  } catch (e) {
    out.error = String(e instanceof Error ? e.message : e).slice(0, 300);
  }
  try {
    const r = await graph<{ data: { total_value?: { breakdowns?: { results?: { dimension_values: string[]; value: number }[] }[] } }[] }>(
      `/me/insights?metric=follows_and_unfollows&breakdown=follow_type&${base}`,
      auth(token),
    );
    for (const x of r.data?.[0]?.total_value?.breakdowns?.[0]?.results ?? []) {
      if (x.dimension_values[0] === "FOLLOWER") out.follows = x.value;
      if (x.dimension_values[0] === "NON_FOLLOWER") out.unfollows = x.value;
    }
  } catch {
    /* fewer than 100 followers: Instagram doesn't report follows; the snapshots still do */
  }
  try {
    const m = await graph<{ data: { id: string; caption?: string; permalink?: string; media_type?: string; media_product_type?: string; thumbnail_url?: string; media_url?: string; timestamp?: string; like_count?: number; comments_count?: number }[] }>(
      `/me/media?fields=id,caption,permalink,media_type,media_product_type,thumbnail_url,media_url,timestamp,like_count,comments_count&limit=12`,
      auth(token),
    );
    out.posts = await Promise.all(
      (m.data ?? []).map(async (p) => {
        const post: Post = {
          id: p.id,
          caption: (p.caption ?? "").replace(/\s+/g, " ").trim(),
          permalink: p.permalink ?? null,
          type: p.media_product_type ?? p.media_type ?? null,
          thumb: p.thumbnail_url ?? (p.media_type === "VIDEO" ? null : (p.media_url ?? null)),
          at: p.timestamp ? Date.parse(p.timestamp) : 0,
          likes: p.like_count ?? null,
          comments: p.comments_count ?? null,
          reach: null,
          views: null,
          saved: null,
          shares: null,
        };
        try {
          const i = await graph<{ data: { name: string; values?: { value: number }[]; total_value?: { value: number } }[] }>(`/${p.id}/insights?metric=reach,views,saved,shares`, auth(token));
          for (const x of i.data ?? []) {
            const v = x.total_value?.value ?? x.values?.[0]?.value ?? null;
            if (x.name === "reach") post.reach = v;
            if (x.name === "views") post.views = v;
            if (x.name === "saved") post.saved = v;
            if (x.name === "shares") post.shares = v;
          }
        } catch {
          /* older posts or ones without insights: likes and comments still show */
        }
        return post;
      }),
    );
  } catch {
    /* posts stay empty */
  }
  return out;
}

export async function growthData(env: Env, now: number, refresh = false): Promise<GrowthCache | null> {
  let cached: GrowthCache | null = null;
  try {
    cached = JSON.parse((await db.getSetting(env.DB, "growth_cache")) ?? "null") as GrowthCache | null;
  } catch {
    cached = null;
  }
  const token = await db.getSetting(env.DB, "ig_token");
  if (!token) return cached; // the local preview's sample, or nothing yet
  if (cached && !refresh && now - cached.at < CACHE_MS) return cached;
  const fresh = await fetchGrowth(token, now).catch(() => null);
  if (!fresh) return cached;
  await db.setSetting(env.DB, "growth_cache", JSON.stringify(fresh));
  return fresh;
}

// ---------------------------------------------------------------------------------------------------------- page

const num = (n: number | null | undefined) => (n === null || n === undefined ? "–" : n.toLocaleString("en-US"));
const short = (n: number | null | undefined) =>
  n === null || n === undefined ? "–" : n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M` : n >= 1e4 ? `${(n / 1e3).toFixed(1).replace(/\.0$/, "")}K` : n.toLocaleString("en-US");
const pct = (a: number, b: number) => (b ? `${Math.round((1000 * a) / b) / 10}%` : "–");

function deltaPill(now: number | null, then: number | null, label: string): string {
  if (now === null || then === null) return `<span class="dp">${label} <b>–</b></span>`;
  const d = now - then;
  return `<span class="dp ${d > 0 ? "up" : d < 0 ? "down" : ""}">${label} <b>${d > 0 ? "+" : ""}${d.toLocaleString("en-US")}</b></span>`;
}

export async function growthPage(env: Env, req: Request, who: Role, now: number): Promise<Response> {
  const url = new URL(req.url);
  const D = env.DB;
  const data = who === "admin" ? await growthData(env, now, url.searchParams.has("refresh")) : null;
  const connected = Boolean(await db.getSetting(D, "ig_token"));

  // Followers over 90 days, from Relay's own daily readings.
  const { results: snaps } = await D.prepare(`SELECT day, followers FROM follower_snapshots WHERE day >= ?1 ORDER BY day`)
    .bind(Math.floor(now / DAY) - 89)
    .all<{ day: number; followers: number }>();
  const byDay = new Map(snaps.map((s) => [s.day, s.followers]));
  const latest = snaps.at(-1)?.followers ?? null;
  const at = (daysAgo: number) => {
    const target = Math.floor(now / DAY) - daysAgo;
    for (let d = target; d >= target - 3; d--) if (byDay.has(d)) return byDay.get(d) ?? null;
    return null;
  };
  const first = snaps[0]?.day ?? Math.floor(now / DAY);
  const days: number[] = [];
  for (let d = first; d <= Math.floor(now / DAY); d++) days.push(d);
  let carry = snaps[0]?.followers ?? 0;
  const series = days.map((d) => (byDay.has(d) ? (carry = byDay.get(d) ?? carry) : carry));
  const labels = days.map((d) => new Date(d * DAY).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }));

  // DMs → followers, for people an automation reached in the last 30 days.
  const since = now - 30 * DAY;
  const f = (await D.prepare(
    `SELECT COUNT(*) AS reached, SUM(l.follow_checked_at IS NOT NULL) AS checked, SUM(l.follow_first = 1) AS already,
            SUM(l.follow_first = 0) AS notyet, SUM(l.follows_at IS NOT NULL) AS gained
     FROM leads l WHERE l.subscriber_id IN (SELECT subscriber_id FROM flow_starts WHERE status = 'sent' AND created_at >= ?1)`,
  )
    .bind(since)
    .first<{ reached: number; checked: number | null; already: number | null; notyet: number | null; gained: number | null }>()) ?? { reached: 0, checked: 0, already: 0, notyet: 0, gained: 0 };
  const gained = f.gained ?? 0;
  const notyet = f.notyet ?? 0;
  const { results: byAuto } = await D.prepare(
    `SELECT t.id, COALESCE(NULLIF(t.name, ''), t.keyword) AS name, t.source, COUNT(DISTINCT s.subscriber_id) AS reached,
            COUNT(DISTINCT CASE WHEN l.follow_first = 0 THEN s.subscriber_id END) AS notyet,
            COUNT(DISTINCT CASE WHEN l.follows_at IS NOT NULL AND l.follows_at >= s.created_at THEN s.subscriber_id END) AS gained
     FROM flow_starts s JOIN triggers t ON t.id = s.trigger_id JOIN leads l ON l.subscriber_id = s.subscriber_id
     WHERE s.status = 'sent' AND s.created_at >= ?1 AND s.trigger_id > 0
     GROUP BY t.id ORDER BY gained DESC, reached DESC LIMIT 8`,
  )
    .bind(since)
    .all<{ id: number; name: string; source: string; reached: number; notyet: number; gained: number }>();

  // Comments per post, and how many became DMs.
  const { results: perPost } = await D.prepare(
    `SELECT c.media_id AS id, COUNT(*) AS comments, SUM(c.status = 'sent') AS dms, MAX(t.keyword) AS kw
     FROM comments c LEFT JOIN triggers t ON t.id = c.trigger_id WHERE c.media_id IS NOT NULL GROUP BY c.media_id`,
  ).all<{ id: string; comments: number; dms: number | null; kw: string | null }>();
  const postStats = new Map(perPost.map((p) => [p.id, p]));

  const tot = data?.totals ?? {};
  const net = data && data.follows !== null && data.unfollows !== null ? data.follows - data.unfollows : null;
  const tile = (k: string, label: string, value: string, sub = "") => `<div class="stat" data-k="${k}"><div class="lbl">${label}</div><b>${value}</b><small>${sub || "Last 30 days"}</small></div>`;

  const spark = (vals: number[]) => {
    if (vals.length < 2) return "";
    const lo = Math.min(...vals);
    const hi = Math.max(lo + 1, ...vals);
    const pts = vals.map((v, i) => `${((i / (vals.length - 1)) * 100).toFixed(1)},${(28 - ((v - lo) / (hi - lo)) * 24).toFixed(1)}`).join(" ");
    return `<svg class="spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><polyline points="0,30 ${pts} 100,30" fill="color-mix(in srgb,var(--pri) 12%,transparent)"/><polyline points="${pts}" fill="none" stroke="var(--pri)" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg>`;
  };

  const notice = !connected
    ? data
      ? `<div class="banner">${icon("info", 16)}<span><b>${env.DEMO_ON === "1" ? "Demo mode." : "Sample data."}</b> These are invented numbers. With demo off, this page shows your own, straight from Instagram.</span></div>`
      : `<div class="banner">${icon("info", 16)}<span><b>Connect Instagram to see your growth.</b> <a href="/admin/setup">Open the Setup guide</a>.</span></div>`
    : data?.error
      ? `<div class="banner warn">${icon("info", 16)}<span><b>Instagram didn't share insights.</b> Relay now asks for the insights permission: <a href="/auth/start">reconnect Instagram</a> and approve it. Followers and DM numbers below still work.<small>${esc(data.error)}</small></span></div>`
      : "";

  const hero = `<section class="ghero2">
<div class="gh-a"><p class="kicker">Followers</p><b class="gh-n">${short(latest)}</b><div class="dps">${deltaPill(latest, at(1), "Today")}${deltaPill(latest, at(7), "7 days")}${deltaPill(latest, at(30), "30 days")}</div>${spark(series.slice(-30))}</div>
<div class="gh-b"><p class="kicker">Followed after your DM · 30 days</p><b class="gh-n hi">${num(gained)}</b><p>${
    notyet
      ? `<b>${pct(gained, notyet)}</b> of the ${num(notyet)} people who weren't following when Relay first checked now follow you.`
      : "Relay checks follow status after each automation DM. Numbers appear once your automations reach people."
  }</p></div>
<div class="gh-c"><p class="kicker">Net follows · 30 days</p><b class="gh-n">${net === null ? "–" : `${net > 0 ? "+" : ""}${num(net)}`}</b><p>${
    data?.follows !== null && data?.follows !== undefined ? `${num(data.follows)} follows, ${num(data.unfollows)} unfollows, from Instagram.` : "Instagram reports follows once an account has 100+ followers."
  }</p></div></section>`;

  const tiles = `<div class="stats">${[
    tile("reach", "Accounts reached", short(tot.reach)),
    tile("views", "Views", short(tot.views)),
    tile("engaged", "Accounts engaged", short(tot.accounts_engaged)),
    tile("inter", "Interactions", short(tot.total_interactions), tot.comments !== undefined ? `${num(tot.comments)} comments · ${num(tot.saves)} saves` : ""),
    tile("taps", "Profile link taps", short(tot.profile_links_taps)),
    tile("replies", "Story replies", short(tot.replies)),
  ].join("")}</div>`;

  const chart = lineChart([{ name: "Followers", color: "var(--pri)", values: series, fill: true }], labels, {
    label: `Followers over ${series.length} days`,
    empty: "Relay records your follower count once a day after Instagram is connected. The line starts tomorrow.",
  });

  const funnel = f.reached
    ? [
        barRow("Got an automation DM", f.reached, 1),
        barRow("Follow status checked", f.checked ?? 0, (f.checked ?? 0) / f.reached),
        barRow("Already followed you", f.already ?? 0, (f.already ?? 0) / f.reached, "before the DM", true),
        barRow("Weren't following yet", notyet, notyet / f.reached),
        barRow("Followed after the DM", gained, notyet ? gained / notyet : null, notyet ? `of ${num(notyet)}` : ""),
      ].join("")
    : `<p class="none">No automation DMs in the last 30 days. <a href="/admin/automations">Publish an automation</a> and its follow-through shows up here.</p>`;

  const autoRows = byAuto
    .map(
      (r) => `<tr><td><a class="nm" href="/admin/flows/${r.id}">${esc(r.name || `Automation ${r.id}`)}</a></td><td class="r">${num(r.reached)}</td><td class="r wide">${num(r.notyet)}</td><td class="r"><b class="hi">${num(r.gained)}</b></td><td class="r">${pct(r.gained, r.notyet)}</td></tr>`,
    )
    .join("");
  const autoTable = byAuto.length
    ? `<table class="tbl"><thead><tr><th>Automation</th><th class="r">Reached</th><th class="r wide">Not following</th><th class="r">New followers</th><th class="r">Follow rate</th></tr></thead><tbody>${autoRows}</tbody></table>`
    : `<p class="none">Once automations run, each one is ranked by the followers it brought in.</p>`;

  const posts = (data?.posts ?? []).slice(0, 9);
  const maxReach = Math.max(1, ...posts.map((p) => p.reach ?? 0));
  const postCards = posts
    .map((p) => {
      const s = postStats.get(p.id);
      const kind = (p.type ?? "").toUpperCase() === "REELS" ? "Reel" : (p.type ?? "").toUpperCase() === "STORY" ? "Story" : "Post";
      return `<a class="pc" ${p.permalink ? `href="${esc(p.permalink)}" target="_blank" rel="noopener"` : ""}>
<span class="pc-img">${p.thumb ? `<img src="${esc(p.thumb)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ""}<span class="pc-k">${kind}</span>${s?.kw ? `<span class="pc-kw">${esc(s.kw)}</span>` : ""}</span>
<span class="pc-b"><span class="pc-c">${esc(p.caption.slice(0, 80) || "(no caption)")}</span>
<span class="pc-bar"><i style="width:${Math.round(((p.reach ?? 0) / maxReach) * 100)}%"></i></span>
<span class="pc-m"><span><b>${short(p.reach)}</b>reach</span><span><b>${short(p.likes)}</b>likes</span><span><b>${short(p.comments)}</b>comments</span><span><b>${short(s?.dms ?? 0)}</b>DMs sent</span></span></span></a>`;
    })
    .join("");

  const body = `${notice}${hero}${tiles}
<div class="cols"><div class="card"><div class="ph"><div><h2>Followers</h2><p>Relay's daily reading of your follower count.</p></div><div class="lgd"><span><i style="background:var(--pri)"></i>Followers<b>${short(latest)}</b></span></div></div>${chart}</div>
<div class="card"><div class="ph"><div><h2>From DM to follower</h2><p>People your automations reached in the last 30 days.</p></div></div>${funnel}</div></div>
<div class="card"><div class="ph"><div><h2>Which automations bring followers</h2><p>New followers = people who weren't following when Relay first checked, and followed after this automation's DM.</p></div><a href="/admin/automations">All automations</a></div>${autoTable}</div>
<div class="card"><div class="ph"><div><h2>Your latest posts</h2><p>Reach and engagement from Instagram, with the comments that turned into DMs.</p></div>${who === "admin" && connected ? `<a href="?refresh=1">Refresh from Instagram</a>` : ""}</div>${
    postCards ? `<div class="pcs">${postCards}</div>` : `<p class="none">Your posts show up here after Instagram is connected.</p>`
  }</div>
<p class="foot-note">${data ? `Instagram numbers as of ${esc(new Date(data.at).toUTCString().replace(" GMT", " UTC"))}, refreshed every 3 hours. ` : ""}Instagram never tells apps who followed you or why. "Followed after your DM" counts people who weren't following when Relay first looked, and were on a later check.</p>${CHART_JS}`;

  return page("Growth", body, who, env, { title: "Growth", actions: `<span class="kicker" style="color:var(--mut)">Last 30 days</span>` });
}
