# Melophile — Requirements (page-by-page scope)

Melophile (melophilenp.com) is a Nepali music platform: music news & updates, an artist
portfolio, services for artists, and a way to get in touch. The internal team must be able to
publish and edit **all** content without developer help.

Companion docs: `design.md` (tech stack & deployment brief), `visual-design.md` (visual system).

---

## 1. Locked decisions

| Area | Decision |
|---|---|
| Framework | Next.js 16 App Router, TypeScript, React 19, pnpm. No `src/` dir: `app/`, `lib/`, `models/`, `components/`, `types/` at repo root. |
| Styling | Tailwind CSS v4; tokens as CSS variables in `app/globals.css` (`@theme`), identical to `docs/visual-design.md`. |
| Database | MongoDB Atlas via **Mongoose**. `lib/db.ts` caches the connection promise on `globalThis` (serverless-safe), `bufferCommands: false`, `serverSelectionTimeoutMS: 5000`, `maxPoolSize: 10`. |
| Admin | **Custom `/admin`** (no headless CMS). Single admin via env `ADMIN_EMAIL` + `ADMIN_PASSWORD`; session = JWT signed with `AUTH_SECRET` using `jose`, stored in an httpOnly, secure, sameSite=lax cookie. **Every admin server action and admin API route calls `requireAdmin()` itself** — `proxy.ts` gating alone is not sufficient because server actions are directly invokable. |
| Media | **ImageKit** (`@imagekit/next`). Client-side upload using auth params from auth-gated `/api/imagekit/auth` (`getUploadAuthParams` from `@imagekit/next/server`). Mongo stores only `MediaRef { url, alt?, fileId? }`. The admin image field always offers a "paste image URL" input and falls back to it entirely when ImageKit env vars are missing. |
| Contact form | Native: server action → zod validation → honeypot (`company`) check → save `ContactMessage` → email the team via **Resend** when `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` are all set (otherwise skip email silently; still save). Messages appear in the `/admin` inbox. |
| Revalidation | Content pages `export const revalidate = 3600` (hourly ISR fallback) **and** admin mutations call helpers in `lib/revalidate.ts` (on-demand `revalidatePath`). |
| Resilience | `next build` must succeed with no database (no `MONGODB_URI`, or unreachable). Public queries (`lib/queries/*`) return empty arrays / defaults on failure; `generateStaticParams` returns `[]` on failure (`dynamicParams` stays true). |
| Scope | Phase 2 pages (Artists, Services) are **in scope**. |

---

## 2. Global

- **Header:** wordmark, nav (News, Artists, Services, Contact), "Work with us" CTA; sticky;
  accessible mobile menu. Skip-to-content link.
- **Footer:** short about line, nav, contact email/phone (from ContactInfo), social links
  (from ContactInfo), © year. Contact info edits revalidate the whole layout.
- **SEO:** `buildMetadata()` per page (title, description, canonical, Open Graph, Twitter),
  `app/sitemap.ts` (static routes + published articles + published artists), `app/robots.ts`
  (disallow `/admin` and `/api`), JSON-LD where useful (Article, MusicGroup/Person).
- **Boundaries:** `not-found.tsx` (global + for missing article/artist) and `error.tsx`.
- **Images:** `next/image` everywhere; missing images render a branded placeholder.
- **Accessibility:** WCAG 2.1 AA; keyboard navigable; visible focus; reduced motion respected.
- **Performance:** static/ISR pages, lean DTO queries (no bodies in listings), lazy iframes.

---

## 3. Landing page `/`

Sections in order (all content from the DB, with graceful fallbacks):

1. **Hero** — `HomepageSettings.heroHeadline`, `heroSubcopy`, optional `heroImage`, up to 3
   `heroCtas`. Huge display type, glow texture.
2. **Trending strip** — marquee of `getTrending()` cards (artist / song / update), rank shown,
   links to artist/article or custom href; song items may expose an embed/listen action.
   Hidden when empty.
3. **Impact stats** — `impactStats` (label, number, suffix), 2×2 on mobile, 4-up on desktop.
4. **Latest news** — `getFeaturedArticles()` (homepage picks, else latest): 1 lead card + grid;
   "View all news" → `/news`.
5. **Featured artists** — `getFeaturedArtists()`; portrait cards → `/artists/[slug]`;
   "All artists" → `/artists`.
6. **Services teaser** — first 3–4 `getActiveServices()` with numbered cards → `/services`.
7. **Testimonials** — `getActiveTestimonials()`; quote carousel or grid (no autoplay without
   pause control).
8. **CTA band** — "Have a release coming up? Let's talk." → `/contact`.

---

## 4. News listing `/news`

- Page title + intro. Category filter chips from `getArticleCategories()` ("All" + categories)
  via `?category=<slug>`; active chip has `aria-current`.
- Grid of `ArticleSummary` cards from `getPublishedArticles({ category, page, pageSize: 9 })`.
- Pagination via `?page=N` (prev/next + page numbers, `rel="prev"/"next"`), out-of-range
  pages show an empty state with a link back.
- Empty state when there are no articles (or DB unavailable).
- Metadata: canonical `/news` (filters/pages beyond 1 are `noindex, follow` or canonical to self).

## 5. Article `/news/[slug]`

