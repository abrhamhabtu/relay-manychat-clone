// The Automations page and flow editor: My Automations (folders, search, trigger and state
// filters, sort by name / runs / modified, LIVE / DRAFT / OFF, Runs, CTR, on/off switch, rename / duplicate / move /
// delete, bulk move and delete, Trash), templates for the common Instagram automations, Basic Automations (Default
// Reply = the AI setter, Welcome Message, Conversation Starters, Main Menu, Story Mention Reply), and the whiteboard
// editor at /admin/flows/<id> (src/flow_editor.ts) with autosave and Publish. The reviewer login can look but not
// change anything.

import { esc, page, type Role } from "./admin";
import { NEXT_POST, type Trigger } from "./comments";
import * as db from "./db";
import { EDITOR_CSS, EDITOR_JS } from "./flow_editor";
import { saveIceBreakers, saveMenu, testCode } from "./flows";
import { editorGraph, graphStats, loadGraph, publish, sanitize, STAGES, triggerCfg, validate, type Graph, type Node } from "./graph";
import { fetchAccount, recentMedia, recentStories, type Media, type Story } from "./meta";
import type { Env } from "./setter";
import { icon } from "./theme";

const CSS = `<style>
/* The Automation page: a 196px sub-nav on the left, then a 1070px column: heading + New
   Automation, a 4-column row of search and filters, folders on the same 4 columns, Trash on the right, then a card per
   automation on one grid (name | switch | runs | CTR | modified | menu) with its trigger on a second line. */
.m-automations .wrap:has(.au){max-width:none;padding:0 48px 32px 32px}
.au{display:flex;gap:32px;align-items:flex-start}
.au-nav{flex:none;width:196px;padding-top:24px;display:flex;flex-direction:column}
.au-nav a{display:flex;align-items:center;gap:8px;height:36px;padding:0 8px;border-radius:6px;color:var(--ink);font-size:14px;line-height:20px;opacity:1}
.au-nav a svg{color:var(--mut)}
.au-nav a:hover{background:var(--navhov);opacity:1}.au-nav a.on{background:var(--navon)}
.au-main{flex:1;min-width:0;max-width:1070px;margin:0 auto;padding-top:32px}
.au-h{display:flex;justify-content:space-between;min-height:42px;align-items:center;gap:12px;margin:0 0 24px}
.au-h h2{font-size:24px;line-height:36px;font-weight:700;letter-spacing:-.01em}
.au-h h2 a{color:var(--mut)}
.mc-btn{display:inline-flex;align-items:center;gap:8px;height:36px;white-space:nowrap;background:var(--pri);color:#fff;border-radius:6px;padding:0 12px;font-weight:500;font-size:14px;border:0;margin:0;opacity:1;cursor:pointer}
.mc-btn:hover{background:color-mix(in srgb,var(--pri) 88%,#000);opacity:1}
.au-f,.au-fds{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:0 0 24px}
.au-f>*{margin:0}
.au-f input,.au-f select{height:36px;margin:0;padding:0 12px;border-radius:6px;background-color:var(--panel);border:1px solid var(--line);font-size:14px;color:var(--ink)}
.au-f select{padding-right:30px;color:var(--mut)}
.au-f .srch{margin:0}.au-f .srch input{padding-left:36px;font-size:14px;border-radius:6px;background:var(--panel);border:1px solid var(--line)}.au-f .srch svg{left:12px;top:10px}
.au-fds{margin-bottom:16px}
.au-fd{position:relative;display:flex;align-items:center;gap:8px;height:42px;border:1px dashed transparent;border-radius:4px;padding:0 4px 0 12px;background:var(--panel);border-color:var(--line);color:var(--ink);opacity:1;min-width:0}
.au-fd>a{flex:1;color:var(--ink);display:flex;align-items:center;gap:10px;min-width:0;height:100%;opacity:1}.au-fd>a span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.au-fd svg{color:var(--pri)}
.au-fd small{color:var(--mut)}
.au-fd.new{border-color:var(--pri);color:var(--pri);background:none;box-shadow:none;justify-content:flex-start;cursor:pointer;margin:0;font-size:14px;font-weight:500;padding:0 12px}
.au-fd.new:hover{background:color-mix(in srgb,var(--pri) 6%,transparent)}
.au-tr{display:flex;justify-content:flex-end;margin:0 0 40px}
.au-tr a{display:inline-flex;align-items:center;gap:6px;font-size:14px;font-weight:500}
.au-cols,.au-row{display:grid;grid-template-columns:18px minmax(0,1fr) 36px 56px 56px 112px 32px;column-gap:24px;align-items:center}
.au-cols{font-size:12px;line-height:16px;color:var(--mut);padding:0 24px 12px}.au-cols a{color:var(--mut);opacity:1}.au-cols a:hover,.au-cols a.on{color:var(--ink)}.au-cols .r{text-align:right}
.au-cols>:nth-child(2),.au-row>.nmc,.au-row>.trg{margin-left:-10px}
.au-row{row-gap:16px;border-radius:4px;padding:24px;margin-bottom:16px;background:var(--panel);border:1px solid var(--line)}
:root[data-theme=dark] .au-row,:root[data-theme=dark] .au-fd:not(.new){box-shadow:none;border:1px solid var(--line)}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .au-row,:root:not([data-theme=light]) .au-fd:not(.new){box-shadow:none;border:1px solid var(--line)}}
.au-row input[type=checkbox],.au-cols input[type=checkbox]{width:18px;height:18px;margin:0;display:block;accent-color:var(--pri)}
.au-row .nm{color:var(--ink);font-size:16px;line-height:20px;font-weight:600;opacity:1;display:flex;align-items:center;min-width:0}.au-row .nm span:last-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.au-row .nm:hover span:last-child{color:var(--pri)}
.au-row .trg{font-size:12px;line-height:20px;color:var(--mut);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mc-num{font-weight:500;text-align:right;font-variant-numeric:tabular-nums}.au-row .mod{color:var(--mut);white-space:nowrap}
.au-row .sub{font-size:12px;line-height:16px;color:var(--mut);text-align:right;font-variant-numeric:tabular-nums}
.au-row .sw{display:grid;place-items:center}
.st-b{display:inline-block;font-size:12px;line-height:16px;font-weight:500;padding:3px 7px;border-radius:4px;margin-right:8px;flex:none;border:1px solid transparent}
.st-b.live{background:var(--pri);color:var(--onpri)}.st-b.draft,.st-b.off{background:var(--canvas);color:var(--mut);border-color:var(--panel)}
.ig{display:inline-block;width:12px;height:12px;border-radius:4px;background:var(--ink);vertical-align:-2px;margin-right:6px}
.au-row .trg .chip{padding:1px 6px;line-height:16px;font-weight:400;margin:0 2px;border-radius:40px;color:var(--mut);background:color-mix(in srgb,var(--pri) 8%,var(--panel));border:1px solid color-mix(in srgb,var(--pri) 30%,var(--panel))}
.au .switch{position:relative;display:inline-block;width:36px;height:20px;margin:0}.au .switch input{position:absolute;opacity:0;width:100%;height:100%;margin:0;cursor:pointer;z-index:1}
.au .switch span{position:absolute;inset:0;border-radius:999px;background:var(--track);transition:.15s}.au .switch span:after{content:"";position:absolute;left:2px;top:2px;width:16px;height:16px;border-radius:50%;background:#fff;transition:.15s}
.au .switch span:before{display:none}.au .switch input:checked+span{background:var(--pri)}.au .switch input:checked+span:after{left:18px}
.au-m{position:relative}.au-m summary{list-style:none;cursor:pointer;padding:2px 6px;border-radius:6px;color:var(--mut);font-size:18px;line-height:20px;text-align:center}.au-m summary::-webkit-details-marker{display:none}
.au-m summary:hover{background:var(--soft)}
.au-m>div{position:absolute;right:0;top:32px;z-index:4;background:var(--elev);border:1px solid var(--line);border-radius:4px;box-shadow:0 8px 30px rgba(0,0,0,.15);padding:6px;min-width:200px}
.au-m form{margin:0}.au-m button,.au-m select{display:block;width:100%;text-align:left;background:none;color:var(--ink);font-weight:500;padding:9px 12px;margin:0;border:0;border-radius:4px}
.au-m button:hover{background:var(--hover)}.au-m button.dz{color:var(--red)}.au-m select{background-color:var(--soft);margin:4px 0}
.au-bulk{display:none;position:sticky;bottom:12px;z-index:3;align-items:center;gap:8px;background:var(--elev);border:1px solid var(--line);border-radius:4px;box-shadow:0 8px 30px rgba(0,0,0,.15);padding:10px 12px;margin-top:8px}
.au:has(.au-row input[form=bulk]:checked) .au-bulk{display:flex}.au-bulk select{margin:0;width:auto;flex:1}.au-bulk button{margin:0}
.au-empty{border:1px dashed var(--line);border-radius:4px;padding:28px;text-align:center;color:var(--mut)}
.au-main>.card{border-radius:4px;margin-top:24px}
dialog.au-new{border:0;border-radius:4px;padding:0;max-width:720px;width:calc(100% - 32px);background:var(--bg);color:var(--ink);box-shadow:0 20px 60px rgba(0,0,0,.3)}
dialog.au-new::backdrop{background:rgba(0,0,0,.45)}
.au-new .hd{display:flex;justify-content:space-between;align-items:center;padding:18px 20px;border-bottom:1px solid var(--line)}.au-new .hd h2{font-size:18px}
.au-new .hd button{margin:0;background:none;color:var(--mut);font-size:22px;padding:0 6px}
.au-tpl{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;padding:20px}
.au-tpl form{margin:0}.au-tpl button{display:block;width:100%;height:100%;margin:0;text-align:left;background:var(--elev);color:var(--ink);border:1px solid var(--line);border-radius:4px;padding:14px;font-weight:600}
.au-tpl button:hover{background:var(--hover);border-color:var(--mut)}.au-tpl small{display:block;color:var(--mut);font-weight:400;font-size:12px;line-height:16px;margin-top:6px}
.au-tpl .em{font-size:22px;display:block;margin-bottom:8px}
.basic .row{align-items:center;padding:16px 0}.basic .row b{font-weight:600}.basic .row p{margin:4px 0 0;color:var(--mut);font-size:13px}.basic .row form{margin:0}
.live-pill{color:var(--green);font-size:13px;font-weight:600;white-space:nowrap;padding:7px 4px}
.off-pill{color:var(--mut);font-size:13px;font-weight:600;white-space:nowrap;padding:7px 4px}
.bk{margin:0 0 4px}.bk a{font-weight:600;color:var(--mut)}.wrap:has(.bk) .ttl{display:none}
.err{color:var(--red);background:color-mix(in srgb,var(--red) 10%,transparent);border-radius:4px;padding:10px 12px;margin-bottom:12px}
@media (max-width:1100px){
  .au-nav{width:150px}
  .au-f,.au-fds{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (max-width:767px){
  .m-automations .wrap:has(.au){padding:0 16px 32px}
  .au{flex-direction:column;gap:0;align-items:stretch}
  .au-nav{width:auto;flex-direction:row;gap:6px;padding-top:12px}
  .au-main{padding-top:16px;max-width:none}
  .au-h{margin-bottom:16px}.au-h h2{font-size:20px;line-height:28px}
  .au-f .srch{grid-column:1/-1}
  .au-tr{margin-bottom:20px}
  .au-cols{display:none}
  .au-row{grid-template-columns:minmax(0,1fr) auto auto;column-gap:12px;row-gap:10px;padding:16px;margin-bottom:12px}
  .au-row>.cb,.au-row>.sp,.au-row>.ctr,.au-row>.mod,.au-row>.sub{display:none}
  .au-row>.nmc,.au-row>.trg{margin-left:0}
  .au-row>.trg{white-space:normal}
  .au-row>.sw{grid-column:2/-1;justify-self:end}
}

/* Relay: mono status badges, sharp menus */
.st-b{font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;border-radius:2px}
.au-m>div,.au-bulk,dialog.au-new{box-shadow:6px 6px 0 color-mix(in srgb,var(--ink) 12%,transparent);border:1px solid var(--ink)}
.live-pill{color:var(--pri);font-family:var(--mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase}

/* scenario gallery */
dialog.tpd{max-width:1080px;width:calc(100% - 48px);height:min(760px,calc(100vh - 64px));padding:0;border:0!important;border-radius:22px!important;overflow:hidden;background:var(--canvas);box-shadow:0 40px 120px -20px rgba(0,0,0,.45)!important}
dialog.tpd[open]{display:flex;flex-direction:column;animation:rl-pop .3s cubic-bezier(.32,.72,0,1)}
dialog.tpd::backdrop{background:rgba(0,0,0,.28);backdrop-filter:blur(6px)}
.tpd-h{display:flex;align-items:center;gap:16px;padding:20px 22px 16px 26px;border-bottom:.5px solid var(--line);background:var(--glass);backdrop-filter:saturate(180%) blur(20px)}
.tpd-h h2{font:700 22px/1.1 var(--serif);letter-spacing:-.025em;margin:0}.tpd-h p{margin:4px 0 0;color:var(--mut);font-size:13px}
.tpd-h>div{flex:1}
.tpd-s{position:relative;display:flex;align-items:center;margin:0;text-transform:none;letter-spacing:0}.tpd-s svg{position:absolute;left:12px;color:var(--mut)}
.tpd-s input{width:240px;margin:0;padding:9px 12px 9px 36px;border-radius:10px;border:0;background:color-mix(in srgb,var(--ink) 6%,transparent)}
.tpd-h form{margin:0}.tpd-x{display:grid;place-items:center;width:32px;height:32px;padding:0!important;margin:0!important;border-radius:50%!important;background:color-mix(in srgb,var(--ink) 7%,transparent)!important;color:var(--ink)!important;box-shadow:none!important}
.tpd-b{flex:1;display:grid;grid-template-columns:210px minmax(0,1fr);min-height:0}
.tpd-r{display:flex;flex-direction:column;gap:2px;padding:14px 10px;border-right:.5px solid var(--line);overflow-y:auto}
.tp-cat{display:flex!important;align-items:center;justify-content:space-between;width:100%;margin:0!important;padding:8px 12px!important;border-radius:9px!important;background:transparent!important;color:var(--ink)!important;box-shadow:none!important;font-weight:500!important;text-align:left;font-size:13.5px}
.tp-cat span{color:var(--mut);font-size:12px;font-weight:500}
.tp-cat:hover{background:color-mix(in srgb,var(--ink) 5%,transparent)!important}
.tp-cat.on{background:color-mix(in srgb,var(--pri) 12%,transparent)!important;color:var(--pri)!important;font-weight:600!important}.tp-cat.on span{color:var(--pri)}
.tpd-blank{margin:auto 0 0}.tpd-blank button{display:flex;align-items:center;gap:8px;justify-content:center;width:100%;margin:12px 0 0;border-radius:12px!important}
.tpd-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px;align-content:start;padding:18px 22px 24px;overflow-y:auto}
.tp{margin:0}.tp[hidden]{display:none}
.tp>button{display:flex!important;flex-direction:column;width:100%;height:100%;margin:0!important;padding:0!important;border-radius:18px!important;background:var(--panel)!important;color:var(--ink)!important;text-align:left;font-weight:400!important;box-shadow:var(--sh1)!important;overflow:hidden;transition:transform .25s cubic-bezier(.32,.72,0,1),box-shadow .25s!important}
.tp>button:hover{transform:translateY(-3px)!important;box-shadow:var(--sh2)!important;filter:none!important}
.tp-pv{display:flex;flex-direction:column;align-items:flex-start;gap:4px;min-height:132px;padding:14px 14px 12px;background:linear-gradient(160deg,color-mix(in srgb,var(--pri) 7%,var(--soft)),var(--soft))}
.tp-trg{align-self:center;font-size:10.5px;color:var(--mut);margin-bottom:4px}.tp-trg b{color:var(--ink);font-weight:700}
.tp-b{max-width:92%;padding:7px 11px;border-radius:16px;background:var(--panel);font-size:12.5px;line-height:16px;white-space:pre-line;box-shadow:0 1px 1px rgba(0,0,0,.04)}
.tp-btn{max-width:92%;padding:6px 11px;border-radius:12px;background:var(--panel);color:#2d7cff;font-size:12px;font-weight:600}
.tp-bd{display:flex;flex-direction:column;gap:6px;padding:12px 14px 14px;flex:1}
.tp-t{display:flex;align-items:center;gap:8px;font-weight:650;font-size:14px;letter-spacing:-.01em}
.tp-em{display:grid;place-items:center;width:26px;height:26px;border-radius:8px;background:color-mix(in srgb,var(--ink) 5%,transparent);font-size:14px;flex:none}
.tp-bd small{color:var(--mut);font-size:12.5px;line-height:17px}
.tp-ch{display:flex;flex-wrap:wrap;gap:4px;margin-top:auto;padding-top:4px}
.tp-ch i{font-style:normal;font-size:10.5px;font-weight:600;padding:3px 8px;border-radius:999px}
.c-ig{background:linear-gradient(135deg,rgba(250,126,30,.14),rgba(214,41,118,.14));color:#c1306b}
.c-fb{background:rgba(0,132,255,.12);color:#0a6cdb}
.c-tt{background:rgba(37,244,238,.16);color:#0b7f7b}
.c-yt{background:rgba(255,0,0,.1);color:#c4151c}
.tp-how{font-size:11px;line-height:15px;color:var(--mut);padding:7px 9px;border-radius:9px;background:color-mix(in srgb,var(--ink) 4%,transparent)}
.tpd-none{grid-column:1/-1;color:var(--mut);text-align:center;padding:40px 0}
@media (max-width:767px){.tpd-b{grid-template-columns:1fr}.tpd-r{flex-direction:row;overflow-x:auto;border-right:0;border-bottom:.5px solid var(--line)}.tp-cat{width:auto;white-space:nowrap;gap:6px}.tpd-blank{margin:0}.tpd-s input{width:140px}.tpd-h p{display:none}}
</style>`;

