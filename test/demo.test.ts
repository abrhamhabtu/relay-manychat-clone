import { describe, expect, it } from "vitest";
import { makeD1 } from "./d1shim";
import * as db from "../src/db";
import worker from "../src/index";
import type { Env } from "../src/setter";

const ctx = { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext;
function makeEnv(demo = true): Env {
  return { DB: makeD1(), DEMO_DB: demo ? makeD1() : undefined, ANTHROPIC_API_KEY: "t", MANYCHAT_API_KEY: "", INBOUND_SECRET: "s", ADMIN_PASSWORD: "pw", REVIEW_PASSWORD: "rv", AI: {} as Ai, SKOOL_LINK: "https://x.dev", AUTOPILOT: "false", REPLY_DELAY_MIN_S: "0", REPLY_DELAY_MAX_S: "0", TRANSPORT: "meta", META_IG_APP_ID: "1", META_APP_SECRET: "a", META_VERIFY_TOKEN: "vt" } as Env;
}
const req = (path: string, cookie = "", init: RequestInit = {}) =>
  new Request(`https://x${path}`, { ...init, headers: { Authorization: `Basic ${btoa("me:pw")}`, ...(cookie ? { Cookie: cookie } : {}), ...(init.headers ?? {}) } });
const page = async (env: Env, path: string, cookie = "") => (await worker.fetch(req(path, cookie), env, ctx)).text();
const count = async (d1: D1Database) => (await d1.prepare(`SELECT COUNT(*) AS n FROM leads`).first<{ n: number }>())!.n;

describe("demo mode", () => {
  it("is off by default, and shows the switch", async () => {
    const env = makeEnv();
    const html = await page(env, "/admin/dashboard");
    expect(html).toContain('class="mode"');
    expect(html).not.toContain('class="demo-bar"');
    expect(await count(env.DEMO_DB!)).toBe(0);
  });

  it("fills only the demo database and never touches the real one", async () => {
    const env = makeEnv();
    await db.recordInbound(env.DB, { subscriber_id: "real1", username: "realperson", first_name: null, text: "hi", mid: "r1" }, Date.now());
    const html = await page(env, "/admin/contacts", "relay_demo=on");
    expect(html).toContain('class="demo-bar"');
    expect(html).toContain("Demo Studio");
    expect(html).not.toContain("realperson");
    expect(await count(env.DEMO_DB!)).toBeGreaterThan(100);
    expect(await count(env.DB)).toBe(1);
    // Off again: the real contact is back.
    expect(await page(env, "/admin/contacts", "relay_demo=off")).toContain("realperson");
  });

  it("flips with one link and returns to the page you were on", async () => {
    const env = makeEnv();
    const res = await worker.fetch(req("/admin/demo?to=on", "", { headers: { Referer: "https://x/admin/growth" } }), env, ctx);
    expect(res.status).toBe(303);
    expect(res.headers.get("Location")).toBe("/admin/growth");
    expect(res.headers.get("Set-Cookie")).toContain("relay_demo=on");
    const off = await worker.fetch(req("/admin/demo?to=off", "", { headers: { Referer: "https://evil.example/admin/x" } }), env, ctx);
    expect(off.headers.get("Location")).toBe("/admin/dashboard"); // never sends you off-site
  });

  it("refreshes sample data on request, and keeps the setup checks about the real install", async () => {
    const env = makeEnv();
    await page(env, "/admin/dashboard", "relay_demo=on");
    const before = await count(env.DEMO_DB!);
    const res = await worker.fetch(req("/admin/demo/reset", "relay_demo=on", { method: "POST" }), env, ctx);
    expect(res.status).toBe(303);
    expect(await count(env.DEMO_DB!)).toBe(before);
    const setup = await page(env, "/admin/setup", "relay_demo=on");
    expect(setup).toMatch(/<li class=""><i><\/i>First DM received/); // the demo's DMs don't count for the real install
  });

  it("explains itself when the demo database isn't there", async () => {
    const env = makeEnv(false);
    const html = await page(env, "/admin/dashboard", "relay_demo=on");
    expect(html).toContain('href="/admin/help#demo"');
    expect(html).not.toContain('class="demo-bar"');
  });

  it("switches between demo workspaces, and remembers the choice on refresh", async () => {
    const env = makeEnv();
    await page(env, "/admin/dashboard", "relay_demo=on");
    const form = new URLSearchParams({ persona: "bakery" });
    await worker.fetch(req("/admin/demo/reset", "relay_demo=on", { method: "POST", body: form, headers: { "Content-Type": "application/x-www-form-urlencoded" } }), env, ctx);
    let html = await page(env, "/admin/automations", "relay_demo=on");
    expect(html).toContain("Bloom Bakery");
    expect(html).toContain("Weekend menu");
    await worker.fetch(req("/admin/demo/reset", "relay_demo=on", { method: "POST" }), env, ctx); // plain refresh
    html = await page(env, "/admin/dashboard", "relay_demo=on");
    expect(html).toContain("Bloom Bakery");
    expect(await count(env.DB)).toBe(0);
  });
});
