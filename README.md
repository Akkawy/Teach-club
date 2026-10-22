# Teach Club

Friends teaching friends, a few minutes at a time. Built from the "Peer Teaching Club" design.
Anyone can sign up.

## What's in this folder

| Folder / file | What it is |
| --- | --- |
| `public/` | The website: the pages, styles and logo |
| `public/manifest.webmanifest`, `public/sw.js`, `public/icons/` | What makes it installable as a phone app |
| `src/` | The server: `worker.js` (routes), `accounts.js`, `clubs.js`, `lessons.js`, `social.js`, `videos.js`, `notify.js`, `wishes.js`, `reminders.js`, `email.js`, `previews.js`, `lib.js` |
| `migrations/` | The database tables, one file per update (applied in order) |
| `public/og/` | The pictures shown when a lesson or invite link is shared |
| `wrangler.jsonc` | Cloudflare settings (app name, database link) |
| `package.json` | The tool list (just Cloudflare's `wrangler`) |

Everything fits in Cloudflare's free plan.

---

## Step 1: Put the code on GitHub

1. Go to <https://github.com/new>.
2. **Repository name:** `teach-club`. Choose **Public** or **Private** (either works). Leave everything else as it is. Click **Create repository**.
3. On the next page, click the link **"uploading an existing file"**.
4. Open your `Documents\teach-club` folder. Select everything **except** `node_modules`, `.wrangler` and `.claude` if you see them, then drag it into the GitHub page.
   - If you can't see `.gitignore`, that's fine: it's optional.
5. Click **Commit changes**.

## Step 2: Create the database on Cloudflare

> **Already done.** I created a database called `teach-club-db` and its ID is already in `wrangler.jsonc`. Skip to Step 3.
> The steps below are only for setting one up from scratch, for example on a different Cloudflare account.

1. Go to <https://dash.cloudflare.com> → **Storage & Databases** → **D1 SQL Database** → **Create**.
2. **Name:** `teach-club-db` → **Create**.
3. Open the new database → **Console** tab. Paste in each file from the `migrations` folder **in order** (`0001…`, then `0002…`, then `0003…`) and click **Execute** after each.
4. Copy the **Database ID** shown at the top of the database page.
5. In `wrangler.jsonc`, replace the value after `"database_id":` with that ID (keep the quotes). Upload the changed file to GitHub.

## Step 3: Connect GitHub to Cloudflare

After this, every time you change something on GitHub, Cloudflare updates the live site by itself.

**If the `teach-club` app already exists in your Cloudflare account** (it does: I uploaded it once):

1. <https://dash.cloudflare.com> → **Workers & Pages** → click **teach-club**.
2. **Settings** → **Build** → **Connect** (next to "Git repository").
3. Choose **GitHub**, allow Cloudflare to see your `teach-club` repository, and pick it.
4. **Branch:** `main`. **Build command:** leave empty. **Deploy command:** `npx wrangler d1 migrations apply teach-club-db --remote && npx wrangler deploy`
   (this also applies any new database update before each deploy).
5. Click **Connect**. Then make any small change on GitHub (or click **Retry build**) to run the first deploy.

**If you're starting on a fresh Cloudflare account:**

1. <https://dash.cloudflare.com> → **Workers & Pages** → **Create** → **Import a repository**.
2. Connect GitHub and pick the `teach-club` repository.
3. **Project name:** `teach-club`. **Build command:** leave empty. **Deploy command:** `npx wrangler d1 migrations apply teach-club-db --remote && npx wrangler deploy`.
4. Click **Create and deploy**. Do Step 2 first so the database exists.

## Step 4: Open your site

Your address is shown on the app's page in Cloudflare, like:
**https://teach-club.abdullah-shawa.workers.dev**

The first person to sign up is the first member.

## Step 5: Install it as an app on your phone

Teach Club is an installable web app: it gets its own home-screen icon and opens full-screen, without the browser bar.

- **Android (Chrome):** open your site → tap **Install app** on your profile page, or ⋮ menu → **Install app**.
- **iPhone (Safari):** open your site → tap **Share** → **Add to Home Screen** → **Add**.
- **Computer (Chrome or Edge):** click the install icon at the right end of the address bar.

Updates arrive by themselves: deploy a change, and the app picks it up the next time it's opened.

### Optional: your own domain

**Workers & Pages** → **teach-club** → **Settings** → **Domains & Routes** → **Add** → **Custom domain**.

---

## Languages and the welcome walkthrough

- The app speaks **English and Arabic**. Arabic switches the whole layout to right-to-left.
  - First visit: it picks the phone's language automatically.
  - Switch any time: the language button on the walkthrough, log-in and sign-up screens, or **Edit profile → Language**. The choice is remembered on that device.
  - All the app's words live in `public/js/strings.js`. To change any wording, edit it there (English under `en`, Arabic under `ar`).
- First-time visitors see a 5-slide **welcome walkthrough** before logging in. Anyone can replay it from "What's Teach Club?" on the log-in page or in Edit profile.

## Features

- **Private clubs:** each club has its own calendar, wishlist and invite link. New members create a club or join one with a link. Club admins can rename the club, make a new invite link, make others admins, remove members, and handle reports.
- **Reminder emails:** a day before and about 15 minutes before each lesson, to the teacher and everyone who said "I'm in". Runs every 15 minutes on Cloudflare (free). Members can turn them off in Edit profile. Capped at 90 emails a day to stay inside Resend's free plan.
- **Free video rooms:** if a teacher doesn't add their own link, each lesson gets its own Jitsi room automatically.
- **Add to calendar:** Google Calendar link, or an `.ics` file for Apple/Outlook (with a 15-minute alert).
- **"Teach me…" wishlist:** ask for lessons, vote "me too", and tap "I'll teach this" to start a lesson from a wish.
- **Presenter mode:** a big countdown that follows your time plan during the lesson and keeps the screen on.
- **Questions before the lesson**, **after-lesson recap and photos** (up to 4), and **part two** follow-ups.
- **Badges**, a yearly **Wrapped** recap, and a **"Surprise me"** topic button when creating a lesson.
- **Time zones:** everyone sees lesson times on their own clock.
- **Link previews** for shared lessons and invites (only the title, format and time, nothing private).
- **Report** a lesson or member, **delete your account**, and a plain-language **privacy page**.

### Safety, following and in-person lessons

- **Community rules + 18+** are accepted at sign-up (`/rules`). Every lesson shows a "personal experience, not professional advice" note.
- **Anti-bot check (Cloudflare Turnstile, free)** on sign-up and "Forgot it?". Set up once:
  1. Cloudflare dashboard → **Turnstile** → **Add widget**. Name: `Teach Club`. Hostname: `teach-club.abdullah-shawa.workers.dev`. Mode: **Managed**. → **Create**.
  2. Put the **Site key** in `wrangler.jsonc` → `TURNSTILE_SITE_KEY`.
  3. Add the **Secret key** as a secret: **Workers & Pages → teach-club → Settings → Variables and Secrets → Add → type Secret**, name `TURNSTILE_SECRET`.
- **Limits:** sign-ups, log-ins, password resets, lessons, questions, follows and reports are rate-limited. Accounts younger than 3 days can post 2 lessons a day and no links.
- **Reports:** a lesson reported by 3 different people is hidden until an admin or the site owner reviews it.
- **Site owner:** add a secret named `OWNER_EMAILS` with the email you log in with. You then get **Site owner tools** on the Club page (every report from every club, suspend accounts).
- **Following (one-way):** follow anyone; turn on **Approve new followers** in Edit profile to review requests. **Block** cuts both ways.
- **Who sees a lesson:** *My club* or *Club + followers*. People without a club can still follow teachers and join their follower lessons.
- **In-person lessons:** place, area, map link and seats. The exact place and map are shown only to people who said "I'm in". Full lessons have a waitlist that moves up automatically.
- **Teacher's private notes** per part of the plan, shown in presenter mode. **Material links** (slides, docs, videos) for people going, and everyone after the lesson.
- **Archive** old lessons (only the teacher still sees them). **Topics** + interests power the **For you** row.
- After sign-up, people get an **Add to home screen** step (with a warning when opened inside WhatsApp/Instagram-style browsers).

### Explore, videos, notifications and quick follow

- **Explore** (bottom menu) has two tabs: **Videos** and **Wishes** (the old wishlist).
- **Videos are links only** (YouTube, TikTok, Instagram, Vimeo, Google Drive; anything else shows as a card). Nothing is uploaded or stored, so it stays free. The player loads from that site only after you tap play (YouTube uses its privacy-friendly "no cookie" player).
  - Others can tap **"I'd join a lesson on this"** and **comment**. The owner can **Turn into a lesson**: the video comes along as a material link, and everyone who said they'd join gets a notification and one email.
  - Same safety as lessons: reports (3 reports hide a video or comment until reviewed), accounts younger than 3 days can't share videos, daily limits, and *My club* / *Club + followers* visibility. Follower-only videos are reviewed by the site owner.
  - Each profile has a **Videos** tab, and good matches show up in **For you**.
- **Notifications (the bell):** follows, follow requests, people joining your lessons, questions, thank-you notes, answers, lesson changes and cancellations, waitlist seats, video comments and "I'd join" taps, and wishes being taught. Similar ones are grouped ("Sara and 4 others…"). Each kind can be switched off in **Edit profile → Notifications**. Old notifications are cleaned up after 60 days.
- **Quick follow:** a small ➕ on people's faces (lesson cards, videos, comments, club members, attendees) follows in one tap, with **Undo**. Explore → Videos starts with **People to follow**.

## Good to know

- Each lesson is saved with the teacher's time zone; everyone else sees it converted to their own.
- "Forgot it?" emails a one-time reset link (valid 1 hour) through Resend, from `noreply@club.kathib.sa`.
  It needs the secret `RESEND_API_KEY` in Cloudflare: **Workers & Pages → teach-club → Settings → Variables and Secrets → Add → Secret**.
  Never put the key in a file or on GitHub.
- Passwords are stored scrambled (hashed), never as plain text.

## For later: running it on your own computer

Only needed if you want to test changes before uploading. Install Node.js LTS from <https://nodejs.org>, then in this folder run:

```bash
npm install
```

```bash
npm run db:local
```

```bash
npm run dev
```

Then open <http://localhost:8787>.
