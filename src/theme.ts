// The console's look, the layout DM-automation tools have settled on: a gray canvas, a
// 215px sidebar that folds to a 64px icon rail, a 60px title bar, white panels and hairline rules, no shadows. The Inbox
// keeps Instagram's own web-DM look (IG's blue-purple bubbles, the system font). Follows the system theme; My Profile
// overrides it per browser (localStorage).

const PATHS: Record<string, string> = {
  trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  command: '<path d="M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3z"/>',
  compass: '<circle cx="12" cy="12" r="10"/><path d="m16.2 7.8-2.1 6.3-6.3 2.1 2.1-6.3z"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  dashboard: '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M8.5 16.5v-4M12 16.5v-9M15.5 16.5v-6"/>',
  inbox: '<path d="M22 3 9.2 10.1"/><path d="M11.7 20.3 22 3H2l7.2 7.1z"/>',
  automations: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  settings:
    '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  send: '<path d="M22 3 9.2 10.1"/><path d="M11.7 20.3 22 3H2l7.2 7.1z"/>',
  users: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3"/>',
  bot: '<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 8V4M9 13v2M15 13v2"/>',
  link: '<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>',
  click: '<path d="m4 4 7 17 2.5-7.5L21 11z"/>',
  hand: '<path d="M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8a8 8 0 0 0 16 0v-3a2 2 0 0 0-4 0"/>',
  flag: '<path d="M4 22V4h13l-2 4 2 4H4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6"/>',
  comment: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  star: '<path d="m12 2 3 7 7 .6-5.3 4.7L18.2 22 12 18.3 5.8 22l1.5-7.7L2 9.6 9 9z"/>',
  hourglass: '<path d="M6 2h12M6 22h12M7 2v4l5 6-5 6v4M17 2v4l-5 6 5 6v4"/>',
  megaphone: '<path d="M3 11v3l13 5V6zM16 9a3 3 0 0 1 0 6"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9v12h14V9"/><path d="M10 21v-6h4v6"/>',
  sparkles: '<path d="m11 4 1.8 4.7L17.5 10.5l-4.7 1.8L11 17l-1.8-4.7L4.5 10.5l4.7-1.8z"/><path d="M19 15v5M16.5 17.5h5"/>',
  chat: '<path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.6-5A8.5 8.5 0 1 1 21 11.5z"/><path d="M8.5 10h7M8.5 13.5h4.5"/>',
  fold: '<path d="M4 5v14"/><path d="m13 7-5 5 5 5"/><path d="M8 12h12"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.2 9a3 3 0 0 1 5.8 1c0 2-3 2.6-3 4"/><path d="M12 17.5h.01"/>',
  up: '<path d="M12 19V5"/><path d="m6 11 6-6 6 6"/>',
  down: '<path d="M12 5v14"/><path d="m6 13 6 6 6-6"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5"/>',
  flow: '<rect x="3" y="9" width="6" height="6" rx="1.5"/><rect x="15" y="4" width="6" height="6" rx="1.5"/><rect x="15" y="14" width="6" height="6" rx="1.5"/><path d="M9 12h3M12 7v10M12 7h3M12 17h3"/>',
  shapes: '<path d="M12 3.5 8.5 9h7z"/><rect x="4" y="13" width="6.5" height="6.5" rx="1"/><circle cx="17" cy="16.2" r="3.3"/>',
};

export function icon(name: keyof typeof PATHS | string, size = 16, stroke = 2): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name] ?? ""}</svg>`;
}

// Stage colors, one per brain.ts stage.
export const STAGE_COLOR: Record<string, string> = {
  opener: "#8e8e8e",
  lead: "#3797f0",
  qualify: "#6a5fe0",
  pitch: "#a35ad8",
  link_sent: "#f0a12e",
  joined: "#2fb85a",
  closed: "#8e8e8e",
};

// --canvas = the page and the sidebar, --panel = what sits on it, --bg = the Inbox's own panes. --pri in light mode is
// deep enough for white button text and for links on the canvas (5:1); --mut clears 4.5:1 on the canvas too.
// Relay's palette: warm paper and ink, one signal color. --pri is the signal (buttons, links, the active rail mark,
// chart series); --onpri is the text that sits on it. --out / --onout are your own bubbles in the Inbox.
const DARK = `--bg:#0f0e0c;--ink:#f0ebe0;--mut:#9d968a;--line:#2b2823;--hover:#1a1815;--sel:#221f1b;--soft:#24211c;--field:#141310;--elev:#181613;
--canvas:#0b0a09;--panel:#13120f;--navon:#26231e;--navhov:#1c1a16;--up:#7bd486;--down:#ff8466;--series2:#6d675c;
--btn2:#24211c;--track:#3a362f;--out:#f0ebe0;--onout:#0b0a09;--pri:#ff5a24;--onpri:#0b0a09;--link:#ffd9c9;--red:#ff5a4a;--green:#7bd486;--amber:#f2b441;color-scheme:dark`;
const LIGHT = `--bg:#fbfaf6;--ink:#16140f;--mut:#665f53;--line:#ddd7ca;--hover:#efebe2;--sel:#e8e3d7;--soft:#ebe6db;--field:#fffefb;--elev:#fffefb;
--canvas:#f2efe7;--panel:#fbfaf6;--navon:#e6e0d3;--navhov:#ebe6db;--up:#2c7a35;--down:#c2310f;--series2:#a8a090;
--btn2:#e8e3d7;--track:#d3ccbc;--out:#16140f;--onout:#f7f4ec;--pri:#c73a0c;--onpri:#fffaf5;--link:#7a2306;--red:#c4301c;--green:#2c8a3c;--amber:#a86a00;color-scheme:light`;

const CHEV = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238e8e8e' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;

// The app's mark: an ink tile with a signal-orange "R" whose leg runs out as an arrow (a message relayed). The same
// SVG is the rail logo, the login logo and the site icon, so they always match.
export const LOGO = `<svg viewBox="0 0 32 32" width="100%" height="100%" aria-hidden="true"><rect x=".5" y=".5" width="31" height="31" rx="7" fill="#16140f" stroke="#3a362f"/><path d="M10 23V9h7.2a4.6 4.6 0 0 1 0 9.2H13.5l8 7.3" fill="none" stroke="#ff5a24" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="23.6" cy="9.4" r="2.1" fill="#f2efe7"/></svg>`;
export const FAVICON_SVG = LOGO.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');
export const FAVICON = `<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(FAVICON_SVG)}">`;
// Geist for reading, Geist Mono for labels and numbers that line up, Instrument Serif for headlines and big figures.
export const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap">`;