const SOURCES: { value: Trigger["source"]; label: string }[] = [
  { value: "comment", label: "Post or Reel Comments" },
  { value: "story", label: "Story Reply" },
  { value: "dm", label: "DM Keyword" },
  { value: "mention", label: "Story Mention" },
  { value: "welcome", label: "Welcome Message" },
  { value: "none", label: "Button only" },
];

const chips = (kw: string) =>
  kw
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean)
    .map((k) => `<span class="chip">${esc(k === "*" ? "anything" : k)}</span>`)
    .join(" ");

export function triggerLine(t: Pick<Trigger, "source" | "keyword" | "media_id">, label: Map<string, string>): string {
  const anyText = t.keyword.split(",").some((k) => k.trim() === "*") || !t.keyword.trim();
  switch (t.source) {
    case "comment": {
      const where =
        t.media_id === NEXT_POST ? "next Post or Reel" : t.media_id ? `specific Post or Reel <small>(${esc(label.get(t.media_id) ?? t.media_id)})</small>` : "any Post or Reel";
      return `User comments on ${where}${anyText ? "" : ` and comment contains ${chips(t.keyword)}`}`;
    }
    case "dm":
      return `User sends a message${anyText ? "" : ` that contains ${chips(t.keyword)}`}`;
    case "story":
      return `User replies to ${t.media_id ? "a specific Story" : "your Story"}${anyText ? "" : ` with ${chips(t.keyword)}`}`;
    case "mention":
      return "User mentions you in their Story";
    case "welcome":
      return "New conversation: their very first message";
    default:
      return "Only from a button, Conversation Starter or another automation";
  }
}

const pct = (n: number, of: number) => (of ? `${((100 * n) / of).toFixed(1)}%` : "n/a");