- `generateStaticParams` from `getAllArticleSlugs()` (returns `[]` on failure).
- `generateMetadata` using `metaTitle`/`metaDescription` fallback to title/excerpt, OG type
  `article`, featured image.
- Layout: category + date + reading time + author; title; featured image; markdown body
  (`react-markdown` + `remark-gfm`, no raw HTML); embeds rendered via `lib/embeds.ts` (Spotify,
  YouTube, SoundCloud; invalid URLs are skipped); tags.
- **Share:** copy link, X, Facebook, WhatsApp (plain share URLs; Web Share API when available).
- **Related:** `getRelatedArticles(article)` (explicit ids, then same category/tags), 3 cards.
- 404 via `notFound()` when missing or unpublished.

## 6. Artists listing `/artists`

- Intro + genre filter chips from `getArtistGenres()` via `?genre=<slug>`.
- Portrait grid of `getArtists({ genre })` (ordered by `order`, then name).
- Empty state.

## 7. Artist detail `/artists/[slug]`

- `generateStaticParams` from `getAllArtistSlugs()`; `generateMetadata` (OG type `profile`).
- Cover image hero, portrait, name, genres, location, social links (`SocialLink[]`).
- Bio (markdown), releases (title, type, date, cover, embed player), media gallery (images in a
  grid with captions — keyboard-accessible lightbox optional; videos as embeds), achievements
  timeline (year, title, description), related news (`relatedArticleIds` → `getArticlesByIds`).
- 404 when missing or draft.

## 8. Services `/services`

- Intro, list of `getActiveServices()`: image, name, description, markdown details, CTA button
  to `formLink` (external URLs open in a new tab with `rel="noopener noreferrer"`; internal
  paths such as `/contact?service=<slug>` prefill the contact form).
- Testimonials section + CTA band.

## 9. Contact `/contact`

- Contact info from `getContactInfo()`: email (mailto), phone (tel), address, office hours,
  social links, optional map iframe (`mapEmbedUrl`).
- Native form (server action): name, email, phone (optional), subject (optional), service
  (select from active services; prefilled from `?service=`), message, hidden honeypot
  `company`. Client + server validation with the shared zod schema
  (`lib/validators/contact-message.ts`), inline field errors, pending state, success panel.
- Honeypot filled → respond with success but do not save or email.
- Basic abuse protection: honeypot + length limits (+ optional per-IP rate limiting).

---

## 10. Admin `/admin`

All routes under `/admin` (except `/admin/login`) require a valid session; `proxy.ts` redirects
unauthenticated requests, and **each server action / API route calls `requireAdmin()`**.
`noindex` everywhere.

- **Login** `/admin/login` — email + password (constant-time comparison), rate-limited
  feedback, sets session cookie (7-day expiry), logout action clears it.
- **Dashboard** `/admin` — counts (published/draft articles, artists, active services,
  new messages), recent messages, quick links.
- **CRUD** (list with search/filter + create + edit + delete with confirmation) for:
  - Articles (status toggle, publish date, category with suggestions, tags, embeds repeater,
    related articles picker, SEO fields, markdown editor with preview)
  - Artists (releases / media / achievements / social links repeaters, featured flag, order)
  - Services (order, active)
  - Testimonials (order, active)
  - Trending items (type, reference picker for artist/article, rank, manual override fields,
    active)
- **Singleton editors:** Homepage settings (hero, CTAs, impact stats, featured article/artist
  pickers) and Contact info.
- **Messages inbox** — list (new/read/archived filter), detail view, mark read/archived,
  delete, reply via `mailto:`.
- **Image upload** — ImageKit upload widget (auth params from `/api/imagekit/auth`, gated by
  `requireAdmin()`), preview, alt text input, and a paste-URL fallback.
- Every successful mutation calls the matching `lib/revalidate.ts` helper.
- Slugs auto-generated from title/name (`slugify`) and editable; uniqueness errors surfaced on
  the slug field.

---

## 11. Content model (contract)

See `models/*.ts`, DTOs in `types/content.ts`, zod input schemas in `lib/validators/*`.

- `MediaRef { url, alt?, fileId? }`, `SocialLink { platform, url }` where platform ∈
  spotify | youtube | instagram | facebook | tiktok | x | apple-music | soundcloud | website.
- **Article**, **Artist**, **Service**, **Testimonial**, **TrendingItem**,
  **HomepageSettings** (singleton `key: 'default'`), **ContactInfo** (singleton),
  **ContactMessage** — fields exactly as in the project brief. Status enums: `draft | published`
  (articles, artists), `active` boolean (services, testimonials, trending), `new | read |
  archived` (messages). Public queries only return published / active items.

## 12. Environment variables

`MONGODB_URI`, `NEXT_PUBLIC_SITE_URL`, `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`,
`IMAGEKIT_PRIVATE_KEY`, `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY`, `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT`,
`RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` — documented in `.env.example`.

## 13. Local development

- `docker compose up -d` (or `pnpm db:up`) → MongoDB 7 on `127.0.0.1:27018`
  (container `melophile-mongo`).
- `cp .env.example .env.local`, then `pnpm seed` for sample content, `pnpm dev`.
- Quality gates: `pnpm typecheck`, `pnpm lint`, `pnpm build` (must pass without a DB).
