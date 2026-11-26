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
:root{--bg:#f5f5f7;--panel:rgba(255,255,255,.72);--ink:#1d1d1f;--mut:#6e6e73;--line:#d2d2d7;--pri:#f2541b}
@media (prefers-color-scheme:dark){:root{--bg:#000;--panel:rgba(28,28,30,.72);--ink:#f5f5f7;--mut:#98989d;--line:#3a3a3c;--pri:#ff6b2c}}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;grid-template-columns:minmax(0,1.15fr) minmax(380px,1fr);background:var(--bg);color:var(--ink);font:15px/21px -apple-system,BlinkMacSystemFont,"SF Pro Text","Inter",system-ui,sans-serif;letter-spacing:-.01em;-webkit-font-smoothing:antialiased}
.art{position:relative;overflow:hidden;padding:56px;display:flex;flex-direction:column;justify-content:space-between;color:#fff;
  background:radial-gradient(60% 70% at 15% 20%,#ff9a52 0,transparent 60%),radial-gradient(55% 60% at 85% 30%,#ff3d7a 0,transparent 60%),radial-gradient(70% 70% at 50% 100%,#7a3cff 0,transparent 65%),#f2541b}
.art:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.18))}
.art>*{position:relative;z-index:1}
.art .k{font-size:13px;font-weight:600;opacity:.9}
.art h2{font:700 clamp(40px,5.2vw,76px)/1.0 -apple-system,BlinkMacSystemFont,"SF Pro Display","Inter",system-ui,sans-serif;letter-spacing:-.045em;margin:0;max-width:12ch;text-shadow:0 2px 30px rgba(0,0,0,.12)}
.art h2 em{font-style:normal;opacity:.82}
.feed{display:grid;gap:8px;max-width:360px}
.feed div{display:flex;gap:8px;align-items:baseline;font-size:13.5px;line-height:19px;padding:10px 14px;border-radius:16px;background:rgba(255,255,255,.18);backdrop-filter:blur(20px) saturate(160%);-webkit-backdrop-filter:blur(20px) saturate(160%);box-shadow:inset 0 0 0 .5px rgba(255,255,255,.35);opacity:0;transform:translateY(10px);animation:in .7s cubic-bezier(.32,.72,0,1) forwards}
.feed div:nth-child(2){animation-delay:.4s;margin-left:24px}.feed div:nth-child(3){animation-delay:.8s}
.feed b{font-weight:650}.feed i{font-style:normal;font-weight:650}
@keyframes in{to{opacity:1;transform:none}}
main{display:grid;place-items:center;padding:40px 24px}
.box{width:min(360px,100%)}
.logo{width:64px;height:64px;margin:0 0 24px;filter:drop-shadow(0 8px 18px rgba(242,84,27,.35))}
h1{font:700 34px/1.1 -apple-system,BlinkMacSystemFont,"SF Pro Display","Inter",system-ui,sans-serif;letter-spacing:-.035em;margin:0 0 8px}p{color:var(--mut);margin:0 0 28px}
a.btn,.pw button{display:flex;align-items:center;justify-content:center;gap:10px;height:48px;border-radius:14px;background:linear-gradient(180deg,#ff8a4a,#f2541b);color:#fff;font:600 15px/1 inherit;letter-spacing:-.01em;text-decoration:none;border:0;cursor:pointer;width:100%;box-shadow:inset 0 1px 0 rgba(255,255,255,.3),0 10px 24px -10px rgba(242,84,27,.7);transition:transform .2s,filter .2s}
a.btn:hover,.pw button:hover{filter:brightness(1.06)}a.btn:active,.pw button:active{transform:scale(.98)}
.err{color:#ff3b30;margin:0 0 18px}
.pw{display:grid;gap:10px}.pw input{height:48px;border:.5px solid var(--line);border-radius:14px;background:var(--panel);color:var(--ink);padding:0 16px;font:inherit;width:100%;transition:box-shadow .2s,border-color .2s}
.pw input:focus{outline:none;border-color:var(--pri);box-shadow:0 0 0 4px rgba(242,84,27,.18)}
.pw input[readonly]{color:var(--mut)}
.or{display:flex;align-items:center;gap:14px;color:var(--mut);font-size:12px;font-weight:500;margin:22px 0}.or:before,.or:after{content:"";flex:1;height:.5px;background:var(--line)}
.hint{color:var(--mut);font-size:12px;margin:12px 0 0}
@media (max-width:860px){body{grid-template-columns:1fr}.art{display:none}}
@media (prefers-reduced-motion:reduce){.feed div{animation:none;opacity:1;transform:none}}
</style></head><body><aside class="art" aria-hidden="true"><span class="k">Relay · Instagram DM automation you own</span>
<h2>Every comment, answered <em>in a second.</em></h2>
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
