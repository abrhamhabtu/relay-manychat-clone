// The Setup guide (/admin/setup): every click from "I have an Instagram page" to "my first automated DM went out",
// written for someone who has never opened Meta's developer site. Six checks are read live from this install, so the
// guide ticks itself off and opens on the first thing still to do. Every value Meta asks for is shown with this
// console's own address filled in and a Copy button.

import { esc, page, type Role } from "./admin";
import * as db from "./db";
import type { Env } from "./setter";
import { icon } from "./theme";

export interface SetupCheck {
  key: "live" | "app" | "webhook" | "connected" | "message" | "automation";
  label: string;
  done: boolean;
}

const placeholder = (v: string | undefined) => !v || /REPLACE/.test(v);

export async function setupStatus(env: Env): Promise<SetupCheck[]> {
  env = env.REAL_DB ? { ...env, DB: env.REAL_DB } : env; // demo mode: setup is about the real install
  const [webhookAt, token, msg, auto] = await Promise.all([
    db.getSetting(env.DB, "webhook_at").catch(() => null),
    db.getSetting(env.DB, "ig_token").catch(() => null),
    env.DB.prepare(`SELECT 1 AS x FROM messages WHERE role = 'lead' LIMIT 1`).first<{ x: number }>().catch(() => null),
    env.DB.prepare(`SELECT 1 AS x FROM triggers WHERE enabled = 1 AND deleted_at IS NULL LIMIT 1`).first<{ x: number }>().catch(() => null),
  ]);
  return [
    { key: "live", label: "Relay is live", done: true },
    { key: "app", label: "Meta app keys saved", done: !placeholder(env.META_IG_APP_ID) && !placeholder(env.META_APP_SECRET) },
    { key: "webhook", label: "Instagram can reach Relay", done: Boolean(webhookAt) },
    { key: "connected", label: "Instagram connected", done: Boolean(token) },
    { key: "message", label: "First DM received", done: Boolean(msg) },
    { key: "automation", label: "First automation live", done: Boolean(auto) },
  ];
}

export const setupProgress = (c: SetupCheck[]) => ({ done: c.filter((x) => x.done).length, total: c.length });

// A small ring for the sidebar, Home and the guide's header.
export function ring(done: number, total: number, size = 44): string {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const p = total ? done / total : 0;
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--line)" stroke-width="3"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--pri)" stroke-width="3" stroke-linecap="butt" stroke-dasharray="${(c * p).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>`;
}

const WEBHOOK_FIELDS = ["messages", "messaging_postbacks", "messaging_seen", "messaging_referral", "message_reactions", "message_edit", "comments", "live_comments"];

const copy = (value: string, label = "Copy", secret = false) =>
  `<span class="cp${secret ? " secret" : ""}"><code>${esc(value)}</code>${secret ? `<button type="button" class="cp-b" onclick="this.closest('.cp').classList.toggle('shown')" aria-label="Show or hide">Show</button>` : ""}<button type="button" class="cp-b" data-copy="${esc(value)}" onclick="relayCopy(this)">${label}</button></span>`;

interface Chapter {
  id: string;
  title: string;
  time: string;
  check?: SetupCheck["key"];
  body: string;
}

