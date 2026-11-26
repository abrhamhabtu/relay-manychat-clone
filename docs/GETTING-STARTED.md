# Getting started: from a brand-new Instagram page to your first automated DM

This guide assumes you've never done this before. Follow it top to bottom, one step at a time. Each step says what
you'll see when it worked. Plan on about **an hour** the first time; most of it is clicking through Meta's site.

> **You do not need ManyChat.** Relay *replaces* ManyChat for Instagram: comment-to-DM, story replies, keyword DMs,
> a flow builder, an inbox and your numbers, all on your own account. If you already pay for ManyChat, see
> [Moving from ManyChat](#moving-from-manychat) at the end.

> **Just want to look around first?** Run `npm run preview` after Part 2 and you get the whole console with sample data,
> no Instagram needed. See [DEMO-MODE.md](DEMO-MODE.md).
>
> **Tip:** once Relay is live (Part 3), open **Setup guide** at the bottom of the console's sidebar. It has these
> same steps with your own addresses already filled in, Copy buttons for every value, and checks that turn green on
> their own as each piece starts working.

---

## Part 0 · What you need (5 minutes)

| | Where | Cost |
|---|---|---|
| Your Instagram page | the Instagram app | free |
| A Facebook account | facebook.com (yours is fine) | free |
| A Cloudflare account | created during setup | free to start |
| A computer with **Node.js 22 or newer** | [nodejs.org](https://nodejs.org), click the big **LTS** button | free |
| **Git** | Mac: already there (type `git` in Terminal and accept the install). Windows: [git-scm.com](https://git-scm.com) | free |
| A second Instagram account | any personal account, for testing | free |

Check Node is installed. Open **Terminal** (Mac: press ⌘ + Space, type *Terminal*) or **PowerShell** (Windows) and run:

```bash
node -v
```

✅ You should see `v22…` or higher. If it says "command not found", install Node from nodejs.org and open a new terminal.

---

## Part 1 · Get your Instagram page ready (5 minutes)

Instagram only lets apps send DMs from **professional** accounts.

1. Open the **Instagram app** on your phone and go to your new page's profile.
2. Tap **☰ (menu) → Settings and privacy → Account type and tools → Switch to professional account**.
3. Pick **Creator** or **Business** (either works) and a category. You can skip connecting a Facebook Page.
4. Still in Settings: **Messages and story replies → Message controls → Connected tools → Allow access to messages**: turn it **on**.

✅ Your profile now shows a "Professional dashboard" button.

---

## Part 2 · Get the code (2 minutes)

In your terminal, go to the folder where you keep projects and run these one at a time:

```bash
git clone https://github.com/abrhamhabtu/relay-manychat-clone.git
```

```bash
cd relay-manychat-clone
```

```bash
npm install
```

✅ `npm install` ends with something like `added 85 packages`.

**Want to look around first?** Run `npm run preview` and open <http://localhost:8791/login>. It's a practice console
with made-up data; nothing is sent anywhere. The password is the `ADMIN_PASSWORD` line in the `.dev.vars` file it
creates. Press `Ctrl + C` in the terminal to stop it.

---

## Part 3 · Run setup (10 minutes)

```bash
npm run setup
```

It asks three questions:

1. **Your Instagram username:** the new page's handle, without the @.
2. **Your name or business:** shown on your privacy page.
3. **A contact email:** also for the privacy page (Meta requires one).

Then a browser tab opens for **Cloudflare**. Sign in (or create a free account) and click **Allow**. Go back to the
terminal: setup creates your database, your message queue and your passwords, and puts Relay live at your own
address (something like `https://relay.yourname.workers.dev`).

It then stops at **"Waiting on the Meta app"** and writes a file called **`MY-SETUP.md`** in the folder.
Leave the terminal open.

✅ You have a `MY-SETUP.md` file. Open it in any text editor. **Never share it**: it holds your password.

---

## Part 4 · Create your Meta app (15–20 minutes)

Instagram requires every DM tool to be registered as an app with Meta. Yours is free and only yours.
**`MY-SETUP.md` has these same 9 steps with your own addresses already filled in. Copy from there.**

1. Go to <https://developers.facebook.com/apps> and log in with Facebook. If it asks you to register as a developer, say yes.
2. Click **Create app** → name it "Relay" → when asked what it's for choose **Other** → type **Business**.
3. In the app's dashboard, find **Instagram** and click **Set up** → choose **API setup with Instagram login**.
4. Note the **Instagram app ID** and **Instagram app secret** (click *Show*). Keep this tab open.
5. Under **Configure webhooks**, paste the **Callback URL** and **Verify token** from `MY-SETUP.md`, click **Verify and save**, then switch **on** every field listed in `MY-SETUP.md`.
6. Open **Set up Instagram business login** → **Business login settings** and paste the three URLs from `MY-SETUP.md`.
7. Left menu: **App settings → Basic**. Fill in the domain, privacy, terms and data-deletion URLs from `MY-SETUP.md`, pick a category, upload `assets/icon.png` as the icon, **Save changes**.
8. Left menu: **App roles → Roles → Add people → Instagram tester** → add your page. Then on your phone: Instagram **Settings → Website permissions → Apps and websites → Tester invites → Accept**.
9. At the top of the app page, switch **App mode** from *Development* to **Live**. You do **not** need App Review for your own account.

Back in the terminal, type `done`. Setup asks for the **Instagram app ID** and **app secret** from step 4. Paste each one.

✅ Setup says it has saved them and is waiting for you to log in.

---

## Part 5 · Connect Instagram (2 minutes)

1. On your computer, open your console address from `MY-SETUP.md` (ends in `/login`).
2. Click **Log in with Instagram**, log in as your new page, and approve **all** the permissions, including insights (that one powers the Growth page).
3. You land on **Home** in your Relay console.

Now, from your **second** Instagram account, send your page a DM saying "hi".

✅ Within a few seconds the message shows in **Inbox**, and the terminal says it arrived.
Then run:

```bash
npm run check
```

✅ Every line is green. If anything is red, it tells you exactly what to fix. Also see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

---

## Part 6 · Your first comment-to-DM automation (5 minutes)

1. Post a reel or photo on your page. In the caption, write something like *Comment GUIDE and I'll DM you the link*.
2. In the console: **Automation → New Automation**. Pick a scenario (try **Tap to unlock the link**), or browse by
   category: Instagram, Messenger, From TikTok, From YouTube, Sell & launch.
3. Choose the post and type the keyword `GUIDE`.
4. Click the message card and write your DM. Add a button with your link.
5. Click **Test**: you get a 3-digit code. DM that code to your page from your second account and watch the whole flow run. Tests never touch your real numbers.
6. Click **Publish**.

✅ From your second account, comment `GUIDE` on the post. The DM arrives in about a second.

> Buttons and quick replies only appear in the Instagram **phone app**, not on instagram.com. Test on a phone.

---

## Part 6½ · Watch your growth

Open **Growth** in the sidebar. You'll see your follower count (Relay reads it once a day, so the chart fills in over
the following days), your reach, views and profile link taps from Instagram, your latest posts with how many comments
turned into DMs, and **how many people followed you after an automation DM'd them**.

Instagram never tells apps *why* someone followed. Relay checks whether each person your automation reached was already
following, and checks again later: "followed after your DM" counts the ones who weren't, and then were.

Instagram only reports follows and unfollows for accounts with 100+ followers; the rest of Growth works from day one.

---

## Part 6¾ · Add Facebook Messenger (optional)

Relay can answer your **Facebook Page** too. Messenger DMs and comments on the Page's posts run the **same automations**
as Instagram and land in the same Inbox, with a small blue badge on Messenger contacts. It uses the Meta app you made in
Part 4. About 15 minutes, plus Meta's review (see step 8).

The console's **Setup guide → Optional: add Facebook Messenger** has these steps with your own addresses and Copy buttons.

1. On [developers.facebook.com/apps](https://developers.facebook.com/apps), open your app → **Add use case** (or **Add
   product**) → **Engage with customers on Messenger from Meta**.
2. **App settings → Basic**: copy the **App ID** and **App Secret**. These are the app's own keys, not the Instagram ones.
3. Add them to the `.env` file in your Relay folder, then run setup again:

   ```
   FB_APP_ID=your app id
   FB_APP_SECRET=your app secret
   ```

   ```bash
   npm run setup
   ```

4. **Messenger → Messenger API Settings → Configure webhooks**: callback URL `https://YOUR-RELAY/messenger`, the same
   verify token as Instagram, **Verify and save**, then subscribe to `messages`, `messaging_postbacks`,
   `message_reads`, `message_echoes`, `message_reactions` and `feed`.
5. Add **Facebook Login for Business** → **Settings** → **Valid OAuth Redirect URIs**: `https://YOUR-RELAY/auth/fb/callback`.
6. In the console: **Accounts → Facebook Messenger → Connect your Facebook Page**. Pick the Page and allow everything.
7. Test: from a Facebook account with a role on your app (**App roles → Roles**), message your Page. ✅ It shows up in
   the Inbox with a blue badge.
8. **Open it to everyone.** Until Meta approves your app, Messenger only works for people with a role on it. In **App
   Review**, request **Advanced Access** for `pages_messaging` (and `pages_manage_engagement` to reply to comments
   publicly). Meta asks for Business Verification and a short screen recording. Instagram doesn't need this for your
   own account; Messenger does.

Automations are shared: a comment keyword set to **any post** answers comments on your Facebook Page's posts too, and
DM keywords answer on both. Story automations are Instagram only.

---

## Part 7 · More than one Instagram page

Each page gets its own Relay install: its own address, database, inbox and numbers, so nothing ever mixes.

```bash
cd ..
```

```bash
git clone https://github.com/abrhamhabtu/relay-manychat-clone.git relay-two
```

```bash
cd relay-two && npm install && npm run setup -- --name=relay-two
```

Use the second page's username when asked, and follow its own `MY-SETUP.md`. Create a **separate Meta app** for it
(a Meta app sends its webhooks to one address, and each install has its own). When it's live, open **Accounts** in either console and link the other
one: the switcher at the top of the sidebar then jumps between your pages.

---

## Moving from ManyChat

You can run both while you move over, with three rules:

1. **Never run the same keyword in both**, or people get two DMs. Rebuild a keyword in Relay, publish it, then turn it **off** in ManyChat (don't delete it, so you can roll back).
2. **Don't set a default conversation-routing app** on your Facebook Page. It can break ManyChat.
3. If ManyChat already owns a thread, Relay can't send into it directly. Add your ManyChat API key to `.env` as `MANYCHAT_API_KEY=…` and run `npm run setup`; Relay will send those through ManyChat instead.

Once every keyword is moved, cancel ManyChat.

---

## Everyday commands

| Command | What it does |
|---|---|
| `npm run check` | Is everything working? Says what's wrong in plain words. |
| `npm run update` | Gets the newest Relay and puts it live. Your settings are never touched. |
| `npm run setup` | Run again after changing a setting or adding a key. Always safe. |
| `npm run preview` | The practice console on your computer, with sample data. |

## Instagram's rules, in short

- Automated DMs only go out within **24 hours** of the person's last message, comment or button tap. You can always reply by hand.
- Relay can't DM new followers: Instagram doesn't tell apps when someone follows you.
- Use only for your own pages, and follow Instagram's terms. Staying inside them is your responsibility.
