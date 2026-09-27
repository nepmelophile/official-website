# Melophile

The website for [melophilenp.com](https://melophilenp.com), a Nepali music platform. It has:

- music news and updates,
- artist portfolios,
- services for artists, with testimonials,
- a contact form,
- a trending strip and a homepage the team curates itself.

The internal team manages all of it from a custom admin at `/admin`, with no developer needed.

**Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, MongoDB Atlas via
Mongoose, ImageKit for media, Resend for email. It deploys to Vercel.

---

## Contents

1. [Architecture and key decisions](#architecture-and-key-decisions)
2. [Local setup](#local-setup)
3. [Environment variables](#environment-variables)
4. [Using the admin](#using-the-admin)
5. [Deploying to Vercel](#deploying-to-vercel)
6. [Scripts and project layout](#scripts-and-project-layout)

---

## Architecture and key decisions

| Area | Decision | Why |
|---|---|---|
| Content editing | **Custom `/admin`** (Next.js routes, server actions, zod validation). There is no headless CMS. | The content model is small and fixed. A tailored admin keeps editing simple, and there is no second service to host or pay for. |
| Auth | A single admin account: `ADMIN_EMAIL` and `ADMIN_PASSWORD`. The session is a JWT (HS256, 7 days) signed with `AUTH_SECRET` using `jose`, stored in an httpOnly, `Secure`, `SameSite=Lax` cookie. | This is simple and there is no user table. The token carries a fingerprint of the password, so changing `ADMIN_EMAIL`, `ADMIN_PASSWORD` or `AUTH_SECRET` signs everyone out. Failed logins are throttled per IP (8 per 15 minutes) and globally (50 per 15 minutes across all clients). |
| Auth enforcement | `proxy.ts` (the Next 16 name for middleware) redirects signed-out visitors away from `/admin/*` as a first check. **Every** admin page, server action and API route also checks the session itself (`requireAdmin()`, `withAdmin()`). | Server actions can be called directly, so the proxy on its own is not a security boundary. |
| Database | MongoDB Atlas through Mongoose. `lib/db.ts` caches the connection promise on `globalThis`. The connection uses `maxPoolSize: 10`, `serverSelectionTimeoutMS: 5000`, `bufferCommands: false`, and waits 15 s before retrying after a failed connect. | A serverless function would otherwise open a new pool per invocation and use up Atlas's connection limit. |
| Resilience | Every public query (`lib/queries/*`) returns empty or default content when `MONGODB_URI` is unset or the database can't be reached. `generateStaticParams` returns `[]` in that case. | `pnpm build` then works on CI and Preview deployments with no database, and the per-request listing pages (`/news`, `/artists`) degrade instead of crashing. Cached (ISR) pages (home, article, artist, services, contact, sitemap) are stricter: when a database **is** configured and a regeneration can't reach it, the render fails on purpose so Next keeps serving the last good page instead of caching empty sections or a 404 for an hour (`requireLiveData()` in `lib/queries/safe.ts`). |
| Media | **ImageKit** (`@imagekit/next`). The browser uploads directly to ImageKit using short-lived signatures from `GET /api/imagekit/auth`, which is admin-only. MongoDB stores only `{ url, alt, fileId }`. | Media stays out of the database and is served from ImageKit's CDN. When ImageKit isn't configured, every image field falls back to pasting a URL. |
| Images | `next/image` with `remotePatterns` for `ik.imagekit.io`, your custom ImageKit endpoint and `picsum.photos` (seed data). Images from any other host are rendered `unoptimized` rather than breaking the page. | Optimised delivery, while URLs pasted into the admin keep working. |
| Contact form | A server action runs zod validation, then a honeypot check (a bot gets a fake success and nothing is saved). It enforces a best-effort limit of 5 messages per IP per 10 minutes (IP taken from trusted proxy headers only, see `TRUSTED_PROXY_HOPS`) and skips duplicates. It saves a `ContactMessage` and emails the team through **Resend** when it is configured. | Every message is always kept in the admin inbox, and email is extra. Without Resend keys, messages are saved silently. |
| Revalidation | Content pages use hourly ISR (`export const revalidate = 3600`) **plus** on-demand `revalidatePath()` from every admin save and delete (`lib/revalidate.ts`). Route patterns there include the `(site)` route group (`/(site)/news/[slug]`), since that is how Next tags the cache. | Published changes appear on the next request with no redeploy, and the hourly pass is a safety net. |
| SEO | `buildMetadata()` sets per-page titles, canonical URLs and Open Graph/Twitter tags, with the default share image `/opengraph-image`. The site also has `sitemap.xml`, `robots.txt` (Preview deployments are blocked), JSON-LD (Organization, NewsArticle, MusicGroup, Service) and real 404s for missing articles and artists. | |

Visual system: see [`docs/visual-design.md`](docs/visual-design.md). Its design tokens live in `app/globals.css` under `@theme`.

---

## Local setup

Prerequisites: Node 20+, pnpm 10 and Docker.

```bash
pnpm install

# 1. Local MongoDB 7. The container is "melophile-mongo" on 127.0.0.1:27018; 27018 is used
#    because 27017 is often taken by other projects.
pnpm db:up                      # = docker compose up -d mongo

# 2. Environment
cp .env.example .env.local
#   MONGODB_URI=mongodb://127.0.0.1:27018/melophile
#   AUTH_SECRET=$(openssl rand -base64 48)
#   ADMIN_EMAIL / ADMIN_PASSWORD = whatever you want to sign in with
#   NEXT_PUBLIC_SITE_URL=http://localhost:3000

# 3. Sample content: 9 articles, 6 artists, 4 services, testimonials, trending, settings
pnpm seed                       # wipes and re-inserts content collections (local DBs only)
pnpm seed -- --with-messages    # also adds sample inbox messages

# 4. Run
pnpm dev                        # http://localhost:3000; the admin is at /admin
```

`pnpm seed` refuses to run against a non-local database unless you pass `-- --force`, so
production data can't be wiped by accident.

To check a production build locally: `pnpm build && pnpm start`.

---

## Environment variables

Set these in `.env.local` for development and in Vercel for deployments. `.env.example` has the
same list with comments. **Never commit real values.**

| Variable | Required | Scope | Purpose |
|---|---|---|---|
| `MONGODB_URI` | Yes, in production | Server | Atlas connection string, including the database name, e.g. `…mongodb.net/melophile?retryWrites=true&w=majority`. If unset, the site renders empty or default content. |
| `NEXT_PUBLIC_SITE_URL` | Yes, in production | Public | Canonical origin with no trailing slash (`https://melophilenp.com`). Used for canonical URLs, Open Graph, the sitemap and JSON-LD. On Vercel Preview it falls back to `VERCEL_URL`. |
| `AUTH_SECRET` | Yes, for the admin | Server | 32 or more random characters (`openssl rand -base64 48`) used to sign admin sessions. Rotating it signs everyone out. |
| `ADMIN_EMAIL` | Yes, for the admin | Server | Admin sign-in email (case-insensitive). |
| `ADMIN_PASSWORD` | Yes, for the admin | Server | Admin password. Use a long random value. Changing it signs out every existing session. |
| `TRUSTED_PROXY_HOPS` | Optional | Server | Only for hosting outside Vercel. It is the number of reverse proxies in front of `next start` that append to `X-Forwarded-For` (default `1`). The login throttle and contact rate limit use the address that the outermost trusted proxy saw. Set it to `0` when `next start` is exposed directly. Vercel is detected automatically. |
| `IMAGEKIT_PRIVATE_KEY` | Optional | Server | ImageKit private key, used only by `/api/imagekit/auth` to sign uploads. |
| `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY` | Optional | Public | ImageKit public key. When unset, the admin hides upload and shows only the paste-URL field. |
| `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT` | Optional | Public | e.g. `https://ik.imagekit.io/<your_id>`. A custom domain here is added to `next/image` automatically. |
| `RESEND_API_KEY` | Optional | Server | Enables contact-form notification emails. |
| `CONTACT_TO_EMAIL` | Optional | Server | Team inbox that receives notifications. |
| `CONTACT_FROM_EMAIL` | Optional | Server | Verified Resend sender, e.g. `Melophile <noreply@melophilenp.com>`. |

Email is sent only when all three of `RESEND_API_KEY`, `CONTACT_TO_EMAIL` and
`CONTACT_FROM_EMAIL` are set. Otherwise messages are just saved and shown in `/admin/messages`.

---

## Using the admin

Go to `/admin` and sign in with `ADMIN_EMAIL` and `ADMIN_PASSWORD`. After 8 failed attempts in
15 minutes, sign-in is locked for that IP (per server instance, best effort).

| Section | What you manage |
|---|---|
| **Dashboard** | Live and hidden counts for every section, new messages and quick links. |
| **Articles** | News posts: markdown body with preview, featured image, category, tags, author, publish date, Spotify/YouTube/SoundCloud embeds, related articles and SEO fields. A future publish date schedules the post. **Draft** hides it. |
| **Artists** | Profile, photo and cover, bio, genres, social links, releases (embedded players), photo and video gallery, milestones, related news, the *Featured* flag and sort order. |
| **Services** | Name, image, short description, details (markdown), form link (an external form URL or `/contact?service=<slug>`), order and active flag. |
| **Testimonials** | Quote, name, role, photo, an optional source (label and link), order, active and *Featured* flags. Reorder, feature (★) and show/hide from the list. Featured quotes are shown large at the top of `/testimonials`. |
| **Trending** | The homepage ticker and the `/trending` chart. Link an artist (Artist), an artist's latest release (Song) or an article (Update), or turn on *Override display* to write your own title, image and link. The rank is the position; reorder with the arrows. An optional chart movement (new, up, down, steady) shows an arrow or NEW badge on the chart. |
| **Trending page** / **Testimonials page** | Page settings (also under *Page settings* on each list): live on/off (off = 404 and removed from the menu, sitemap and homepage links), show in the menu and its label, eyebrow, heading and intro, SEO title, description and share image. Trending adds the number of chart entries, the homepage strip length and the type filter; Testimonials adds the homepage carousel length and the closing call to action. Nothing needs saving for the pages to work: without a saved document they use built-in defaults (live, in the menu). |
| **Homepage** | Hero headline (wrap one word in `*asterisks*` to accent it), subcopy, image and buttons, impact stats, and the featured articles and artists in the order you choose. |
| **Contact info** | Email, phone, address, office hours, social links and the map. Paste Google Maps' *Embed a map* `<iframe>` snippet or its URL. |
| **Messages** | The contact-form inbox, with Unread, Read and Archived views, search, and reply by email. Opening a message marks it read. |

Saving or deleting anything updates the public site straight away (on-demand revalidation).
Every public page also refreshes at least hourly. Keyboard shortcut: <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>S</kbd>
saves the current form, and you are warned before leaving a form with unsaved changes.

---

## Deploying to Vercel

### 1. MongoDB Atlas

1. Create a project and cluster. **M0 (free)** is fine to start; upgrade when traffic or storage grows.
2. **Database Access:** create a user dedicated to this app with the built-in role
   *readWrite* **scoped to the `melophile` database only** (Specific Privileges →
   `readWrite@melophile`). Don't use an Atlas admin user.
3. **Network Access:** Vercel functions have no fixed IPs. Either:
   - install the **MongoDB Atlas integration** from the Vercel Marketplace. It connects the
     cluster, handles network access and sets `MONGODB_URI` for you; **or**
   - add `0.0.0.0/0` to the IP access list and rely on the scoped user, a strong password and TLS.
     This is standard for serverless. The URI is server-only and never reaches the browser.
4. Copy the connection string (Drivers → Node.js) and add the database name:
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/melophile?retryWrites=true&w=majority`.
5. **Preview deployments need their own database.** Create a second database, such as
   `melophile_preview` (or a separate cluster), with its own user scoped to it. Use that URI for
   the *Preview* environment so previews can never write to production content. Leaving
   `MONGODB_URI` unset on Preview also works: the site builds and renders with empty content, and
   the admin shows "database not configured".
6. Optional first content: from your machine, run
   `MONGODB_URI="<preview or prod URI>" pnpm seed -- --force` (it **wipes** content collections),
   or add content through `/admin`.

### 2. Vercel project

1. Import the Git repository in Vercel. It detects Next.js; the build command `pnpm build` and
   the install command `pnpm install` are picked up from `packageManager`.
2. **Settings → Environment Variables:** add every variable from the
   [table above](#environment-variables), **separately for Production, Preview and Development**:

   | Variable | Production | Preview | Development |
   |---|---|---|---|
   | `MONGODB_URI` | prod database | **separate** preview database (or unset) | local or dev database |
   | `NEXT_PUBLIC_SITE_URL` | `https://melophilenp.com` | leave unset (falls back to `VERCEL_URL`) | `http://localhost:3000` |
   | `AUTH_SECRET` | unique random value | a *different* random value | any 32+ characters |
   | `ADMIN_EMAIL` / `ADMIN_PASSWORD` | real credentials | test credentials | local credentials |
   | ImageKit keys | prod keys | same keys, or unset | same keys, or unset |
   | Resend keys | set | usually unset, so previews don't email the team | unset |

3. Deploy. `robots.txt` blocks crawlers on Preview deployments automatically (`VERCEL_ENV`).

### 3. ImageKit

1. Create an ImageKit account. Under **Developer options → API keys**, copy the public key, the
   private key and the URL endpoint into the variables above.
2. Optional: set a custom media domain (e.g. `media.melophilenp.com`) in ImageKit and use it as
   `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT`. `next.config.ts` allows that host automatically.
3. Uploads go into folders per section (`/melophile/articles`, `/melophile/artists`, …).

### 4. Resend (contact-form email)

1. Create a Resend account, then **add and verify the `melophilenp.com` domain** by adding the
   DNS records it shows.
2. Create an API key with *Sending access* and set it as `RESEND_API_KEY`.
3. Set `CONTACT_FROM_EMAIL` to an address on the verified domain (e.g.
   `Melophile <noreply@melophilenp.com>`) and `CONTACT_TO_EMAIL` to the team inbox. Replies go
   straight to the sender (`replyTo`).

### 5. Custom domain

1. In Vercel, go to **Settings → Domains** and add `melophilenp.com` and `www.melophilenp.com`.
   Redirect one to the other; the canonical domain should match `NEXT_PUBLIC_SITE_URL`.
2. Point DNS at Vercel: an `A` record for `76.76.21.21` on the apex and a `CNAME` for
   `cname.vercel-dns.com` on `www`, or use Vercel's nameservers. Wait for the SSL certificate
   to be issued.
3. Redeploy after changing `NEXT_PUBLIC_SITE_URL`, because it is inlined at build time.

### 6. Production checklist

- [ ] `pnpm lint` and `pnpm build` are clean (CI or the Vercel build log).
- [ ] All environment variables are set for **Production and Preview**, with a different
      `AUTH_SECRET` for each.
- [ ] Atlas network access works from Vercel: `/news` lists articles and `/admin` loads the
      dashboard counts.
- [ ] The connection singleton is in place (`lib/db.ts`). Check Atlas → Metrics → Connections
      under load; it should stay near `maxPoolSize` per warm instance.
- [ ] Image hosts are allowed: ImageKit is in `remotePatterns`, and uploads render through `/_next/image`.
- [ ] SEO: open `/sitemap.xml` and `/robots.txt`, and check the share image and tags with a card validator.
- [ ] Custom domain attached, SSL issued, and `NEXT_PUBLIC_SITE_URL` set to it.
- [ ] 404 and error pages: `/news/does-not-exist` returns a real **404**.
- [ ] Revalidation: edit an article in `/admin` and the public page updates on the next request.
- [ ] **Preview deployments use a separate database, or none**, never production.
- [ ] Contact form: send a test message, and check it appears in `/admin/messages` and, if configured, the team inbox.
- [ ] Analytics, if required: add `@vercel/analytics` or your provider to `app/layout.tsx`.

---

## Scripts and project layout

| Script | What it does |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm start` | Next.js dev server, production build and production server |
| `pnpm lint` | ESLint (flat config; `next lint` no longer exists in Next 16) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm seed` | Seed sample content. `-- --with-messages` adds inbox messages; `-- --force` allows a remote database. |
| `pnpm db:up` / `pnpm db:down` | Start or stop the local MongoDB container |

```
app/
  (site)/            public pages: home, news, artists, trending, services, testimonials, contact
                     (header and footer layout; the menu comes from getNavLinks())
  admin/             /admin: login, then (protected)/ sections with list, new and [id] edit pages
  api/imagekit/auth  signed upload parameters (admin only)
  sitemap.ts, robots.ts, manifest.ts, opengraph-image.tsx, not-found.tsx, globals.css (tokens)
components/
  ui/  cards/  site/  home/  news/  artists/  services/  contact/   public UI
  admin/                                                           admin kit (forms, inputs, tables)
lib/
  db.ts              cached Mongoose connection
  queries/           public read queries (published only; never throw without a database)
  admin/             auth session, action helpers, admin read queries (lib/admin/queries/*)
  validators/        zod schemas shared by the admin forms and server actions
  revalidate.ts      on-demand revalidation helpers
  site.ts, embeds.ts, images.ts, serialize.ts, utils.ts, constants.ts
models/              Mongoose models (Article, Artist, Service, Testimonial, TrendingItem,
                     HomepageSettings, PageSettings, ContactInfo, ContactMessage)
types/content.ts     serialisable DTOs shared by server and client
proxy.ts             optimistic /admin gate (Next 16 "proxy", formerly middleware)
scripts/seed.ts      sample content
docs/                design.md (stack brief), requirements.md, visual-design.md, admin-kit.md
```