function ago(ms: number | null, now: number): string {
  if (!ms) return "";
  const s = Math.max(0, (now - ms) / 1000);
  const unit = ([[31536000, "year"], [2592000, "month"], [604800, "week"], [86400, "day"], [3600, "hour"], [60, "minute"]] as const).find(([n]) => s >= n);
  if (!unit) return "just now";
  const n = Math.floor(s / unit[0]);
  return `${n} ${unit[1]}${n === 1 ? "" : "s"} ago`;
}

export const statusOf = (t: Trigger): "live" | "off" | "draft" => (t.enabled ? "live" : t.published_at ? "off" : "draft");
const badge = (t: Trigger) => `<span class="st-b ${statusOf(t)}">${statusOf(t).toUpperCase()}</span>`;

const DEFAULT_NAME: Partial<Record<Trigger["source"], string>> = { mention: "Story Mention Reply", welcome: "Welcome Message", none: "Button-only automation" };
export const nameOf = (t: Trigger) => t.name || DEFAULT_NAME[t.source] || t.keyword || "Untitled automation";

interface Stats {
  runs: number;
  clicks: number;
}

// Runs = people who entered the automation; CTR = share of them who tapped or clicked anything in it. Comment
// automations count from the comments log too, which predates flow_starts.
async function automationStats(env: Env): Promise<Map<number, Stats>> {
  const { results } = await env.DB.prepare(`SELECT trigger_id, COUNT(*) AS runs FROM flow_starts WHERE status = 'sent' GROUP BY trigger_id`).all<{ trigger_id: number; runs: number }>();
  const { results: clicks } = await env.DB.prepare(
    `SELECT s.trigger_id, COUNT(DISTINCT s.subscriber_id) AS n FROM flow_taps t JOIN flow_sends s ON s.id = t.send_id GROUP BY s.trigger_id`,
  ).all<{ trigger_id: number; n: number }>();
  const { results: comments } = await env.DB.prepare(
    `SELECT trigger_id, COUNT(*) AS runs FROM comments WHERE status = 'sent' AND trigger_id IS NOT NULL GROUP BY trigger_id`,
  ).all<{ trigger_id: number; runs: number }>();
  const out = new Map<number, Stats>(results.map((r) => [r.trigger_id, { runs: r.runs, clicks: 0 }]));
  const get = (id: number) => out.get(id) ?? out.set(id, { runs: 0, clicks: 0 }).get(id)!;
  for (const c of clicks) get(c.trigger_id).clicks = c.n;
  for (const c of comments) get(c.trigger_id).runs = Math.max(get(c.trigger_id).runs, c.runs);
  return out;
}

async function folders(env: Env): Promise<string[]> {
  const saved = JSON.parse((await db.getSetting(env.DB, "automation_folders")) ?? "[]") as string[];
  const { results } = await env.DB.prepare(`SELECT DISTINCT folder FROM triggers WHERE folder IS NOT NULL AND deleted_at IS NULL`).all<{ folder: string }>();
  return [...new Set([...saved, ...results.map((r) => r.folder)])].sort((a, b) => a.localeCompare(b));
}
const setFolders = (env: Env, list: string[]) => db.setSetting(env.DB, "automation_folders", JSON.stringify([...new Set(list)]));

const qs = (base: Record<string, string>, over: Record<string, string | null>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...base, ...over })) if (v) p.set(k, v);
  const s = p.toString();
  return `/admin/automations${s ? `?${s}` : ""}`;
};

// ---------- templates ----------

const msg = (id: string, x: number, y: number, bubbles: { text: string; buttons?: { id: string; title: string; url?: string }[] }[], qrs: string[] = []): Node => ({
  id,
  kind: "message",
  x,
  y,
  data: { bubbles: bubbles.map((b) => ({ text: b.text, buttons: b.buttons ?? [] })), quick_replies: qrs.map((title, i) => ({ id: `${id}q${i}`, title })) },
});
const act = (id: string, x: number, y: number, actions: { type: string; value: string }[]): Node => ({ id, kind: "action", x, y, data: { actions } });
const TRIG: Node = { id: "trigger", kind: "trigger", x: 0, y: 0, data: {} };
const tg = (source: Trigger["source"], keyword: string, nodes: Node[], edges: [string, string, string][], public_reply: string | null = null): Graph => ({
  trigger: { source, keyword, media_id: null, public_reply },
  nodes: [TRIG, ...nodes],
  edges: edges.map(([from, port, to]) => ({ from, port, to })),
});

// Where a template runs. TikTok and YouTube scenarios bring that audience into your Instagram DMs (a DM keyword you
// mention in the video or bio): Relay doesn't send on TikTok or YouTube.
export const CHANNEL: Record<string, string> = { ig: "Instagram", fb: "Messenger", tt: "TikTok → Instagram", yt: "YouTube → Instagram" };
export const CATEGORIES: [string, string][] = [
  ["popular", "Popular"],
  ["instagram", "Instagram"],
  ["messenger", "Messenger"],
  ["tiktok", "From TikTok"],
  ["youtube", "From YouTube"],
  ["sell", "Sell & launch"],
  ["community", "Community"],
];

