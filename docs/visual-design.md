# Melophile — Visual Design System

> Source of truth for the look of melophilenp.com. Every token below is mirrored **with identical
> values** in `app/globals.css` (`@theme` blocks). If you change one, change both.

## 1. Direction

**"Night-set editorial."** Melophile should feel like a late-night Kathmandu gig poster crossed
with a print music magazine: a deep, warm near-black page, warm paper-white type, one loud
vermilion accent (the red of the Nepali flag and of sindoor/tika), one marigold accent (the
sayapatri garlands of Tihar). Big, confident display type; asymmetric editorial grids; a
scrolling "ticker" of what's trending; fine film grain over everything so the dark never looks
flat or default.

Principles

1. **Type is the hero.** Headlines are huge, tight, and slightly condensed. Imagery supports.
2. **One accent at a time.** Vermilion is for action and emphasis (CTAs, active states, live
   dots, key numbers). Marigold is for highlights and metadata (categories, ranks, stars).
   Never put vermilion text on marigold or vice-versa.
3. **Asymmetry over symmetry.** 12-column grid; prefer 7/5, 8/4 and offset splits over 6/6.
4. **Texture, not decoration.** Grain overlay + soft radial glow, thin hairlines, mono metadata.
   No stock gradients, no glassmorphism, no emoji.
5. **Dark only** for the public site (no light theme). Admin uses the same palette, calmer.

## 2. Color tokens

Tailwind v4 exposes each as `bg-*`, `text-*`, `border-*`, `ring-*`, `fill-*` etc.
(e.g. `--color-ink-900` → `bg-ink-900`; `--color-fg-muted` → `text-fg-muted`).

### 2.1 Raw palette

| Token | Hex | Notes |
|---|---|---|
| `--color-ink-950` | `#0B0A09` | Page background (warm near-black) |
| `--color-ink-900` | `#131110` | Section alt background, admin sidebar |
| `--color-ink-850` | `#1A1715` | Cards / surfaces |
| `--color-ink-800` | `#221F1C` | Raised surfaces, inputs |
| `--color-ink-700` | `#2E2A26` | Hairline borders |
| `--color-ink-600` | `#403A35` | Strong borders, dividers on hover |
| `--color-ink-500` | `#5E5750` | Disabled text, placeholder |
| `--color-ink-400` | `#948B81` | Subtle text |
| `--color-ink-300` | `#AEA498` | Muted text |
| `--color-ink-200` | `#D3C9BC` | Secondary text |
| `--color-ink-100` | `#EAE2D6` | Near-paper |
| `--color-paper` | `#F5EEE3` | Primary text (warm off-white) |
| `--color-vermilion-300` | `#FF8A7A` | Accent text on dark (small sizes) |
| `--color-vermilion-400` | `#FF5A45` | Hover of primary |
| `--color-vermilion-500` | `#E8391F` | **Brand vermilion** — dots, borders, large display accents |
| `--color-vermilion-600` | `#D4321A` | Button background (= `accent`) |
| `--color-vermilion-700` | `#A82613` | Pressed / dark borders |
| `--color-vermilion-900` | `#3A120B` | Tinted background |
| `--color-marigold-300` | `#FFD27A` | Highlight text |
| `--color-marigold-400` | `#FFBA3B` | **Secondary accent** |
| `--color-marigold-500` | `#F29F05` | Pressed / strong |
| `--color-marigold-900` | `#3A2805` | Tinted background |
| `--color-success` | `#4CC38A` | Form success, "published" badge |
| `--color-warning` | `#FFBA3B` | = marigold-400 |
| `--color-danger` | `#FF5A5F` | Errors, destructive buttons |
| `--color-info` | `#6CB4EE` | Neutral info |

