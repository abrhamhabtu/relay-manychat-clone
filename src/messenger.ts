// Facebook Messenger: the same automations, inbox and numbers, for a Facebook Page.
//
// Messenger speaks almost the same language as Instagram's messaging API, so instead of a second copy of everything
// Relay translates at the two edges:
//   • In: `toInstagramShape` turns a Page webhook (object "page") into the Instagram shape every parser already reads.
//     Every Messenger id gets the prefix "fb:" (people, the Page, messages' comments and posts), so a Messenger
//     contact can never collide with an Instagram one and the rest of the code can tell them apart.
//   • Out: `graph()` in src/meta.ts sees an "fb:" id in a call, sends it to graph.facebook.com with the Page's token,
//     strips the prefix, and maps the few calls that differ (see `routeMessenger`).
// Connecting a Page is Facebook Login (`/auth/fb/*` in src/index.ts); the Page token lives in setting `fb_page_token`.

export const FB = "fb:";
export const isMessenger = (id: string | null | undefined) => typeof id === "string" && id.startsWith(FB);
const fb = (id: unknown) => (typeof id === "string" && id && !id.startsWith(FB) ? FB + id : id);

// The Page token for this request, set once at the top of each handler (fetch, cron, queue) from the database. Null
// when no Page is connected, and in demo mode, so nothing in demo can ever reach Facebook.
let pageToken: string | null = null;
export const setPageToken = (t: string | null) => {
  pageToken = t;
};
export const messengerToken = () => pageToken;

export const FB_GRAPH = "https://graph.facebook.com/v26.0";
export const FB_SCOPES = "pages_show_list,pages_messaging,pages_manage_metadata,pages_read_engagement,pages_manage_engagement,pages_read_user_content,business_management";
export const FB_FIELDS = "messages,messaging_postbacks,message_reads,message_echoes,message_reactions,feed";

interface RawEntry {
  id?: string;
  time?: number;
  messaging?: Record<string, unknown>[];
  changes?: { field?: string; value?: Record<string, unknown> }[];
}

// A Page webhook, as if Instagram had sent it. Messages, echoes, postbacks, reads and reactions keep their shape with
// their ids prefixed; a new comment on a Page post becomes an Instagram "comments" change.
export function toInstagramShape(payload: unknown): unknown {
  const p = payload as { object?: string; entry?: RawEntry[] };
  if (p?.object !== "page" || !Array.isArray(p.entry)) return payload;
  return {
    object: "instagram",
    entry: p.entry.map((e) => ({
      id: fb(e.id),
      time: e.time,
      messaging: (e.messaging ?? []).map((m) => {
        const out: Record<string, unknown> = { ...m };
        if (m.sender && typeof m.sender === "object") out.sender = { ...(m.sender as object), id: fb((m.sender as { id?: string }).id) };
        if (m.recipient && typeof m.recipient === "object") out.recipient = { ...(m.recipient as object), id: fb((m.recipient as { id?: string }).id) };
        // Messenger names a read "read" (a watermark); Instagram's is "read" with a mid. Both pass through.
        return out;
      }),
      changes: (e.changes ?? []).flatMap((c) => {
        const v = c.value ?? {};
        if (c.field !== "feed" || v.item !== "comment" || v.verb !== "add" || typeof v.comment_id !== "string") return [];
        const from = (v.from ?? {}) as { id?: string; name?: string };
        if (!from.id || typeof v.message !== "string") return [];
        return [{ field: "comments", value: { id: fb(v.comment_id), text: v.message, from: { id: fb(from.id), username: from.name ?? null }, media: { id: fb(v.post_id) } } }];
      }),
    })),
  };
}

const strip = (s: string) => s.split(FB).join("");