export const TEMPLATES: Record<string, { name: string; emoji: string; desc: string; cats?: string[]; ch?: string[]; how?: string; graph: () => Graph }> = {
  comment: {
    name: "Comment keyword → DM link",
    emoji: "💬",
    cats: ["popular", "instagram"],
    ch: ["ig", "fb"],
    desc: "Someone comments a keyword, they get a DM with a button that sends the link.",
    graph: () =>
      tg(
        "comment",
        "LINK",
        [
          msg("m1", 380, 0, [{ text: "yoooo! tap below and I'll send it over 👇", buttons: [{ id: "send", title: "Send it" }] }]),
          msg("m2", 760, 0, [{ text: "here you go 🎁", buttons: [{ id: "open", title: "Open", url: "{{SKOOL_LINK}}" }] }]),
        ],
        [["trigger", "next", "m1"], ["m1", "send", "m2"]],
        "sent 📩\ncheck your DMs 👀",
      ),
  },
  followers: {
    name: "Comment keyword → link for followers",
    emoji: "🔒",
    cats: ["popular", "instagram"],
    ch: ["ig"],
    desc: "The link only goes to people who follow you; everyone else is asked to follow first.",
    graph: () =>
      tg(
        "comment",
        "GUIDE",
        [
          msg("m1", 380, 0, [{ text: "hey! tap below for the guide 👇", buttons: [{ id: "send", title: "Send it" }] }]),
          { id: "c1", kind: "condition", x: 760, y: 0, data: { match: "all", rules: [{ field: "follows", op: "is", value: "" }] } },
          msg("m2", 1140, -120, [{ text: "here it is 🎁", buttons: [{ id: "open", title: "Open the guide", url: "{{SKOOL_LINK}}" }] }]),
          msg("m3", 1140, 200, [{ text: "follow me first so you don't miss the next one, then tap below 👇", buttons: [{ id: "done", title: "I followed" }] }]),
        ],
        [["trigger", "next", "m1"], ["m1", "send", "c1"], ["c1", "yes", "m2"], ["c1", "no", "m3"], ["m3", "done", "c1"]],
      ),
  },
  dm: {
    name: "DM keyword → link + follow-up",
    emoji: "✉️",
    cats: ["instagram", "messenger"],
    ch: ["ig", "fb"],
    desc: "A DM with the keyword gets the link, then a nudge an hour later if they go quiet.",
    graph: () =>
      tg(
        "dm",
        "GUIDE",
        [
          msg("m1", 380, 0, [{ text: "here's the free guide 👇", buttons: [{ id: "open", title: "Get the guide", url: "{{SKOOL_LINK}}" }] }]),
          { id: "d1", kind: "delay", x: 760, y: 0, data: { seconds: 3600 } },
          msg("m2", 1140, 0, [{ text: "did you get a chance to check it out? curious what you think" }]),
        ],
        [["trigger", "next", "m1"], ["m1", "next", "d1"], ["d1", "next", "m2"]],
      ),
  },
  story: {
    name: "Story reply → tag and hand to the AI",
    emoji: "📸",
    cats: ["instagram", "community"],
    ch: ["ig"],
    desc: "Thank people who reply to your Story, ask what they're after, tag them and let the AI take over.",
    graph: () =>
      tg(
        "story",
        "*",
        [
          msg("m1", 380, 0, [{ text: "appreciate you 🙏 what are you working on right now?" }], ["Growing on YouTube", "AI in my business"]),
          act("a1", 760, -60, [{ type: "add_tag", value: "youtube" }, { type: "handoff", value: "" }]),
          act("a2", 760, 200, [{ type: "add_tag", value: "ai-business" }, { type: "handoff", value: "" }]),
        ],
        [["trigger", "next", "m1"], ["m1", "m1q0", "a1"], ["m1", "m1q1", "a2"]],
      ),
  },
  welcome: {
    name: "Welcome Message",
    emoji: "👋",
    cats: ["instagram", "messenger", "community"],
    ch: ["ig", "fb"],
    desc: "First DM ever and no keyword matched: say hi, sort them with quick replies, hand off to the AI.",
    graph: () =>
      tg(
        "welcome",
        "*",
        [
          msg("m1", 380, 0, [{ text: "hey! welcome in 👋 what are you building right now?" }], ["A YouTube channel", "An AI business", "Just looking"]),
          act("a1", 760, -120, [{ type: "add_tag", value: "youtube" }, { type: "handoff", value: "" }]),
          act("a2", 760, 120, [{ type: "add_tag", value: "ai-business" }, { type: "handoff", value: "" }]),
          act("a3", 760, 360, [{ type: "handoff", value: "" }]),
        ],
        [["trigger", "next", "m1"], ["m1", "m1q0", "a1"], ["m1", "m1q1", "a2"], ["m1", "m1q2", "a3"]],
      ),
  },
  mention: {
    name: "Story Mention Reply",
    emoji: "🙌",
    cats: ["instagram", "community"],
    ch: ["ig"],
    desc: "Thank people who mention you in their Story.",
    graph: () => tg("mention", "*", [msg("m1", 380, 0, [{ text: "thanks for the shoutout 🙏 means a lot" }])], [["trigger", "next", "m1"]]),
  },
  unlock: {
    name: "Tap to unlock the link",
    emoji: "🔓",
    desc: "They comment, you DM a friendly hello with a button. One tap and the link lands, plus a question that starts a real chat.",
    cats: ["popular", "instagram"],
    ch: ["ig", "fb"],
    graph: () =>
      tg(
        "comment",
        "KIT",
        [
          msg("m1", 380, 0, [{ text: "yo {{first_name}}! 👋 you just watched it run live 😄 tap below and I'll send the whole thing over", buttons: [{ id: "send", title: "Send me the link 👉" }] }]),
          msg("m2", 760, 0, [{ text: "you got it 🙌" }, { text: "here it is 👉 {{SKOOL_LINK}}" }, { text: "what's the first thing you'd make with it?" }]),
        ],
        [["trigger", "next", "m1"], ["m1", "send", "m2"]],
        "just sent it 📩",
      ),
  },
  bundle: {
    name: "Send a bundle of links",
    emoji: "🧰",
    desc: "One keyword, a whole stack: a neat, numbered list of tools or resources, spaced out so it's easy to read on a phone.",
    cats: ["popular", "instagram"],
    ch: ["ig", "fb"],
    graph: () =>
      tg(
        "comment",
        "TOOLS",
        [
          msg("m1", 380, 0, [
            { text: "here's all 5 👇" },
            { text: "1. Tool one (what it does)\n→ {{SKOOL_LINK}}\n\n2. Tool two (what it does)\n→ https://\n\n3. Tool three (what it does)\n→ https://\n\n4. Tool four (what it does)\n→ https://\n\n5. Tool five (what it does)\n→ https://" },
            { text: "save this one, you'll want it later 🔖" },
          ]),
        ],
        [["trigger", "next", "m1"]],
        "sent you all 5 📩",
      ),
  },
  followgate: {
    name: "Follow first, then the link",
    emoji: "🤝",
    desc: "A warm ask to follow before you send it over. They tap “Following” and get the goods.",
    cats: ["instagram"],
    ch: ["ig"],
    graph: () =>
      tg(
        "comment",
        "SETUP",
        [
          msg("m1", 380, 0, [{ text: "hey! sending you this setup 🙌 just make sure you're following so you catch the next one", buttons: [{ id: "ok", title: "Following ✅" }] }]),
          msg("m2", 760, 0, [{ text: "legend 🙏 here it is", buttons: [{ id: "open", title: "Open the setup", url: "{{SKOOL_LINK}}" }] }]),
        ],
        [["trigger", "next", "m1"], ["m1", "ok", "m2"]],
      ),
  },
  launch: {
    name: "Launch: it's live!",
    emoji: "🚀",
    desc: "For a course, product or drop: the link the moment they ask, then a friendly check-in the next day.",
    cats: ["sell"],
    ch: ["ig", "fb"],
    graph: () =>
      tg(
        "comment",
        "LIVE",
        [
          msg("m1", 380, 0, [{ text: "it's officially live 🎉" }, { text: "tap below and I'll send you the link", buttons: [{ id: "send", title: "Send it" }] }]),
          msg("m2", 760, 0, [{ text: "here you go 👉", buttons: [{ id: "open", title: "See what's inside", url: "{{SKOOL_LINK}}" }] }]),
          { id: "d1", kind: "delay", x: 1140, y: 0, data: { seconds: 86400 } },
          msg("m3", 1520, 0, [{ text: "hey! did you get a chance to look? any questions, just reply here 🙂" }]),
        ],
        [["trigger", "next", "m1"], ["m1", "send", "m2"], ["m2", "next", "d1"], ["d1", "next", "m3"]],
      ),
  },
  email: {
    name: "Link + ask for their email",
    emoji: "📩",
    desc: "Send the link, then offer the full version by email. Their reply lands in your Inbox, tagged.",
    cats: ["sell"],
    ch: ["ig", "fb"],
    graph: () =>
      tg(
        "dm",
        "FREE",
        [
          msg("m1", 380, 0, [{ text: "here's the free version 👇", buttons: [{ id: "open", title: "Get it", url: "{{SKOOL_LINK}}" }] }, { text: "want the full one too? I'll email it over" }], ["Yes please", "I'm good"]),
          msg("m2", 760, -80, [{ text: "you got it, shoot over your email 📩" }]),
          act("a1", 1140, -80, [{ type: "add_tag", value: "wants-email" }, { type: "pause_ai", value: "" }]),
          msg("m3", 760, 200, [{ text: "all good! enjoy it ✌️" }]),
        ],
        [["trigger", "next", "m1"], ["m1", "m1q0", "m2"], ["m2", "next", "a1"], ["m1", "m1q1", "m3"]],
      ),
  },
  call: {
    name: "Qualify, then book a call",
    emoji: "📅",
    desc: "Two quick questions sort who's ready; ready people get your booking link, the rest get a free resource.",
    cats: ["sell"],
    ch: ["ig", "fb"],
    graph: () =>
      tg(
        "dm",
        "CALL",
        [
          msg("m1", 380, 0, [{ text: "love that 🙌 quick one so I point you the right way: where are you at right now?" }], ["Just starting", "Already making money"]),
          msg("m2", 760, -120, [{ text: "perfect, start here, it'll save you months 👇", buttons: [{ id: "open", title: "Free starter guide", url: "{{SKOOL_LINK}}" }] }]),
          msg("m3", 760, 200, [{ text: "let's talk then 🤝 grab a time that works", buttons: [{ id: "book", title: "Book a call", url: "{{SKOOL_LINK}}" }] }]),
          act("a1", 1140, 200, [{ type: "add_tag", value: "hot lead" }]),
        ],
        [["trigger", "next", "m1"], ["m1", "m1q0", "m2"], ["m1", "m1q1", "m3"], ["m3", "next", "a1"]],
      ),
  },
  tiktok: {
    name: "TikTok viewers → your DMs",
    emoji: "🎵",
    desc: "Say “DM me TIKTOK on Instagram” in your TikTok video or bio. They message the word, they get what you promised.",
    cats: ["tiktok", "popular"],
    ch: ["tt"],
    how: "Relay doesn't send on TikTok. Put “DM me TIKTOK on Instagram” in your TikTok bio, captions or pinned comment.",
    graph: () =>
      tg(
        "dm",
        "TIKTOK",
        [
          msg("m1", 380, 0, [{ text: "ayy you came over from TikTok 🙌" }, { text: "here's what I promised 👇", buttons: [{ id: "open", title: "Get it", url: "{{SKOOL_LINK}}" }] }]),
          act("a1", 760, 0, [{ type: "add_tag", value: "from-tiktok" }]),
        ],
        [["trigger", "next", "m1"], ["m1", "next", "a1"]],
      ),
  },
  tiktok_series: {
    name: "TikTok series → part 2 on Instagram",
    emoji: "🎬",
    desc: "End a TikTok with “part 2 is in my DMs, send PART2 on Instagram”. They get the link to the full video.",
    cats: ["tiktok"],
    ch: ["tt"],
    how: "Relay doesn't send on TikTok. Say the keyword at the end of the TikTok.",
    graph: () =>
      tg(
        "dm",
        "PART2",
        [msg("m1", 380, 0, [{ text: "you made it 😂 here's part 2", buttons: [{ id: "open", title: "Watch part 2", url: "{{SKOOL_LINK}}" }] }, { text: "lmk if you want part 3 👀" }])],
        [["trigger", "next", "m1"]],
      ),
  },
  youtube: {
    name: "YouTube viewers → the template",
    emoji: "▶️",
    desc: "Add “DM me YOUTUBE on Instagram for the template” to your description or pinned comment. Then ask which video sent them.",
    cats: ["youtube", "popular"],
    ch: ["yt"],
    how: "Relay doesn't send on YouTube. Put the line in your video description, pinned comment or end screen.",
    graph: () =>
      tg(
        "dm",
        "YOUTUBE",
        [
          msg("m1", 380, 0, [{ text: "welcome over from YouTube 👋" }, { text: "here's the template from the video", buttons: [{ id: "open", title: "Get the template", url: "{{SKOOL_LINK}}" }] }]),
          { id: "d1", kind: "delay", x: 760, y: 0, data: { seconds: 600 } },
          msg("m2", 1140, 0, [{ text: "curious, which video sent you here?" }], ["The newest one", "An older one"]),
          act("a1", 1520, 0, [{ type: "add_tag", value: "from-youtube" }]),
        ],
        [["trigger", "next", "m1"], ["m1", "next", "d1"], ["d1", "next", "m2"], ["m2", "next", "a1"]],
      ),
  },
  youtube_live: {
    name: "YouTube Live → replay and slides",
    emoji: "🎙️",
    desc: "Tell your live chat to “DM me REPLAY on Instagram”. They get the replay and slides when it's up.",
    cats: ["youtube"],
    ch: ["yt"],
    how: "Relay doesn't send on YouTube. Say the keyword during the live and pin it in chat.",
    graph: () =>
      tg(
        "dm",
        "REPLAY",
        [msg("m1", 380, 0, [{ text: "thanks for hanging out on the live 🙏" }, { text: "replay + slides 👇", buttons: [{ id: "open", title: "Watch the replay", url: "{{SKOOL_LINK}}" }] }])],
        [["trigger", "next", "m1"]],
      ),
  },
  fbpage: {
    name: "Facebook Page post → DM",
    emoji: "💙",
    desc: "Someone comments on your Facebook Page post; Messenger sends them the info, privately. Works on Instagram posts too.",
    cats: ["messenger"],
    ch: ["fb", "ig"],
    how: "Facebook Page posts need Messenger connected (Accounts & platforms).",
    graph: () =>
      tg(
        "comment",
        "INFO",
        [msg("m1", 380, 0, [{ text: "hi {{first_name}}! thanks for commenting 😊 here's everything you asked about", buttons: [{ id: "open", title: "See the details", url: "{{SKOOL_LINK}}" }] }])],
        [["trigger", "next", "m1"]],
        "sent you a message 💬",
      ),
  },
  faq: {
    name: "FAQ menu for new messages",
    emoji: "❓",
    desc: "First message ever: tap a question, get the answer. Great for shops and local businesses on Messenger.",
    cats: ["messenger", "community"],
    ch: ["fb", "ig"],
    graph: () =>
      tg(
        "welcome",
        "*",
        [
          msg("m1", 380, 0, [{ text: "hi! thanks for messaging 👋 what can I help with?" }], ["Prices", "Hours", "Talk to a person"]),
          msg("m2", 760, -160, [{ text: "here's everything with prices 👇", buttons: [{ id: "open", title: "See prices", url: "{{SKOOL_LINK}}" }] }]),
          msg("m3", 760, 60, [{ text: "we're open Tue–Sun, 8am to 4pm ☕" }]),
          act("a1", 760, 280, [{ type: "add_tag", value: "needs-reply" }, { type: "pause_ai", value: "" }]),
        ],
        [["trigger", "next", "m1"], ["m1", "m1q0", "m2"], ["m1", "m1q1", "m3"], ["m1", "m1q2", "a1"]],
      ),
  },
  blank: {
    name: "Untitled automation",
    emoji: "✨",
    cats: [],
    ch: ["ig", "fb"],
    desc: "Start from scratch on an empty canvas.",
    graph: () => tg("dm", "", [msg("m1", 380, 0, [{ text: "" }])], [["trigger", "next", "m1"]]),
  },
};