### 2.2 Semantic aliases (use these in components)

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#0B0A09` | `bg-bg` — page |
| `--color-bg-alt` | `#131110` | `bg-bg-alt` — alternating sections |
| `--color-surface` | `#1A1715` | `bg-surface` — cards |
| `--color-surface-raised` | `#221F1C` | `bg-surface-raised` — inputs, popovers |
| `--color-line` | `#2E2A26` | `border-line` — hairlines |
| `--color-line-strong` | `#403A35` | `border-line-strong` |
| `--color-fg` | `#F5EEE3` | `text-fg` — body/headlines |
| `--color-fg-muted` | `#AEA498` | `text-fg-muted` — secondary copy |
| `--color-fg-subtle` | `#948B81` | `text-fg-subtle` — metadata, captions |
| `--color-accent` | `#D4321A` | `bg-accent` — primary CTA fill, active states |
| `--color-accent-hover` | `#BF2D16` | hover/pressed fill of accent (pair with `shadow-glow`) |
| `--color-accent-fg` | `#FFF7F0` | text on accent |
| `--color-highlight` | `#FFBA3B` | `text-highlight` — marigold highlights |
| `--color-highlight-fg` | `#1A1204` | text on marigold |

Contrast (measured, on `#0B0A09`): paper 17.2:1, fg-muted 8.1:1, fg-subtle 5.9:1 (AA body),
vermilion-300 8.6:1 (use for small accent text/links), vermilion-400 6.4:1, vermilion-500 4.7:1,
accent `#D4321A` 4.0:1 (large/bold text ≥ 24px only), marigold-400 11.6:1. On `surface`
(`#1A1715`) fg-subtle is 5.3:1 and on `surface-raised` 4.9:1 (lifted from `#857C73`, which failed
AA inside cards). `ink-500` (≤ 2.8:1) is for disabled/placeholder/decorative marks only — never
for text people need to read; use fg-subtle instead.
Fills: `accent-fg` on `accent` 4.6:1 (AA), on `accent-hover` higher; `highlight-fg` on marigold
10.9:1; `ink-950` on `danger` 6.5:1. **Never put `accent-fg` on vermilion-500/400** (≤ 3.9:1).

## 3. Typography

Loaded with `next/font/google` in `app/layout.tsx`, exposed as CSS variables and mapped in the
theme:

| Role | Family | CSS var (next/font) | Theme token → utility |
|---|---|---|---|
| Display | **Bricolage Grotesque** (variable, `opsz` + `wdth` axes) | `--font-bricolage` | `--font-display` → `font-display` |
| Text | **Hanken Grotesk** (variable) | `--font-hanken` | `--font-sans` → `font-sans` (default body) |
| Editorial accent | **Instrument Serif** 400, normal + italic | `--font-instrument` | `--font-serif` → `font-serif` |
| Metadata | **JetBrains Mono** (variable) | `--font-jetbrains` | `--font-mono` → `font-mono` |

Usage rules

- Headlines: `font-display font-extrabold tracking-tight leading-[0.9]`, optionally
  `[font-stretch:85%]` for condensed poster feel. Uppercase only for ≤ 3-word kickers.
- Pull-quotes, testimonial quotes and one emphasised word in a headline: `font-serif italic`
  (e.g. "The sound of *Nepal*, amplified.").
- Metadata (dates, categories, ranks, counters): `font-mono text-xs uppercase tracking-[0.14em]`.
- Body: `font-sans text-base/relaxed text-fg-muted`, max ~68ch (`max-w-prose`).

### Type scale (fluid; `--text-*` → `text-*`)

| Token | Size | Line height | Tracking | Use |
|---|---|---|---|---|
| `--text-display-2xl` | `clamp(3.5rem, 1.6rem + 8vw, 10rem)` | 0.86 | -0.04em | Landing hero |
| `--text-display-xl` | `clamp(2.75rem, 1.5rem + 5.2vw, 6.5rem)` | 0.9 | -0.035em | Page heroes |
| `--text-display-lg` | `clamp(2.25rem, 1.4rem + 3.4vw, 4.5rem)` | 0.95 | -0.03em | Section titles |
| `--text-display-md` | `clamp(1.75rem, 1.3rem + 1.9vw, 3rem)` | 1.0 | -0.02em | Article titles in cards (lead) |
| `--text-display-sm` | `clamp(1.375rem, 1.15rem + 0.9vw, 2rem)` | 1.1 | -0.015em | Card titles |
| Tailwind defaults `text-xs … text-xl` | unchanged | | | UI & body |

