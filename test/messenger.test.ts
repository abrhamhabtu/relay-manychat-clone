import { afterEach, describe, expect, it, vi } from "vitest";
import { makeD1 } from "./d1shim";
import * as db from "../src/db";
import worker from "../src/index";
import { hmacHex, privateReply, react, replyToComment, sendText } from "../src/meta";
import { setPageToken, toInstagramShape } from "../src/messenger";
import type { Env } from "../src/setter";

const ctx = { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext;
function makeEnv(): Env {
  return { DB: makeD1(), ANTHROPIC_API_KEY: "t", MANYCHAT_API_KEY: "", INBOUND_SECRET: "s", ADMIN_PASSWORD: "pw", REVIEW_PASSWORD: "rv", AI: {} as Ai, SKOOL_LINK: "https://x.dev", AUTOPILOT: "false", REPLY_DELAY_MIN_S: "0", REPLY_DELAY_MAX_S: "0", TRANSPORT: "meta", META_IG_APP_ID: "1", META_APP_SECRET: "igsecret", META_VERIFY_TOKEN: "vt", FB_APP_ID: "77", FB_APP_SECRET: "fbsecret" } as Env;
}
type Call = { url: string; auth: string | null; body: any };
let calls: Call[] = [];
function stub(reply: (u: string) => object = () => ({ message_id: "m.1", recipient_id: "9001" })) {
  calls = [];
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    calls.push({ url, auth: new Headers(init?.headers).get("Authorization"), body: typeof init?.body === "string" ? JSON.parse(init.body) : null });
    return Response.json(reply(url));
  });
}
afterEach(() => {
  vi.unstubAllGlobals();
  setPageToken(null);
});

describe("messenger: in", () => {
  it("reads a Page webhook as Instagram's shape, every id marked as Messenger", () => {
    const shaped = toInstagramShape({
      object: "page",
      entry: [
        { id: "100", time: 1, messaging: [{ sender: { id: "555" }, recipient: { id: "100" }, timestamp: 5, message: { mid: "m_1", text: "hi" } }] },
        { id: "100", changes: [{ field: "feed", value: { item: "comment", verb: "add", comment_id: "100_7", post_id: "100_3", message: "MENU please", from: { id: "42", name: "Ana" } } }] },
        { id: "100", changes: [{ field: "feed", value: { item: "like", verb: "add" } }] },
      ],
    }) as any;
    expect(shaped.object).toBe("instagram");
    expect(shaped.entry[0].id).toBe("fb:100");
    expect(shaped.entry[0].messaging[0].sender.id).toBe("fb:555");
    expect(shaped.entry[1].changes[0]).toEqual({ field: "comments", value: { id: "fb:100_7", text: "MENU please", from: { id: "fb:42", username: "Ana" }, media: { id: "fb:100_3" } } });
    expect(shaped.entry[2].changes).toEqual([]);
    expect(toInstagramShape({ object: "instagram", entry: [] })).toEqual({ object: "instagram", entry: [] }); // Instagram's own pass through
  });
});

describe("messenger: out", () => {
  it("sends a Messenger contact's message to Facebook with the Page token, and leaves Instagram alone", async () => {
    setPageToken("PAGE");
    stub();
    await sendText("igtoken", "fb:555", "see fb:this");
    expect(calls[0].url).toBe("https://graph.facebook.com/v26.0/me/messages");
    expect(calls[0].auth).toBe("Bearer PAGE");
    expect(calls[0].body).toEqual({ recipient: { id: "555" }, message: { text: "see fb:this" } });
    await sendText("igtoken", "17841", "hi");
    expect(calls[1].url).toBe("https://graph.instagram.com/v26.0/me/messages");
    expect(calls[1].auth).toBe("Bearer igtoken");
  });

  it("maps the calls that differ: private replies, public replies and reactions", async () => {
    setPageToken("PAGE");
    stub();
    expect(await privateReply("ig", "fb:100_7", "here")).toEqual({ lead_id: "fb:9001", mid: "m.1" });
    expect(calls[0].body.recipient).toEqual({ comment_id: "100_7" });
    await replyToComment("ig", "fb:100_7", "sent you a DM!");
    expect(calls[1].url).toBe("https://graph.facebook.com/v26.0/100_7/comments?message=sent+you+a+DM%21");
    await react("ig", "fb:555", "m_1", "❤️");
    expect(calls).toHaveLength(2); // Pages can't react through the Send API: skipped, not an error
  });

  it("never reaches Facebook without a connected Page", async () => {
    stub();
    await expect(sendText("ig", "fb:555", "hi")).rejects.toThrow(/no Facebook Page/);
    expect(calls).toHaveLength(0);
  });
});

describe("messenger: the webhook", () => {
  const post = async (env: Env, body: object, secret = "fbsecret") => {
    const raw = JSON.stringify(body);
    return worker.fetch(new Request("https://x/messenger", { method: "POST", body: raw, headers: { "X-Hub-Signature-256": `sha256=${await hmacHex(secret, raw)}` } }), env, ctx);
  };
  const dm = (text: string) => ({ object: "page", entry: [{ id: "100", messaging: [{ sender: { id: "555" }, recipient: { id: "100" }, timestamp: Date.now(), message: { mid: `m_${text}`, text } }] }] });

  it("refuses anything not signed with the App Secret", async () => {
    const env = makeEnv();
    expect((await post(env, dm("hi"), "igsecret")).status).toBe(401);
  });

  it("records a Messenger DM as its own contact, and answers a keyword on Messenger", async () => {
    const env = makeEnv();
    await db.setSetting(env.DB, "fb_page_token", "PAGE");
    await env.DB.prepare(`INSERT INTO triggers (source, keyword, name, dm, enabled, created_at, published_at) VALUES ('dm', 'MENU', 'Menu', 'here is the menu', 1, 1, 1)`).run();
    stub((u) => (u.includes("fields=") ? { name: "Ana Park" } : { message_id: "m.out", recipient_id: "555" }));
    const res = await post(env, dm("MENU"));
    expect(res.status).toBe(200);
    const lead = await db.getLead(env.DB, "fb:555");
    expect(lead?.subscriber_id).toBe("fb:555");
    const sends = calls.filter((c) => c.url.endsWith("/me/messages") && c.body?.message);
    expect(sends.length).toBeGreaterThan(0);
    expect(sends[0].url.startsWith("https://graph.facebook.com/")).toBe(true);
    expect(sends[0].auth).toBe("Bearer PAGE");
    expect(sends[0].body.recipient).toEqual({ id: "555" });
  });
});
