// Log in with Instagram: the console's sign-in is the same Instagram business login the app already uses. Only the
// account this setter runs (brand.ts IG_HANDLE) gets in; the reward is a signed 90-day cookie. The basic-auth password
// still works (scripts, the reviewer login), it just isn't the front door anymore.

import { IG_HANDLE } from "./brand";
import * as db from "./db";
import { graph, hmacHex } from "./meta";
import type { Env } from "./setter";
import { FAVICON, FONTS, LOGO } from "./theme";

const COOKIE = "dms_session";
const TTL_S = 90 * 24 * 60 * 60;

const sign = (env: Env, exp: number) => hmacHex(`${env.META_APP_SECRET}:session`, `owner:${exp}`);

export async function sessionCookie(env: Env, now: number): Promise<string> {
  const exp = Math.floor(now / 1000) + TTL_S;
  return `${COOKIE}=${exp}.${await sign(env, exp)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${TTL_S}`;
}

export const clearCookie = `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

export async function hasSession(req: Request, env: Env, now = Date.now()): Promise<boolean> {
  const m = (req.headers.get("Cookie") ?? "").match(new RegExp(`(?:^|;\\s*)${COOKIE}=(\\d+)\\.([0-9a-f]{64})`));
  if (!m || !env.META_APP_SECRET || Number(m[1]) * 1000 < now) return false;
  const expected = await sign(env, Number(m[1]));
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ m[2].charCodeAt(i);
  return diff === 0;
}

// The account this setter runs, as Instagram ids it (17841...). Cached by the sync; asked from the live token otherwise.
export async function ownerId(env: Env): Promise<string | null> {
  const cached = await db.getSetting(env.DB, "ig_account_id");
  if (cached) return cached;
  const token = await db.getSetting(env.DB, "ig_token");
  if (!token) return null;
  const me = await graph<{ user_id: string }>(`/me?fields=user_id`, { headers: { Authorization: `Bearer ${token}` } });
  await db.setSetting(env.DB, "ig_account_id", me.user_id);
  return me.user_id;
}

// On an iPhone, Instagram's app claims instagram.com/consent/ (its "Allow" screen), so the Instagram button bounces
// into the app mid-sign-in. Phones only get the password form (iCloud Keychain saves it, Face ID fills it).
export const isPhone = (req: Request | null) => /iPhone|iPad|iPod|Android/i.test(req?.headers.get("User-Agent") ?? "");

export function loginPage(error: string | null = null, req: Request | null = null): Response {
  const phone = isPhone(req);
  const ig = `<a class="btn" href="/auth/login">Log in with Instagram</a>`;
  const pw = `<form method="post" action="/login" class="pw">