Body base: 1rem / 1.65. Article prose: 1.125rem / 1.75 (`prose-lg` on ≥ md).

## 4. Spacing & layout

- Base spacing unit: Tailwind default `--spacing: 0.25rem` (so `p-4` = 1rem).
- `--spacing-gutter: clamp(1rem, 0.6rem + 2vw, 2.5rem)` → `px-gutter` page side padding.
- `--spacing-section: clamp(4rem, 2.8rem + 5vw, 8.5rem)` → `py-section` vertical rhythm between
  landing sections.
- Containers: `--container-content: 88rem` (`max-w-content`, main grid), `--container-reading:
  44rem` (`max-w-reading`, article reading column), `--container-narrow: 36rem` (`max-w-narrow`,
  forms). Note Tailwind's built-in `max-w-prose` stays `65ch` (a static utility).
- Page wrapper pattern: `mx-auto w-full max-w-content px-gutter`.
- Grid: `grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-x-6 gap-y-10`.

## 5. Radii

| Token | Value | Use |
|---|---|---|
| `--radius-xs` | `2px` | Tags, badges |
| `--radius-sm` | `4px` | Inputs, small buttons |
| `--radius-md` | `8px` | Cards, images |
| `--radius-lg` | `14px` | Feature cards, modals |
| `--radius-xl` | `24px` | Hero media, big panels |
| `--radius-pill` | `9999px` | Pills, avatar, CTA buttons |

Editorial feel = mostly small radii. Buttons are pills; cards are `rounded-md`.

## 6. Shadows & glows

| Token | Value |
|---|---|
| `--shadow-card` | `0 1px 0 0 rgb(255 255 255 / 0.04) inset, 0 24px 48px -28px rgb(0 0 0 / 0.9)` |
| `--shadow-lift` | `0 1px 0 0 rgb(255 255 255 / 0.06) inset, 0 32px 64px -24px rgb(0 0 0 / 0.95)` |
| `--shadow-glow` | `0 0 0 1px rgb(232 57 31 / 0.45), 0 18px 50px -18px rgb(232 57 31 / 0.55)` |
| `--shadow-glow-marigold` | `0 0 0 1px rgb(255 186 59 / 0.4), 0 18px 50px -18px rgb(255 186 59 / 0.45)` |

Shadows are subtle on dark; separation mostly comes from surfaces + hairlines.

## 7. Motion

