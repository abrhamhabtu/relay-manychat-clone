// Connecting a Facebook Page for Messenger: Facebook Login, picking the Page when there are several, disconnecting.
// The Page token never leaves the database; the console only shows the Page's name and picture.

import { esc, page, role, type Role } from "./admin";
import * as db from "./db";
import { fbAuthorizeUrl, fbPages, fbSubscribe, type FbPage } from "./messenger";
import type { Env } from "./setter";
import { icon } from "./theme";

const STATE = "dms_fb_oauth";
const PENDING_MS = 15 * 60_000;

export const messengerReady = (env: Env) => Boolean(env.FB_APP_ID && env.FB_APP_SECRET);

export interface ConnectedPage {
  id: string;
  name: string;
  pic: string | null;
}
export async function connectedPage(env: Env): Promise<ConnectedPage | null> {
  const [id, name, pic, token] = await Promise.all(["fb_page_id", "fb_page_name", "fb_page_pic", "fb_page_token"].map((k) => db.getSetting(env.DB, k).catch(() => null)));
  return id && token ? { id, name: name ?? "Your Page", pic } : null;
}

async function connect(env: Env, p: FbPage): Promise<void> {
  await fbSubscribe(p);
  await db.setSetting(env.DB, "fb_page_token", p.access_token);
  await db.setSetting(env.DB, "fb_page_id", p.id);
  await db.setSetting(env.DB, "fb_page_name", p.name);
  await db.setSetting(env.DB, "fb_page_pic", p.picture ?? "");
  await env.DB.prepare(`DELETE FROM settings WHERE key = 'fb_pages_pending'`).run();
}

const back = (req: Request, path: string, msg?: string) => Response.redirect(new URL(`${path}${msg ? `${path.includes("?") ? "&" : "?"}m=${encodeURIComponent(msg)}` : ""}`, req.url).toString(), 303);

// /auth/fb/start and /auth/fb/callback
export async function handleFbAuth(req: Request, env: Env, pathname: string): Promise<Response> {
  const url = new URL(req.url);
  if ((await role(req, env)) !== "admin") return Response.redirect(`${url.origin}/login`, 302);
  if (!messengerReady(env)) return back(req, "/admin/setup#messenger");
  const redirectUri = `${url.origin}/auth/fb/callback`;
  if (pathname === "/auth/fb/start") {
    const state = crypto.randomUUID();
    return new Response(null, {
      status: 302,
      headers: { Location: fbAuthorizeUrl(env.FB_APP_ID!, redirectUri, state), "Set-Cookie": `${STATE}=${state}; Path=/auth/fb; HttpOnly; Secure; SameSite=Lax; Max-Age=900` },
    });
  }
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const expected = (req.headers.get("Cookie") ?? "").match(new RegExp(`(?:^|;\\s*)${STATE}=([^;]+)`))?.[1];
  if (!code || !state || state !== expected) return back(req, "/admin/accounts", url.searchParams.get("error_description") ?? "Facebook sign-in expired. Try again.");
  try {
    const pages = await fbPages(env.FB_APP_ID!, env.FB_APP_SECRET!, redirectUri, code);
    if (!pages.length) return back(req, "/admin/accounts", "Facebook didn't share any Pages. Try again and tick your Page when Facebook asks which ones Relay may use.");
    if (pages.length === 1) {
      await connect(env, pages[0]);
      return back(req, "/admin/accounts", `Messenger is connected to ${pages[0].name}.`);
    }
    await db.setSetting(env.DB, "fb_pages_pending", JSON.stringify({ at: Date.now(), pages }));
    return back(req, "/admin/messenger/choose");
  } catch (e) {
    console.error("facebook connect failed:", e);
    return back(req, "/admin/accounts", `Facebook didn't finish connecting (${String(e).slice(0, 140)}).`);
  }
}

async function pending(env: Env): Promise<FbPage[]> {
  try {
    const p = JSON.parse((await db.getSetting(env.DB, "fb_pages_pending")) ?? "null") as { at: number; pages: FbPage[] } | null;
    return p && Date.now() - p.at < PENDING_MS ? p.pages : [];
  } catch {
    return [];
  }
}

// GET /admin/messenger/choose, POST /admin/messenger/pick, POST /admin/messenger/disconnect
export async function messengerAdmin(env: Env, req: Request, pathname: string, who: Role): Promise<Response | null> {
  if (!pathname.startsWith("/admin/messenger/")) return null;
  if (who !== "admin") return new Response("not allowed for the reviewer login", { status: 403 });
  if (pathname === "/admin/messenger/choose" && req.method === "GET") {
    const pages = await pending(env);
    if (!pages.length) return back(req, "/admin/accounts", "That choice expired. Connect Messenger again.");
    const rows = pages
      .map(
        (p) => `<button class="pgc" name="id" value="${esc(p.id)}"><span class="pf-m" style="background:linear-gradient(135deg,#00b2ff,#006aff)">${p.picture ? `<img src="${esc(p.picture)}" alt="" referrerpolicy="no-referrer">` : esc(p.name.charAt(0))}</span><span><b>${esc(p.name)}</b><small>Page ID ${esc(p.id)}</small></span>${icon("chevron", 16)}</button>`,
      )
      .join("");
    return page("Accounts", `<div class="card" style="max-width:620px"><div class="ph"><div><h2>Which Page should Relay answer for?</h2><p>Relay connects one Facebook Page per install, the same way it runs one Instagram account.</p></div></div><form method="post" action="/admin/messenger/pick" class="pgl">${rows}</form></div>`, who, env, { title: "Connect Messenger" });
  }
  if (req.method !== "POST") return null;
  if (pathname === "/admin/messenger/pick") {
    const id = String((await req.formData()).get("id") ?? "");
    const p = (await pending(env)).find((x) => x.id === id);
    if (!p) return back(req, "/admin/accounts", "That choice expired. Connect Messenger again.");
    try {
      await connect(env, p);
    } catch (e) {
      return back(req, "/admin/accounts", `Facebook didn't finish connecting (${String(e).slice(0, 140)}).`);
    }
    return back(req, "/admin/accounts", `Messenger is connected to ${p.name}.`);
  }
  if (pathname === "/admin/messenger/disconnect") {
    await env.DB.prepare(`DELETE FROM settings WHERE key IN ('fb_page_token', 'fb_page_id', 'fb_page_name', 'fb_page_pic', 'fb_pages_pending')`).run();
    return back(req, "/admin/accounts", "Messenger is disconnected. Your Messenger conversations stay in the Inbox.");
  }
  return null;
}
