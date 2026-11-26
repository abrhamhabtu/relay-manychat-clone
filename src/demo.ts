// Demo mode: the whole console on invented sample data, one click away from your real one.
//
// Sample data lives in its own database (binding DEMO_DB, made by `npm run setup`), so turning demo on never mixes
// with your contacts. A cookie picks the database for console pages only: webhooks, the cron and Instagram login
// always use the real one. In demo, nothing can reach Instagram: the demo database has no Instagram token, the send
// queue is swapped for one that drops jobs, and live updates are off.

import { demoSeed, PERSONAS } from "./demo_seed.js";
import * as db from "./db";
import type { Env } from "./setter";

export const DEMO_COOKIE = "relay_demo";
const STALE_MS = 7 * 86_400_000; // sample dates are relative to when they were made: refresh weekly so they stay recent

export function demoWanted(req: Request, env: Env): boolean {
  const m = (req.headers.get("Cookie") ?? "").match(new RegExp(`(?:^|;\\s*)${DEMO_COOKIE}=(on|off)(?:;|$)`));
  if (m) return m[1] === "on";
  return env.DEMO_DEFAULT === "on"; // the local preview starts in demo
}

export const demoAvailable = (env: Env) => Boolean(env.DEMO_DB);

// The env a console request runs with in demo mode.
export function demoEnv(env: Env): Env {
  const dropped = { send: async () => {}, sendBatch: async () => {} } as unknown as Queue<never>;
  return { ...env, DB: env.DEMO_DB as D1Database, REAL_DB: env.DB, DEMO_ON: "1", SEND_QUEUE: dropped, LIVE: undefined, SKOOL_LINK: "https://demo.studio/guide" };
}

const KEEP = new Set(["_relay_migrations", "d1_migrations"]);

// Empties every table in the demo database and fills it again, dated around `now`.
export async function resetDemo(d1: D1Database, now: number, persona?: string): Promise<number> {
  const keep = persona && PERSONAS[persona] ? persona : ((await db.getSetting(d1, "demo_persona").catch(() => null)) ?? "creator");
  const { results } = await d1.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'`).all<{ name: string }>();
  const tables = results.map((r) => r.name).filter((n) => !KEEP.has(n));
  if (!tables.includes("leads")) throw new Error("The demo database has no tables yet. Run `npm run setup` (or `npm run update`) to build it.");
  await d1.batch(tables.map((t) => d1.prepare(`DELETE FROM "${t.replace(/"/g, "")}"`)));
  const stmts = demoSeed(now, keep);
  for (let i = 0; i < stmts.length; i += 400) await d1.batch(stmts.slice(i, i + 400).map((s) => d1.prepare(s)));
  await db.setSetting(d1, "demo_seeded_at", String(now));
  return stmts.length;
}

// First visit, or sample data older than a week: refill it.
export async function ensureDemoData(env: Env, now: number): Promise<void> {
  const at = Number((await db.getSetting(env.DB, "demo_seeded_at").catch(() => null)) ?? 0);
  if (now - at > STALE_MS) await resetDemo(env.DB, now);
}

const safeBack = (req: Request) => {
  const ref = req.headers.get("Referer");
  try {
    const u = ref ? new URL(ref) : null;
    if (u && u.origin === new URL(req.url).origin && u.pathname.startsWith("/admin") && !u.pathname.startsWith("/admin/demo")) return u.pathname + u.search;
  } catch {
    /* fall through */
  }
  return "/admin/dashboard";
};

// GET /admin/demo?to=on|off|toggle flips the cookie and returns to the page you were on.
export function demoToggle(req: Request, env: Env): Response {
  const to = new URL(req.url).searchParams.get("to") ?? "toggle";
  const next = to === "on" ? true : to === "off" ? false : !demoWanted(req, env);
  const back = safeBack(req);
  return new Response(null, {
    status: 303,
    headers: { Location: back, "Set-Cookie": `${DEMO_COOKIE}=${next ? "on" : "off"}; Path=/; Max-Age=31536000; SameSite=Lax${new URL(req.url).protocol === "https:" ? "; Secure" : ""}` },
  });
}

export async function demoResetRoute(req: Request, env: Env): Promise<Response> {
  if (env.DEMO_ON !== "1") return new Response("demo mode is off", { status: 400 });
  const persona = String((await req.formData().catch(() => null))?.get("persona") ?? "");
  await resetDemo(env.DB, Date.now(), persona || undefined);
  return Response.redirect(new URL(safeBack(req), req.url).toString(), 303);
}

// The picker in the demo banner: which sample workspace is showing.
export async function demoPersona(env: Env): Promise<string> {
  const p = await db.getSetting(env.DB, "demo_persona").catch(() => null);
  return p && PERSONAS[p] ? p : "creator";
}
export { PERSONAS };