| Token | Value |
|---|---|
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` → `ease-out-expo` |
| `--ease-in-out-quart` | `cubic-bezier(0.76, 0, 0.24, 1)` → `ease-in-out-quart` |
| `--duration-fast` | `150ms` |
| `--duration-base` | `280ms` |
| `--duration-slow` | `600ms` |
| `--animate-marquee` | `marquee 45s linear infinite` → `animate-marquee` |
| `--animate-fade-up` | `fade-up 700ms cubic-bezier(0.16, 1, 0.3, 1) both` → `animate-fade-up` |
| `--animate-pulse-dot` | `pulse-dot 1.8s ease-in-out infinite` → `animate-pulse-dot` (live/trending dot) |

Use Tailwind `duration-150 / duration-300 / duration-700` utilities in markup (they match
fast/base/slow closely) or `duration-(--duration-base)`.

- Hover: images scale to 1.04 over `duration-700 ease-out-expo`; cards lift border to
  `line-strong`; link underlines grow from left (`bg-size` transition).
- Entrance: `animate-fade-up` with staggered `animation-delay` (60–90ms steps), sections only.
- The marquee duplicates its content once and translates `-50%`; pause on hover/focus-within.
- **`prefers-reduced-motion: reduce`** — globals.css disables all animations/transitions
  (duration → 0.01ms) and the marquee becomes a horizontally scrollable, static row. Never
  convey information only through motion.

## 8. Breakpoints

Tailwind v4 defaults plus `xs`:

| Token | Value |
|---|---|
| `--breakpoint-xs` | `30rem` (480px) |
| `sm` | `40rem` (640px) |
| `md` | `48rem` (768px) |
| `lg` | `64rem` (1024px) |
| `xl` | `80rem` (1280px) |
| `2xl` | `96rem` (1536px) |

Mobile-first. Test at 360, 768, 1024, 1440.

## 9. Texture

- **Grain:** `body::before` fixed full-viewport SVG `feTurbulence` noise at `opacity: 0.07`,
  `mix-blend-mode: overlay`, `pointer-events: none`, `z-index: 60`. Defined in globals.css —
  components do nothing. Class `.no-grain` on `<body>` disables it (admin uses it).
- **Glow:** utility class `.bg-glow` = two soft radial gradients (vermilion top-left at 18%,
  marigold bottom-right at 10%) for heroes and CTA bands.
- **Hairlines:** `border-line`; section headers use a full-width top hairline.

## 10. Component patterns

### Buttons (pills)
- **Primary:** `inline-flex items-center gap-2 rounded-pill bg-accent px-6 py-3 font-sans
  text-sm font-semibold text-accent-fg transition hover:bg-accent-hover
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight
  focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-50`. Optional
  trailing `ArrowUpRight` icon that nudges `translate-x-0.5 -translate-y-0.5` on hover.
- **Secondary:** transparent, `border border-line-strong text-fg hover:border-fg`.
- **Ghost / link:** `text-fg underline-offset-4 hover:underline decoration-accent`.
- **Marigold (sparingly, e.g. "Listen"):** `bg-highlight text-highlight-fg`.
- Sizes: `sm` px-4 py-2 text-xs, `md` (default) px-6 py-3 text-sm, `lg` px-8 py-4 text-base.
- Min touch target 44px.

### Cards
- Article card: image (`aspect-[4/3]` or `aspect-[16/10]`, `rounded-md`, overflow hidden, hover
  zoom) → mono meta row (`CATEGORY · 12 SEP 2026` with category in `text-highlight`) → title
  `font-display text-display-sm` → excerpt 2-line clamp `text-fg-muted`. Whole card is one link
  (title link with `after:absolute after:inset-0`), no nested interactive elements.
- Lead/featured card: 7-col image + 5-col text, title `text-display-md`.
- Artist card: portrait `aspect-[4/5]` image with a bottom gradient (`from-ink-950/90`), name
  overlaid in `font-display` bold, genres as mono tags beneath. Grayscale → color on hover
  (`grayscale-[35%] hover:grayscale-0`).
- Service card: `bg-surface border border-line rounded-lg p-6`, big mono index number
  (`01`, `02`) in `text-highlight`, title, description, arrow link.
- Testimonial: large `font-serif italic` quote (`text-2xl md:text-3xl`), vermilion opening “
  glyph, avatar 48px round + name + designation mono.

### Tags / badges
`inline-flex items-center rounded-xs border border-line px-2 py-0.5 font-mono text-[0.6875rem]
uppercase tracking-[0.14em] text-fg-muted`. Active/filter-selected: `border-accent
bg-vermilion-900 text-vermilion-300`. Category tag uses `text-highlight`.

### Section headers
Top hairline (`border-t border-line pt-6`), row with: mono kicker (`01 — LATEST NEWS` in
`text-fg-subtle`), large `font-display text-display-lg` title (one word may be `font-serif
italic`), and a right-aligned "View all →" link. Stack on mobile.

### Navigation
- Sticky header, `bg-bg/80 backdrop-blur-md border-b border-line`, height 64px (72px ≥ lg).
- Left: wordmark "MELOPHILE" in `font-display font-extrabold tracking-tight` with a vermilion
  dot. Center/right: links (News, Artists, Services, Contact) `text-sm text-fg-muted
  hover:text-fg`; active link `text-fg` with 2px vermilion underline bar. Right CTA pill
  "Work with us" → /contact.
- Mobile: menu button (≥44px, `aria-expanded`, `aria-controls`) opens a full-screen overlay with
  links at `text-display-md`; focus trapped, Esc closes, body scroll locked.
- Skip link "Skip to content" as first focusable element.

### Trending strip (marquee)
Full-bleed band `bg-bg-alt border-y border-line`, left sticky label `● TRENDING` (pulsing
vermilion dot, mono). Items: rank in `font-mono text-highlight` (`#01`), 40px thumb, title
`font-display font-semibold`, subtitle `text-fg-subtle`. Separator `✦` or `/` in
`text-ink-600`. Pauses on hover/focus; static scroll under reduced motion.

