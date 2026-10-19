# Teach Club

Friends teaching friends, a few minutes at a time. Built from the "Peer Teaching Club" design.
Anyone can sign up.

## What's in this folder

| Folder / file | What it is |
| --- | --- |
| `public/` | The website: the pages, styles and logo |
| `public/manifest.webmanifest`, `public/sw.js`, `public/icons/` | What makes it installable as a phone app |
| `src/worker.js` | The server: accounts, lessons, RSVPs, notes |
| `migrations/0001_init.sql` | The database tables |
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
3. Open the new database → **Console** tab. Open `migrations/0001_init.sql` from this folder, copy all of it, paste it into the console and click **Execute**.
4. Copy the **Database ID** shown at the top of the database page.
5. In `wrangler.jsonc`, replace the value after `"database_id":` with that ID (keep the quotes). Upload the changed file to GitHub.

## Step 3: Connect GitHub to Cloudflare

After this, every time you change something on GitHub, Cloudflare updates the live site by itself.

**If the `teach-club` app already exists in your Cloudflare account** (it does: I uploaded it once):

1. <https://dash.cloudflare.com> → **Workers & Pages** → click **teach-club**.
2. **Settings** → **Build** → **Connect** (next to "Git repository").
3. Choose **GitHub**, allow Cloudflare to see your `teach-club` repository, and pick it.
4. **Branch:** `main`. **Build command:** leave empty. **Deploy command:** `npx wrangler deploy`.
5. Click **Connect**. Then make any small change on GitHub (or click **Retry build**) to run the first deploy.

**If you're starting on a fresh Cloudflare account:**

1. <https://dash.cloudflare.com> → **Workers & Pages** → **Create** → **Import a repository**.
2. Connect GitHub and pick the `teach-club` repository.
3. **Project name:** `teach-club`. **Build command:** leave empty. **Deploy command:** `npx wrangler deploy`.
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

## Good to know

- Lesson times are saved exactly as the teacher picks them, so it works best when members share a time zone.
- "Forgot it?" on the log-in page doesn't reset passwords yet: that needs an email service.
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
