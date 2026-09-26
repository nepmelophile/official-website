# Melophile Website — Tech Stack & Production Deployment (Next.js + MongoDB Atlas → Vercel)

Companion docs: `requirements.md` (page-by-page scope), `design.md` (visual system). This file
covers the technical stack and what "production-ready on Vercel" means for this project.

## 1. Stack

- **Framework:** Next.js, App Router, TypeScript
- **Database:** MongoDB Atlas
- **Data access:** Mongoose (schema validation) over the raw driver, unless there's a reason to
  go driver-only
- **Hosting:** Vercel
- **Styling:** carry the design tokens from `design.md` (colors, type scale, spacing) as CSS
  variables or a Tailwind theme — either is fine, keep the token values identical

## 2. Suggested Project Structure

```
app/
  page.tsx                 → Landing page
  news/page.tsx             → News & Updates listing
  news/[slug]/page.tsx       → Individual article
  contact/page.tsx          → Contact Us
  artists/page.tsx          → Artist Portfolio (Phase 2)
  artists/[slug]/page.tsx   → Individual artist (Phase 2)
  services/page.tsx        → Services (Phase 2)
  sitemap.ts, robots.ts     → SEO
lib/
  db.ts                     → Mongo connection (singleton, see §4)
models/
  Article.ts, Artist.ts, Service.ts, Testimonial.ts,
  TrendingItem.ts, HomepageSettings.ts, ContactInfo.ts
```

## 3. Content Model

These map directly to the entities named in `design.md` §9. Sketch of fields — adjust as the
actual schema takes shape, but keep the shape stable so the CMS/admin side and the public
templates agree on it:

- **Article** — title, slug, featuredImage, excerpt, body (rich text/markdown), category,
  publishedAt, embeds (Spotify/YouTube URLs), relatedArticleIds
- **Artist** — name, slug, photo, bio, genre, location, socialLinks, releases (title, embed
  url), media (images/videos), achievements, relatedArticleIds
- **Service** — name, image, description, details, formLink (Google Form or internal route)
- **Testimonial** — name, designation/artistName, image, quote
- **TrendingItem** — type (artist/song/update), refId, rank, manualOverride flag (per the
  brief's "manageable and selectable from the admin/CMS" requirement)
- **HomepageSettings** — heroHeadline, heroSubcopy, impactStats (label + number), featured
  content picks
- **ContactInfo** — email, phone, address, socialLinks

## 4. MongoDB Atlas Setup

- Cluster: M0 (free tier) is fine to start; plan to upgrade if traffic/storage grows
- Create a dedicated database user scoped to this database only — not an admin-level user
- **Network access:** Vercel's serverless functions don't have fixed IPs. Either:
  - Use MongoDB's official Vercel integration (sets `MONGODB_URI` automatically and handles
    access), **or**
  - Allow access from `0.0.0.0/0` in Atlas Network Access, relying on the username/password +
    TLS for security (standard practice for serverless, but the connection string must never be
    exposed client-side)
- Store the connection string only as an environment variable (`MONGODB_URI`) — never commit it

## 5. Connection Handling (serverless-safe)

Serverless functions can spin up many concurrent instances; without care this exhausts Atlas's
connection limit. `lib/db.ts` must cache the connection across invocations (the standard
Next.js + Mongoose pattern: store the connection promise on the Node global object in
development, and reuse it, rather than calling `mongoose.connect()` fresh on every request).
Flag this explicitly to whoever builds it — it's the single most common cause of a Next.js +
MongoDB app falling over in production.

## 6. Environment Variables (set in Vercel, not committed)

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | Atlas connection string |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for SEO/OG tags |
| Email/service key (if used) | For a native contact form (e.g. Resend/SendGrid), if not using a Google Form embed — see `requirements.md` §8 |
| Auth secret (if a custom admin panel is built) | Session/JWT signing |

Set each for Production, Preview, and Development environments in the Vercel project settings.

## 7. Admin / Content Editing — flag before building

The brief requires the internal team to add/edit content (articles, artists, services,
testimonials, trending picks, homepage settings) without developer help. A raw
Next.js + MongoDB stack has **no admin UI out of the box** — someone has to build one, or a
headless CMS/admin product needs to sit in front of the same data. This is a real scope
decision, not a detail:

- **Build a custom `/admin` section** (auth-gated Next.js routes with CRUD forms) if the content
  model is expected to stay simple, **or**
- **Put a headless CMS or admin-panel generator in front of MongoDB** if the team wants a
  polished editing experience without hand-building every form

Confirm which direction before implementation starts — it changes the size of the build
significantly.

## 8. Media Storage

MongoDB Atlas is not a good fit for storing images/video directly. Store media in a dedicated
host (Vercel Blob, Cloudinary, or S3) and keep only the URL/reference in MongoDB documents.
Decide this before building the Artist/Article media fields, since it affects the schema.

## 9. Production Readiness Checklist (Vercel)

- [ ] `next build` runs clean — no type or lint errors
- [ ] All environment variables set in Vercel (Production **and** Preview)
- [ ] Atlas network access confirmed reachable from Vercel (see §4)
- [ ] Connection singleton in place (see §5) — verified under concurrent load, not just locally
- [ ] `next.config` image `remotePatterns`/domains set for wherever media actually lives
- [ ] `generateMetadata` per page, `sitemap.ts`, `robots.ts`, Open Graph tags in place
- [ ] Custom domain (e.g. `melophilenp.com`) attached in Vercel with SSL issued
- [ ] `not-found.tsx` / `error.tsx` boundaries for missing articles/artists
- [ ] Revalidation strategy decided for content pages (ISR interval, or on-demand revalidation
      triggered from the admin/CMS on publish) so new content doesn't need a redeploy
- [ ] Analytics wired, if required
- [ ] Preview deployments don't write to/corrupt production data (use a separate dev database
      or read-only fallback for previews)

## 10. Open Decisions to Confirm Before Building

- Custom admin panel vs. headless CMS layered on Mongo (§7)
- ISR interval vs. on-demand revalidation for published content
- Native contact form (with an email service) vs. Google Form embed — see `requirements.md` §8
- Media host: Vercel Blob, Cloudinary, or S3
