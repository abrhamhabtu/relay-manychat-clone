// Accounts: every Instagram page you run with Relay, in one place.
//
// One Relay install runs one Instagram account (Instagram gives each connected app one token per account, and every
// table here belongs to that account). Running several pages means one install per page, each on its own address. This
// page and the switcher at the top of the sidebar link them together: the list lives in the `accounts` setting of
// each install, so every console can jump to the others. Nothing here sends anything to the other installs.

import { connectedPage, messengerReady, type ConnectedPage } from "./messenger_admin";
import { esc, me, meAvatar, page, type Role } from "./admin";
import { ORIGIN } from "./brand";
import * as db from "./db";
import type { Env } from "./setter";
import { icon } from "./theme";

export interface Linked {
  handle: string; // without the @
  url: string; // the other install's console origin, https://…
}

const MAX = 24;

// Accepts "@name", "name" or an instagram.com link. Instagram usernames: letters, digits, dots, underscores, ≤30.
export function cleanHandle(raw: string): string | null {
  const h = raw
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/[/?#].*$/, "")
    .replace(/^@/, "")
    .toLowerCase();
  return /^[a-z0-9._]{1,30}$/.test(h) ? h : null;
}

// Only an http(s) origin is kept (no paths, no credentials), so a stored entry can never become a javascript: link.
export function cleanUrl(raw: string): string | null {
  let s = raw.trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    if (u.protocol !== "https:" && !(u.protocol === "http:" && /^(localhost|127\.0\.0\.1)$/.test(u.hostname))) return null;
    if (u.username || u.password) return null;
    return u.origin;
  } catch {
    return null;
  }
}

export function parseLinked(raw: string | null): Linked[] {
  try {
    const v = JSON.parse(raw ?? "[]") as unknown;
    if (!Array.isArray(v)) return [];
    return v
      .map((a) => {
        if (!a || typeof a !== "object") return null;
        const o = a as Partial<Linked>;
        const handle = cleanHandle(String(o.handle ?? ""));
        const url = cleanUrl(String(o.url ?? ""));
        return handle && url ? { handle, url } : null;
      })
      .filter((a): a is Linked => a !== null)
      .slice(0, MAX);
  } catch {
    return [];
  }
}

export async function linked(env: Env): Promise<Linked[]> {
  return parseLinked(await db.getSetting(env.DB, "accounts"));
}

// A deterministic color per handle, so an account keeps its color in every console.
const SWATCH = ["#c73a0c", "#16140f", "#2c7a35", "#8a5a00", "#5b4a9e", "#1f6f8b", "#a3245b", "#4b5563"];
export function initialAvatar(handle: string, cls = ""): string {
  let h = 0;
  for (const c of handle) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `<span class="av${cls ? ` ${cls}` : ""}" style="background:${SWATCH[h % SWATCH.length]}">${esc(handle.charAt(0).toUpperCase() || "?")}</span>`;
}

// The dropdown under the logo: this account, the linked ones, and the way to the Accounts page.
export function switcher(current: { username: string | null; name: string | null; pic: string | null } | null, others: Linked[], who: Role): string {
  const name = current?.name || current?.username || (who === "admin" ? "Connect Instagram" : "Relay");
  const handle = current?.username ? `@${current.username}` : "not connected";
  const rows = others
    .map(
      (a) =>
        `<a href="${esc(a.url)}/admin/dashboard" rel="noopener">${initialAvatar(a.handle)}<span class="grow">@${esc(a.handle)}<small>${esc(new URL(a.url).host)}</small></span>${icon("chevron", 14)}</a>`,
    )
    .join("");
  return `<details class="acsw"><summary title="Switch account">${meAvatar(current)}<span class="l">${esc(name)}<small>${esc(handle)}</small></span><span class="ud2">${icon("chevron", 14)}</span></summary>
<div class="acsw-pop" role="menu"><h6>This console</h6><a href="/admin/profile">${meAvatar(current)}<span class="grow">${esc(name)}<small>${esc(handle)}</small></span><span class="cur">Live</span></a>
${rows ? `<hr><h6>Your other pages</h6>${rows}` : ""}<hr><a class="mg" href="/admin/accounts">${icon("plus", 16)}<span class="grow">${others.length ? "Manage accounts" : "Add another Instagram page"}</span></a></div></details>
<script>document.addEventListener("click",function(e){document.querySelectorAll("details.acsw[open],details.db-ws[open]").forEach(function(d){if(!d.contains(e.target))d.removeAttribute("open")})})</script>`;
}