// A new automation: a DRAFT (off) whose draft is the template. The live graph is just the When... node, so the old
// builder's conversion never touches it.
// The live automation already waiting for the next post, if any other than `id`.
const waitingForNextPost = (env: Env, id: number) =>
  env.DB.prepare(`SELECT * FROM triggers WHERE id != ?1 AND source = 'comment' AND media_id = ?2 AND enabled = 1 AND deleted_at IS NULL LIMIT 1`).bind(id, NEXT_POST).first<Trigger>();

async function create(env: Env, template: string, folder: string | null, now: number): Promise<number> {
  const tpl = TEMPLATES[template] ?? TEMPLATES.blank;
  const g = tpl.graph();
  const row = await env.DB.prepare(
    `INSERT INTO triggers (source, keyword, name, dm, enabled, folder, draft, created_at, updated_at) VALUES (?1, ?2, ?3, '', 0, ?4, ?5, ?6, ?6) RETURNING id`,
  )
    .bind(g.trigger.source, g.trigger.keyword || "*", tpl.name, folder, JSON.stringify(g), now)
    .first<{ id: number }>();
  await env.DB.prepare(`INSERT INTO flow_nodes (trigger_id, id, kind, data, x, y) VALUES (?1, 'trigger', 'trigger', '{}', 0, 0)`).bind(row!.id).run();
  return row!.id;
}

// ---------- the page ----------

// `after` = whatever the page adds under the list (admin.ts's Recent comments), inside the same column.
export async function automationsBody(env: Env, req: Request, who: Role, label: Map<string, string>, now = Date.now(), after = ""): Promise<string> {
  const u = new URL(req.url).searchParams;
  const tab = u.get("tab") === "basic" ? "basic" : u.get("tab") === "trash" ? "trash" : "all";
  const tabs = `<nav class="au-nav" aria-label="Automation">${[
    ["all", "My Automations", "flow"],
    ["basic", "Basic", "shapes"],
  ]
    .map(([k, l, ic]) => `<a href="/admin/automations${k === "all" ? "" : `?tab=${k}`}"${k === tab || (k === "all" && tab === "trash") ? ' class="on"' : ""}>${icon(ic, 16, 1.8)}${l}</a>`)
    .join("")}</nav>`;
  const body = tab === "basic" ? await basicTab(env, who) : tab === "trash" ? await trashTab(env, who, label, now) : await listTab(env, u, who, label, now);
  return `${CSS}<div class="au">${tabs}<div class="au-main">${body}${after}</div></div>${who === "admin" ? newDialog(u.get("folder")) : ""}`;
}

function newDialog(folder: string | null): string {
  const first = (g: Graph) => {
    const m = g.nodes.find((n) => n.kind === "message");
    const bubbles = m ? (m.data as { bubbles: { text: string; buttons: { title: string }[] }[] }).bubbles : [];
    return bubbles.slice(0, 2).map((b) => ({ text: b.text.replace(/\{\{SKOOL_LINK\}\}/g, "yourlink.com").replace(/\{\{first_name\}\}/g, "Maya"), btn: b.buttons[0]?.title ?? null }));
  };
  const kw = (g: Graph) => (g.trigger.keyword && g.trigger.keyword !== "*" ? g.trigger.keyword : null);
  const how = (g: Graph) => ({ comment: "Comments", dm: "DM keyword", story: "Story reply", mention: "Story mention", welcome: "First message", none: "Started by another automation" })[g.trigger.source] ?? "";
  const hidden = (k: string) => (folder ? `<input type="hidden" name="folder" value="${esc(folder)}">` : "") + `<input type="hidden" name="template" value="${k}">`;
  const cards = Object.entries(TEMPLATES)
    .filter(([k]) => k !== "blank")
    .map(([k, t]) => {
      const g = t.graph();
      const bub = first(g)
        .map((b) => `<span class="tp-b">${esc(b.text.length > 90 ? `${b.text.slice(0, 88)}…` : b.text)}</span>${b.btn ? `<span class="tp-btn">${esc(b.btn)}</span>` : ""}`)
        .join("");
      return `<form method="post" action="/admin/automations/new" class="tp" data-cats="${esc((t.cats ?? []).join(" "))}" data-q="${esc(`${t.name} ${t.desc} ${kw(g) ?? ""}`.toLowerCase())}">${hidden(k)}
<button><span class="tp-pv"><span class="tp-trg">${esc(how(g))}${kw(g) ? ` · <b>${esc(kw(g)!)}</b>` : ""}</span>${bub}</span>
<span class="tp-bd"><span class="tp-t"><span class="tp-em">${t.emoji}</span>${esc(t.name)}</span><small>${esc(t.desc)}</small>
<span class="tp-ch">${(t.ch ?? []).map((c) => `<i class="c-${c}">${esc(CHANNEL[c] ?? c)}</i>`).join("")}</span>${t.how ? `<span class="tp-how">${esc(t.how)}</span>` : ""}</span></button></form>`;
    })
    .join("");
  const rail = [["all", "All scenarios"], ...CATEGORIES]
    .map(([k, l], i) => `<button type="button" class="tp-cat${i === 0 ? " on" : ""}" data-cat="${k}">${esc(l)}<span>${k === "all" ? Object.keys(TEMPLATES).length - 1 : Object.values(TEMPLATES).filter((t) => (t.cats ?? []).includes(k)).length}</span></button>`)
    .join("");
  return `<dialog class="au-new tpd" id="au-new"><div class="tpd-h"><div><h2>New automation</h2><p>Start from a scenario and make it yours, or start from scratch.</p></div>
<label class="tpd-s">${icon("search", 16)}<input type="search" placeholder="Search scenarios" aria-label="Search scenarios" oninput="tpFilter()"></label>
<form method="dialog"><button class="tpd-x" aria-label="Close">${icon("close", 18)}</button></form></div>
<div class="tpd-b"><nav class="tpd-r">${rail}<form method="post" action="/admin/automations/new" class="tpd-blank">${hidden("blank")}<button>${icon("plus", 16)}Start from scratch</button></form></nav>
<div class="tpd-g">${cards}<p class="tpd-none" hidden>No scenarios match. Try another word, or start from scratch.</p></div></div></dialog>
<script>var tpCat="all";function tpFilter(){var q=(document.querySelector(".tpd-s input").value||"").toLowerCase().trim(),n=0;document.querySelectorAll(".tp").forEach(function(c){var ok=(tpCat==="all"||(" "+c.dataset.cats+" ").indexOf(" "+tpCat+" ")>=0)&&(!q||c.dataset.q.indexOf(q)>=0);c.hidden=!ok;if(ok)n++});document.querySelector(".tpd-none").hidden=n>0}
document.querySelectorAll(".tp-cat").forEach(function(b){b.addEventListener("click",function(){tpCat=b.dataset.cat;document.querySelectorAll(".tp-cat").forEach(function(x){x.classList.toggle("on",x===b)});tpFilter()})});
if(/[?&]new=1/.test(location.search)){var d=document.getElementById("au-new");if(d&&d.showModal)d.showModal();history.replaceState(null,"",location.pathname)}</script>`;
}

const menuForm = (id: number, action: string, label: string, extra = "", cls = "") =>
  `<form method="post" action="/admin/automations/${id}/${action}"${extra}><button${cls ? ` class="${cls}"` : ""}>${label}</button></form>`;

