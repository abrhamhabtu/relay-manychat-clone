// Sample data for demo mode and the local preview: about 45 days of DMs from made-up people, six automations, tags,
// read receipts, button taps, link opens, 60 days of follower counts and a sample of Instagram insights. Everything is
// invented (names are mixed from two short lists); nothing here is anyone's real data. Three demo workspaces
// (PERSONAS) show Relay for different kinds of pages: a creator, a local bakery and a fitness coach.
//
// Plain JavaScript so both the Worker (the console's "Refresh sample data") and Node (scripts/preview-seed.mjs, and
// `npm run setup` filling the demo database) can run it. Types: demo_seed.d.ts. Deterministic apart from the clock.


// Each demo workspace: who it is, its automations [id, source, keyword, name, share of traffic, first DM], a draft,
// tags, what people say, and its posts.
export const PERSONAS = {
  creator: {
    label: "Creator", blurb: "Courses and guides, sold from reels",
    name: "Demo Studio", handle: "demo.studio", link: "https://demo.studio/guide", followers: 3120,
    autos: [
      [1, "comment", "AGENT", "AI receptionist build", 0.34, "heyyy thanks for commenting! 🙌 want the full build?"],
      [2, "comment", "EDIT", "Claude video editor", 0.26, "here's my whole editing stack 👇"],
      [3, "comment", "GUIDE", "Creator starter guide", 0.18, "the guide's yours, tap below 👇"],
      [4, "story", "*", "Story reply: send the template", 0.14, "you replied to my story! here's the template"],
      [5, "dm", "PRICING", "Pricing question", 0.08, "great question! here's everything on pricing"],
    ],
    draft: ["HOOKS", "Viral hook library (draft)"],
    tags: ["ai receptionist build", "video editor", "starter guide", "member", "hot", "agency"],
    tap: ["Send the link", "Open the guide"],
    replies: ["this is sick ty", "wait how do i set it up", "appreciate it!!", "do you have one for editors"],
    opens: ["hey saw your reel", "how do i start", "love the content", "can you help with my channel"],
    captions: ["I built an AI receptionist in 20 minutes. Comment AGENT for the build", "My whole video editing stack runs on Claude. Comment EDIT", "The creator starter guide I wish I had. Comment GUIDE", "3 hooks that doubled my reach this month", "Behind the scenes: how I batch a week of content", "Stop posting without this checklist", "My studio setup under $500", "Answering your DMs about pricing", "The reel that got 400k views, broken down"],
  },
  bakery: {
    label: "Local business", blurb: "A bakery taking preorders by DM",
    name: "Bloom Bakery", handle: "bloom.bakery", link: "https://bloom.bakery/order", followers: 1840,
    autos: [
      [1, "comment", "MENU", "Weekend menu", 0.32, "hi friend! 🥐 here's this weekend's menu"],
      [2, "comment", "ORDER", "Preorder a box", 0.27, "yay! preorders close Thursday, grab yours 👇"],
      [3, "story", "*", "Story reply: today's bake", 0.17, "it's fresh out of the oven right now! want one saved?"],
      [4, "dm", "CAKE", "Custom cake inquiry", 0.14, "we'd love to bake for you 🎂 tell us the date and size"],
      [5, "welcome", "*", "Welcome new DMs", 0.1, "hi! thanks for reaching out to Bloom 🌸 how can we help?"],
    ],
    draft: ["HOLIDAY", "Holiday preorders (draft)"],
    tags: ["menu", "preorder", "regular", "custom cake", "catering", "wholesale"],
    tap: ["See the menu", "Order now"],
    replies: ["omg the cardamom buns 😍", "can I pick up Saturday?", "do you do gluten free?", "ordered! thank you"],
    opens: ["are you open sunday?", "do you deliver?", "how much for a dozen?", "is the sourdough back?"],
    captions: ["This weekend's menu is here. Comment MENU 🥐", "Preorder boxes are open. Comment ORDER", "Cardamom buns, fresh at 7am", "Meet the team behind the bakes", "How we laminate croissant dough", "Custom cakes: what's possible", "Our sourdough starter turns 5", "Pastry flight for two", "Holiday preorders, coming soon"],
  },
  coach: {
    label: "Coach", blurb: "A fitness coach booking calls from DMs",
    name: "Peak Coaching", handle: "peak.coaching", link: "https://peak.coach/plan", followers: 5420,
    autos: [
      [1, "comment", "PLAN", "Free 4-week plan", 0.35, "let's go 💪 your free 4-week plan is ready"],
      [2, "comment", "MEALS", "High-protein meal guide", 0.24, "here's my go-to meal guide, 30g+ protein each"],
      [3, "story", "*", "Story reply: join the challenge", 0.17, "you're in! the 21-day challenge starts Monday"],
      [4, "dm", "COACHING", "Coaching inquiry", 0.16, "love that you want to level up. quick question first: what's your goal?"],
      [5, "mention", "*", "Thank you for the mention", 0.08, "thanks for the shoutout 🙏 means a lot"],
    ],
    draft: ["MOBILITY", "Mobility routine (draft)"],
    tags: ["free plan", "meal guide", "challenge", "client", "hot lead", "nutrition"],
    tap: ["Get the plan", "Open the plan"],
    replies: ["starting today!!", "can I do this at home?", "how much is coaching?", "week 1 done 🔥"],
    opens: ["how do I lose belly fat", "do you do online coaching?", "what split do you run?", "help with my diet?"],
    captions: ["Free 4-week plan for beginners. Comment PLAN", "What I eat in a day, 180g protein. Comment MEALS", "21-day challenge starts Monday", "Client transformation: 12 weeks", "3 mistakes killing your progress", "Home workout, no equipment", "How I structure my training week", "Mobility routine I do daily", "Q&A: your top questions"],
  },
};