### Stats (impact)
Huge numbers `font-display text-display-xl font-extrabold` with suffix in `text-accent`, label in
mono uppercase below. 2-col mobile, 4-col desktop, vertical hairlines between.

### Forms (public)
Label `text-sm font-medium text-fg` above input; input `w-full rounded-sm border border-line
bg-surface-raised px-4 py-3 text-fg placeholder:text-ink-500 focus:border-accent
focus:ring-2 focus:ring-accent/30 outline-none`; error text `text-sm text-danger` linked via
`aria-describedby`; `aria-invalid` on invalid fields. Success state replaces the form with a
confirmation panel announced via `role="status"`.

### Embeds
Spotify/YouTube/SoundCloud iframes inside `rounded-md overflow-hidden border border-line
bg-surface`, `loading="lazy"`, descriptive `title`, YouTube in `aspect-video`. Heights come from
`lib/embeds.ts`.

### Markdown prose
`prose prose-invert prose-melophile max-w-reading` (class `.prose-melophile` in globals.css sets
the `--tw-prose-*` colors: body `fg-muted`, headings `fg` in `font-display`, links
`vermilion-300`, quotes `font-serif italic` with vermilion left border, bullets `accent`).

## 11. Image treatment

- Always `next/image` with explicit `sizes`. Remote hosts: `ik.imagekit.io` (+ custom ImageKit
  endpoint), `picsum.photos` (seed data).
- Rounded `rounded-md` (cards) / `rounded-xl` (hero). `object-cover`.
- Subtle warm tint: images sit on `bg-surface`; hero images get a bottom
  `bg-gradient-to-t from-bg via-bg/40 to-transparent` scrim so type overlays stay legible.
- Artist portraits: slight desaturation (`grayscale-[35%]`) → full colour on hover.
- Every image needs meaningful `alt` (MediaRef.alt, falling back to title/name).
- Missing image → a `bg-surface` block with a large faint "M" monogram in `font-display
  text-ink-700` (never a broken image).

## 12. Iconography

`lucide-react`, stroke width 1.75, sizes 16/20/24. Arrows: `ArrowUpRight` for outbound/CTA,
`ArrowRight` for "view all". Social icons: lucide where available, otherwise a mono text label.

## 13. Admin UI

Same tokens, calmer and denser:
- `body.no-grain` (no texture), no glows, no display-size type. Headings `font-display
  text-2xl font-bold`; everything else `font-sans text-sm`.
- Layout: left sidebar `w-60 bg-bg-alt border-r border-line` with nav (Dashboard, Articles,
  Artists, Services, Testimonials, Trending, Homepage, Contact info, Messages, with unread count
  badge in `bg-accent`), main area `bg-bg p-6 lg:p-8`, max width 72rem.
- Tables: `text-sm`, header row `font-mono text-[0.6875rem] uppercase tracking-[0.12em]
  text-fg-subtle`, rows `border-b border-line hover:bg-surface`, 44px min row height.
- Forms: two-column on ≥ lg (main fields 2/3, sidebar with status/publish/image 1/3); inputs as
  public forms but `py-2`; field hint `text-xs text-fg-subtle`.
- Status badges: published `text-success border-success/40`, draft `text-fg-subtle`, new message
  `text-vermilion-300 border-accent/40`, archived `text-fg-subtle`.
- Buttons: same pill components at `sm`/`md`; destructive = `bg-danger text-ink-950`, always
  confirmed.
- Toast/inline feedback via `role="status"` / `aria-live="polite"`.

## 14. Accessibility checklist

- Visible focus everywhere: global `:focus-visible` = 2px marigold outline, 3px offset.
- Color is never the only signal (active nav also bold/underlined; errors have text).
- Hit targets ≥ 44×44px. Landmarks: header, nav, main#main, footer. One `h1` per page.
- Respect reduced motion (section 7). Iframes have `title`.