export async function setupPage(env: Env, req: Request, who: Role): Promise<Response> {
  const checks = await setupStatus(env);
  const { done, total } = setupProgress(checks);
  const is = (k: SetupCheck["key"]) => checks.find((c) => c.key === k)?.done ?? false;
  const origin = new URL(req.url).origin;
  const host = new URL(req.url).host;
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  const admin = who === "admin";
  const verify = admin ? env.META_VERIFY_TOKEN || "(run npm run setup to create it)" : "(owner only)";

  const step = (title: string, html: string) => `<li><b>${title}</b>${html ? `<div>${html}</div>` : ""}</li>`;
  const see = (t: string) => `<p class="see">${icon("info", 14)}<span><b>What you'll see:</b> ${t}</span></p>`;
  const trap = (t: string) => `<p class="trap"><b>If it goes wrong:</b> ${t}</p>`;

  const chapters: Chapter[] = [
    {
      id: "before",
      title: "Before you start",
      time: "5 min",
      body: `<p>You'll be moving between three places: the <b>Instagram app</b> on your phone, <b>Meta's developer site</b> on your computer, and <b>this console</b>. Keep this page open in one tab.</p>
<ol class="gsteps">
${step("Have these ready", `<ul class="tick"><li>Your Instagram page, and its password</li><li>A Facebook account (your personal one is fine; nobody sees it)</li><li>A second Instagram account to test with (a friend's, or a spare)</li><li>Your phone, for the verification text Meta sends</li></ul>`)}
${step("Know the one rule that trips everyone up", `Instagram lets automations message someone only within <b>24 hours</b> of their last message, comment or button tap. Every trigger in Relay is built around that, so you don't have to think about it, but it explains why you can't "DM everyone".`)}
</ol>`,
    },
    {
      id: "pro",
      title: "Make your page a Professional account",
      time: "3 min",
      body: `<ol class="gsteps">
${step("Open your page in the Instagram app", "Tap your profile picture at the bottom right.")}
${step("Switch to professional", `Tap <b>☰</b> (top right) → <b>Settings and privacy</b> → <b>Account type and tools</b> → <b>Switch to professional account</b>. Pick a category, then <b>Creator</b> or <b>Business</b>. Either works. You can skip connecting a Facebook Page.`)}
${step("Let tools read your messages", `Still in <b>Settings and privacy</b> → <b>Messages and story replies</b> → <b>Message controls</b> → <b>Connected tools</b> → turn on <b>Allow access to messages</b>. Without this, Instagram never passes DMs to Relay.`)}
</ol>
${see("a <b>Professional dashboard</b> button under your bio.")}`,
    },
    {
      id: "dev",
      title: "Create your Meta developer account",
      time: "5 min",
      body: `<p>Instagram only lets an app send DMs if a developer registered it with Meta. That developer is you. It's free, and it doesn't make your Facebook profile public.</p>
<ol class="gsteps">
${step("Go to Meta for Developers", `Open <a href="https://developers.facebook.com" target="_blank" rel="noopener">developers.facebook.com</a> and click <b>Log in</b> (top right). Use your Facebook account.`)}
${step("Register as a developer", `Click <b>Get started</b> (or <b>My Apps</b>, which asks you to register). Accept the Platform Terms.`)}
${step("Verify your phone and email", `Meta texts you a code and emails you a link. Enter the code and open the link. You can't create an app until both are verified.`)}
${step("Pick a role", `When asked what describes you, choose <b>Developer</b> (or anything; it changes nothing).`)}
</ol>
${see("the <b>Apps</b> page, with a green <b>Create app</b> button.")}
${trap("if Meta says your account is too new or restricted, add a profile picture to Facebook, wait a day and try again. This is Meta's anti-spam check, not something Relay controls.")}`,
    },
    {
      id: "app",
      title: "Create the app and copy its keys",
      time: "5 min",
      check: "app",
      body: `<ol class="gsteps">
${step("Create app", `On <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener">developers.facebook.com/apps</a> click <b>Create app</b>. Name it <b>Relay</b> (anything works) and enter your email.`)}
${step("Choose what it's for", `If Meta shows a list of <b>use cases</b>, pick <b>Manage messaging &amp; content on Instagram</b>. If it asks for an app type instead, choose <b>Other</b> then <b>Business</b>. Skip connecting a business portfolio for now if it lets you.`)}
${step("Open the Instagram API setup", `In the app's dashboard find <b>Instagram</b> (or <b>Customize the use case</b>) and open <b>API setup with Instagram login</b>.`)}
${step("Copy the two keys", `Near the top you'll see <b>Instagram app ID</b> and <b>Instagram app secret</b> (click <b>Show</b>, Meta may ask for your password). Not the "App ID" at the very top of the page: the <b>Instagram</b> ones.`)}
${step("Give them to Relay", `In the terminal, in your Relay folder, run ${copy("npm run setup")} and type <b>done</b> when it asks about the Meta app. Paste the app ID, then the secret. Setup saves them encrypted and puts Relay live again.`)}
</ol>
${see("this check turning green after you reload this page.")}
${trap("copied the wrong ID? Run <code>npm run setup</code> again; it asks again and overwrites the old one.")}`,
    },
    {
      id: "webhook",
      title: "Point Instagram at Relay (webhooks)",
      time: "4 min",
      check: "webhook",
      body: `<p>A webhook is how Instagram taps Relay on the shoulder the moment someone comments or DMs.</p>
<ol class="gsteps">
${step("Find Configure webhooks", "On the same <b>API setup with Instagram login</b> page, open step <b>2. Configure webhooks</b>.")}
${step("Paste the callback URL", copy(`${origin}/meta`))}
${step("Paste the verify token", copy(verify, "Copy", admin))}
${step("Verify and save", "Click <b>Verify and save</b>. Meta calls Relay right then; it only succeeds if Relay is live and the token matches.")}
${step("Turn on every field", `In the list that appears, switch on <b>Subscribe</b> for: <span class="flds">${WEBHOOK_FIELDS.map((f) => `<code>${f}</code>`).join(" ")}</span>`)}
</ol>
${see("a green tick next to the callback URL. This check turns green when the first real event arrives (Part 11).")}
${trap(`"The URL couldn't be validated" means Relay isn't reachable or the token is off by a character. Open <a href="${esc(origin)}/meta" target="_blank" rel="noopener">${esc(host)}/meta</a> in a browser: it should load (any short text is fine). Then copy the token again with the button.`)}`,
    },
    {
      id: "login",
      title: "Business login settings",
      time: "3 min",
      body: `<ol class="gsteps">
${step("Open the login section", `Open step <b>3. Set up Instagram business login</b> (expand it first; the button does nothing while it's folded) and click <b>Business login settings</b>.`)}
${step("OAuth redirect URI", copy(`${origin}/auth/callback`))}
${step("Deauthorize callback URL", copy(`${origin}/deauthorize`))}
${step("Data deletion request URL", copy(`${origin}/data-deletion`))}
${step("Save", "")}
</ol>
${trap(`"Invalid redirect URI" when you log in later means this field and the address you're using differ, often by a missing <code>https://</code> or a trailing slash. Paste it again with the button.`)}`,
    },
    {
      id: "basic",
      title: "App details Meta requires",
      time: "4 min",
      body: `<p>Meta won't let an app go Live without a privacy policy and terms. Relay already hosts them for you.</p>
<ol class="gsteps">
${step("Open App settings → Basic", "In the left menu.")}
${step("App domains", copy(host))}
${step("Privacy policy URL", copy(`${origin}/privacy`))}
${step("Terms of service URL", copy(`${origin}/terms`))}
${step("User data deletion", `Choose <b>Data deletion instructions URL</b> (or callback) and paste ${copy(`${origin}/data-deletion`)}`)}
${step("Category and icon", `Pick any category (for example <b>Business and pages</b>). For the icon, download <a href="https://raw.githubusercontent.com/abrhamhabtu/relay-manychat-clone/main/assets/icon.png" target="_blank" rel="noopener">Relay's icon</a> or use any square picture.`)}
${step("Save changes", "At the bottom of the page.")}
</ol>`,
    },
    {
      id: "tester",
      title: "Add your page as a tester",
      time: "3 min",
      body: `<ol class="gsteps">
${step("App roles → Roles", `In the left menu. Click <b>Add people</b>, choose <b>Instagram Tester</b>, and type your page's username.`)}
${step("Accept the invite", `On your computer open <a href="https://www.instagram.com/accounts/manage_access/" target="_blank" rel="noopener">instagram.com/accounts/manage_access</a> logged in as your page (or in the app: Settings → Website permissions → Apps and websites), open <b>Tester invites</b> and tap <b>Accept</b>.`)}
</ol>
${trap("no invite showing? It can take a minute. Make sure you're logged in as the page, not your personal account.")}`,
    },
    {
      id: "live",
      title: "Switch the app to Live",
      time: "2 min",
      body: `<ol class="gsteps">
${step("Flip App mode", `At the top of the app's dashboard, switch <b>App mode</b> from <b>Development</b> to <b>Live</b>.`)}
${step("Answer anything Meta asks first", `It may ask for a <b>data use checkup</b> or business details. Fill those in honestly. You do <b>not</b> need App Review: you're using the app on your own account.`)}
</ol>
${trap("this is the #1 cause of \"nothing arrives\". In Development mode Meta only delivers events from people with a role on the app, so DMs from your test account never reach Relay.")}`,
    },
    {
      id: "connect",
      title: "Connect Instagram to Relay",
      time: "1 min",
      check: "connected",
      body: `<ol class="gsteps">
${step("Log in with Instagram", `${admin ? `<a class="btn-x" href="/auth/start">Connect Instagram ${icon("chevron", 14)}</a>` : "The owner does this."} Log in as your page and approve every permission.`)}
${step("Check it worked", `Your page's name and picture appear at the top of the sidebar.`)}
</ol>
${trap(`an error from Instagram usually names the field: a redirect URI mismatch (Part 6), or the tester invite not accepted (Part 8).`)}`,
    },
    {
      id: "test",
      title: "Send yourself a test DM",
      time: "1 min",
      check: "message",
      body: `<ol class="gsteps">
${step("From your second account", "DM your page anything, like <b>hi</b>.")}
${step("Watch the Inbox", `Open <a href="/admin/inbox">Inbox</a>. The message appears within a few seconds, live.`)}
</ol>
${trap("nothing after a minute? Almost always: the app is still in Development (Part 9), a webhook field is off (Part 5), or Allow access to messages is off (Part 2). In the terminal, <code>npm run check</code> tells you which.")}`,
    },
    {
      id: "first",
      title: "Your first comment-to-DM automation",
      time: "5 min",
      check: "automation",
      body: `<ol class="gsteps">
${step("Post something", `Post a reel or photo with a call to action in the caption: <i>Comment GUIDE and I'll DM you the link.</i>`)}
${step("New automation", `<a href="/admin/automations">Automation</a> → <b>New Automation</b> → template <b>Comment keyword → DM link</b>. Pick the post, type <b>GUIDE</b>.`)}
${step("Write the DM", "Click the message card, write it, add a button with your link. Buttons show in the Instagram phone app (not on desktop).")}
${step("Test without touching your numbers", "Click <b>Test</b>, then DM the 3-digit code to your page from the second account. The whole flow runs on a hidden copy. Repeat as often as you like.")}
${step("Publish", "From now on everyone who comments the keyword gets the DM, in about a second.")}
</ol>
${see("this check turning green, and the automation's numbers on <a href=\"/admin/dashboard\">Home</a>.")}`,
    },
  ];

  const firstOpen = chapters.find((c) => !c.check || !is(c.check))?.id;
  const nextUp = chapters.find((c) => c.check && !is(c.check));
  const chapterHtml = chapters
    .map((c, i) => {
      const ok = c.check ? is(c.check) : null;
      const state = ok === true ? "ok" : ok === false ? "todo" : "manual";
      const open = (nextUp ? c.id === nextUp.id : c.id === firstOpen) || (i === 0 && done <= 1);
      return `<details class="gch ${state}" id="${c.id}"${open ? " open" : ""}><summary><span class="gn">${String(i + 1).padStart(2, "0")}</span><span class="gt">${esc(c.title)}</span><span class="gm">${c.time}</span><span class="gs" data-ch="${c.id}">${
        ok === true ? `${icon("check", 13, 2.5)}Done` : ok === false ? "To do" : ""
      }</span>${icon("chevron", 16)}</summary><div class="gb">${c.body}${
        ok === null ? `<label class="mark"><input type="checkbox" data-mark="${c.id}"> I've done this part</label>` : ""
      }</div></details>`;
    })
    .join("");

  const checkList = checks.map((c) => `<li class="${c.done ? "ok" : ""}"><i></i>${esc(c.label)}</li>`).join("");
  const body = `${
    local
      ? `<div class="banner">${icon("info", 16)}<span><b>You're on the local preview.</b> Meta needs your live address, not localhost. Run <code>npm run setup</code> to put Relay live, then open this page on your live console: every value below fills in with your real address.</span></div>`
      : ""
  }
<section class="ghero"><div class="ghero-t"><p class="kicker">Setup guide · about an hour, once</p><h2>${
    done === total ? "You're all set." : nextUp ? `Next: ${esc(nextUp.title.toLowerCase())}.` : "Let's get you live."
  }</h2><p>Written for someone who has never done this. Go top to bottom. Each part says what you'll see when it worked, and what to do if it didn't. The checks on the right tick themselves as Relay sees each piece working.</p></div>
<div class="ghero-s"><div class="gring">${ring(done, total, 96)}<b>${done}<small>/${total}</small></b></div><ul class="gchecks">${checkList}</ul></div></section>
<div class="glist">${chapterHtml}</div>
<div class="card"><div class="ph"><div><h2>Still stuck?</h2><p>In the terminal, in your Relay folder:</p></div></div>
<p>${copy("npm run check")}</p><p class="note">It looks at your live setup and says, in plain words, what works and what to fix. The full list of fixes is in <a href="https://github.com/abrhamhabtu/relay-manychat-clone/blob/main/docs/TROUBLESHOOTING.md" target="_blank" rel="noopener">TROUBLESHOOTING.md</a>.</p></div>
<script>
function relayCopy(b){var v=b.getAttribute("data-copy");(navigator.clipboard?navigator.clipboard.writeText(v):Promise.reject()).then(function(){b.textContent="Copied";b.classList.add("did");setTimeout(function(){b.textContent="Copy";b.classList.remove("did")},1600)},function(){var r=document.createRange();r.selectNodeContents(b.previousElementSibling.tagName==="CODE"?b.previousElementSibling:b.parentNode.querySelector("code"));var s=getSelection();s.removeAllRanges();s.addRange(r)})}
(function(){var k="relay-setup-marks",m={};try{m=JSON.parse(localStorage.getItem(k)||"{}")}catch(e){}
document.querySelectorAll("[data-mark]").forEach(function(x){var id=x.getAttribute("data-mark"),d=document.getElementById(id);
function paint(){d.classList.toggle("ok",x.checked);d.classList.toggle("manual",!x.checked);var s=d.querySelector(".gs");if(s)s.textContent=x.checked?"Done":""}
x.checked=!!m[id];paint();x.addEventListener("change",function(){m[id]=x.checked;try{localStorage.setItem(k,JSON.stringify(m))}catch(e){}paint();
if(x.checked){d.open=false;var n=d.nextElementSibling;while(n&&n.classList.contains("ok"))n=n.nextElementSibling;if(n){n.open=true;n.scrollIntoView({behavior:"smooth",block:"start"})}}})})
if(location.hash){var t=document.querySelector(location.hash);if(t&&t.tagName==="DETAILS")t.open=true}})();
</script>`;
  return page("Setup", body, who, env, { title: "Setup guide" });
}