export const HEAD = `${FAVICON}${FONTS}<script>try{var t=localStorage.getItem("theme");if(t)document.documentElement.dataset.theme=t;if(localStorage.getItem("nav")==="min")document.documentElement.classList.add("nav-min")}catch(e){}
try{document.cookie="tz="+new Date().getTimezoneOffset()+";path=/;max-age=31536000;samesite=lax"}catch(e){}
function setTheme(t){var d=document.documentElement;if(t)d.dataset.theme=t;else delete d.dataset.theme;try{t?localStorage.setItem("theme",t):localStorage.removeItem("theme")}catch(e){}
document.querySelectorAll("[data-theme-btn]").forEach(function(b){b.setAttribute("aria-pressed",String((b.dataset.themeBtn||"")===(t||"")))})}
function flipTheme(){var d=document.documentElement;setTheme((d.dataset.theme?d.dataset.theme==="dark":matchMedia("(prefers-color-scheme: dark)").matches)?"light":"dark")}
function foldNav(b){var min=document.documentElement.classList.toggle("nav-min");try{localStorage.setItem("nav",min?"min":"max")}catch(e){}
b.setAttribute("aria-expanded",String(!min));b.setAttribute("aria-label",min?"Expand navigation":"Collapse navigation");b.title=min?"Expand":"Collapse"}
var RELAY_CMDS=[["Home","/admin/dashboard","Page"],["Growth","/admin/growth","Page"],["Contacts","/admin/contacts","Page"],["Automation","/admin/automations","Page"],["AI","/admin/ai","Page"],["Inbox","/admin/inbox","Page"],["Accounts","/admin/accounts","Page"],["Settings","/admin/settings","Page"],["Setup guide","/admin/setup","Page"],["Help","/admin/help","Page"],["My Profile","/admin/profile","Page"],["New automation","/admin/automations?new=1","Action"],["Link another Instagram page","/admin/accounts","Action"],["Switch light / dark","#theme","Action"],["Refresh Instagram numbers","/admin/growth?refresh=1","Action"],["Instagram connection","/admin/profile","Action"],["Log out","/logout","Action"]];
function relayPalette(){var o=document.getElementById("pal");if(o){o.remove();return}
o=document.createElement("div");o.id="pal";o.innerHTML='<div class="pal-bg"></div><div class="pal" role="dialog" aria-label="Search and jump"><input placeholder="Jump to a page, or search contacts and the inbox…" aria-label="Search"><ul role="listbox"></ul><p class="pal-f"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>↵</kbd> open</span><span><kbd>esc</kbd> close</span></p></div>';
document.body.appendChild(o);var i=o.querySelector("input"),ul=o.querySelector("ul"),sel=0,items=[];
function esc(t){return t.replace(/[&<>"]/g,function(c){return"&#"+c.charCodeAt(0)+";"})}
function draw(){var q=i.value.trim().toLowerCase();items=RELAY_CMDS.filter(function(c){return!q||c[0].toLowerCase().indexOf(q)>=0});
if(q){items=items.concat([["Search contacts for “"+i.value.trim()+"”","/admin/contacts?q="+encodeURIComponent(i.value.trim()),"Search"],["Search the inbox for “"+i.value.trim()+"”","/admin/inbox?q="+encodeURIComponent(i.value.trim()),"Search"]])}
sel=Math.min(sel,items.length-1);if(sel<0)sel=0;
ul.innerHTML=items.map(function(c,k){return'<li role="option" data-k="'+k+'"'+(k===sel?' aria-selected="true"':'')+'><span>'+esc(c[0])+'</span><small>'+c[2]+'</small></li>'}).join("")}
function go(k){var c=items[k];if(!c)return;if(c[1]==="#theme"){flipTheme();o.remove();return}location.href=c[1]}
i.addEventListener("input",function(){sel=0;draw()});
i.addEventListener("keydown",function(e){if(e.key==="ArrowDown"){sel=Math.min(items.length-1,sel+1);draw();e.preventDefault()}else if(e.key==="ArrowUp"){sel=Math.max(0,sel-1);draw();e.preventDefault()}else if(e.key==="Enter"){go(sel)}else if(e.key==="Escape"){o.remove()}});
ul.addEventListener("click",function(e){var li=e.target.closest("li");if(li)go(+li.dataset.k)});o.querySelector(".pal-bg").addEventListener("click",function(){o.remove()});draw();i.focus()}
document.addEventListener("keydown",function(e){if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();relayPalette()}else if(e.key==="/"&&!/INPUT|TEXTAREA|SELECT/.test((document.activeElement||{}).tagName||"")&&!document.getElementById("pal")){e.preventDefault();relayPalette()}});
function info(){var b=document.querySelector(".ib");if(b)b.classList.toggle("swap")}
function grow(t){t.style.height="auto";t.style.height=Math.min(t.scrollHeight,160)+"px"}
function fmtTimes(root){var n=new Date();root.querySelectorAll("time[data-t]").forEach(function(el){var d=new Date(+el.dataset.t),o={hour:"numeric",minute:"2-digit"};
if(d.toDateString()!==n.toDateString()){if(n-d<6*864e5)o.weekday="short";else{o.month="short";o.day="numeric";if(d.getFullYear()!==n.getFullYear())o.year="numeric"}
if(el.hasAttribute("data-day"))o=o.weekday?{weekday:"long"}:{month:o.month,day:o.day,year:o.year}}
el.textContent=d.toLocaleString([],o)})}
document.addEventListener("DOMContentLoaded",function(){fmtTimes(document);var m=document.querySelector(".msgs");if(m)m.scrollTop=m.scrollHeight;
var f=document.querySelector(".fold button");if(f&&document.documentElement.classList.contains("nav-min")){f.setAttribute("aria-expanded","false");f.setAttribute("aria-label","Expand navigation");f.title="Expand"}
var th="";try{th=localStorage.getItem("theme")||""}catch(e){}document.querySelectorAll("[data-theme-btn]").forEach(function(b){b.setAttribute("aria-pressed",String((b.dataset.themeBtn||"")===th))})})</script>
<style>
:root{${LIGHT}}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){${DARK}}}
:root[data-theme=dark]{${DARK}}
*{box-sizing:border-box}
html{background:var(--canvas)}
body{margin:0;background:var(--canvas);color:var(--ink);font:14px/19px "Geist",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;
  --rail:215px;--ease:cubic-bezier(.29,.01,0,1.04)}
html.nav-min body{--rail:64px}
a{color:var(--pri);text-decoration:none}
a:hover{opacity:.85}
svg{flex:none}
[hidden]{display:none!important}
::selection{background:color-mix(in srgb,var(--pri) 24%,transparent)}
:focus-visible{outline:2px solid var(--pri);outline-offset:2px}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}

/* ---------- sidebar: 215px, folds to a 64px icon rail. Everything in it is centered on x=32, so folding moves nothing ---------- */
.side{position:fixed;top:0;bottom:0;left:0;width:var(--rail);background:var(--canvas);border-right:1px solid var(--line);display:flex;flex-direction:column;overflow:hidden;z-index:5;transition:width .3s var(--ease)}
.brand{display:flex;align-items:center;gap:10px;height:60px;padding:0 20px;border-bottom:1px solid var(--line);font-size:19px;font-weight:700;letter-spacing:-.02em;white-space:nowrap;flex:none;color:var(--ink);opacity:1}
.brand:hover{opacity:1}
.logo{width:26px;height:26px;display:block;flex:none}
.side .who{display:flex;align-items:center;gap:10px;height:64px;padding:0 18px;border-bottom:1px solid var(--line);white-space:nowrap;flex:none;color:var(--ink);font-size:13px;line-height:18px;min-width:0;opacity:1}
.side .who .av{width:28px;height:28px;font-size:12px}
.side .who .l{overflow:hidden;text-overflow:ellipsis;min-width:0}
.side .who small{display:block;color:var(--mut);font-size:12px;line-height:16px}
.side nav,.side .foot{display:flex;flex-direction:column;padding:8px;flex:none}
.side .foot{border-top:1px solid var(--line)}
.nv{display:flex;align-items:center;gap:12px;height:48px;padding:0 12px;border-radius:10px;color:var(--mut);font-size:14px;line-height:20px;white-space:nowrap;opacity:1;transition:background-color .15s,color .15s}
.nv:hover{background:var(--navhov);color:var(--ink);opacity:1}
.nv.on{background:var(--navon);color:var(--ink)}
.nv .av{width:24px;height:24px;font-size:11px}
button.nv{width:100%;margin:0;border:0;background:none;font:inherit;font-size:14px;line-height:20px;font-weight:400;text-align:left;cursor:pointer}
/* the light / dark toggle names the mode it switches to: moon + "Dark mode" in light, sun + "Light mode" in dark */
.th-d{display:contents}.th-l{display:none}
:root[data-theme=dark] .th-d{display:none}:root[data-theme=dark] .th-l{display:contents}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .th-d{display:none}:root:not([data-theme=light]) .th-l{display:contents}}
.side .l{transition:opacity .2s}
html.nav-min .side .l{opacity:0}
.side .gap{flex:1;min-height:8px}
.fold{height:64px;display:flex;align-items:center;padding:0 14px;flex:none}
.fold button{display:grid;place-items:center;width:36px;height:36px;margin:0;padding:0;border-radius:6px;background:none;color:var(--ink);transition:background-color .15s}
.fold button:hover{background:var(--navhov)}
.fold svg{transition:transform .3s var(--ease)}
html.nav-min .fold svg{transform:scaleX(-1)}

/* ---------- title bar + content ---------- */
main{margin-left:var(--rail);min-height:100vh;transition:margin-left .3s var(--ease)}
.tb{position:sticky;top:0;z-index:4;display:flex;align-items:center;justify-content:space-between;gap:16px;height:60px;padding:0 40px;background:var(--canvas);border-bottom:1px solid var(--line)}
.tb h1{font-size:22px;line-height:28px;font-weight:700;letter-spacing:-.01em;white-space:nowrap}
.tb-r{display:flex;align-items:center;gap:8px;min-width:0}
.tb-r button{margin:0}
.tb .me{display:none;opacity:1}.tb .me .av{width:30px;height:30px;font-size:12px}
.p-inbox .tb,main:has(.fe) .tb{display:none}
.wrap{max-width:1280px;margin:0 auto;padding:28px 40px 64px}
.m-settings .wrap,.m-profile .wrap,.m-help .wrap{max-width:760px}
.m-ai .wrap{max-width:1000px}
.m-inbox .wrap{max-width:none;padding:0}
h1{font-size:24px;line-height:30px;font-weight:700;margin:0;letter-spacing:-.01em}
h2{font-size:16px;line-height:20px;font-weight:600;margin:0}
.sub{color:var(--mut);margin:4px 0 0}
@media (prefers-reduced-motion:reduce){.side,main,.fold svg,.side .l,.nv{transition:none}}

/* ---------- shared bits ---------- */
.card{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:20px 24px;margin:0 0 16px}
.card>b:first-child,.card h2{font-size:16px;font-weight:600;margin:0}
.head{margin-bottom:8px}.head small{color:var(--mut)}
.tag{font-size:11px;font-weight:600;padding:2px 8px;border-radius:999px;background:var(--amber);color:#000}.tag.flag{background:var(--red);color:#fff}
.thread{display:flex;flex-direction:column;gap:2px;margin:10px 0}
.note{color:var(--mut);font-size:12px;line-height:16px;margin-bottom:8px}
textarea,input,select{width:100%;font:inherit;font-size:14px;line-height:18px;padding:10px 12px;border-radius:8px;border:1px solid var(--line);background:var(--field);color:var(--ink);margin-bottom:10px}
textarea:focus,input:focus,select:focus{outline:none;border-color:var(--mut)}
select{appearance:none;-webkit-appearance:none;background-image:${CHEV};background-repeat:no-repeat;background-position:right 10px center;padding-right:30px;cursor:pointer}
input[type=checkbox]{width:auto}
button{font:inherit;font-size:14px;font-weight:600;line-height:18px;margin:8px 8px 0 0;padding:7px 16px;border-radius:8px;border:0;background:var(--pri);color:#fff;cursor:pointer}
button:hover{background:color-mix(in srgb,var(--pri) 88%,#000)}
button.ghost{background:var(--btn2);color:var(--ink)}
button.ghost:hover{filter:brightness(.95);background:var(--btn2)}
button:disabled{opacity:.5;cursor:default}
label{display:block;font-size:12px;font-weight:600;color:var(--mut);margin:6px 0 6px}
.row{display:flex;justify-content:space-between;gap:12px;align-items:center;border-top:1px solid var(--line);padding:14px 0}
.card>.row:first-of-type,.card>b+.row{border-top:0}
.off{opacity:.5}.st{font-size:12px;color:var(--mut);white-space:nowrap}.st.sent{color:var(--green)}.st.failed{color:var(--red)}
.acct{display:flex;gap:12px;align-items:center;padding:2px 0}.acct img{width:44px;height:44px;border-radius:50%}.acct small{color:var(--mut)}
.badge{display:inline-flex;align-items:center;border-radius:999px;color:#fff;font-size:11px;font-weight:600;padding:0 8px;line-height:18px}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.chip{display:inline-flex;align-items:center;gap:4px;border-radius:999px;padding:5px 10px;font-size:12px;font-weight:600;color:var(--ink);background:var(--soft);line-height:16px}
.chip button{margin:0;padding:0 0 0 2px;background:none;color:var(--mut);font-size:15px;line-height:1;font-weight:400}
.chip button:hover{background:none;color:var(--ink)}
.empty{padding:16px 0;color:var(--mut)}

/* avatars: real Instagram pictures sit on top of the initial */
.av{position:relative;overflow:hidden;width:44px;height:44px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:600;font-size:17px;flex:none}
.av img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.av.lg{width:96px;height:96px;font-size:36px}
.av.xs{width:28px;height:28px;font-size:12px}
.av.grp{background:var(--soft);color:var(--ink)}.av.grp svg{width:50%;height:50%}

/* ---------- metrics: the KPI band, panels, charts, tables ---------- */
.meta{display:flex;flex-wrap:wrap;gap:4px 20px;align-items:baseline;margin:0 0 16px;color:var(--mut);font-size:14px;line-height:20px}
.meta b{color:var(--ink);font-weight:600;font-variant-numeric:tabular-nums}
.meta .cmp{margin-left:auto;font-size:13px}
.seg{display:inline-flex;border:1px solid var(--line);border-radius:8px;background:var(--panel);overflow:hidden}
.seg a,.seg button{margin:0;padding:7px 12px;font-size:13px;line-height:18px;font-weight:600;color:var(--mut);background:none;border-radius:0;opacity:1;border-left:1px solid var(--line);white-space:nowrap}
.seg a:first-child,.seg button:first-child{border-left:0}
.seg a:hover,.seg button:hover{color:var(--ink);background:var(--hover);opacity:1}
.seg a.on,.seg button[aria-pressed=true]{background:var(--navon);color:var(--ink)}
.seg .n{display:none}
.stats{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:1px;background:var(--line);border:1px solid var(--line);border-radius:8px;overflow:hidden;margin:0 0 16px}
.stat{background:var(--panel);padding:16px 20px 18px;min-width:0}
.stat .lbl{color:var(--mut);font-size:13px;line-height:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.stat b{display:block;font-size:26px;line-height:32px;font-weight:600;margin:6px 0 4px;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.stat small{display:block;color:var(--mut);font-size:12px;line-height:16px}.stat small svg{vertical-align:-2px;margin-right:2px}
.stat small.up{color:var(--up)}.stat small.down{color:var(--down)}
.cols{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:16px;margin:0 0 16px}
.cols>.card{margin:0;min-width:0;display:flex;flex-direction:column}
.ph{display:flex;justify-content:space-between;align-items:baseline;gap:8px 16px;flex-wrap:wrap;margin:0 0 18px}
.ph h2{font-size:15px;line-height:20px}
.ph p{font-size:13px;color:var(--mut);margin:2px 0 0}
.ph>a{font-size:13px;font-weight:600;white-space:nowrap}
.lgd{display:flex;gap:18px;font-size:13px;color:var(--mut);white-space:nowrap}
.lgd i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:6px}
.lgd b{color:var(--ink);font-weight:600;font-variant-numeric:tabular-nums;margin-left:4px}
.lc{flex:1;display:grid;grid-template-columns:auto minmax(0,1fr);grid-template-rows:minmax(220px,1fr) auto;gap:8px 10px;font-size:12px;line-height:12px;color:var(--mut);font-variant-numeric:tabular-nums}
.lc-y{display:flex;flex-direction:column;justify-content:space-between;text-align:right;margin:-6px 0}
.lc-plot{position:relative;touch-action:pan-y;cursor:crosshair;min-width:0}
.lc-plot svg{display:block;width:100%;height:100%;overflow:visible}
.lc-plot .gr{stroke:var(--line);stroke-width:1}
.lc-x{grid-column:2;display:flex;justify-content:space-between;white-space:nowrap}
.lc-guide{position:absolute;top:0;bottom:0;width:1px;background:var(--mut);pointer-events:none}
.lc-tip{position:absolute;top:8px;transform:translateX(-50%);background:var(--ink);color:var(--panel);border-radius:6px;padding:8px 10px;font-size:12px;line-height:18px;white-space:nowrap;pointer-events:none;z-index:2;box-shadow:0 4px 14px rgba(0,0,0,.18)}
.lc-tip b{display:block;font-weight:600}
.lc-tip span{display:flex;align-items:center;gap:6px}
.lc-tip i{width:8px;height:8px;border-radius:2px}
.lc-tip em{font-style:normal;margin-left:auto;padding-left:14px;font-weight:600}
.lc-none{position:absolute;inset:0;display:grid;place-items:center;color:var(--mut);font-size:13px;line-height:18px;text-align:center;padding:0 24px}
.fb{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px 12px;align-items:baseline;padding:12px 0;border-top:1px solid var(--line)}
.fb:first-of-type{border-top:0;padding-top:0}.fb:last-of-type{padding-bottom:0}
.fb-l{font-size:13px}
.fb-n{font-size:13px;color:var(--mut);font-variant-numeric:tabular-nums;text-align:right}.fb-n b{color:var(--ink);font-weight:600;margin-right:8px}
.fb-t{grid-column:1/-1;height:8px;border-radius:4px;background:var(--soft);overflow:hidden}
.fb-t i{display:block;height:100%;border-radius:4px;background:var(--pri)}
.fb.sec .fb-t i{background:var(--series2)}
.tbl{width:100%;border-collapse:collapse;font-size:13px;line-height:18px}
.tbl th{text-align:left;font-size:12px;font-weight:600;color:var(--mut);padding:0 12px 10px 0;white-space:nowrap;border-bottom:1px solid var(--line)}
.tbl td{padding:12px 12px 12px 0;border-bottom:1px solid var(--line);vertical-align:middle}
.tbl tr:last-child td{border-bottom:0;padding-bottom:0}
.tbl .r{text-align:right;font-variant-numeric:tabular-nums;padding-right:0;padding-left:12px;white-space:nowrap}
.tbl a.nm{display:block;color:var(--ink);font-weight:600;opacity:1}.tbl a.nm:hover{color:var(--pri)}
.tbl small{color:var(--mut);display:block;font-size:12px;line-height:16px;margin-top:2px}
.tbl td:first-child{max-width:0;width:100%}.tbl td:first-child>*{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.none{color:var(--mut);font-size:13px;line-height:20px;padding:8px 0}
.none a{font-weight:600}
.ch{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.ch p{color:var(--mut);margin:4px 0 0;font-size:13px}
.ch>a{font-weight:600;white-space:nowrap;font-size:13px}
.flush>.ch{padding-bottom:8px}.ch>div[style]{white-space:nowrap}
.big{font-size:16px;font-weight:600}.amber{color:var(--mut);font-size:13px}
.li{display:flex;align-items:center;gap:12px;padding:10px 12px;margin:0 -12px;border-radius:8px;color:inherit;opacity:1}
a.li:hover{background:var(--hover);opacity:1}
.li .grow{flex:1;min-width:0}.li .grow div{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.li .t{font-weight:600}.li .s{color:var(--mut);font-size:13px;margin-top:2px}
.li>svg{color:var(--mut)}
.ig{width:44px;height:44px;border-radius:50%;background:var(--soft);display:grid;place-items:center}
.foot-note{color:var(--mut);font-size:12px;margin:16px 0 0}
.pipe{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-top:20px;text-align:center}
.pipe .lbl{color:var(--mut);font-size:12px}.pipe .n{font-size:22px;line-height:28px;font-weight:600;margin:2px 0 8px;font-variant-numeric:tabular-nums}
.pipe .ic{display:none}
.pipe .pct{display:inline-block;padding:3px 10px;border-radius:999px;border:1px solid;font-size:12px;font-weight:600}
.aisw{display:flex;align-items:center;justify-content:space-between;gap:20px}
.aisw form{margin:0}
.aisw button{display:flex;align-items:center;gap:10px;margin:0;padding:8px 12px;border-radius:8px;border:1px solid var(--line);background:var(--panel);color:var(--ink);white-space:nowrap}
.aisw button:hover{background:var(--hover)}
.aisw button:disabled{opacity:.55;cursor:default}.aisw button:disabled:hover{background:var(--panel)}

/* ---------- contacts: tags on the left, the list on the right ---------- */
.ct{display:grid;grid-template-columns:220px minmax(0,1fr);gap:32px;align-items:start}
.ct-side h3{font-size:14px;line-height:20px;font-weight:600;margin:0 0 8px}
.ct-side a{display:flex;justify-content:space-between;gap:8px;padding:6px 8px;margin:0 -8px;border-radius:6px;color:var(--ink);font-size:13px;line-height:18px;opacity:1}
.ct-side a span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ct-side a:hover{background:var(--navhov);opacity:1}.ct-side a.on{background:var(--navon)}
.ct-side a span:last-child{color:var(--mut);font-variant-numeric:tabular-nums}
.ct-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 12px;color:var(--mut);font-size:13px}
.ct-bar form{margin:0;flex:0 1 320px}
.ct-bar .srch{margin:0}
.ct-bar .srch input{background:var(--panel);border:1px solid var(--line);border-radius:8px;font-size:14px;padding:8px 12px 8px 36px}
.ct-bar .srch svg{left:12px;top:10px}
.ct-tbl{background:var(--panel);border:1px solid var(--line);border-radius:8px;overflow:hidden}
.ct-h,.ct-row{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1.4fr) 130px 130px;gap:16px;align-items:center;padding:10px 20px}
.ct-h{font-size:12px;font-weight:600;color:var(--mut);padding:12px 20px;border-bottom:1px solid var(--line)}
.ct-row{color:var(--ink);opacity:1;border-top:1px solid var(--line);font-size:13px;line-height:18px}
.ct-h+.ct-row{border-top:0}
.ct-row:hover{background:var(--hover);opacity:1}
.ct-row .nm{display:flex;align-items:center;gap:12px;min-width:0}
.ct-row .nm .av{width:36px;height:36px;font-size:14px}
.ct-row .nm div{min-width:0}.ct-row .nm b,.ct-row .nm small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ct-row .nm b{font-weight:600}.ct-row small{color:var(--mut);font-size:12px;line-height:16px}
.ct-row .chips{flex-wrap:nowrap;overflow:hidden}.ct-row .chip{padding:2px 8px;font-weight:500;white-space:nowrap}
.ct-row .when{color:var(--mut);font-variant-numeric:tabular-nums;white-space:nowrap}
.ct-tbl .none{padding:28px 20px}
.ct .pager{padding:16px 0}

/* ---------- help ---------- */
.qa{border-top:1px solid var(--line);padding:14px 0}
.qa:first-of-type{border-top:0;padding-top:0}.qa:last-of-type{padding-bottom:0}
.qa h3{font-size:14px;line-height:20px;font-weight:600;margin:0 0 4px}
.qa p{margin:0;color:var(--mut);font-size:14px;line-height:21px;max-width:68ch}

/* ---------- inbox: list | thread | details ---------- */
.ib{display:grid;grid-template-columns:397px minmax(0,1fr) 340px;height:100vh;height:100dvh}
html:has(.ib),body:has(.ib){height:100%;overflow:hidden}
.convs,.msgs,.sd-b{overscroll-behavior:contain}
.ib:not(.open){grid-template-columns:397px minmax(0,1fr)}
.ib:not(.open) .ib-side,.ib.swap .ib-side{display:none}
.ib.open.swap{grid-template-columns:397px minmax(0,1fr)}
.pane{position:relative;display:flex;flex-direction:column;min-height:0;min-width:0;overflow:hidden;background:var(--bg)}
.ib-list{border-right:1px solid var(--line)}
/* the three panes' headers are 60px, so their rules continue the sidebar's and the title bar's */
.lh{padding:0 24px}
.lh h1{font-size:22px;line-height:59px;height:60px;margin:0 -24px 6px;padding:0 24px;border-bottom:1px solid var(--line)}
.tabs{display:flex;border-bottom:1px solid var(--line);margin:0 -24px}
.tabs a{flex:1;text-align:center;padding:14px 0 13px;color:var(--mut);font-weight:600;font-size:14px;border-bottom:1px solid transparent;margin-bottom:-1px;opacity:1}
.tabs a:hover{color:var(--ink)}
.tabs a.on{color:var(--ink);border-color:var(--ink)}
.srch{position:relative;margin:16px 0 0}.srch svg{position:absolute;left:14px;top:12px;color:var(--mut)}
.srch input{margin:0;padding:10px 16px 10px 40px;border:0;border-radius:999px;background:var(--soft);font-size:15px}
.srch input::placeholder{color:var(--mut)}
.count{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:16px 0 8px;font-weight:700;font-size:15px}
.count .fl{display:flex;gap:4px;font-weight:600}
.count select,.count form{margin:0;width:auto}
.count select{border:0;background-color:transparent;color:var(--mut);font-size:13px;font-weight:600;padding:4px 22px 4px 8px;background-position:right 4px center;border-radius:6px;max-width:120px}
.count select:hover{color:var(--ink);background-color:var(--hover)}
.convs{position:relative;overflow-y:auto;flex:1;padding-bottom:8px}
.conv{display:flex;align-items:center;gap:12px;padding:8px 24px;color:inherit;opacity:1}
.conv:hover{background:var(--hover);opacity:1}.conv.on{background:var(--sel)}
.conv .avw{position:relative;flex:none}
.conv .av{width:56px;height:56px;font-size:22px}
.wo{position:absolute;right:1px;bottom:1px;width:14px;height:14px;border-radius:50%;background:var(--green);border:3px solid var(--bg)}
.conv.on .wo{border-color:var(--sel)}
.conv .grow{flex:1;min-width:0}
.conv .top1{display:flex;align-items:baseline;justify-content:space-between;gap:8px}
.conv .top1 b{font-weight:400;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.stg{font-size:11px;font-weight:600;white-space:nowrap;flex:none}
.conv .prev{display:flex;color:var(--mut);font-size:12px;line-height:16px;margin-top:3px;white-space:nowrap;min-width:0}
.conv .prev .txt{overflow:hidden;text-overflow:ellipsis;min-width:0}
.conv .prev .when:before{content:"·";margin:0 4px}
.conv .prev .when{flex:none}
.conv.unread .top1 b,.conv.unread .prev{font-weight:600;color:var(--ink)}
.conv.unread .prev .when{font-weight:400;color:var(--mut)}
.ud{width:8px;height:8px;border-radius:50%;background:var(--pri);flex:none}
.ai{flex:none;font-weight:600}
.ai:after{content:"·";margin:0 4px;color:var(--mut);font-weight:400}
.ai.paused{color:var(--amber)}.ai.flagged{color:var(--red)}.ai.closed{color:var(--mut)}
.pager{display:flex;justify-content:space-between;padding:16px 24px}
.pager a{background:var(--btn2);color:var(--ink);padding:7px 16px;border-radius:8px;font-weight:600}
.placeholder{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:var(--mut);text-align:center;padding:24px}
.placeholder .ring{width:96px;height:96px;border-radius:50%;border:2px solid var(--ink);display:grid;place-items:center;color:var(--ink);margin-bottom:12px}
.placeholder b{color:var(--ink);font-size:20px;line-height:25px;font-weight:400}

/* thread */
.th-head{display:flex;align-items:center;gap:12px;height:60px;padding:0 16px 0 16px;border-bottom:1px solid var(--line);flex:none}
.th-head .who{display:flex;gap:12px;align-items:center;min-width:0;flex:1;color:inherit;cursor:pointer;opacity:1}
.th-head .who b{font-size:16px;line-height:20px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.th-head .who small{color:var(--mut);font-size:12px}
.th-head form{margin:0}
.ibtn{display:grid;place-items:center;width:40px;height:40px;margin:0;padding:0;border-radius:50%;background:none;color:var(--ink)}
.ibtn:hover{background:var(--hover)}
.back{display:none;color:var(--ink);margin-left:-8px}
.aitog{display:inline-flex;align-items:center;gap:8px;background:none;color:var(--ink);margin:0;padding:6px 10px;font-size:13px;font-weight:600;border-radius:999px;white-space:nowrap}
.aitog:hover{background:var(--hover)}
.err{color:var(--red);font-size:13px;padding:10px 20px;border-bottom:1px solid var(--line);background:color-mix(in srgb,var(--red) 8%,transparent)}
.msgs{flex:1;overflow-y:auto;padding:20px 20px 12px;display:flex;flex-direction:column;gap:2px}
.msgs time{align-self:center;font-size:12px;color:var(--mut);margin:16px 0 10px}
.msgs time:first-child{margin-top:4px}
.m{max-width:min(560px,70%);padding:8px 12px;border-radius:22px;white-space:pre-wrap;word-break:break-word;font-size:15px;line-height:20px}
.m.lead{align-self:flex-start;background:var(--soft);color:var(--ink);margin-left:36px;position:relative}
.m.bot{align-self:flex-end;background:var(--out);color:#fff}
.m.bot+.m.bot{border-top-right-radius:4px}.m.bot:has(+.m.bot){border-bottom-right-radius:4px}
.m.lead+.m.lead{border-top-left-radius:4px}.m.lead:has(+.m.lead){border-bottom-left-radius:4px}
.m.lead+.m.bot,.m.bot+.m.lead{margin-top:8px}
.m .av{position:absolute;left:-36px;bottom:0}
.gs{align-self:flex-start;margin:8px 0 2px 48px;font-size:12px;color:var(--mut)}
.m.lead a,.m.bot a{color:inherit;text-decoration:underline}
/* Instagram's message box, measured on instagram.com/direct (2026-10-29): 44px pill, 1px border, 22px radius, 11px
   side padding; 32px emoji button; 15/18 text that grows to 160px then scrolls; a 52x34 #4a5df9 send pill that only
   shows once there's text; "Replying to" bar with a top divider above it. */
.compose{padding:16px;flex:none;position:relative}
.cbox{display:flex;align-items:flex-end;min-height:44px;border:1px solid var(--track);border-radius:22px;padding:0 11px;margin:0}
.cbox .c-emo{display:grid;place-items:center;width:32px;height:32px;margin:6px 0;padding:0;border:0;border-radius:50%;background:none;color:var(--ink);flex:none;cursor:pointer}
.cbox textarea{flex:1;min-width:0;margin:13px 6px;padding:0;border:0;border-radius:0;background:none;color:var(--ink);font-size:15px;line-height:18px;height:18px;max-height:160px;resize:none;overflow-y:auto}
.cbox textarea::placeholder{color:var(--mut)}
.cbox textarea:focus{outline:none}
.cbox textarea:disabled{cursor:not-allowed}
.cbox .c-send{display:grid;place-items:center;width:52px;height:34px;margin:5px 0 5px 6px;padding:0;border:0;border-radius:20px;background:#4a5df9;color:#fff;flex:none;cursor:pointer}
.cbox .c-send:hover{background:#3b4ee8;color:#fff}
.cbox textarea:placeholder-shown~.c-send{display:none}
.compose .note{margin:8px 4px 0;text-align:center}

/* details panel */
.ib-side{border-left:1px solid var(--line)}
.sd-h{display:flex;align-items:center;justify-content:space-between;height:60px;padding:0 12px 0 24px;border-bottom:1px solid var(--line);flex:none;font-size:16px;font-weight:700}
.sd-b{overflow-y:auto;flex:1}
.sd-who{display:flex;flex-direction:column;align-items:center;gap:4px;padding:28px 24px 24px;text-align:center;border-bottom:1px solid var(--line)}
.sd-who .av{margin-bottom:10px}
.sd-who b{font-size:16px}
.sd-who .stg{margin-top:8px}
.sd{padding:16px 24px;border-bottom:1px solid var(--line)}
.sd:last-child{border:0}
.sd h4{margin:0 0 10px;font-size:12px;font-weight:600;color:var(--mut)}
.kv{display:flex;justify-content:space-between;gap:12px;font-size:14px;padding:5px 0}
.mem{display:flex;align-items:center;gap:10px;padding:4px 0;font-size:14px;color:var(--ink);text-decoration:none}
.kv span:first-child{color:var(--mut)}.kv span:last-child{text-align:right}
.kv.blk{flex-direction:column;gap:4px}.kv.blk span:last-child{text-align:left;line-height:19px}
.sd .chips form{display:contents}
.addtag{display:inline-flex;align-items:center;gap:4px;border:1px dashed var(--line);border-radius:999px;padding:0 10px;color:var(--mut)}
.addtag input{width:72px;margin:0;padding:5px 0;border:0;background:none;font-size:12px}

/* ---------- settings ---------- */
.sec .ch{justify-content:flex-start;align-items:center;gap:12px;margin-bottom:8px}
.sec .ic{color:var(--ink);display:grid}
.opt{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:16px 0;border-top:1px solid var(--line)}
.sec .ch+.opt{border-top:0}
.opt a{font-weight:600;white-space:nowrap}.opt .t{font-weight:600;display:flex;align-items:center;gap:6px}.opt .d{color:var(--mut);font-size:13px;margin-top:4px;line-height:17px}
.opt.hl{display:block}
.pill{display:inline-block;font-size:11px;font-weight:600;color:var(--pri);background:color-mix(in srgb,var(--pri) 12%,transparent);border-radius:6px;padding:1px 6px;margin-left:2px}
.inl{display:flex;gap:8px;align-items:center;margin-top:12px;color:var(--mut)}.inl input{width:80px;margin:0}.inl select{width:auto;margin:0}
.switch{position:relative;display:inline-block;width:44px;height:26px;flex:none;margin:0}
.switch input{position:absolute;opacity:0;width:0;height:0;margin:0}
.switch span{position:absolute;inset:0;background:var(--track);border-radius:13px;transition:.2s;cursor:pointer}
.switch span:before{content:"";position:absolute;width:22px;height:22px;left:2px;top:2px;border-radius:50%;background:#fff;transition:.2s;box-shadow:0 1px 3px rgba(0,0,0,.25)}
.switch input:checked+span{background:var(--ink)}.switch input:checked+span:before{transform:translateX(18px);background:var(--bg)}
.tog{position:relative;width:36px;height:22px;border-radius:11px;background:var(--track);flex:none;transition:.2s}
.tog:before{content:"";position:absolute;width:18px;height:18px;left:2px;top:2px;border-radius:50%;background:#fff;transition:.2s;box-shadow:0 1px 2px rgba(0,0,0,.25)}
.tog.on{background:var(--green)}.tog.on:before{transform:translateX(14px)}
.aitog .tog.on{background:var(--pri)}.aitog .tog.idle{opacity:.4}
.two{display:grid;grid-template-columns:1fr auto;gap:8px}

/* ---------- narrower screens ---------- */
@media (max-width:1263px){
  body,html.nav-min body{--rail:64px}
  .side .l{opacity:0}.fold{display:none}
  .stats{grid-template-columns:repeat(3,minmax(0,1fr))}
  .cols{grid-template-columns:minmax(0,1fr)}
  .ct{grid-template-columns:minmax(0,1fr);gap:20px}
  .ct-side{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.ct-side h3{margin:0 8px 0 0}
  .ct-side a{margin:0;border:1px solid var(--line);background:var(--panel);border-radius:999px;padding:4px 10px}
  .ib,.ib:not(.open),.ib.open.swap{grid-template-columns:360px minmax(0,1fr)}
  .ib-side{display:none}
  .ib.open.swap .ib-side{display:flex;grid-column:2;grid-row:1}
  .ib.swap .ib-thread{display:none}
}
@media (max-width:767px){
  body,html.nav-min body{--rail:0px}
  .side{top:auto;right:0;width:auto;height:calc(52px + env(safe-area-inset-bottom));flex-direction:row;align-items:center;padding:0 4px env(safe-area-inset-bottom);border-right:0;border-top:1px solid var(--line);background:var(--panel);transition:none}
  .brand,.side .who,.side .gap,.fold,.side .foot{display:none}
  .side nav{flex-direction:row;flex:1;justify-content:space-around;padding:0}
  .nv{height:44px;padding:0 10px}.nv .l{display:none}
  main{padding-bottom:calc(56px + env(safe-area-inset-bottom));transition:none}
  .tb{height:52px;padding:0 16px}.tb h1{font-size:18px;line-height:24px}
  .tb .me{display:block}
  .wrap{padding:16px 16px 48px}
  .card{padding:16px}
  .stats{grid-template-columns:repeat(2,minmax(0,1fr))}
  .stat{padding:12px 14px 14px}.stat b{font-size:22px;line-height:28px}
  .lc{grid-template-rows:minmax(180px,1fr) auto}
  .lc-x span:nth-child(even){visibility:hidden}
  .seg .w,.tbl .wide{display:none}.seg .n{display:inline}
  .tb-r{gap:10px}
  .ct-h{display:none}
  .ct-row{grid-template-columns:minmax(0,1fr) auto;padding:10px 14px}
  .ct-row .chips,.ct-row .when.first{display:none}
  .ib,.ib:not(.open),.ib.open.swap{grid-template-columns:minmax(0,1fr);height:calc(100dvh - 52px - env(safe-area-inset-bottom))}
  .ib.open .ib-list{display:none}
  .ib:not(.open) .ib-thread{display:none}
  .ib.open.swap .ib-side{grid-column:1}
  body:has(.ib.open){padding:0}
  body:has(.ib.open) .side{display:none}
  body:has(.ib.open) main{padding-bottom:0}
  body:has(.ib.open) .ib{height:100dvh}
  .lh{padding:0 16px}.lh h1{margin:0 -16px 4px;padding:0 16px;height:52px;line-height:51px;font-size:18px}.tabs{margin:0 -16px}
  .conv{padding:8px 16px}
  .back{display:grid}
  .th-head{height:60px;padding:0 8px 0 12px;gap:8px}
  .th-head .av{width:36px;height:36px;font-size:15px}
  .aitog .lbl{display:none}
  .msgs{padding:16px 12px 8px}
  .m{max-width:80%}
  .compose{padding:10px}
  .sd-h{height:60px}
  .pipe{grid-template-columns:repeat(3,1fr);row-gap:18px}
}

/* =====================================================================================================================
   RELAY LAYER. Everything below re-skins the layout above: paper and ink, hairlines, sharp 4px corners, one signal
   color. Serif for headlines and big figures, mono for labels. Kept last so it wins without touching layout rules.
   ===================================================================================================================== */
body{--serif:"Instrument Serif",ui-serif,Georgia,serif;--mono:"Geist Mono",ui-monospace,SFMono-Regular,Menlo,monospace;--r:4px}
body:after{content:"";position:fixed;inset:0;pointer-events:none;z-index:100;opacity:.035;mix-blend-mode:multiply;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
:root[data-theme=dark] body:after{mix-blend-mode:screen;opacity:.025}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]) body:after{mix-blend-mode:screen;opacity:.025}}
::selection{background:color-mix(in srgb,var(--pri) 30%,transparent)}
*{scrollbar-width:thin;scrollbar-color:var(--track) transparent}
a{color:var(--pri)}

/* rail */
.side{background:var(--canvas)}
.brand{gap:11px;font:400 italic 27px/1 var(--serif);letter-spacing:-.01em}
.brand .l{transform:translateY(1px)}
.nv{height:40px;border-radius:0;margin:1px 0;color:var(--mut);font-weight:500;position:relative}
.nv:hover{background:transparent;color:var(--ink)}
.nv.on{background:transparent;color:var(--ink)}
.nv.on:before{content:"";position:absolute;left:-8px;top:8px;bottom:8px;width:3px;background:var(--pri)}
.nv.on svg{color:var(--pri)}
.side nav{padding:12px 8px}
.side nav:before{content:"Workspace";display:block;font:500 10px/1 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--mut);padding:6px 12px 10px;white-space:nowrap;transition:opacity .2s}
html.nav-min .side nav:before{opacity:0}
.fold button{border-radius:var(--r)}

/* account switcher (the block under the logo) */
.acsw{position:relative;border-bottom:1px solid var(--line);flex:none}
.acsw summary{list-style:none;display:flex;align-items:center;gap:10px;height:64px;padding:0 18px;cursor:pointer;white-space:nowrap;color:var(--ink);font-size:13px;line-height:17px}
.acsw summary::-webkit-details-marker{display:none}
.acsw summary:hover{background:var(--navhov)}
.acsw summary .av{width:28px;height:28px;font-size:12px}
.acsw summary .l{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis}
.acsw summary small{display:block;color:var(--mut);font:400 11px/15px var(--mono)}
.acsw summary .ud2{color:var(--mut);transition:transform .2s}
.acsw[open] summary .ud2{transform:rotate(90deg)}
.acsw-pop{position:fixed;left:12px;top:126px;width:268px;z-index:30;background:var(--elev);border:1px solid var(--ink);border-radius:var(--r);box-shadow:6px 6px 0 color-mix(in srgb,var(--ink) 14%,transparent);padding:6px}
.acsw-pop h6{margin:6px 10px 6px;font:500 10px/1 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--mut)}
.acsw-pop a{display:flex;align-items:center;gap:10px;padding:8px 10px;color:var(--ink);border-radius:2px;font-size:13px;opacity:1}
.acsw-pop a:hover{background:var(--hover)}
.acsw-pop a .av{width:26px;height:26px;font-size:11px}
.acsw-pop a small{display:block;color:var(--mut);font:400 11px/14px var(--mono)}
.acsw-pop a .grow{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.acsw-pop .cur{font:500 10px/1 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--pri)}
.acsw-pop hr{border:0;border-top:1px solid var(--line);margin:6px 0}
.acsw-pop .mg{color:var(--mut)}
html.nav-min .acsw summary .l,html.nav-min .acsw summary .ud2{opacity:0}

/* title bar */
.tb{background:color-mix(in srgb,var(--canvas) 88%,transparent);backdrop-filter:saturate(1.2) blur(10px);-webkit-backdrop-filter:saturate(1.2) blur(10px);height:72px}
.tb h1{font:400 34px/1 var(--serif);letter-spacing:-.015em}
h1{font-family:var(--serif);font-weight:400;letter-spacing:-.01em}
.p-inbox .lh h1{font:400 30px/59px var(--serif)}

/* panels */
.card,.ct-tbl,.stats{border-radius:var(--r)}
.card{background:var(--panel);padding:22px 24px}
.card>b:first-child,.card h2,.ph h2{font-size:15px;font-weight:600;letter-spacing:-.005em}
.ph p,.ch p{font-size:13px}
.kicker,.stat .lbl,.tbl th,.ct-h,.sd h4,label,.lgd,.meta .cmp,.count .fl,.pipe .lbl{font-family:var(--mono);font-size:10.5px;line-height:14px;font-weight:500;letter-spacing:.1em;text-transform:uppercase}
.lgd b{font-family:var(--mono)}
.stats{gap:1px}
.stat{padding:18px 20px 18px}
.stat b{font:400 46px/1 var(--serif);letter-spacing:-.02em;margin:12px 0 8px}
.stat small{font-family:var(--mono);font-size:11px}
.pipe .n{font:400 34px/1.1 var(--serif)}
.meta b,.tbl .r,.fb-n,.ct-row .when,.lc,.st{font-family:var(--mono);font-size:12px}
.fb-t{height:6px;border-radius:0;background:var(--soft)}
.fb-t i{border-radius:0;background:var(--pri)}
.lc-tip{border-radius:var(--r);font-family:var(--mono);box-shadow:4px 4px 0 color-mix(in srgb,var(--pri) 55%,transparent)}
.tag{border-radius:2px;font-family:var(--mono);font-size:10px;letter-spacing:.06em;text-transform:uppercase}
.chip{border-radius:2px;font:500 11px/16px var(--mono);background:var(--soft);border:1px solid var(--line)}
.badge{border-radius:2px;font-family:var(--mono)}
.pill{border-radius:2px;font-family:var(--mono);font-weight:500;letter-spacing:.04em}
.pipe .pct{border-radius:2px;font-family:var(--mono)}

/* controls */
button{border-radius:var(--r);background:var(--ink);color:var(--canvas);font-weight:600;transition:transform .12s ease,box-shadow .12s ease,background-color .12s}
button:hover{background:var(--ink);transform:translate(-1px,-1px);box-shadow:3px 3px 0 var(--pri)}
button:active{transform:none;box-shadow:none}
button.ghost{background:transparent;color:var(--ink);box-shadow:inset 0 0 0 1px var(--line)}
button.ghost:hover{background:var(--hover);filter:none;box-shadow:inset 0 0 0 1px var(--ink)}
button:disabled:hover{transform:none;box-shadow:none}
.ibtn,.ibtn:hover,.aitog,.aitog:hover,.chip button,.chip button:hover,.c-emo,.c-send,.fold button,.acsw button,button.nv,button.nv:hover,.seg button,.seg button:hover{transform:none;box-shadow:none}
.ibtn:hover{background:var(--hover)}.aitog{background:transparent;color:var(--ink)}
.fold button{background:none;color:var(--ink)}button.nv{background:none;color:var(--mut)}button.nv:hover{color:var(--ink)}
.chip button{background:none;color:var(--mut)}
textarea,input,select{border-radius:var(--r);background:var(--field)}
textarea:focus,input:focus,select:focus{border-color:var(--ink);box-shadow:0 0 0 3px color-mix(in srgb,var(--pri) 16%,transparent)}
.seg{border-radius:var(--r);background:var(--panel)}
.seg a,.seg button{font:500 11px/18px var(--mono);letter-spacing:.06em;text-transform:uppercase;background:transparent;color:var(--mut)}
.seg a.on,.seg button[aria-pressed=true]{background:var(--ink);color:var(--canvas)}
.switch input:checked+span{background:var(--pri)}.switch input:checked+span:before{background:#fff}
.tog.on{background:var(--pri)}
.pager a{border-radius:var(--r);background:transparent;box-shadow:inset 0 0 0 1px var(--line)}
.aisw button{border-radius:var(--r)}

/* lists + contacts */
.li{border-radius:2px}
.ct-side a{border-radius:2px}
.ct-side a.on{background:transparent;box-shadow:inset 2px 0 0 var(--pri);color:var(--ink);font-weight:600}
.ct-bar .srch input{border-radius:var(--r)}
.ct-row .nm b{font-weight:600}

/* inbox */
.tabs a.on{border-color:var(--pri)}
.srch input{border-radius:var(--r);background:var(--soft);border:1px solid transparent}
.srch input:focus{border-color:var(--ink);box-shadow:none}
.ud{background:var(--pri)}
.m.bot{background:var(--out);color:var(--onout)}
.m{border-radius:18px}
.cbox{border-radius:var(--r)}
.cbox .c-send{background:var(--pri);color:var(--onpri);border-radius:2px}
.cbox .c-send:hover{background:var(--pri);color:var(--onpri)}
.placeholder .ring{border-radius:var(--r);border-color:var(--line)}
.placeholder b{font:400 28px/1.1 var(--serif)}
.sd-who b{font:400 26px/1.1 var(--serif)}
.wo{background:var(--pri)}

/* accounts page */
.acc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;margin:0 0 16px}
.acc{background:var(--panel);border:1px solid var(--line);border-radius:var(--r);padding:20px;display:flex;flex-direction:column;gap:14px;min-height:172px;position:relative}
.acc .top{display:flex;align-items:center;gap:12px}
.acc .top .av{width:44px;height:44px}
.acc .h{font:400 26px/1.05 var(--serif);word-break:break-word}
.acc .u{font:400 12px/16px var(--mono);color:var(--mut)}
.acc .live{display:inline-flex;align-items:center;gap:6px;font:500 10px/1 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--pri)}
.acc .live:before{content:"";width:7px;height:7px;border-radius:50%;background:var(--pri);box-shadow:0 0 0 3px color-mix(in srgb,var(--pri) 22%,transparent);animation:rl-pulse 2.4s ease-in-out infinite}
.acc .host{font:400 11px/15px var(--mono);color:var(--mut);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.acc .act{margin-top:auto;display:flex;gap:8px;align-items:center}
.acc .act form{margin:0}.acc .act button{margin:0}
.acc .act a.go{font:600 13px/1 inherit;color:var(--ink);display:inline-flex;align-items:center;gap:6px;padding:9px 14px;border:1px solid var(--ink);border-radius:var(--r);opacity:1}
.acc .act a.go:hover{background:var(--ink);color:var(--canvas)}
.acc.add{background:repeating-linear-gradient(135deg,transparent 0 9px,color-mix(in srgb,var(--line) 55%,transparent) 9px 10px),var(--panel);justify-content:center}
.acc.add form{display:grid;gap:8px}.acc.add input{margin:0}.acc.add button{margin:4px 0 0;justify-self:start}
.steps{counter-reset:s;list-style:none;margin:8px 0 0;padding:0}
.steps li{counter-increment:s;position:relative;padding:14px 0 14px 48px;border-top:1px solid var(--line);line-height:21px}
.steps li:first-child{border-top:0}
.steps li:before{content:counter(s,decimal-leading-zero);position:absolute;left:0;top:14px;font:500 12px/21px var(--mono);color:var(--pri)}
.steps code,.card code{font:400 12.5px/1 var(--mono);background:var(--soft);border:1px solid var(--line);padding:2px 6px;border-radius:2px}
@keyframes rl-pulse{50%{box-shadow:0 0 0 6px color-mix(in srgb,var(--pri) 0%,transparent)}}
@media (prefers-reduced-motion:reduce){button,.acc .live:before{transition:none;animation:none}}

@media (max-width:1263px){.side nav:before{opacity:0}.acsw summary .l,.acsw summary .ud2{opacity:0}}
@media (max-width:767px){
  .tb{height:56px}.tb h1{font-size:26px}
  .stat b{font-size:34px}
  .acsw{display:none}
  .nv.on:before{left:10px;right:10px;top:auto;bottom:0;width:auto;height:2px}
  .side nav:before{display:none}
}

/* ---------- Relay: shared new bits ---------- */
kbd{font:500 10px/1 var(--mono);border:1px solid var(--line);border-bottom-width:2px;border-radius:3px;padding:2px 5px;color:var(--mut);background:var(--panel);margin-left:auto}
.nv kbd{margin-left:auto}.nv .l{display:flex;align-items:center;gap:8px;flex:1;min-width:0}
.nb{font:600 10px/1 var(--mono);font-style:normal;color:var(--onpri);background:var(--pri);border-radius:2px;padding:3px 5px;margin-left:auto}
.kicker{font:500 10.5px/14px var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--mut);margin:0}
.banner{display:flex;gap:10px;align-items:flex-start;padding:12px 16px;border:1px solid var(--line);border-left:3px solid var(--pri);background:var(--panel);border-radius:var(--r);margin:0 0 16px;font-size:13px;line-height:19px}
.banner svg{color:var(--pri);margin-top:2px}.banner small{display:block;color:var(--mut);font-family:var(--mono);font-size:11px;margin-top:4px;word-break:break-word}
.banner code{font:12px var(--mono)}
.spark{display:block;width:100%;height:56px}
.hi{color:var(--pri)}
@keyframes rl-up{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.wrap>*{animation:rl-up .5s cubic-bezier(.16,1,.3,1) both}
.wrap>*:nth-child(2){animation-delay:.04s}.wrap>*:nth-child(3){animation-delay:.08s}.wrap>*:nth-child(4){animation-delay:.12s}.wrap>*:nth-child(5){animation-delay:.16s}.wrap>*:nth-child(n+6){animation-delay:.2s}
.m-inbox .wrap>*{animation:none}

/* Home hero */
.hhero{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(260px,1fr);gap:0;border:1px solid var(--line);border-radius:var(--r);background:var(--panel);margin:0 0 16px;overflow:hidden}
.hhero-l{padding:26px 28px}
.hhero h2{font:400 clamp(34px,4vw,52px)/1 var(--serif);letter-spacing:-.02em;margin:10px 0 10px}
.hhero h2 em{color:var(--pri)}
.hstory{color:var(--mut);font-size:15px;line-height:22px;margin:0 0 20px;max-width:56ch}
.qa-row{display:flex;flex-wrap:wrap;gap:8px}
.qa-b{display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 14px;border:1px solid var(--line);border-radius:var(--r);background:var(--canvas);color:var(--ink);font:500 13px/1 inherit;margin:0;opacity:1;cursor:pointer}
.qa-b:hover{border-color:var(--ink);background:var(--canvas);transform:none;box-shadow:none;opacity:1}
.qa-b em{font:500 11px/1 var(--mono);font-style:normal;color:var(--mut)}
.qa-b.pri{background:var(--ink);color:var(--canvas);border-color:var(--ink)}
.qa-b.pri:hover{box-shadow:3px 3px 0 var(--pri);transform:translate(-1px,-1px)}
.qa-b kbd{margin:0}
.hhero-r{border-left:1px solid var(--line);padding:26px 28px 0;display:flex;flex-direction:column;justify-content:space-between;background:linear-gradient(var(--line) 1px,transparent 1px) 0 0/100% 28px}
.pulse-k b{display:block;font:400 64px/1 var(--serif);letter-spacing:-.03em;margin-top:8px}
.hhero-r .spark{height:90px;margin:0 -28px;width:calc(100% + 56px)}
.setup-card{display:grid;grid-template-columns:auto 1fr auto;gap:18px;align-items:center;padding:16px 22px;margin:0 0 16px;border:1px solid var(--ink);border-radius:var(--r);background:var(--panel);color:var(--ink);opacity:1;transition:box-shadow .15s,transform .15s}
.setup-card:hover{opacity:1;transform:translate(-1px,-1px);box-shadow:4px 4px 0 var(--pri)}
.sc-ring{position:relative;display:grid;place-items:center}.sc-ring b{position:absolute;font:600 11px/1 var(--mono)}
.sc-t b{display:block;font-size:15px;margin:4px 0 2px}.sc-t small{color:var(--mut);font-size:13px}
.sc-go{display:inline-flex;align-items:center;gap:8px;font-weight:600;color:var(--pri);white-space:nowrap}
.act .ev{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:start;padding:11px 0;border-top:1px solid var(--line);color:var(--ink);opacity:1;font-size:13px;line-height:18px}
.act .ph+.ev{border-top:0}
.act .ev:hover{opacity:1}.act .ev:hover b{color:var(--pri)}
.ev-d{display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:var(--soft);color:var(--ink)}
.ev-d.cm{background:color-mix(in srgb,var(--pri) 14%,transparent);color:var(--pri)}
.ev q{display:block;color:var(--mut);quotes:none;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ev em{font-style:normal;font:500 11px var(--mono)}.ev em.ok{color:var(--up)}.ev em.bad{color:var(--down)}
.ev time{font:400 11px/18px var(--mono);color:var(--mut)}

/* Setup guide */
.ghero{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:32px;padding:28px;border:1px solid var(--line);border-radius:var(--r);background:var(--panel);margin:0 0 16px}
.ghero h2{font:400 clamp(32px,3.6vw,46px)/1.02 var(--serif);letter-spacing:-.02em;margin:10px 0 12px}
.ghero-t>p:last-child{color:var(--mut);max-width:60ch;margin:0;line-height:21px}
.ghero-s{display:flex;gap:18px;align-items:center;border-left:1px solid var(--line);padding-left:28px}
.gring{position:relative;display:grid;place-items:center;flex:none}.gring b{position:absolute;font:400 30px/1 var(--serif)}.gring small{font:500 11px var(--mono);color:var(--mut)}
.gchecks{list-style:none;margin:0;padding:0;display:grid;gap:7px;font-size:12.5px;line-height:16px}
.gchecks li{display:flex;align-items:center;gap:8px;color:var(--mut)}
.gchecks i{width:12px;height:12px;border:1.5px solid var(--track);border-radius:50%;flex:none}
.gchecks li.ok{color:var(--ink)}.gchecks li.ok i{background:var(--pri);border-color:var(--pri);box-shadow:inset 0 0 0 2px var(--panel)}
.glist{display:grid;gap:8px;margin:0 0 16px}
.gch{border:1px solid var(--line);border-radius:var(--r);background:var(--panel);overflow:hidden}
.gch[open]{border-color:var(--ink)}
.gch summary{list-style:none;display:grid;grid-template-columns:36px minmax(0,1fr) auto auto 20px;gap:14px;align-items:center;padding:16px 20px;cursor:pointer}
.gch summary::-webkit-details-marker{display:none}
.gch summary:hover .gt{color:var(--pri)}
.gch summary>svg{color:var(--mut);transition:transform .2s}.gch[open] summary>svg{transform:rotate(90deg)}
.gn{font:500 12px/1 var(--mono);color:var(--mut)}
.gt{font-size:15px;font-weight:600}
.gm{font:400 11px/1 var(--mono);color:var(--mut)}
.gs{display:inline-flex;align-items:center;gap:5px;font:500 10px/1 var(--mono);letter-spacing:.1em;text-transform:uppercase;min-width:52px;justify-content:flex-end}
.gch.ok .gs{color:var(--up)}.gch.todo .gs{color:var(--pri)}
.gch.ok .gn{color:var(--up)}.gch.ok .gt{color:var(--mut);text-decoration:line-through;text-decoration-color:var(--line)}
.gb{padding:4px 20px 22px 70px;font-size:14px;line-height:22px;max-width:900px}
.gb>p{margin:0 0 12px}
.gsteps{counter-reset:g;list-style:none;margin:0 0 12px;padding:0}
.gsteps>li{counter-increment:g;position:relative;padding:10px 0 10px 34px;border-top:1px dashed var(--line)}
.gsteps>li:first-child{border-top:0}
.gsteps>li:before{content:counter(g);position:absolute;left:0;top:11px;width:22px;height:22px;border:1px solid var(--ink);border-radius:50%;display:grid;place-items:center;font:600 11px/1 var(--mono)}
.gsteps>li>b{display:block;margin-bottom:2px}
.gsteps>li>div{color:color-mix(in srgb,var(--ink) 82%,var(--mut))}
.tick{margin:6px 0 0;padding-left:18px}.tick li{margin:2px 0}
.see,.trap{display:flex;gap:8px;align-items:flex-start;margin:10px 0 0;padding:10px 12px;border-radius:var(--r);font-size:13px;line-height:19px}
.see{background:color-mix(in srgb,var(--up) 9%,transparent)}.see svg{color:var(--up);margin-top:3px}
.trap{display:block;background:var(--soft)}
.cp{display:inline-flex;align-items:stretch;max-width:100%;border:1px solid var(--line);border-radius:var(--r);background:var(--canvas);vertical-align:middle;margin:4px 0;overflow:hidden}
.cp code{font:400 12.5px/30px var(--mono)!important;background:none!important;border:0!important;padding:0 10px!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.cp.secret:not(.shown) code{filter:blur(5px);user-select:none}
.cp-b{margin:0;border-radius:0;border-left:1px solid var(--line);background:var(--panel);color:var(--ink);font:600 11px/1 var(--mono);letter-spacing:.06em;text-transform:uppercase;padding:0 12px;flex:none}
.cp-b:hover{background:var(--ink);color:var(--canvas);transform:none;box-shadow:none}
.cp-b.did{background:var(--pri);color:var(--onpri)}
.flds{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}
.mark{display:flex;align-items:center;gap:8px;margin:16px 0 0;padding:10px 12px;border:1px dashed var(--line);border-radius:var(--r);font:500 13px/1 inherit;color:var(--ink);text-transform:none;letter-spacing:0;cursor:pointer}
.mark input{width:16px;height:16px;margin:0;accent-color:var(--pri)}
.btn-x{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;background:var(--ink);color:var(--canvas);border-radius:var(--r);font-weight:600;margin:4px 0;opacity:1}
.btn-x:hover{opacity:1;box-shadow:3px 3px 0 var(--pri)}

/* Growth */
.ghero2{display:grid;grid-template-columns:1.3fr 1fr 1fr;border:1px solid var(--line);border-radius:var(--r);background:var(--panel);margin:0 0 16px;overflow:hidden}
.ghero2>div{padding:24px 26px;min-width:0}
.ghero2>div+div{border-left:1px solid var(--line)}
.gh-n{display:block;font:400 clamp(48px,5.4vw,76px)/1 var(--serif);letter-spacing:-.03em;margin:10px 0 12px}
.ghero2 p{color:var(--mut);font-size:13px;line-height:19px;margin:0}.ghero2 p b{color:var(--ink)}
.gh-a .spark{height:64px;margin:14px -26px -24px;width:calc(100% + 52px)}
.gh-b{background:linear-gradient(135deg,color-mix(in srgb,var(--pri) 7%,transparent),transparent 60%)}
.dps{display:flex;flex-wrap:wrap;gap:6px}
.dp{font:400 11px/1 var(--mono);color:var(--mut);border:1px solid var(--line);border-radius:2px;padding:5px 7px}
.dp b{font-weight:600;color:var(--ink)}.dp.up b{color:var(--up)}.dp.down b{color:var(--down)}
b.hi{color:var(--pri)}
.pcs{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
.pc{display:flex;flex-direction:column;border:1px solid var(--line);border-radius:var(--r);overflow:hidden;color:var(--ink);opacity:1;background:var(--canvas);transition:transform .15s,box-shadow .15s}
a.pc[href]:hover{opacity:1;transform:translate(-1px,-1px);box-shadow:4px 4px 0 color-mix(in srgb,var(--ink) 14%,transparent)}
.pc-img{position:relative;aspect-ratio:4/3;background:repeating-linear-gradient(135deg,var(--soft) 0 10px,var(--panel) 10px 20px);overflow:hidden}
.pc-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.pc-k,.pc-kw{position:absolute;top:10px;font:600 10px/1 var(--mono);letter-spacing:.1em;text-transform:uppercase;padding:5px 7px;border-radius:2px}
.pc-k{left:10px;background:var(--ink);color:var(--canvas)}.pc-kw{right:10px;background:var(--pri);color:var(--onpri)}
.pc-b{display:flex;flex-direction:column;gap:10px;padding:12px 14px 14px}
.pc-c{font-size:13px;line-height:18px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:36px}
.pc-bar{height:3px;background:var(--soft)}.pc-bar i{display:block;height:100%;background:var(--pri)}
.pc-m{display:grid;grid-template-columns:repeat(4,1fr);gap:4px}
.pc-m span{font:400 10px/13px var(--mono);color:var(--mut);text-transform:uppercase;letter-spacing:.05em}
.pc-m b{display:block;font:400 20px/1.1 var(--serif);color:var(--ink);letter-spacing:0;text-transform:none}

/* command palette */
#pal{position:fixed;inset:0;z-index:200}
.pal-bg{position:absolute;inset:0;background:color-mix(in srgb,var(--ink) 30%,transparent);backdrop-filter:blur(2px);animation:rl-fade .15s}
.pal{position:absolute;left:50%;top:14vh;transform:translateX(-50%);width:min(600px,calc(100vw - 32px));background:var(--elev);border:1px solid var(--ink);border-radius:var(--r);box-shadow:8px 8px 0 color-mix(in srgb,var(--ink) 16%,transparent);overflow:hidden;animation:rl-up .2s cubic-bezier(.16,1,.3,1)}
.pal input{margin:0;border:0;border-bottom:1px solid var(--line);border-radius:0;background:transparent;font-size:16px;padding:16px 18px}
.pal input:focus{box-shadow:none;border-color:var(--line)}
.pal ul{list-style:none;margin:0;padding:6px;max-height:340px;overflow-y:auto}
.pal li{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:2px;cursor:pointer;font-size:14px}
.pal li small{font:500 10px/1 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--mut)}
.pal li[aria-selected=true]{background:var(--ink);color:var(--canvas)}.pal li[aria-selected=true] small{color:color-mix(in srgb,var(--canvas) 70%,transparent)}
.pal-f{display:flex;gap:16px;margin:0;padding:10px 16px;border-top:1px solid var(--line);font:400 11px var(--mono);color:var(--mut)}
.pal-f kbd{margin:0 3px 0 0}
@keyframes rl-fade{from{opacity:0}}
@media (prefers-reduced-motion:reduce){.wrap>*,.pal,.pal-bg{animation:none}}

@media (max-width:1263px){.nv .l kbd,.nv .l .nb{display:none}.ghero2{grid-template-columns:1fr 1fr}.ghero2>.gh-a{grid-column:1/-1}.ghero2>.gh-b{border-left:0;border-top:1px solid var(--line)}.ghero2>.gh-c{border-top:1px solid var(--line)}}
@media (max-width:900px){.hhero,.ghero{grid-template-columns:1fr}.hhero-r{border-left:0;border-top:1px solid var(--line)}.ghero-s{border-left:0;padding-left:0;border-top:1px solid var(--line);padding-top:20px}}
@media (max-width:767px){
  .hhero-l,.hhero-r{padding:20px}.hhero-r .spark{margin:0 -20px;width:calc(100% + 40px)}
  .setup-card{grid-template-columns:auto 1fr;padding:14px 16px}.sc-go{grid-column:1/-1}
  .gb{padding:4px 16px 18px}.gch summary{grid-template-columns:28px minmax(0,1fr) auto 16px;padding:14px 16px;gap:10px}.gm{display:none}
  .ghero{padding:20px}.ghero2{grid-template-columns:1fr}.ghero2>div+div{border-left:0;border-top:1px solid var(--line)}
  .pc-m b{font-size:17px}
  .side nav{overflow-x:auto;justify-content:flex-start;scrollbar-width:none;-webkit-mask-image:linear-gradient(90deg,#000 85%,transparent)}
  .side nav::-webkit-scrollbar{display:none}
  .side nav .nv{flex:none;min-width:58px;justify-content:center}
  .side nav .nv .l{display:none}
}
.gb code{font:400 12px/1 var(--mono);background:var(--soft);border:1px solid var(--line);padding:3px 6px;border-radius:2px}
</style>`;