async function listTab(env: Env, u: URLSearchParams, who: Role, label: Map<string, string>, now: number): Promise<string> {
  const folder = u.get("folder") || null;
  const q = (u.get("q") ?? "").trim().toLowerCase();
  const source = u.get("trigger") ?? "";
  const state = u.get("state") ?? "";
  const sort = ["name", "runs", "modified"].includes(u.get("sort") ?? "") ? u.get("sort")! : "modified";
  const order = u.get("order") === "asc" ? "asc" : "desc";
  const base: Record<string, string> = { folder: folder ?? "", q, trigger: source, state, sort, order };
  const { results: all } = await env.DB.prepare(`SELECT * FROM triggers WHERE deleted_at IS NULL`).all<Trigger>();
  const stats = await automationStats(env);
  const st = (t: Trigger) => stats.get(t.id) ?? { runs: 0, clicks: 0 };
  // Search covers every folder; otherwise you see the open folder.
  let list = all.filter((t) => (q ? `${nameOf(t)} ${t.keyword}`.toLowerCase().includes(q) : (t.folder ?? null) === folder));
  if (source) list = list.filter((t) => t.source === source);
  if (state === "live") list = list.filter((t) => t.enabled);
  if (state === "draft") list = list.filter((t) => statusOf(t) === "draft" || t.draft);
  if (state === "off") list = list.filter((t) => statusOf(t) === "off");
  const key = (t: Trigger) => (sort === "name" ? nameOf(t).toLowerCase() : sort === "runs" ? st(t).runs : (t.updated_at ?? t.created_at));
  list.sort((a, b) => {
    const [x, y] = [key(a), key(b)];
    const c = x < y ? -1 : x > y ? 1 : b.id - a.id;
    return order === "asc" ? c : -c;
  });
  const all_folders = await folders(env);
  const admin = who === "admin";
  const moveOpts = (cur: string | null) =>
    `<option value="" disabled selected>Move to…</option>${cur ? `<option value="/">Top level</option>` : ""}${all_folders
      .filter((f) => f !== cur)
      .map((f) => `<option value="${esc(f)}">${esc(f)}</option>`)
      .join("")}<option value="+">+ New folder…</option>`;
  const rows = list
    .map((t) => {
      const s = st(t);
      const name = nameOf(t);
      const sw =
        statusOf(t) === "draft"
          ? ""
          : `<form method="post" action="/admin/automations/${t.id}/toggle" class="switch" title="${t.enabled ? "Live: tap to turn off" : "Off: tap to turn on"}"><input type="checkbox"${t.enabled ? " checked" : ""}${admin ? ' onchange="this.form.submit()"' : " disabled"} aria-label="On/off"><span></span></form>`;
      const menu = admin
        ? `<details class="au-m"><summary aria-label="More">⋯</summary><div>
<button type="button" onclick="auRename(${t.id}, this.dataset.n)" data-n="${esc(name)}">Rename</button>
${menuForm(t.id, "duplicate", "Duplicate")}
<form method="post" action="/admin/automations/${t.id}/move"><select name="folder" onchange="auMove(this)">${moveOpts(t.folder)}</select></form>
${menuForm(t.id, "delete", "Delete", ` onsubmit="return confirm('Move to Trash?')"`, "dz")}</div></details>`
        : "<span></span>";
      // Two lines on one grid: the automation, then its trigger with the switch and the trigger's numbers.
      return `<article class="au-row"><span class="cb">${admin ? `<input type="checkbox" name="ids" value="${t.id}" form="bulk" aria-label="Select ${esc(name)}">` : ""}</span>
<div class="nmc"><a class="nm" href="/admin/flows/${t.id}">${badge(t)}<span>${esc(name)}</span></a></div><span class="sp"></span>
<div class="mc-num runs">${s.runs.toLocaleString("en-US")}</div><div class="mc-num ctr">${pct(s.clicks, s.runs)}</div><div class="mod">${ago(t.updated_at ?? t.created_at, now)}</div>${menu}
<span class="sp"></span><div class="trg"><span class="ig"></span>${triggerLine(t, label)}${t.draft && t.published_at ? ` · <i>unpublished changes</i>` : ""}${q && t.folder ? ` · in ${esc(t.folder)}` : ""}</div>
<div class="sw">${sw}</div><div class="sub">${s.runs.toLocaleString("en-US")}</div><div class="sub">${pct(s.clicks, s.runs)}</div><span class="sp"></span><span class="sp"></span></article>`;
    })
    .join("");
  const counts = new Map<string, number>();
  for (const t of all) if (t.folder) counts.set(t.folder, (counts.get(t.folder) ?? 0) + 1);
  const folderTiles =
    folder || q
      ? ""
      : `<div class="au-fds">${all_folders
          .map(
            (f) => `<div class="au-fd"><a href="${qs({}, { folder: f })}">${icon("folder", 18, 1.8)}<span>${esc(f)}</span> <small>${counts.get(f) ?? 0}</small></a>${
              admin
                ? `<details class="au-m"><summary aria-label="Folder menu">⋯</summary><div>
<button type="button" onclick="auFolder('rename', this.dataset.f)" data-f="${esc(f)}">Rename</button>
<button type="button" class="dz" onclick="auFolder('delete', this.dataset.f)" data-f="${esc(f)}">Delete folder</button></div></details>`
                : ""
            }</div>`,
          )
          .join("")}${admin ? `<button type="button" class="au-fd new" onclick="auFolder('create')">${icon("plus", 18, 1.8)}New Folder</button>` : ""}</div>`;
  const sortLink = (k: string, l: string, cls = "") => {
    const on = sort === k;
    const next = on && order === "desc" ? "asc" : "desc";
    return `<a class="${[cls, on ? "on" : ""].filter(Boolean).join(" ")}" href="${qs(base, { sort: k, order: next })}">${l}${on ? (order === "desc" ? " ↓" : " ↑") : " ↕"}</a>`;
  };
  const title = folder ? `<a href="/admin/automations">My Automations</a> › ${esc(folder)}` : q ? "Search results" : "My Automations";
  return `<div class="au-h"><h2>${title}</h2>${admin ? `<button class="mc-btn" type="button" onclick="document.getElementById('au-new').showModal()">${icon("plus", 18, 1.8)}New Automation</button>` : ""}</div>
<form class="au-f" method="get" action="/admin/automations">${folder ? `<input type="hidden" name="folder" value="${esc(folder)}">` : ""}<input type="hidden" name="sort" value="${sort}"><input type="hidden" name="order" value="${order}">
<div class="srch">${icon("search", 16)}<input type="search" name="q" value="${esc(q)}" placeholder="Search all Automations" aria-label="Search all automations"></div>
<select name="trigger" onchange="this.form.submit()" aria-label="Trigger"><option value="">Any Trigger</option>${SOURCES.map((s) => `<option value="${s.value}"${s.value === source ? " selected" : ""}>${s.label}</option>`).join("")}</select>
<select name="state" onchange="this.form.submit()" aria-label="State"><option value="">Any state</option>${[
    ["live", "Live"],
    ["off", "Off"],
    ["draft", "Draft or unpublished"],
  ]
    .map(([v, l]) => `<option value="${v}"${v === state ? " selected" : ""}>${l}</option>`)
    .join("")}</select></form>
${folderTiles}
${folder || q ? "" : `<div class="au-tr"><a href="/admin/automations?tab=trash">${icon("trash", 16, 1.8)}Trash</a></div>`}
${rows ? `<div class="au-cols"><span></span>${sortLink("name", "Name")}<span></span>${sortLink("runs", "Runs", "r")}<span class="r">CTR</span>${sortLink("modified", "Modified")}<span></span></div>${rows}` : `<div class="au-empty">${q || source || state ? "Nothing matches." : folder ? "This folder is empty." : "No automations yet. Comment and DM keywords, story replies and mentions all start here."}</div>`}
${
  admin
    ? `<form id="bulk" method="post" action="/admin/automations/bulk" class="au-bulk"><span>Selected:</span><select name="folder"><option value="">Move to…</option><option value="/">Top level</option>${all_folders.map((f) => `<option value="${esc(f)}">${esc(f)}</option>`).join("")}</select>
<button name="act" value="move" class="ghost">Move</button><button name="act" value="delete" class="ghost" onclick="return confirm('Move the selected automations to Trash?')">Delete</button></form>
<script>
function auPost(action,fields){var f=document.createElement("form");f.method="post";f.action=action;for(var k in fields){var i=document.createElement("input");i.type="hidden";i.name=k;i.value=fields[k];f.appendChild(i)}document.body.appendChild(f);f.submit()}
function auRename(id,cur){var n=prompt("Rename automation",cur);if(n&&n.trim())auPost("/admin/automations/"+id+"/rename",{name:n.trim()})}
function auMove(s){var v=s.value;if(v==="+"){v=prompt("New folder name");if(!v||!v.trim()){s.selectedIndex=0;return}s.options[s.options.length]=new Option(v,v.trim(),true,true)}s.form.submit()}
function auFolder(act,cur){var n=act==="delete"?(confirm("Delete the folder "+cur+"? Its automations move to the top level.")?cur:null):prompt(act==="create"?"Folder name":"Rename folder",cur||"");if(n&&n.trim())auPost("/admin/automations/folders",{act:act,folder:cur||"",name:n.trim()})}
</script>`
    : ""
}`;
}