/** @param {number} now @param {string} [personaKey] @returns {string[]} one SQL statement per entry */
export function demoSeed(now, personaKey = "creator") {
  const P = PERSONAS[personaKey] ?? PERSONAS.creator;
  let x = 42; const rnd = () => ((x = (x * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const DAY = 864e5, HOUR = 36e5, MIN = 6e4;
  const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";
  const out = [];
  const firsts = ["Maya","Leo","Nina","Omar","Priya","Theo","Ines","Kofi","Sana","Luca","Aiko","Dex","Remy","Wes","Zoe","Noor","Eli","Tess","Hugo","Mira"];
  const lasts = ["Park","Okafor","Silva","Novak","Haddad","Lindqvist","Moreau","Tanaka","Reyes","Boateng","Kaur","Fischer"];
  const autos = P.autos;
  for (const [id, source, kw, name, , dm] of autos)
    out.push(`INSERT INTO triggers (id, source, keyword, name, dm, enabled, created_at, published_at, updated_at) VALUES (${id}, ${q(source)}, ${q(kw)}, ${q(name)}, ${q(dm)}, ${id === 5 ? 0 : 1}, ${now - 50 * DAY}, ${now - 50 * DAY}, ${now - id * DAY});`);
  out.push(`INSERT INTO triggers (id, source, keyword, name, dm, enabled, created_at) VALUES (6, 'comment', ${q(P.draft[0])}, ${q(P.draft[1])}, 'coming soon', 0, ${now - 2 * DAY});`);
  const tags = P.tags;
  let mid = 0, sendId = 0, lead = 100;
  for (let d = 44; d >= 0; d--) {
    const dow = new Date(now - d * DAY).getUTCDay();
    const base = 6 + (44 - d) * 0.45 + (dow === 0 || dow === 6 ? -3 : 2) + (d === 12 || d === 5 ? 22 : 0); // growth, weekdays, two viral days
    const n = Math.max(1, Math.round(base * (0.7 + rnd() * 0.6)));
    for (let i = 0; i < n; i++) {
      const rawId = String(++lead), at = now - d * DAY - Math.floor(rnd() * 20 * HOUR) - HOUR;
      const id = rawId; // Messenger contacts get "fb:" below, once we know they came in by DM
      if (at > now - 5 * MIN) continue;
      const first = pick(firsts), last = pick(lasts), named = rnd() < 0.75;
      const user = (first + (rnd() < 0.5 ? "." : "_") + last).toLowerCase() + (rnd() < 0.4 ? Math.floor(rnd() * 90) : "");
      out.push(`INSERT INTO leads (subscriber_id, username, first_name, created_at, last_inbound_at) VALUES (${q(id)}, ${q(user)}, ${named ? q(first + " " + last) : "NULL"}, ${at}, ${at});`);
      const r = rnd(); let acc = 0; const auto = autos.find((a) => (acc += a[4]) > r) ?? null;
      const msg = (role, text, t) => out.push(`INSERT INTO messages (subscriber_id, role, text, created_at, mid) VALUES (${q(id)}, ${q(role)}, ${q(text)}, ${t}, 'm${++mid}');`);
      if (auto && rnd() < 0.85) {
        const [tid, source, kw] = auto;
        if (source === "comment") out.push(`INSERT INTO comments (comment_id, subscriber_id, username, media_id, text, trigger_id, status, created_at) VALUES ('c${mid}', ${q(id)}, ${q(user)}, 'reel${tid}', ${q(kw === "*" ? "😍" : kw + (rnd() < 0.5 ? " please" : ""))}, ${tid}, ${rnd() < 0.03 ? "'failed'" : "'sent'"}, ${at});`);
        else msg("lead", source === "story" ? "[replying to your story] need this" : source === "mention" ? "[mentioned you in their story]" : source === "welcome" ? pick(P.opens) : kw.toLowerCase() + "?", at);
        out.push(`INSERT INTO flow_starts (trigger_id, subscriber_id, status, created_at) VALUES (${tid}, ${q(id)}, 'sent', ${at + 2000});`);
        const seen = rnd() < 0.62, tapped = seen && rnd() < 0.7, linked = tapped && rnd() < 0.55, replied = rnd() < (tapped ? 0.45 : 0.12);
        out.push(`INSERT INTO flow_sends (id, trigger_id, subscriber_id, status, node_id, part, urls, seen_at, created_at) VALUES (${++sendId}, ${tid}, ${q(id)}, 'sent', 'm0', 0, NULL, ${seen ? at + 3 * MIN : "NULL"}, ${at + 2000});`);
        msg("bot", `${auto[5]}\n[buttons: ${P.tap[0]}]`, at + 2000);
        if (tapped) {
          out.push(`INSERT INTO flow_taps (send_id, port, created_at) VALUES (${sendId}, 'nx', ${at + 4 * MIN});`);
          msg("lead", `[tapped] ${P.tap[0]}`, at + 4 * MIN);
          out.push(`INSERT INTO flow_sends (id, trigger_id, subscriber_id, status, node_id, part, urls, seen_at, created_at) VALUES (${++sendId}, ${tid}, ${q(id)}, 'sent', 'm1', 0, ${q(JSON.stringify({ go: P.link }))}, ${at + 5 * MIN}, ${at + 4 * MIN + 2000});`);
          msg("bot", `here it is\n[buttons: ${P.tap[1]} (${P.link})]`, at + 4 * MIN + 2000);
          if (linked) out.push(`INSERT INTO flow_taps (send_id, port, created_at) VALUES (${sendId}, 'go', ${at + 6 * MIN});`);
        }
        if (replied) { msg("lead", pick(P.replies), at + 20 * MIN); if (rnd() < 0.6) msg("bot", "anytime, lmk how it goes", at + 40 * MIN); }
        if (rnd() < 0.8) out.push(`INSERT INTO lead_tags (subscriber_id, tag, created_at) VALUES (${q(id)}, ${q(tags[tid - 1] ?? "hot")}, ${at});`);
      } else {
        // About one in four plain DMs came in on the Page's Messenger: same thread, blue badge.
        if (rnd() < 0.25) {
          const fbId = "fb:" + rawId;
          out[out.length - 1] = `INSERT INTO leads (subscriber_id, username, first_name, created_at, last_inbound_at) VALUES (${q(fbId)}, NULL, ${q(first + " " + last)}, ${at}, ${at});`;
          const fmsg = (role, text, t) => out.push(`INSERT INTO messages (subscriber_id, role, text, created_at, mid) VALUES (${q(fbId)}, ${q(role)}, ${q(text)}, ${t}, 'm${++mid}');`);
          fmsg("lead", pick(P.opens), at);
          if (rnd() < 0.6) fmsg("bot", "hey! thanks for the message, happy to help 🙂", at + 30 * MIN);
          continue;
        }
        msg("lead", pick(P.opens), at);
        if (rnd() < 0.5) { msg("bot", "hey! thanks for the message, happy to help 🙂", at + 30 * MIN); if (rnd() < 0.5) msg("lead", pick(P.replies), at + 50 * MIN); }
      }
      if (rnd() < 0.08) out.push(`INSERT OR IGNORE INTO lead_tags (subscriber_id, tag, created_at) VALUES (${q(id)}, ${q(pick(tags.slice(3)))}, ${at});`);
    }
  }

  // Growth: 60 days of follower counts, follow checks on everyone an automation reached, and a cached Instagram
  // insights reply (the preview has no Instagram connection, so Growth shows this sample, labeled as such).
  let followers = P.followers;
  for (let d = 59; d >= 0; d--) {
    const day = Math.floor((now - d * DAY) / DAY);
    followers += Math.round(4 + (59 - d) * 0.35 + (d === 12 || d === 5 ? 95 : 0) + (rnd() - 0.35) * 14);
    out.push(`INSERT INTO follower_snapshots (day, followers, follows, media, at) VALUES (${day}, ${followers}, 412, ${118 + Math.floor((59 - d) / 4)}, ${now - d * DAY});`);
  }
  out.push(`UPDATE leads SET follow_checked_at = ${now - HOUR}, follow_first = CASE WHEN (CAST(subscriber_id AS INTEGER) % 5) = 0 THEN 1 ELSE 0 END WHERE subscriber_id IN (SELECT subscriber_id FROM flow_starts);`);
  out.push(`UPDATE leads SET follows = follow_first WHERE follow_checked_at IS NOT NULL;`);
  out.push(`UPDATE leads SET follows = 1, follows_at = (SELECT MIN(created_at) FROM flow_starts f WHERE f.subscriber_id = leads.subscriber_id) + 3 * ${HOUR} WHERE follow_first = 0 AND (CAST(subscriber_id AS INTEGER) % 7) IN (1, 3, 4);`);
  const captions = P.captions;
  const posts = captions.map((caption, i) => ({ id: i < 3 ? `reel${i + 1}` : `post${i}`, caption, permalink: null, type: i % 3 === 2 ? "FEED" : "REELS", thumb: null, at: now - (i * 4 + 1) * DAY,
    likes: Math.round(900 + rnd() * 5200), comments: Math.round(60 + rnd() * 420), reach: Math.round(9000 + rnd() * 70000), views: Math.round(20000 + rnd() * 140000), saved: Math.round(100 + rnd() * 900), shares: Math.round(40 + rnd() * 600) }));
  out.push(`INSERT INTO settings (key, value) VALUES ('growth_cache', ${q(JSON.stringify({ at: now - 40 * MIN, totals: Object.fromEntries(Object.entries({ reach: 184320, views: 612450, accounts_engaged: 9214, total_interactions: 31870, profile_links_taps: 1288, likes: 24110, comments: 3920, shares: 2210, saves: 1630, replies: 412 }).map(([k, v]) => [k, Math.round((v * P.followers) / 3120)])), follows: Math.round((1148 * P.followers) / 3120), unfollows: Math.round((219 * P.followers) / 3120), posts, error: null }))});`);
  out.push(`INSERT INTO settings (key, value) VALUES ('demo_seeded_at', '${now}');`);
  out.push(`INSERT INTO settings (key, value) VALUES ('skool_link', ${q(P.link)});`);
  out.push(`INSERT INTO settings (key, value) VALUES ('demo_persona', ${q(PERSONAS[personaKey] ? personaKey : "creator")});`);
  out.push(`INSERT INTO settings (key, value) VALUES ('ig_profile', ${q(JSON.stringify({ username: P.handle, name: P.name, pic: null, at: now + 365 * DAY }))});`);
  return out;
}
