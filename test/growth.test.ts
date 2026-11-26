import { afterEach, describe, expect, it, vi } from "vitest";
import { makeD1 } from "./d1shim";
import * as db from "../src/db";
import { checkFollows, snapshotFollowers } from "../src/growth";
import worker from "../src/index";
import type { Env } from "../src/setter";

const ctx = { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext;
const HOUR = 3_600_000;
function makeEnv(): Env {
  return { DB: makeD1(), ANTHROPIC_API_KEY: "t", MANYCHAT_API_KEY: "", INBOUND_SECRET: "s", ADMIN_PASSWORD: "pw", REVIEW_PASSWORD: "rv", AI: {} as Ai, SKOOL_LINK: "https://x.dev", AUTOPILOT: "false", REPLY_DELAY_MIN_S: "0", REPLY_DELAY_MAX_S: "0", TRANSPORT: "meta", META_IG_APP_ID: "1", META_APP_SECRET: "a", META_VERIFY_TOKEN: "vt" } as Env;
}
const get = async (env: Env, path: string) => (await worker.fetch(new Request(`https://x${path}`, { headers: { Authorization: `Basic ${btoa("me:pw")}` } }), env, ctx)).text();

// Instagram's answers: who follows, and the follower count.
function stubGraph(follows: Record<string, boolean>, followers = 1000) {
  vi.stubGlobal("fetch", async (url: string) => {
    const u = new URL(url);
    if (u.pathname.endsWith("/me")) return Response.json({ followers_count: followers, follows_count: 10, media_count: 5 });
    const id = decodeURIComponent(u.pathname.split("/").pop() ?? "");
    return Response.json({ is_user_follow_business: follows[id] ?? false });
  });
}
afterEach(() => vi.unstubAllGlobals());

async function reached(env: Env, id: string, at: number) {
  await db.recordInbound(env.DB, { subscriber_id: id, username: `u${id}`, first_name: null, text: "GUIDE", mid: `m${id}` }, at);
  await env.DB.prepare(`INSERT INTO flow_starts (trigger_id, subscriber_id, status, created_at) VALUES (1, ?1, 'sent', ?2)`).bind(id, at).run();
}
const lead = (env: Env, id: string) => env.DB.prepare(`SELECT follows, follow_first, follows_at FROM leads WHERE subscriber_id = ?1`).bind(id).first<{ follows: number; follow_first: number; follows_at: number | null }>();

describe("growth: who followed after an automation DM", () => {
  it("counts a follow only when someone wasn't following at the first check", async () => {
    const env = makeEnv();
    await db.setSetting(env.DB, "ig_token", "tok");
    const t0 = Date.now();
    await reached(env, "a", t0); // already a follower
    await reached(env, "b", t0); // follows later
    await reached(env, "c", t0); // never follows
    stubGraph({ a: true });
    expect(await checkFollows(env, t0 + HOUR)).toBe(3);
    expect(await lead(env, "a")).toMatchObject({ follows: 1, follow_first: 1, follows_at: null });
    expect(await lead(env, "b")).toMatchObject({ follows: 0, follow_first: 0 });

    // Rechecked only after 6 hours, and only people not following yet.
    stubGraph({ a: true, b: true });
    expect(await checkFollows(env, t0 + 2 * HOUR)).toBe(0);
    expect(await checkFollows(env, t0 + 8 * HOUR)).toBe(2);
    expect(await lead(env, "b")).toMatchObject({ follows: 1, follow_first: 0, follows_at: t0 + 8 * HOUR });
    expect((await lead(env, "c"))?.follows_at).toBeNull();
  });

  it("keeps one follower reading per day and shows it on Growth", async () => {
    const env = makeEnv();
    await db.setSetting(env.DB, "ig_token", "tok");
    stubGraph({}, 4321);
    await snapshotFollowers(env, Date.now());
    await snapshotFollowers(env, Date.now() + 1000); // too soon: no second call needed
    const rows = await env.DB.prepare(`SELECT COUNT(*) AS n, MAX(followers) AS f FROM follower_snapshots`).first<{ n: number; f: number }>();
    expect(rows).toEqual({ n: 1, f: 4321 });
    vi.stubGlobal("fetch", async () => Response.json({ error: { message: "insights permission missing" } }, { status: 400 }));
    const html = await get(env, "/admin/growth");
    expect(html).toContain("4,321");
    expect(html).toContain("reconnect Instagram");
  });
});