<input name="username" autocomplete="username" value="${IG_HANDLE}" readonly aria-label="Account">
<input name="password" type="password" autocomplete="current-password" placeholder="Password" required aria-label="Password">
<button>Log in</button></form>`;
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Log in · Relay</title>${FAVICON}${FONTS}
<style>
:root{--bg:#f2efe7;--panel:#fbfaf6;--ink:#16140f;--mut:#665f53;--line:#ddd7ca;--pri:#c73a0c;--onpri:#fffaf5}
@media (prefers-color-scheme:dark){:root{--bg:#0b0a09;--panel:#13120f;--ink:#f0ebe0;--mut:#9d968a;--line:#2b2823;--pri:#ff5a24;--onpri:#0b0a09}}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;grid-template-columns:minmax(0,1.1fr) minmax(360px,1fr);background:var(--bg);color:var(--ink);font:14px/20px "Geist",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
.art{position:relative;overflow:hidden;border-right:1px solid var(--line);padding:48px;display:flex;flex-direction:column;justify-content:space-between;
  background:linear-gradient(var(--line) 1px,transparent 1px) 0 0/100% 48px,var(--bg)}
.art .k{font:500 10.5px/1 "Geist Mono",ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--mut)}
.art h2{font:400 clamp(44px,6vw,92px)/.95 "Instrument Serif",Georgia,serif;letter-spacing:-.025em;margin:0;max-width:11ch}
.art h2 em{color:var(--pri)}
.feed{display:grid;gap:10px;max-width:380px}
.feed div{display:flex;gap:10px;align-items:baseline;font:400 12px/18px "Geist Mono",ui-monospace,monospace;color:var(--mut);padding:10px 12px;border:1px solid var(--line);background:var(--panel);border-radius:4px;opacity:0;transform:translateY(8px);animation:in .6s cubic-bezier(.16,1,.3,1) forwards}
.feed div:nth-child(2){animation-delay:.35s}.feed div:nth-child(3){animation-delay:.7s}
.feed b{color:var(--ink);font-weight:500}.feed i{font-style:normal;color:var(--pri)}
@keyframes in{to{opacity:1;transform:none}}
main{display:grid;place-items:center;padding:40px 24px}
.box{width:min(340px,100%)}
.logo{width:44px;height:44px;margin:0 0 28px}
h1{font:400 44px/1 "Instrument Serif",Georgia,serif;letter-spacing:-.02em;margin:0 0 8px}p{color:var(--mut);margin:0 0 28px}
a.btn,.pw button{display:flex;align-items:center;justify-content:center;gap:10px;height:46px;border-radius:4px;background:var(--ink);color:var(--bg);font:600 14px/1 inherit;text-decoration:none;border:0;cursor:pointer;width:100%;transition:transform .12s,box-shadow .12s}
a.btn:hover,.pw button:hover{transform:translate(-1px,-1px);box-shadow:3px 3px 0 var(--pri)}
.err{color:var(--pri);margin:0 0 18px}
.pw{display:grid;gap:8px}.pw input{height:44px;border:1px solid var(--line);border-radius:4px;background:var(--panel);color:var(--ink);padding:0 12px;font:inherit;width:100%}
.pw input:focus{outline:none;border-color:var(--ink)}
.pw input[readonly]{color:var(--mut);font-family:"Geist Mono",ui-monospace,monospace;font-size:13px}
.or{display:flex;align-items:center;gap:14px;color:var(--mut);font:500 10.5px/1 "Geist Mono",ui-monospace,monospace;letter-spacing:.14em;margin:22px 0}.or:before,.or:after{content:"";flex:1;height:1px;background:var(--line)}
.hint{color:var(--mut);font-size:12px;margin:12px 0 0}
@media (max-width:860px){body{grid-template-columns:1fr}.art{display:none}}
@media (prefers-reduced-motion:reduce){.feed div{animation:none;opacity:1;transform:none}}
</style></head><body><aside class="art" aria-hidden="true"><span class="k">Relay · Instagram DM automation you own</span>
<h2>Every comment, <em>answered</em> in a second.</h2>
<div class="feed"><div><b>@maya.builds</b> commented <i>GUIDE</i></div><div><b>Relay</b> sent the DM · 0.9s</div><div><b>@maya.builds</b> tapped <i>Get the guide</i></div></div></aside>
<main><div class="box">
<div class="logo" aria-hidden="true">${LOGO}</div>
<h1>Welcome back</h1><p>${phone ? "Log in to your Relay console." : "Log in with the Instagram account this Relay runs on."}</p>
${error ? `<p class="err">${error.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)}</p>` : ""}
${phone ? `${pw}<p class="hint">You stay logged in for 90 days. Your phone can save this and fill it with Face ID.</p>` : `<div class="ig">${ig}<div class="or">OR</div></div>${pw}`}
</div></main><script>/* iPads and "desktop site" phones look like a Mac to the server: drop the Instagram button on touch screens */
if (navigator.maxTouchPoints > 1) document.querySelectorAll(".ig").forEach((e) => e.remove());</script></body></html>`,
    { status: error ? 403 : 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
  );
}