// Where Relay can talk to people, honestly: what works today, what's possible next, and what the platform doesn't allow.
const PLATFORMS: { name: string; tone: string; mark: string; state: "live" | "next" | "gated" | "no"; label: string; text: string }[] = [
  { name: "Instagram", mark: "IG", tone: "linear-gradient(135deg,#feda75,#fa7e1e 30%,#d62976 60%,#962fbf 80%,#4f5bd5)", state: "live", label: "Live", text: "Comment-to-DM, story replies, DM keywords, the inbox and Growth. Official Instagram API." },
  { name: "Facebook Messenger", mark: "M", tone: "linear-gradient(135deg,#00b2ff,#006aff)", state: "next", label: "", text: "" },
  { name: "WhatsApp", mark: "W", tone: "linear-gradient(135deg,#5af07a,#1fa855)", state: "next", label: "Possible next", text: "Through Meta's WhatsApp Cloud API. Replies are free inside 24 hours; messages after that need paid, pre-approved templates. Not built yet." },
  { name: "TikTok", mark: "T", tone: "linear-gradient(135deg,#25f4ee,#000 45%,#000 55%,#fe2c55)", state: "gated", label: "Needs TikTok's approval", text: "TikTok's Business Messaging API needs a Business account, a developer app and TikTok's approval, and isn't offered in the EU, UK or Switzerland. Not built yet." },
  { name: "Threads", mark: "@", tone: "linear-gradient(135deg,#3a3a3c,#000)", state: "no", label: "Not possible", text: "Threads' API covers posts and replies, not direct messages." },
];
function messengerState(env: Env, pg: ConnectedPage | null, admin: boolean): { state: "live" | "next" | "gated" | "no"; label: string; text: string; act: string } {
  if (env.DEMO_ON === "1") return { state: "next", label: "Built in", text: "DMs and comments on your Facebook Page run the same automations as Instagram. Switch to Live to connect your Page.", act: "" };
  if (pg)
    return {
      state: "live",
      label: "Live",
      text: `Connected to ${esc(pg.name)}. DMs and comments on its posts run the same automations as Instagram, and show in the Inbox with a blue badge.`,
      act: admin ? `<form method="post" action="/admin/messenger/disconnect"><button class="ghost pf-b">Disconnect</button></form>` : "",
    };
  if (messengerReady(env))
    return { state: "gated", label: "Ready to connect", text: "Your Meta app's keys are in. Connect the Facebook Page Relay should answer for.", act: admin ? `<a class="pf-go" href="/auth/fb/start">Connect your Facebook Page ${icon("chevron", 14)}</a>` : "" };
  return { state: "next", label: "Built in · off", text: "Same Meta app, same rules as Instagram. Add your app's App ID and App Secret to switch it on (about 15 minutes).", act: `<a class="pf-go soft" href="/admin/setup#messenger">How to switch it on ${icon("chevron", 14)}</a>` };
}
function platformsCard(env: Env, pg: ConnectedPage | null, admin: boolean, igOn: boolean): string {
  const ms = messengerState(env, pg, admin);
  const ig = igOn || env.DEMO_ON === "1"
    ? null
    : { state: "next" as const, label: "Not connected yet", text: "Comment-to-DM, story replies, DM keywords, the inbox and Growth, through the official Instagram API.", act: admin ? `<a class="pf-go" href="/admin/setup">Finish setting up ${icon("chevron", 14)}</a>` : "" };
  return `<div class="card plat"><div class="ph"><div><h2>Platforms</h2><p>Where Relay can reach people. Want another one? <a href="https://github.com/abrhamhabtu/relay-manychat-clone/issues" target="_blank" rel="noopener">Ask or help build it on GitHub</a>.</p></div></div>
<div class="plat-g">${PLATFORMS.map((p) => {
    const m = p.name === "Facebook Messenger" ? ms : p.name === "Instagram" && ig ? ig : { ...p, text: esc(p.text), act: "" };
    return `<div class="pf ${m.state}"><span class="pf-m" style="background:${p.tone}">${pg && p.name === "Facebook Messenger" && pg.pic ? `<img src="${esc(pg.pic)}" alt="" referrerpolicy="no-referrer">` : esc(p.mark)}</span><div class="pf-t"><b>${esc(p.name)}</b><span class="pf-s">${esc(m.label)}</span><p>${m.text}</p>${m.act}</div></div>`;
  }).join("")}</div></div>`;
}