async function basicTab(env: Env, who: Role): Promise<string> {
  const { results: triggers } = await env.DB.prepare(`SELECT * FROM triggers WHERE deleted_at IS NULL ORDER BY enabled DESC, id`).all<Trigger>();
  const bySource = (s: Trigger["source"]) => triggers.find((t) => t.source === s);
  const setUp = (template: string) =>
    who === "admin" ? `<form method="post" action="/admin/automations/new"><input type="hidden" name="template" value="${template}"><button class="mc-btn">Set Up</button></form>` : "";
  const basic = (title: string, desc: string, t: Trigger | undefined, template: string) =>
    `<div class="row"><div><b>${title}</b><p>${desc}</p></div>${
      t ? `<a href="/admin/flows/${t.id}" class="${t.enabled ? "live-pill" : "off-pill"}">${t.enabled ? "▷ Live" : statusOf(t) === "draft" ? "Draft" : "Off"}</a>` : setUp(template)
    }</div>`;
  const ice = await db.getSetting(env.DB, "ice_breakers");
  const menu = await db.getSetting(env.DB, "main_menu");
  const ai = env.AUTOPILOT === "true";
  return `<div class="au-h"><h2>Basic</h2></div><div class="card basic">
<div class="row"><div><b>Default Reply: the AI setter answers every other DM</b><p>${ai ? "AI replies are on: it answers within seconds." : "AI replies are off: turn them on from the AI page."}</p></div><a href="/admin/ai" class="${ai ? "live-pill" : "mc-btn"}">${ai ? "▷ Live" : "Turn on"}</a></div>
${basic("Welcome Message: first impression for a brand-new conversation", "Sent instantly when someone DMs you for the first time and no keyword matched.", bySource("welcome"), "welcome")}
<div class="row"><div><b>Conversation Starters: questions people can tap before their first DM</b><p>${ice ? esc(ice.split("\n").map((l) => l.split(" > ")[0]).join(" · ")) : "Up to 4 FAQ buttons on the empty chat screen. Not shown on desktop."}</p></div>${
    who === "admin" || ice ? `<a class="${ice ? "live-pill" : "mc-btn"}" href="/admin/flows/icebreakers">${ice ? "▷ Live" : "Set Up"}</a>` : ""
  }</div>
<div class="row"><div><b>Main Menu: the menu button inside every chat</b><p>${menu ? esc(menu.split("\n").map((l) => l.split(/\s*[>|]\s*/)[0]).join(" · ")) : "Links and shortcuts people can open any time."}</p></div>${
    who === "admin" || menu ? `<a class="${menu ? "live-pill" : "mc-btn"}" href="/admin/flows/menu">${menu ? "▷ Live" : "Set Up"}</a>` : ""
  }</div>
${basic("Story Mention Reply: thank people who mention you in their Story", "Say thanks or start a flow when someone tags you.", bySource("mention"), "mention")}
<div class="row"><div><b>Say hi to new followers</b><p>Instagram's API has no follow event, so this can't be built here. If another tool sends your follow DM, it lands in the Inbox and the conversation carries on from there.</p></div><span class="off-pill">Not available</span></div>
</div>`;
}

async function trashTab(env: Env, who: Role, label: Map<string, string>, now: number): Promise<string> {
  const { results } = await env.DB.prepare(`SELECT * FROM triggers WHERE deleted_at IS NOT NULL AND id > 0 ORDER BY deleted_at DESC`).all<Trigger>();
  const rows = results
    .map(
      (t) => `<article class="au-row"><span class="cb"></span><div class="nmc"><span class="nm">${badge(t)}<span>${esc(nameOf(t))}</span></span></div>
<span class="sp"></span><span class="sp"></span><span class="sp"></span><div class="mod">deleted ${ago(t.deleted_at, now)}</div>${
        who === "admin"
          ? `<details class="au-m"><summary aria-label="More">⋯</summary><div>${menuForm(t.id, "restore", "Restore")}${menuForm(t.id, "purge", "Delete forever", ` onsubmit="return confirm('Delete forever? This can't be undone.')"`, "dz")}</div></details>`
          : "<span></span>"
      }<span class="sp"></span><div class="trg"><span class="ig"></span>${triggerLine(t, label)}</div></article>`,
    )
    .join("");
  return `<div class="au-h"><h2><a href="/admin/automations">My Automations</a> › Trash</h2></div>${rows || '<div class="au-empty">Trash is empty.</div>'}`;
}

// ---------- the editor ----------

// Who an automation reached, for the published view's Key metrics and the list behind each tile. `set` narrows it to
// the people a read receipt covered ("opened") or who tapped any button or link ("clicked"). Reviewer: test threads.
type ContactSet = "all" | "opened" | "clicked";
const SET_SQL: Record<ContactSet, string> = {
  all: "1 = 1",
  opened: "s.seen_at IS NOT NULL",
  clicked: "EXISTS (SELECT 1 FROM flow_taps t WHERE t.send_id = s.id)",
};
const asSet = (v: unknown): ContactSet => (v === "opened" || v === "clicked" ? v : "all");
const REACHED = `FROM flow_sends s JOIN leads l ON l.subscriber_id = s.subscriber_id WHERE s.trigger_id = ?1 AND s.status = 'sent' AND (?2 = 'admin' OR l.test = 1)`;