// What graph() does with a call that names a Messenger id. Returns null when the call isn't Messenger's.
export function routeMessenger(path: string, init?: RequestInit): { url: string; init: RequestInit; skip?: unknown; prefixRecipient: boolean } | null {
  let body: Record<string, unknown> | null = null;
  try {
    body = typeof init?.body === "string" ? (JSON.parse(init.body) as Record<string, unknown>) : null;
  } catch {
    body = null;
  }
  const rec = (body?.recipient ?? {}) as { id?: string; comment_id?: string };
  const inPath = path.includes(FB);
  if (!inPath && !isMessenger(rec.id) && !isMessenger(rec.comment_id)) return null;
  if (!pageToken) throw new Error("messenger: no Facebook Page is connected");
  // Pages can't react to messages through the Send API.
  if (body && (body.sender_action === "react" || body.sender_action === "unreact")) return { url: "", init: {}, skip: {}, prefixRecipient: false };
  let p = strip(path);
  // A public reply under a comment: Instagram's /replies is Facebook's /comments.
  p = p.replace(/^\/(\d+_\d+|\d+)\/replies\?/, "/$1/comments?");
  // Profile fields: Messenger has name and profile_pic, not username or the follow flag.
  const f = p.match(/[?&]fields=([^&]*)/);
  if (f) {
    const keep = decodeURIComponent(f[1]).split(",").filter((x) => x !== "username" && x !== "is_user_follow_business");
    if (!keep.length) return { url: "", init: {}, skip: {}, prefixRecipient: false };
    p = p.replace(f[0], `${f[0][0]}fields=${encodeURIComponent(keep.join(","))}`);
  }
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${pageToken}`);
  const next: RequestInit = { ...init, headers };
  if (body) {
    const r = { ...rec };
    if (typeof r.id === "string") r.id = strip(r.id);
    if (typeof r.comment_id === "string") r.comment_id = strip(r.comment_id);
    next.body = JSON.stringify({ ...body, recipient: r });
  }
  return { url: `${FB_GRAPH}${p}`, init: next, prefixRecipient: true };
}

// ------------------------------------------------------------------------------------------- Facebook Login

export function fbAuthorizeUrl(appId: string, redirectUri: string, state: string): string {
  const q = new URLSearchParams({ client_id: appId, redirect_uri: redirectUri, response_type: "code", scope: FB_SCOPES, state });
  return `https://www.facebook.com/v26.0/dialog/oauth?${q}`;
}

export interface FbPage {
  id: string;
  name: string;
  access_token: string;
  picture?: string | null;
}

async function fbGet<T>(url: string): Promise<T> {
  const r = await fetch(url);
  const b = (await r.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!r.ok || b.error) throw new Error(`facebook ${r.status}: ${b.error?.message ?? "request failed"}`);
  return b;
}

// Code → long-lived user token → the Pages it manages, each with a Page token that doesn't expire.
export async function fbPages(appId: string, secret: string, redirectUri: string, code: string): Promise<FbPage[]> {
  const short = await fbGet<{ access_token: string }>(`${FB_GRAPH}/oauth/access_token?${new URLSearchParams({ client_id: appId, client_secret: secret, redirect_uri: redirectUri, code })}`);
  const long = await fbGet<{ access_token: string }>(
    `${FB_GRAPH}/oauth/access_token?${new URLSearchParams({ grant_type: "fb_exchange_token", client_id: appId, client_secret: secret, fb_exchange_token: short.access_token })}`,
  );
  const pages = await fbGet<{ data: { id: string; name: string; access_token: string; picture?: { data?: { url?: string } } }[] }>(
    `${FB_GRAPH}/me/accounts?${new URLSearchParams({ fields: "id,name,access_token,picture", limit: "100", access_token: long.access_token })}`,
  );
  return (pages.data ?? []).map((p) => ({ id: p.id, name: p.name, access_token: p.access_token, picture: p.picture?.data?.url ?? null }));
}

// The Page sends its messages and comments to this app's webhook.
export async function fbSubscribe(page: FbPage): Promise<void> {
  const r = await fetch(`${FB_GRAPH}/${page.id}/subscribed_apps?${new URLSearchParams({ subscribed_fields: FB_FIELDS, access_token: page.access_token })}`, { method: "POST" });
  const b = (await r.json().catch(() => ({}))) as { success?: boolean; error?: { message?: string } };
  if (!r.ok || !b.success) throw new Error(`facebook subscribe: ${b.error?.message ?? r.status}`);
}