export async function accountsPage(env: Env, who: Role, note: string | null): Promise<Response> {
  const acct = await me(env);
  const others = await linked(env);
  const origin = ORIGIN.includes("REPLACE") ? "" : ORIGIN;
  const here = `<div class="acc"><div class="top">${meAvatar(acct)}<div><div class="h">${esc(acct?.name || acct?.username || "This console")}</div><div class="u">${acct?.username ? `@${esc(acct.username)}` : "No Instagram connected yet"}</div></div></div>
<span class="live">You are here</span>${origin ? `<div class="host">${esc(origin.replace(/^https?:\/\//, ""))}</div>` : ""}
<div class="act">${acct?.username ? `<a class="go" href="/admin/dashboard">Open ${icon("chevron", 14)}</a>` : who === "admin" ? `<a class="go" href="/auth/start">Connect Instagram ${icon("chevron", 14)}</a>` : ""}</div></div>`;
  const cards = others
    .map(
      (a, i) => `<div class="acc"><div class="top">${initialAvatar(a.handle)}<div><div class="h">@${esc(a.handle)}</div><div class="u">separate install</div></div></div>
<div class="host">${esc(new URL(a.url).host)}</div>
<div class="act"><a class="go" href="${esc(a.url)}/admin/dashboard" rel="noopener">Open console ${icon("chevron", 14)}</a>${
        who === "admin"
          ? `<form method="post" action="/admin/accounts/remove"><input type="hidden" name="i" value="${i}"><button class="ghost" title="Remove from this list. The other install keeps running.">Unlink</button></form>`
          : ""
      }</div></div>`,
    )
    .join("");
  const add =
    who === "admin" && others.length < MAX
      ? `<div class="acc add"><form method="post" action="/admin/accounts"><label for="ah">Link another page</label>
<input id="ah" name="handle" placeholder="@yourotherpage" autocomplete="off" required>
<input name="url" placeholder="relay-yourotherpage.you.workers.dev" autocomplete="off" required>
<button>Link account</button></form></div>`
      : "";
  const body = `${note ? `<div class="card" role="status" style="border-color:var(--pri)">${esc(note)}</div>` : ""}
<p class="kicker" style="margin:0 0 12px;color:var(--mut)">${others.length + 1} Instagram ${others.length ? "pages" : "page"}</p>
<div class="acc-grid">${here}${cards}${add}</div>
${platformsCard(env, await connectedPage(env).catch(() => null), who === "admin", Boolean(acct?.username))}
<div class="cols"><div class="card"><div class="ph"><div><h2>Add a new Instagram page</h2><p>Each page runs on its own Relay install: its own address, database, inbox and numbers. It takes about 20 minutes, and most of it is Meta's site.</p></div></div>
<ol class="steps">
<li>Make sure the new page is a <b>Professional</b> account: in the Instagram app, Settings → Account type and tools → Switch to professional.</li>
<li>In a terminal, next to your current Relay folder, get a second copy: <code>git clone https://github.com/abrhamhabtu/relay-manychat-clone.git relay-two</code> then <code>cd relay-two</code>.</li>
<li>Run <code>npm run setup -- --name=relay-two</code>. The name keeps its database and address apart from this one. Answer the three questions with the new page's username.</li>
<li>Follow the new <code>MY-SETUP.md</code> it writes. Give it its own Meta app: a Meta app sends webhooks to one address, and each install has its own.</li>
<li>Come back here and link it with its console address, so you can jump between pages from the sidebar. Do the same from the new console to link back.</li>
</ol></div>
<div class="card"><div class="ph"><div><h2>Good to know</h2></div></div>
<div class="qa"><h3>Why separate installs?</h3><p>Every account gets its own database, so contacts, automations and numbers never mix, and a problem on one page can't touch another.</p></div>
<div class="qa"><h3>Does it cost more?</h3><p>Cloudflare's free plan covers a few small pages. Busy pages are best on Workers Paid ($5 a month for the whole Cloudflare account, not per page).</p></div>
<div class="qa"><h3>Is anything shared?</h3><p>Only this list of links, stored in this console. Unlinking removes the shortcut; the other page keeps running.</p></div></div></div>`;
  return page("Accounts", body, who, env, { title: "Accounts & platforms" });
}

export async function accountsPost(env: Env, req: Request, pathname: string, who: Role): Promise<Response> {
  const back = (msg?: string) => Response.redirect(new URL(`/admin/accounts${msg ? `?m=${encodeURIComponent(msg)}` : ""}`, req.url).toString(), 303);
  if (who !== "admin") return new Response("not allowed for the reviewer login", { status: 403 });
  const f = await req.formData();
  const list = await linked(env);
  if (pathname === "/admin/accounts/remove") {
    const i = Number(f.get("i"));
    if (Number.isInteger(i) && i >= 0 && i < list.length) list.splice(i, 1);
    await db.setSetting(env.DB, "accounts", JSON.stringify(list));
    return back("Unlinked. That page keeps running on its own install.");
  }
  const handle = cleanHandle(String(f.get("handle") ?? ""));
  const url = cleanUrl(String(f.get("url") ?? ""));
  if (!handle) return back("That doesn't look like an Instagram username.");
  if (!url) return back("The console address should look like relay-name.you.workers.dev (https only).");
  if (url === cleanUrl(ORIGIN)) return back("That's this console's own address.");
  if (list.length >= MAX) return back(`You can link up to ${MAX} pages.`);
  const at = list.findIndex((a) => a.handle === handle || a.url === url);
  if (at >= 0) list[at] = { handle, url };
  else list.push({ handle, url });
  await db.setSetting(env.DB, "accounts", JSON.stringify(list));
  return back(`Linked @${handle}.`);
}