// Sends = how many times it ran; the rest are people. Opened is a floor (read receipts only).
export async function keyMetrics(env: Env, id: number, who: Role): Promise<{ sends: number; contacts: number; opened: number; clicked: number }> {
  const r = await env.DB.prepare(
    `SELECT COUNT(DISTINCT s.subscriber_id) AS contacts, COUNT(DISTINCT CASE WHEN ${SET_SQL.opened} THEN s.subscriber_id END) AS opened,
       COUNT(DISTINCT CASE WHEN ${SET_SQL.clicked} THEN s.subscriber_id END) AS clicked ${REACHED}`,
  )
    .bind(id, who)
    .first<{ contacts: number; opened: number; clicked: number }>();
  const runs = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM flow_starts f JOIN leads l ON l.subscriber_id = f.subscriber_id WHERE f.trigger_id = ?1 AND f.status = 'sent' AND (?2 = 'admin' OR l.test = 1)`,
  )
    .bind(id, who)
    .first<{ n: number }>();
  const contacts = r?.contacts ?? 0;
  return { sends: Math.max(runs?.n ?? 0, contacts), contacts, opened: r?.opened ?? 0, clicked: r?.clicked ?? 0 };
}

// The newest 100 people in a set, with when the automation last messaged them.
async function reachedContacts(env: Env, id: number, who: Role, set: ContactSet): Promise<Response> {
  const { results } = await env.DB.prepare(
    `SELECT l.subscriber_id AS id, l.username, l.first_name AS name, l.profile_pic AS pic, MAX(s.created_at) AS at ${REACHED} AND ${SET_SQL[set]}
     GROUP BY l.subscriber_id ORDER BY at DESC LIMIT 100`,
  )
    .bind(id, who)
    .all<{ id: string; username: string | null; name: string | null; pic: string | null; at: number }>();
  const total = (await env.DB.prepare(`SELECT COUNT(DISTINCT s.subscriber_id) AS n ${REACHED} AND ${SET_SQL[set]}`).bind(id, who).first<{ n: number }>())?.n ?? 0;
  return Response.json({ total, contacts: results });
}

async function editorPage(env: Env, who: Role, t: Trigger & { draft: string | null }): Promise<Response> {
  const token = await db.getSetting(env.DB, "ig_token");
  const media: Media[] = token ? await recentMedia(token).catch(() => []) : [];
  const stories: Story[] = token ? await recentStories(token).catch(() => []) : [];
  const { results: autos } = await env.DB.prepare(`SELECT * FROM triggers WHERE deleted_at IS NULL ORDER BY id`).all<Trigger>();
  const { results: tags } = await env.DB.prepare(`SELECT DISTINCT tag FROM lead_tags ORDER BY tag LIMIT 300`).all<{ tag: string }>();
  const boot = {
    id: t.id,
    name: nameOf(t),
    folder: t.folder,
    status: statusOf(t),
    hasDraft: Boolean(t.draft),
    ro: who !== "admin",
    link: env.SKOOL_LINK.replace(/^https?:\/\/(www\.)?/, ""),
    graph: await editorGraph(env.DB, t),
    // With unpublished changes waiting, the published view shows what's live, not the draft.
    published: t.draft ? await loadGraph(env.DB, t) : null,
    metrics: await keyMetrics(env, t.id, who),
    stats: await graphStats(env.DB, t.id),
    media: media.map((m) => ({ id: m.id, label: `${(m.caption ?? "").replace(/\s+/g, " ").slice(0, 50) || "(no caption)"} · ${m.timestamp?.slice(0, 10) ?? ""}` })),
    stories: stories.map((s) => ({ id: s.id, at: s.timestamp ?? null, video: s.media_type === "VIDEO", img: s.thumbnail_url ?? s.media_url ?? null })),
    automations: autos.map((a) => ({ id: a.id, name: nameOf(a) })),
    tags: tags.map((r) => r.tag),
    stages: STAGES,
  };
  const json = JSON.stringify(boot).replace(/</g, "\\u003c");
  const body = `<style>${EDITOR_CSS}</style><div class="fe" id="fe"></div><script type="application/json" id="fe-data">${json}</script><script src="/admin/flows/editor.js"></script>`;
  return page("Automations", body, who, env);
}

const PROFILE = {
  icebreakers: {
    title: "Conversation Starters",
    key: "ice_breakers",
    help: `Up to 4 questions shown when someone opens a chat with you for the first time (Instagram app only, not desktop).
"Question &gt; automation name" runs that automation when tapped; a question without one goes to the AI setter.`,
    placeholder: "How do I join the community? &gt; join&#10;What do you teach?",
  },
  menu: {
    title: "Main Menu",
    key: "main_menu",
    help: `The menu button in every chat (Instagram app only). One item per line, 5 max: "Title &gt; automation name" runs it,
"Title | https://..." opens a link ({{SKOOL_LINK}} works). Shows up after people refresh their inbox.`,
    placeholder: "Join the community | {{SKOOL_LINK}}&#10;Free AI guide &gt; whop promo",
  },
} as const;

async function profilePage(env: Env, who: Role, kind: keyof typeof PROFILE, error = ""): Promise<Response> {
  const ro = who !== "admin";
  const p = PROFILE[kind];
  const saved = (await db.getSetting(env.DB, p.key)) ?? "";
  const body = `${CSS}
<p class="bk"><a href="/admin/automations?tab=basic">‹ Basic Automations</a></p>
<div class="au-h"><h2>${p.title}</h2></div>
${error ? `<div class="err">${esc(error)}</div>` : ""}
<form method="post" action="/admin/flows/${kind}" class="card">
<p class="note">${p.help}</p>
<textarea name="lines" rows="5" placeholder="${p.placeholder}"${ro ? " disabled" : ""}>${esc(saved)}</textarea>
${ro ? "" : `<button>Save to Instagram</button>`}
</form>`;
  return page("Automations", body, who, env);
}

const getT = (env: Env, id: number) => env.DB.prepare(`SELECT * FROM triggers WHERE id = ?1`).bind(id).first<Trigger>();

export async function flowsPage(env: Env, req: Request, path: string, who: Role): Promise<Response> {
  if (path === "/admin/flows/editor.js") return new Response(EDITOR_JS, { headers: { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "no-cache" } });
  if (path === "/admin/flows/icebreakers" || path === "/admin/flows/menu") return profilePage(env, who, path.endsWith("menu") ? "menu" : "icebreakers");
  const list = path.match(/^\/admin\/flows\/(\d+)\/contacts$/);
  if (list) return reachedContacts(env, Number(list[1]), who, asSet(new URL(req.url).searchParams.get("set")));
  const m = path.match(/^\/admin\/flows\/(\d+)$/);
  const t = m ? await getT(env, Number(m[1])) : null;
  if (!t) return path === "/admin/flows/new" ? Response.redirect(new URL("/admin/automations", req.url).toString(), 302) : new Response("not found", { status: 404 });
  return editorPage(env, who, t);
}

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const json = (body: unknown, status = 200) => Response.json(body, { status });

export async function flowsAdminPost(env: Env, req: Request, path: string, who: Role, now = Date.now()): Promise<Response> {
  if (who !== "admin") return new Response("not allowed for the reviewer login", { status: 403 });
  const to = (p: string) => Response.redirect(new URL(p, req.url).toString(), 303);
  const back = () => to(req.headers.get("Referer") ?? "/admin/automations");
  const wantsJson = (req.headers.get("Content-Type") ?? "").includes("json") || (req.headers.get("Accept") ?? "").includes("json");

  if (path === "/admin/flows/icebreakers" || path === "/admin/flows/menu") {
    const f = await req.formData();
    const kind = path.endsWith("menu") ? "menu" : "icebreakers";
    const token = await db.getSetting(env.DB, "ig_token");
    if (!token) return profilePage(env, who, kind, "Instagram isn't connected: open /auth/start first.");
    try {
      await (kind === "menu" ? saveMenu : saveIceBreakers)(env, token, str(f, "lines"));
    } catch (e) {
      return profilePage(env, who, kind, `Instagram said no: ${String(e)}`);
    }
    return to("/admin/automations?tab=basic");
  }

  if (path === "/admin/automations/new") {
    const f = await req.formData();
    const id = await create(env, str(f, "template"), str(f, "folder") || null, now);
    return to(`/admin/flows/${id}`);
  }

  if (path === "/admin/automations/folders") {
    const f = await req.formData();
    const [act, cur, name] = [str(f, "act"), str(f, "folder"), str(f, "name").slice(0, 60)];
    const list = await folders(env);
    if (act === "create" && name) await setFolders(env, [...list, name]);
    if (act === "rename" && cur && name) {
      await env.DB.prepare(`UPDATE triggers SET folder = ?2 WHERE folder = ?1`).bind(cur, name).run();
      await setFolders(env, list.map((x) => (x === cur ? name : x)));
    }
    if (act === "delete" && cur) {
      await env.DB.prepare(`UPDATE triggers SET folder = NULL WHERE folder = ?1`).bind(cur).run();
      await setFolders(env, list.filter((x) => x !== cur));
    }
    return to("/admin/automations");
  }

  if (path === "/admin/automations/bulk") {
    const f = await req.formData();
    const ids = JSON.stringify(f.getAll("ids").map(Number).filter(Boolean));
    if (str(f, "act") === "delete") await env.DB.prepare(`UPDATE triggers SET enabled = 0, deleted_at = ?2 WHERE id IN (SELECT value FROM json_each(?1))`).bind(ids, now).run();
    if (str(f, "act") === "move" && str(f, "folder")) {
      const folder = str(f, "folder") === "/" ? null : str(f, "folder");
      await env.DB.prepare(`UPDATE triggers SET folder = ?2 WHERE id IN (SELECT value FROM json_each(?1))`).bind(ids, folder).run();
    }
    return back();
  }

  const row = path.match(/^\/admin\/(automations|flows)\/(\d+)\/([a-z]+)$/);
  const t = row ? await getT(env, Number(row[2])) : null;
  if (!row || !t) return new Response("not found", { status: 404 });
  const id = t.id;
  const action = row[3];
  const input = wantsJson ? ((await req.json().catch(() => ({}))) as { graph?: unknown; name?: string; set?: string; tag?: string }) : null;
  const form = wantsJson ? null : await req.formData().catch(() => null);

  switch (action) {
    case "draft": {
      const g = sanitize(input?.graph, triggerCfg(t));
      await env.DB.prepare(`UPDATE triggers SET draft = ?2, updated_at = ?3 WHERE id = ?1`).bind(id, JSON.stringify(g), now).run();
      return json({ ok: true });
    }
    case "publish": {
      const g = input?.graph ? sanitize(input.graph, triggerCfg(t)) : await editorGraph(env.DB, t);
      const problems = validate(g);
      const rival = g.trigger.source === "comment" && g.trigger.media_id === NEXT_POST ? await waitingForNextPost(env, id) : null;
      if (rival) problems.push(`When...: "${nameOf(rival)}" is already waiting for the next post. Only one automation can wait for it at a time.`);
      if (problems.length) return json({ ok: false, problems }, 400);
      await publish(env.DB, id, g, now);
      return json({ ok: true, status: "live" });
    }
    case "test": {
      // A 3-digit code: DM it to the account from anywhere and this automation (as it is in the editor) runs on you.
      const g = input?.graph ? sanitize(input.graph, triggerCfg(t)) : await editorGraph(env.DB, t);
      const code = await testCode(env.DB, id, g, now);
      const token = await db.getSetting(env.DB, "ig_token");
      const handle = token ? ((await fetchAccount(token).catch(() => null))?.username ?? null) : null;
      return json({ ok: true, code, handle, comment: g.trigger.source === "comment" });
    }
    case "discard":
      await env.DB.prepare(`UPDATE triggers SET draft = NULL WHERE id = ?1`).bind(id).run();
      return json({ ok: true });
    case "tag": {
      // "Tag these contacts" in the published view's Contacts list: everyone in the set, not only the 100 shown.
      const tag = String(input?.tag ?? "").trim().toLowerCase().slice(0, 40);
      if (!tag) return json({ ok: false }, 400);
      const r = await env.DB.prepare(
        `INSERT OR IGNORE INTO lead_tags (subscriber_id, tag, created_at) SELECT DISTINCT s.subscriber_id, ?3, ?4 ${REACHED} AND ${SET_SQL[asSet(input?.set)]}`,
      )
        .bind(id, who, tag, now)
        .run();
      return json({ ok: true, tag, added: r.meta.changes ?? 0 });
    }
    case "rename": {
      const name = String(input?.name ?? form?.get("name") ?? "").trim().slice(0, 80);
      if (name) await env.DB.prepare(`UPDATE triggers SET name = ?2, updated_at = ?3 WHERE id = ?1`).bind(id, name, now).run();
      return wantsJson ? json({ ok: true }) : back();
    }
    case "toggle": {
      // A draft that was never published has nothing to turn on: Publish does that.
      // A Next Post or Reel trigger switched back on waits for the next post from now, and never while another one waits.
      const blocked = !t.enabled && t.media_id === NEXT_POST && (await waitingForNextPost(env, id));
      if (statusOf(t) !== "draft" && !blocked) {
        await env.DB.prepare(
          `UPDATE triggers SET enabled = 1 - enabled, published_at = CASE WHEN enabled = 0 AND media_id = ?3 THEN ?2 ELSE COALESCE(published_at, created_at) END, updated_at = ?2 WHERE id = ?1`,
        )
          .bind(id, now, NEXT_POST)
          .run();
      }
      const fresh = (await getT(env, id))!;
      return wantsJson ? json({ ok: true, status: statusOf(fresh) }) : row[1] === "flows" ? to(`/admin/flows/${id}`) : back();
    }
    case "duplicate": {
      const g = await editorGraph(env.DB, t);
      const copy = await env.DB.prepare(
        `INSERT INTO triggers (source, keyword, name, dm, media_id, public_reply, enabled, folder, draft, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, 0, ?7, ?8, ?9, ?9) RETURNING id`,
      )
        .bind(t.source, t.keyword, `${nameOf(t)} (copy)`, t.dm, t.media_id, t.public_reply, t.folder, JSON.stringify(g), now)
        .first<{ id: number }>();
      await env.DB.prepare(`INSERT INTO flow_nodes (trigger_id, id, kind, data, x, y) VALUES (?1, 'trigger', 'trigger', '{}', 0, 0)`).bind(copy!.id).run();
      return back();
    }
    case "move": {
      const folder = String(form?.get("folder") ?? "").trim();
      const dest = !folder || folder === "/" ? null : folder.slice(0, 60);
      if (dest) await setFolders(env, [...(await folders(env)), dest]);
      await env.DB.prepare(`UPDATE triggers SET folder = ?2 WHERE id = ?1`).bind(id, dest).run();
      return back();
    }
    case "delete":
      await env.DB.batch([
        env.DB.prepare(`UPDATE triggers SET enabled = 0, deleted_at = ?2 WHERE id = ?1`).bind(id, now),
        env.DB.prepare(`UPDATE flow_runs SET status = 'cancelled' WHERE trigger_id = ?1 AND status = 'scheduled'`).bind(id),
      ]);
      return to(t.folder ? `/admin/automations?folder=${encodeURIComponent(t.folder)}` : "/admin/automations");
    case "restore":
      await env.DB.prepare(`UPDATE triggers SET deleted_at = NULL WHERE id = ?1`).bind(id).run();
      return to("/admin/automations?tab=trash");
    case "purge":
      if (!t.deleted_at) return new Response("only from Trash", { status: 400 });
      await env.DB.batch([
        env.DB.prepare(`DELETE FROM triggers WHERE id = ?1`).bind(id),
        env.DB.prepare(`DELETE FROM flow_steps WHERE trigger_id = ?1`).bind(id),
        env.DB.prepare(`DELETE FROM flow_nodes WHERE trigger_id = ?1`).bind(id),
        env.DB.prepare(`DELETE FROM flow_edges WHERE trigger_id = ?1`).bind(id),
      ]);
      return to("/admin/automations?tab=trash");
  }
  return new Response("not found", { status: 404 });
}

