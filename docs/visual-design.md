# Melophile — Visual Design System

> Source of truth for the look of melophilenp.com. Every token below is mirrored **with identical
> values** in `app/globals.css` (`@theme` blocks for the dark defaults, the `@variant light` block
> for the light theme, §15). If you change one, change both.

## 1. Direction

**"Night-set editorial."** Melophile should feel like a late-night Kathmandu gig poster crossed
with a print music magazine: a deep, cool near-black page with a faint violet cast, soft
off-white type (with a matching light "paper" theme, §15), and the client's two brand colours: **orchid magenta** (primary) and **electric
cobalt blue** (secondary). Big, confident display type; asymmetric editorial grids; a scrolling
"ticker" of what's trending; fine film grain over everything so the dark never looks flat or
default.

> **Brand colours.** Primary **`#DD44DD`** and secondary **`#3D4CF5`**, both at 100% opacity,
> come from the client's brand guidelines (received 2026-09-27). They replaced the launch
> palette on that date. `#DD44DD` is `orchid-500` / `accent`; `#3D4CF5` is `cobalt-500` /
> `secondary`. Do not substitute near-matches for either value.

Principles

1. **Type is the hero.** Headlines are huge, tight, and slightly condensed. Imagery supports.
2. **One accent at a time.** Orchid is for action and emphasis: CTAs, active states, live dots,
   links, key numbers (`accent`, `link`). Its `highlight` tint marks the italic
   heading word and metadata (categories, ranks, counters). Cobalt is the supporting colour:
   listen/play controls, the cobalt fill button, the second glow, blue small text via
   `secondary-soft`. Never put orchid text on a cobalt fill or vice-versa.
3. **Asymmetry over symmetry.** 12-column grid; prefer 7/5, 8/4 and offset splits over 6/6.
4. **Texture, not decoration.** Grain overlay + soft radial glow, thin hairlines, mono metadata.
   The brand gradient (orchid → cobalt) is the only gradient, and it is reserved for a few
   signature moments (§2.4). No stock gradients, no glassmorphism, no emoji.
5. **Dark first, light as an equal.** Dark is the default look and the source of the design; a
   light "paper" theme mirrors it (Light / Dark / System, default System, §15). Components use
   semantic tokens only, so both themes come for free. Admin uses the same palette, calmer.

## 2. Color tokens

Tailwind v4 exposes each as `bg-*`, `text-*`, `border-*`, `ring-*`, `fill-*` etc.
(e.g. `--color-ink-900` → `bg-ink-900`; `--color-fg-muted` → `text-fg-muted`).
Components should use the **semantic aliases** (§2.2): they are the only colours that change
with the theme. Raw scale steps (`ink-*`, `orchid-*`, `cobalt-*`, `paper`) are **fixed in both
themes**, so use them only where a colour must not flip: text and scrims on photos, the record
sticker, brand fills (`cobalt-700` pressed state), the OG image and icons (§15.4).

### 2.1 Raw palette

**Ink (neutrals).** A cool, slightly violet-tinted near-black ramp (OKLCH hue ≈ 292°, chroma
0.008–0.024), at the same lightness steps as the original warm ramp so contrast is unchanged.
Components reach these through the semantic aliases; the raw steps are fixed in both themes.

| Token | Hex | Dark-theme alias / fixed use |
|---|---|---|
| `--color-ink-950` | `#0A090F` | = `bg`. Fixed: photo scrims (`bg-ink-950/85`, `from-ink-950/90`), modal backdrops |
| `--color-ink-900` | `#121117` | = `bg-alt` |
| `--color-ink-850` | `#18161E` | = `surface`, `skeleton` |
| `--color-ink-800` | `#201E28` | = `surface-raised` |
| `--color-ink-700` | `#2B2934` | = `line` |
| `--color-ink-600` | `#3B3946` | = `line-strong` |
| `--color-ink-500` | `#585665` | = `fg-faint` |
| `--color-ink-400` | `#8E8C9C` | = `fg-subtle` |
| `--color-ink-300` | `#A8A5B5` | = `fg-muted` |
| `--color-ink-200` | `#CAC9D6` | = `fg-soft`. Fixed: location line on artist-card photos |
| `--color-ink-100` | `#E3E2EB` | Fixed: captions on gallery photos, prose code blocks (dark) |
| `--color-paper` | `#F0EFF5` | = `fg`. Fixed: names and icons on photos |

**Orchid (primary).** Built around the brand `#DD44DD` at 500 (OKLCH hue 328°).

| Token | Hex | Notes |
|---|---|---|
| `--color-orchid-50` | `#FFF2FE` | Lightest tint (light contexts only) |
| `--color-orchid-100` | `#FEE3FD` | |
| `--color-orchid-200` | `#FECBFB` | |
| `--color-orchid-300` | `#F3A1F0` | = `link` (dark) |
| `--color-orchid-400` | `#E46FE3` | = `highlight` (dark) and `accent-hover`. Fixed: labels on photo scrims, record sticker |
| `--color-orchid-500` | `#DD44DD` | **Brand primary** (= `accent`): fills, dots, bars, borders |
| `--color-orchid-600` | `#BA32BA` | Link colour on white (email template) |
| `--color-orchid-700` | `#932694` | Dark borders, resting underline decoration |
| `--color-orchid-800` | `#6C1B6C` | |
| `--color-orchid-900` | `#431242` | = `accent-tint` (dark) |
| `--color-orchid-950` | `#2A0A29` | Deepest tint |

**Cobalt (secondary).** Built around the brand `#3D4CF5` at 500 (OKLCH hue ≈ 271°; the light
steps lean slightly toward 275° so they stay indigo rather than sky blue).

| Token | Hex | Notes |
|---|---|---|
| `--color-cobalt-50` | `#F0F3FF` | Lightest tint (light contexts only) |
| `--color-cobalt-100` | `#E1E7FE` | |
| `--color-cobalt-200` | `#C6D0FD` | |
| `--color-cobalt-300` | `#A2B2FD` | Prose inline code (dark theme) |
| `--color-cobalt-400` | `#7288FB` | = `secondary-soft` (dark) |
| `--color-cobalt-500` | `#3D4CF5` | **Brand secondary** (= `secondary`): fills, borders, large text only |
| `--color-cobalt-600` | `#313CD2` | = `secondary-hover` |
| `--color-cobalt-700` | `#2732AB` | Pressed fill of secondary |
| `--color-cobalt-800` | `#1D277E` | |
| `--color-cobalt-900` | `#141E55` | |
| `--color-cobalt-950` | `#0C1336` | = `secondary-tint` (dark) |

**Status** (dark values; the light theme swaps in darker text-safe variants, §15.2).

| Token | Hex | Notes |
|---|---|---|
| `--color-success` | `#4CC38A` | Form success, "published" badge |
| `--color-warning` | `#FBBF24` | Amber. Notices: `border-warning/40 bg-warning/10`, icon/code `text-warning` |
| `--color-danger` | `#FE674C` | Errors, destructive buttons. Orange-red (hue 32°) so it never reads as the magenta accent (hue 328°) |
| `--color-info` | `#4CD1EE` | Neutral info. Cyan (hue 215°), clearly apart from the cobalt brand blue (hue 271°) |
| `--color-danger-fg` | `#0A090F` | Text on a `danger` fill (destructive buttons); white in light |

### 2.2 Semantic aliases (use these in components)

Values below are the dark theme (the `@theme` defaults). The light values are in §15.2.

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#0A090F` | `bg-bg` — page |
| `--color-bg-alt` | `#121117` | `bg-bg-alt` — alternating sections |
| `--color-surface` | `#18161E` | `bg-surface` — cards |
| `--color-surface-raised` | `#201E28` | `bg-surface-raised` — inputs, popovers, selected segment |
| `--color-skeleton` | `#18161E` | `bg-skeleton` — loading skeletons, image wells and the "M" placeholder (must show against `bg` in both themes) |
| `--color-line` | `#2B2934` | `border-line` — hairlines; also `bg-line` hover/selected fill inside raised surfaces, `text-line` for faint decorative marks (monograms, 404 digits) |
| `--color-line-strong` | `#3B3946` | `border-line-strong`; `text-line-strong` for separators (`/`, `✦`, `·`) |
| `--color-fg` | `#F0EFF5` | `text-fg` — body/headlines |
| `--color-fg-soft` | `#CAC9D6` | `text-fg-soft` — standfirsts and lead paragraphs (between `fg` and `fg-muted`) |
| `--color-fg-muted` | `#A8A5B5` | `text-fg-muted` — secondary copy |
| `--color-fg-subtle` | `#8E8C9C` | `text-fg-subtle` — metadata, captions |
| `--color-fg-faint` | `#585665` | `text-fg-faint` — placeholder, disabled, decorative only (never text people must read) |
| `--color-accent` | `#DD44DD` | `bg-accent` — primary CTA fill, active states, live dots, nav bar |
| `--color-accent-hover` | `#E46FE3` | hover fill of accent (lighter; pair with `shadow-glow`). Pressed returns to `accent` |
| `--color-accent-fg` | `#160716` | text on accent / accent-hover (deep plum; white is only 3.5:1 on `#DD44DD`). Same in both themes |
| `--color-accent-tint` | `#431242` | `bg-accent-tint` — orchid-tinted fill behind `link` text (active chips/badges, news pill); with alpha for washes (`/20` category badge, `/40` selected option and drop zone, `/30` messages card, `/15` new rows); `fill-accent-tint` vinyl label |
| `--color-secondary` | `#3D4CF5` | `bg-secondary` — cobalt fill button, now-playing toggle, sticker spindle, borders |
| `--color-secondary-hover` | `#313CD2` | hover fill of secondary (darker, so white text gains contrast) |
| `--color-secondary-fg` | `#FFFFFF` | text on secondary / secondary-hover |
| `--color-secondary-soft` | `#7288FB` | `text-secondary-soft` — blue text/icons safe at small sizes on every surface |
| `--color-secondary-tint` | `#0C1336` | `bg-secondary-tint` — cobalt-tinted fill behind `secondary-soft` (listen-button hover, `/50` scheduled note) |
| `--color-highlight` | `#E46FE3` | `text-highlight` — italic heading words, categories, ranks, counters, movement "up"; focus ring |
| `--color-highlight-fg` | `#160716` | text on highlight fills (skip link, "featured" pill) |
| `--color-link` | `#F3A1F0` | `text-link` — inline links and hover text (`hover:text-link`), prose links, text on `accent-tint` |

### 2.3 Contrast (computed)

WCAG 2.x ratios for **both themes** are in §15.5, computed from the values in `globals.css`
(relative luminance per WCAG, alpha tints composited over their real background). Normal text
needs **≥ 4.5:1**; large text (≥ 24px, or ≥ 19px bold) and non-text UI need **≥ 3:1**. Every
text token passes 4.5:1 on `bg`, `bg-alt`, `surface` and `surface-raised` in both themes.

**Usage rules** (they hold in both themes)

- Small text may use `fg`, `fg-soft`, `fg-muted`, `fg-subtle`, `highlight`, `link`,
  `secondary-soft` and the status colours. Nothing else. (`accent` also passes on dark, but not
  on paper, so it is not a small-text colour.)
- **`accent` (`#DD44DD`) and `secondary` (`#3D4CF5`) are fills, borders, marks and large text.**
  `accent` is 3.26:1 on the light `bg`; raw `secondary` is 3.35:1 on the dark `bg` and 2.78:1 on
  dark `surface-raised` (never as text there). For small orchid text use `highlight`/`link`; for
  small blue text use `secondary-soft`.
- Text on `accent`/`accent-hover` fills is always the deep plum `accent-fg`, **never white**
  (3.5:1), in both themes. Text on `secondary` fills is `secondary-fg` (white). Text on
  `highlight` fills is `highlight-fg` (plum on dark, white on light). Text on `danger` fills is
  `danger-fg` (near-black on dark, white on light).
- The pressed state of orchid fills stays on `accent`: `orchid-600` and darker drop below 4.5:1
  with the dark foreground. Cobalt fills press to `cobalt-700`.
- Coloured text on a photo sits on a fixed `bg-ink-950/85` scrim (or darker) and uses **fixed**
  colours (`text-orchid-400`, `text-paper`, `text-ink-200`), never `text-highlight`/`text-fg`,
  which flip with the theme. `orchid-400` is 4.93:1 on `/85` over a white photo, and drops to
  2.8:1 on `/70`.
- `fg-faint` (≤ 2.8:1) is for disabled/placeholder/decorative marks only; use `fg-subtle` for
  anything people need to read.
- Status colours are deliberately off-brand: `danger` is orange-red (never magenta), `info` is
  cyan (never cobalt), `warning` is amber.

### 2.4 Brand gradient

`--gradient-brand: linear-gradient(120deg, #dd44dd 0%, #3d4cf5 100%)` (orchid-500 → cobalt-500),
exposed as two utilities in `globals.css`:

- `bg-brand-gradient`: the gradient as a background fill.
- `text-brand-gradient`: the same gradient clipped to text. It also sets
  `padding-inline: 0.08em; margin-inline: -0.08em` (net zero) so italic overhangs are painted,
  keeps selection readable, and falls back to `CanvasText` in forced-colors mode.

Where it is used (signature moments only, at most one or two per page):

- The hero highlight word (`HomeHero`: `[&_em]:text-brand-gradient`).
- The CTA band headline accent (home and services `CtaBand`).
- The logo artwork itself (the note mark's built-in magenta → blue gradient; see §16).
- The OG image: wordmark dot and the italic "Nepal" (`backgroundClip: "text"` works in next/og).
- Oversized decorative numerals or glyphs at display size.

Rules:

- **Large text only** (≥ 24px, or ≥ 19px bold). On the dark `bg` the midpoint is 4.0:1 and the
  blue end 3.35:1; on the light `bg` the orchid start is 3.26:1. The gradient is identical in
  both themes.
- Never behind body text, never as a section-sized background wash, never on buttons (buttons
  are solid `accent` or `secondary`).
- Don't combine `text-brand-gradient` with `px-*`/`mx-*`. On a block-level element add `w-fit`,
  so the gradient spans the text and not the whole line box.
- HTML email has no reliable gradient support: use solid orchid there.

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
| `--shadow-card` | `0 1px 0 0 var(--elevation-card-edge) inset, 0 24px 48px -28px var(--elevation-card-drop)` |
| `--shadow-lift` | `0 1px 0 0 var(--elevation-lift-edge) inset, 0 32px 64px -24px var(--elevation-lift-drop)` |
| `--shadow-glow` | `0 0 0 1px rgb(221 68 221 / 0.45), 0 18px 50px -18px rgb(221 68 221 / 0.55)` |
| `--shadow-glow-secondary` | `0 0 0 1px rgb(61 76 245 / 0.5), 0 18px 50px -18px rgb(61 76 245 / 0.6)` |

Tailwind inlines shadow values into the utility, so the card/lift colours are variables that the
light theme overrides (it cannot override `--shadow-card` itself):

| Variable | Dark | Light |
|---|---|---|
| `--elevation-card-edge` | `rgb(255 255 255 / 0.04)` | `rgb(255 255 255 / 0.7)` |
| `--elevation-card-drop` | `rgb(0 0 0 / 0.9)` | `rgb(22 20 30 / 0.16)` |
| `--elevation-lift-edge` | `rgb(255 255 255 / 0.06)` | `rgb(255 255 255 / 0.8)` |
| `--elevation-lift-drop` | `rgb(0 0 0 / 0.95)` | `rgb(22 20 30 / 0.26)` |

Shadows are subtle on dark; separation mostly comes from surfaces + hairlines. On paper they are
soft ink-tinted drops. `shadow-glow`
(orchid) pairs with `accent`/`highlight` fills, `shadow-glow-secondary` (cobalt) with
`secondary` fills.

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
  components do nothing. Class `.no-grain` on `<body>` disables it (admin uses it). White noise
  in `overlay` vanishes on paper, so the light theme swaps in the same noise in ink
  (`rgb(23 20 31)`) with `mix-blend-mode: multiply` at `opacity: 0.06`.
- **Glow:** utility class `.bg-glow` = two soft radial gradients (orchid `#DD44DD` top-left at
  16%, cobalt `#3D4CF5` bottom-right at 20%; blue carries less luminance, so it gets more alpha)
  for heroes and CTA bands. The alphas are `--glow-orchid-alpha` / `--glow-cobalt-alpha`; the
  light theme uses 12% / 12%. The footer adds one orchid radial at 12% (both themes).
- **Vinyl grooves:** `VinylGrooves` rings in `text-line/70` (≈ `ink-800` on dark, a pencil-grey
  on paper) with a `fill-accent-tint` label and a `fill-bg` spindle hole.
- **Brand gradient:** see §2.4 (signature moments only).
- **Hairlines:** `border-line`; section headers use a full-width top hairline.

## 10. Component patterns

### Buttons (pills)
- **Primary:** `inline-flex items-center gap-2 rounded-pill bg-accent px-6 py-3 font-sans
  text-sm font-semibold text-accent-fg transition hover:bg-accent-hover hover:shadow-glow
  active:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight
  focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-50`. Optional
  trailing `ArrowUpRight` icon that nudges `translate-x-0.5 -translate-y-0.5` on hover. Hover
  lightens (`accent-hover`), press returns to `accent`; text stays deep plum `accent-fg`.
- **Secondary:** transparent, `border border-line-strong text-fg hover:border-fg`.
- **Ghost / link:** `text-fg underline decoration-accent decoration-1 underline-offset-[6px]
  hover:decoration-2`.
- **Cobalt (variant `cobalt`, sparingly, e.g. "Listen"):** `bg-secondary text-secondary-fg
  hover:bg-secondary-hover hover:shadow-glow-secondary active:bg-cobalt-700`.
- **Danger:** `bg-danger text-danger-fg hover:brightness-110`.
- Sizes: `sm` px-4 py-2 text-xs, `md` (default) px-6 py-3 text-sm, `lg` px-8 py-4 text-base.
- Min touch target 44px.

### Cards
- Article card: image (`aspect-[4/3]` or `aspect-[16/10]`, `rounded-md`, overflow hidden, hover
  zoom) → mono meta row (`CATEGORY · 12 SEP 2026` with category in `text-highlight`) → title
  `font-display text-display-sm` → excerpt 2-line clamp `text-fg-muted`. Whole card is one link
  (title link with `after:absolute after:inset-0`), no nested interactive elements.
- Lead/featured card: 7-col image + 5-col text, title `text-display-md`.
- Artist card: portrait `aspect-[4/5]` image with a bottom gradient (`from-ink-950/90`, fixed
  dark), name overlaid in `font-display` bold `text-paper`, genres as mono tags beneath. Grayscale → color on hover
  (`grayscale-[35%] hover:grayscale-0`).
- Service card: `bg-surface border border-line rounded-lg p-6`, big mono index number
  (`01`, `02`) in `text-highlight`, title, description, arrow link.
- Testimonial: large `font-serif italic` quote (`text-2xl md:text-3xl`), `text-accent` opening “
  glyph, avatar 48px round + name + designation mono.
- Coloured labels over photos (artist index, trending rank) sit on a fixed `bg-ink-950/85` scrim
  or darker, in fixed `text-orchid-400` (see §2.3). They look the same in both themes.

### Tags / badges
`inline-flex items-center rounded-xs border border-line px-2 py-0.5 font-mono text-[0.6875rem]
uppercase tracking-[0.14em] text-fg-muted`. Active/filter-selected: `border-accent
bg-accent-tint text-link` (dot `bg-highlight`). Category badge: `border-accent-tint
bg-accent-tint/20 text-highlight`; inline category text uses `text-highlight`.

### Section headers
Top hairline (`border-t border-line pt-6`), row with: mono kicker (`01 — LATEST NEWS` in
`text-fg-subtle`), large `font-display text-display-lg` title (one word may be `font-serif
italic`), and a right-aligned "View all →" link. Stack on mobile.

### Navigation
- Sticky header, `bg-bg/80 backdrop-blur-md border-b border-line`, height 64px (72px ≥ lg).
- Left: wordmark "MELOPHILE" in `font-display font-extrabold tracking-tight` with a
  `bg-brand-gradient` dot. Center/right: links (News, Artists, Services, Contact) `text-sm
  text-fg-muted hover:text-fg`; active link `text-fg` with 2px `bg-accent` underline bar. Right: the
  theme menu button (≥ lg, §15.3) and the CTA pill "Work with us" → /contact.
- Mobile: menu button (≥44px, `aria-expanded`, `aria-controls`) opens a full-screen overlay with
  links at `text-display-md`; focus trapped, Esc closes, body scroll locked. The Light / Dark /
  System switch sits at the bottom of the overlay.
- Skip link "Skip to content" as first focusable element.

### Trending strip (marquee)
Full-bleed band `bg-bg-alt border-y border-line`, left sticky label `● TRENDING` (pulsing
`bg-accent` dot, mono). Items: rank in `font-mono text-highlight` (`#01`), 40px thumb, title
`font-display font-semibold`, subtitle `text-fg-subtle`. Separator `✦` or `/` in
`text-line-strong`. Pauses on hover/focus; static scroll under reduced motion.

### Stats (impact)
Huge numbers `font-display text-display-xl font-extrabold` with suffix in `text-accent`, label in
mono uppercase below. 2-col mobile, 4-col desktop, vertical hairlines between.

### Forms (public)
Label `text-sm font-medium text-fg` above input; input `w-full rounded-sm border border-line
bg-surface-raised px-4 py-3 text-fg placeholder:text-fg-faint focus:border-accent
focus:ring-2 focus:ring-accent/30 outline-none`; error text `text-sm text-danger` linked via
`aria-describedby`; `aria-invalid` on invalid fields. Success state replaces the form with a
confirmation panel announced via `role="status"`.

### Embeds
Spotify/YouTube/SoundCloud iframes inside `rounded-md overflow-hidden border border-line
bg-surface`, `loading="lazy"`, descriptive `title`, YouTube in `aspect-video`. Heights come from
`lib/embeds.ts`. The players keep their own dark look (Spotify `theme=0`, YouTube) in both
themes: inside the rounded frame they read as media objects on paper too. SoundCloud's white
widget uses the orchid `color`.

### Markdown prose
`prose prose-invert prose-melophile max-w-reading` (class `.prose-melophile` in globals.css sets
the `--tw-prose-invert-*` colors to semantic tokens, so prose follows the theme: body
`fg-muted`, lead `fg-soft`, headings `fg` in `font-display`, links `link` (underline
`accent/60`, hover decoration `link`), quotes `font-serif italic` with an `accent` left border,
bullets `accent`, inline code `cobalt-300` on dark / `secondary-soft` on light). The rule is
**unlayered** on purpose: the typography plugin's `.prose` sets the same variables in the
utilities layer, which would beat anything in `@layer components`.

### Listen / now playing
Play toggles are cobalt: idle `border-line-strong text-secondary-soft hover:border-secondary-soft
hover:bg-secondary-tint`; active `border-secondary bg-secondary text-secondary-fg
shadow-glow-secondary`. The "Listen" pill on article heroes uses the `cobalt` button variant.

## 11. Image treatment

- Always `next/image` with explicit `sizes`. Remote hosts: `ik.imagekit.io` (+ custom ImageKit
  endpoint), `picsum.photos` (seed data).
- Rounded `rounded-md` (cards) / `rounded-xl` (hero). `object-cover`.
- Images sit on `bg-skeleton` while loading; hero images with type over them get a bottom
  `bg-linear-to-t from-bg via-bg/40 to-transparent` scrim so the type stays legible (it flips
  with the theme: a darkening fade on dark, a paper fade on light). The home hero photo has no
  type on it, so its fade is dark-only (`light:hidden`): on paper it would read as fog.
- Artist portraits: slight desaturation (`grayscale-[35%]`) → full colour on hover.
- Every image needs meaningful `alt` (MediaRef.alt, falling back to title/name).
- Missing image → a `bg-skeleton` block (soft radial from `surface-raised`) with a large faint "M"
  monogram in `font-display text-line` and a `text-accent-tint` dot (never a broken image).

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
  `text-link border-accent/40` with a `bg-accent` dot, featured `text-highlight
  border-highlight/40`, manual `text-info border-info/40`, archived `text-fg-subtle`.
- Sidebar active item: `bg-surface-raised text-fg` with a 2px `bg-accent` bar; unread badge
  `bg-accent text-accent-fg`. The sidebar footer (and the mobile drawer) has the compact
  Light / Dark / System switch above "View site".
- Notices: warnings `border-warning/40 bg-warning/10` with `text-warning` icon/code; info
  `border-info/40 bg-info/10`; the "scheduled" note is cobalt (`border-secondary/50
  bg-secondary-tint/50`, icon `text-secondary-soft`). New/unread rows get `bg-accent-tint/15`.
  Hover/selected fills inside raised surfaces (menu options, editor tabs, toast close) use
  `bg-line`.
- Buttons: same pill components at `sm`/`md`; destructive = `bg-danger text-danger-fg
  hover:brightness-110`, always confirmed. Modal backdrops stay a fixed ink scrim
  (`bg-ink-950/75`, lighter `light:bg-ink-950/40` on paper).
- Toast/inline feedback via `role="status"` / `aria-live="polite"`.

## 14. Accessibility checklist

- Visible focus everywhere: global `:focus-visible` = 2px `highlight` outline, 3px offset
  (dark `#E46FE3`: 7.25:1 on `bg`, 6.01:1 on `surface-raised`; light `#A12AA2`: 5.75:1 on `bg`,
  6.23:1 on `surface-raised`); utilities use `ring-highlight`.
- Text contrast: see §2.3 and §15.5. Run the numbers again, for both themes, whenever a colour
  token changes.
- Color is never the only signal (active nav also bold/underlined; errors have text).
- Hit targets ≥ 44×44px. Landmarks: header, nav, main#main, footer. One `h1` per page.
- Respect reduced motion (section 7). Iframes have `title`.

## 15. Themes

Three modes: **Light**, **Dark** and **System** (follows `prefers-color-scheme`). The default is
System. Dark is the design's home; the light "paper" theme mirrors it with a violet-tinted
off-white page, deep ink type and the **same brand fills** (`#DD44DD` with plum text, `#3D4CF5`
with white text).

### 15.1 How it works

- **State:** `<html data-theme="light" | "dark" | "system">`. The choice is stored in
  `localStorage["melophile-theme"]` (`"light"` or `"dark"`; no entry = System). Constants and the
  bootstrap script live in `lib/theme.ts`.
- **No flash:** `app/layout.tsx` renders `<script dangerouslySetInnerHTML={{ __html:
  THEME_INIT_SCRIPT }} />` inside `<head>` (the pattern from Next's guide "Preventing flash
  before hydration", `node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md`).
  It runs synchronously while the HTML is parsed, before the first paint, reads the stored mode
  (in a `try`, since storage can be blocked) and sets `data-theme`. `<html>` has
  `suppressHydrationWarning` because that attribute is not in React's markup. Without JS the
  attribute is absent and CSS falls back to System.
- **CSS:** the `@theme static` values in `globals.css` are the dark theme. The light values are
  written once, inside `:root { @variant light { … } }` in `@layer base`, which Tailwind expands
  to both `:root[data-theme="light"]` and `@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) }`. So Dark forced on a light OS stays dark, Light forced on a
  dark OS is light, and System follows the OS live. The same block sets `color-scheme: light`
  (the default `html` rule sets `color-scheme: dark`), so native controls, date pickers, select
  arrows and scrollbars match.
- **Why the overrides work:** every semantic colour in `@theme static` is a literal on `:root`,
  and utilities read it through `var(--color-*)` (opacity modifiers use `color-mix(in oklab,
  var(--color-*) N%, transparent)`). Redefining the variable on `:root` in a later layer flips
  every utility. Nothing uses `@theme inline` for colours (only fonts), which would bake values
  into utilities. Two Tailwind details matter:
  - Shadow utilities are **inlined** (`--tw-shadow: 0 24px 48px -28px var(--tw-shadow-color,
    …)`), so `--shadow-card`/`--shadow-lift` reference `--elevation-*` colour variables that the
    light theme overrides (§6).
  - Opacity modifiers also emit a literal `color-mix(in srgb, #0a090f 80%, …)` fallback for
    browsers without `color-mix(in lab)` (pre-2023). Those browsers see dark values for
    `bg-bg/80`-style classes only.
- **Variants:** `light:` and `dark:` are `@custom-variant`s with the same logic (explicit
  attribute, or the media query unless the other mode is forced). Components should almost never
  need them; they exist for the few theme-specific decorations listed in §15.4. Both skip
  fixed-dark islands.
- **Fixed-dark islands:** `data-theme="dark"` on any element re-declares the dark semantic
  values for its subtree (a `[data-theme="dark"]` block in `globals.css`, written as
  `var(--color-ink-…)` references so it cannot drift). The photo lightbox uses it.
- **Browser chrome:** `viewport.themeColor` has a light (`#F6F5FA`) and a dark (`#0A090F`) entry
  with `prefers-color-scheme` media, and `colorScheme: "dark light"`. A meta tag cannot see the
  stored choice, so a forced mode that differs from the OS keeps the OS-coloured browser bar.
- **Sync:** `<ThemeSync />` (root layout) re-applies the stored mode in a layout effect (React's
  development-only remount resets `<html>` attributes; a no-op in production) and follows
  changes from other tabs via the `storage` event. `app/global-error.tsx`, which replaces the
  whole document, re-applies the stored mode itself.
- **Switching** (`setThemeMode()` in `components/ui/ThemeToggle.tsx`) stores the choice (System
  removes the key), sets the attribute, and briefly disables transitions so the page does not
  animate every colour at once.

### 15.2 Light tokens

Overrides in the `@variant light` block. Everything not listed keeps its dark value, including
the whole raw palette, `accent` `#DD44DD`, `accent-hover` `#E46FE3`, `accent-fg` `#160716`,
`secondary` `#3D4CF5`, `secondary-hover` `#313CD2` and `secondary-fg` `#FFFFFF`.

| Token | Dark | Light | Notes |
|---|---|---|---|
| `--color-bg` | `#0A090F` | `#F6F5FA` | Paper: off-white with the ink ramp's violet cast (hue ≈ 292°) |
| `--color-bg-alt` | `#121117` | `#EEEDF4` | Alternating sections, admin sidebar, footer |
| `--color-surface` | `#18161E` | `#FCFBFE` | Cards |
| `--color-surface-raised` | `#201E28` | `#FFFFFF` | Inputs, popovers, selected segment |
| `--color-skeleton` | `#18161E` | `#E9E7EF` | Darker than paper so skeletons and image wells show |
| `--color-line` | `#2B2934` | `#DDDBE5` | Hairlines, hover fills, faint marks |
| `--color-line-strong` | `#3B3946` | `#C4C1CE` | Strong borders, separators |
| `--color-fg` | `#F0EFF5` | `#16141E` | Deep ink |
| `--color-fg-soft` | `#CAC9D6` | `#383644` | |
| `--color-fg-muted` | `#A8A5B5` | `#52505F` | |
| `--color-fg-subtle` | `#8E8C9C` | `#63616F` | |
| `--color-fg-faint` | `#585665` | `#9E9CA9` | Decorative only (≈ 2.5:1, like dark) |
| `--color-accent-tint` | `#431242` | `#FECBFB` | = `orchid-200` |
| `--color-secondary-soft` | `#7288FB` | `#313CD2` | = `cobalt-600`; also prose inline code |
| `--color-secondary-tint` | `#0C1336` | `#E1E7FE` | = `cobalt-100` |
| `--color-highlight` | `#E46FE3` | `#A12AA2` | Darker orchid (raw `#DD44DD` is only 3.26:1 on paper) |
| `--color-highlight-fg` | `#160716` | `#FFFFFF` | |
| `--color-link` | `#F3A1F0` | `#932694` | = `orchid-700` |
| `--color-success` | `#4CC38A` | `#04673F` | |
| `--color-warning` | `#FBBF24` | `#8A5809` | |
| `--color-danger` | `#FE674C` | `#BE260B` | Still orange-red (hue ≈ 32°) |
| `--color-info` | `#4CD1EE` | `#0B6C80` | Still cyan (hue ≈ 215°) |
| `--color-danger-fg` | `#0A090F` | `#FFFFFF` | |

Also overridden: the `--elevation-*` shadow colours (§6), `--glow-orchid-alpha` /
`--glow-cobalt-alpha` (0.12 / 0.12), the grain (§9) and, in `.prose-melophile`, inline code
(`secondary-soft`) and code-block text (`fg`).

### 15.3 Theme toggle

`components/ui/ThemeToggle.tsx` (client):

- **`ThemeMenu`** — public header, ≥ lg: a 44px round icon button (sun / moon / monitor for the
  current mode) that opens a Light / Dark / System menu. WAI-ARIA menu button: the trigger has
  `aria-haspopup="menu"`, `aria-expanded`, `aria-label="Theme: System. Change theme"`; items are
  `menuitemradio` with `aria-checked` and a check mark. Enter / Space / ↓ open on the current
  mode (↑ on the last), ↑↓ Home End move, Enter / Space choose, Esc closes and returns focus to
  the button, Tab or a click outside closes.
- **`ThemeSwitch`** — mobile menu (bottom, 44px) and admin sidebar footer (compact, 36px): a
  3-way segmented control built from native radios in a `fieldset` (legend "Theme"), so arrow
  keys move and select, Tab leaves the group, and the focus ring shows on the segment
  (`has-[:focus-visible]:ring-highlight`). The mobile menu's focus trap treats the group as one
  tab stop.
- **Hydration:** both read the mode from `<html data-theme>` with `useSyncExternalStore`, whose
  server snapshot is `null`. Server HTML and the first client render therefore agree: the menu
  button shows a neutral sun-moon icon and no radio is checked until hydration, then the real
  state appears. A `MutationObserver` keeps every control in sync.

### 15.4 Stays the same in both themes (on purpose)

- **Text and scrims on photos:** artist-card gradient `from-ink-950/90` with `text-paper` /
  `text-ink-200`, index and rank labels `bg-ink-950/85 text-orchid-400`, gallery captions
  `text-ink-100`, the gallery zoom button. A photo does not change with the theme, so neither
  does the scrim that makes text on it readable.
- **Photo lightbox** (`ArtistGallery`): a `data-theme="dark"` island. Photo viewers are dark by
  convention, and the photo is the content.
- **Record sticker:** a printed object, `orchid-400` with plum type in both themes. Only its
  spindle hole (`fill-bg`) and drop shadow (`light:` softer ink shadow) follow the theme.
- **Embeds:** Spotify (`theme=0`) and YouTube stay dark players; they sit in rounded
  `border-line` frames and read as media objects on paper.
- **Modal backdrops:** a fixed `ink-950` scrim (`/75` dialog, `/70` admin drawer), lighter on
  paper via `light:` (`/40`, `/35`).
- **OG image, favicon, apple and PWA icons, manifest colours:** always dark. The icon is a dark
  rounded square that reads on light and dark browser chrome alike, the OG image is shared
  artwork, and the manifest has no media queries.
- **Brand gradient** (`#DD44DD → #3D4CF5`) and the button fills.
- **Admin branding swatches** preview the logo on fixed `ink-950` and `ink-100`.

Theme-specific tweaks that use the `light:` variant (the only ones): the contact map drops its
dark-mode invert filter (`light:[filter:none]`), the home hero photo drops its fade into the
page (`light:hidden`), the record sticker's softer shadow, and the two modal scrims above.

### 15.5 Contrast (both themes)

WCAG 2.x, computed from `globals.css` (dark values from `@theme`, light values from the
`@variant light` block; alpha tints composited over their real background). Every text token
passes 4.5:1 on all four surfaces in both themes. "AA large / non-text" rows are large text,
icons or UI marks, which need 3:1.

#### Dark theme

| Text token | Hex | on `bg` | on `bg-alt` | on `surface` | on `surface-raised` | Use |
|---|---|---:|---:|---:|---:|---|
| `fg` | `#F0EFF5` | 17.35 | 16.43 | 15.67 | 14.38 | Body + headings |
| `fg-soft` | `#CAC9D6` | 12.12 | 11.48 | 10.95 | 10.05 | Standfirsts, lead paragraphs |
| `fg-muted` | `#A8A5B5` | 8.23 | 7.79 | 7.43 | 6.82 | Secondary copy |
| `fg-subtle` | `#8E8C9C` | 6.03 | 5.71 | 5.44 | 4.99 | Metadata, captions |
| `highlight` | `#E46FE3` | 7.25 | 6.87 | 6.55 | 6.01 | Italic heading words, categories, ranks, focus ring |
| `link` | `#F3A1F0` | 10.55 | 9.99 | 9.53 | 8.74 | Links and hover text |
| `secondary-soft` | `#7288FB` | 6.26 | 5.93 | 5.66 | 5.19 | Small blue text/icons |
| `orchid-300` | `#F3A1F0` | 10.55 | 9.99 | 9.53 | 8.74 | (= `link`) |
| `cobalt-300` | `#A2B2FD` | 9.75 | 9.23 | 8.81 | 8.08 | Prose inline code |
| `accent` | `#DD44DD` | 5.61 | 5.32 | 5.07 | 4.65 | Passes, thin margin on raised: prefer `highlight`/`link` for small text |
| `success` | `#4CC38A` | 8.95 | 8.48 | 8.09 | 7.42 | Status |
| `warning` | `#FBBF24` | 11.88 | 11.25 | 10.73 | 9.85 | Status |
| `danger` | `#FE674C` | 6.86 | 6.49 | 6.19 | 5.68 | Errors |
| `info` | `#4CD1EE` | 11.01 | 10.43 | 9.95 | 9.13 | Status |
| `secondary` | `#3D4CF5` | 3.35 | 3.18 | 3.03 | 2.78 | **Large/non-text only.** Raw `#3D4CF5`: fills, borders, large text |
| `fg-faint` | `#585665` | 2.77 | 2.62 | 2.50 | 2.30 | **Decorative only.** Placeholder, disabled, decorative marks |

| Pair | Foreground | Background | Ratio | Result |
|---|---|---|---:|---|
| `accent-fg` on `accent` (primary button) | `#160716` | `#DD44DD` | 5.52 | AA |
| `accent-fg` on `accent-hover` | `#160716` | `#E46FE3` | 7.14 | AA |
| `secondary-fg` on `secondary` (cobalt button) | `#FFFFFF` | `#3D4CF5` | 5.91 | AA |
| `secondary-fg` on `secondary-hover` | `#FFFFFF` | `#313CD2` | 7.76 | AA |
| `secondary-fg` on `cobalt-700` (pressed) | `#FFFFFF` | `#2732AB` | 9.86 | AA |
| `highlight-fg` on `highlight` (skip link, featured pill) | `#160716` | `#E46FE3` | 7.14 | AA |
| `danger-fg` on `danger` (destructive button) | `#0A090F` | `#FE674C` | 6.86 | AA |
| `link` on `accent-tint` (active chip/badge) | `#F3A1F0` | `#431242` | 7.95 | AA |
| `highlight` on `accent-tint` (icon in the active news pill) | `#E46FE3` | `#431242` | 5.47 | AA |
| `highlight` on `accent-tint/20` over `surface` (category badge) | `#E46FE3` | `#211525` | 6.41 | AA |
| `highlight` on `accent-tint/20` over `bg` (category badge) | `#E46FE3` | `#150B19` | 7.02 | AA |
| `link` on `accent-tint/30` over `bg` (admin messages card) | `#F3A1F0` | `#1B0C1E` | 9.99 | AA |
| `fg-subtle` on `accent-tint/15` over `bg` (new-message row) | `#8E8C9C` | `#130A17` | 5.89 | AA |
| `fg-muted` on `accent-tint/40` over `bg` (selected option) | `#A8A5B5` | `#210D23` | 7.60 | AA |
| `secondary-soft` on `secondary-tint` (listen-button hover) | `#7288FB` | `#0C1336` | 5.71 | AA |
| `secondary-soft` on `secondary-tint/50` over `surface` (scheduled note) | `#7288FB` | `#12152A` | 5.68 | AA |
| `warning` on `warning/10` over `bg` (admin notice) | `#FBBF24` | `#221B11` | 10.20 | AA |
| `fg` on `warning/10` over `surface` | `#F0EFF5` | `#2F271F` | 12.84 | AA |
| `danger` on `danger/10` over `surface` (dialog error) | `#FE674C` | `#2F1E23` | 5.45 | AA |
| `success` on `success/15` over `surface-raised` (status select) | `#4CC38A` | `#273737` | 5.62 | AA |
| `success` on `success/15` over `bg` (contact success icon) | `#4CC38A` | `#142521` | 7.20 | AA |
| `fg-subtle` on `.bg-glow` orchid peak (16% over `bg`) | `#8E8C9C` | `#2C1230` | 5.16 | AA |
| `fg-subtle` on `.bg-glow` cobalt peak (20% over `bg`) | `#8E8C9C` | `#14163D` | 5.27 | AA |
| `highlight` focus ring on `bg` (non-text) | `#E46FE3` | `#0A090F` | 7.25 | AA |
| `highlight` focus ring on `surface-raised` (non-text) | `#E46FE3` | `#201E28` | 6.01 | AA |
| `orchid-400` on `ink-950/85` over a white photo (fixed-dark label) | `#E46FE3` | `#2F2E33` | 4.93 | AA |
| `paper` on `ink-950/70` over a white photo (fixed-dark name, 70% point) | `#F0EFF5` | `#545357` | 6.68 | AA |
| Gradient start `orchid-500` on `bg` | `#DD44DD` | `#0A090F` | 5.61 | AA |
| Gradient midpoint on `bg` | `#8D48E9` | `#0A090F` | 4.00 | AA large / non-text |
| Gradient end `cobalt-500` on `bg` | `#3D4CF5` | `#0A090F` | 3.35 | AA large / non-text |
| Gradient end `cobalt-500` on `bg-alt` | `#3D4CF5` | `#121117` | 3.18 | AA large / non-text |

#### Light theme

| Text token | Hex | on `bg` | on `bg-alt` | on `surface` | on `surface-raised` | Use |
|---|---|---:|---:|---:|---:|---|
| `fg` | `#16141E` | 16.79 | 15.66 | 17.67 | 18.21 | Body + headings |
| `fg-soft` | `#383644` | 10.88 | 10.15 | 11.45 | 11.80 | Standfirsts, lead paragraphs |
| `fg-muted` | `#52505F` | 7.25 | 6.76 | 7.62 | 7.86 | Secondary copy |
| `fg-subtle` | `#63616F` | 5.58 | 5.20 | 5.87 | 6.05 | Metadata, captions |
| `highlight` | `#A12AA2` | 5.75 | 5.36 | 6.05 | 6.23 | Italic heading words, categories, ranks, focus ring |
| `link` | `#932694` | 6.57 | 6.13 | 6.92 | 7.13 | Links and hover text |
| `secondary-soft` | `#313CD2` | 7.15 | 6.67 | 7.52 | 7.76 | Small blue text/icons, prose inline code |
| `accent` | `#DD44DD` | 3.26 | 3.04 | 3.43 | 3.53 | **Large/non-text only.** `#DD44DD` as text: large text, fills and marks only |
| `success` | `#04673F` | 6.42 | 5.98 | 6.75 | 6.96 | Status |
| `warning` | `#8A5809` | 5.56 | 5.19 | 5.85 | 6.03 | Status |
| `danger` | `#BE260B` | 5.58 | 5.20 | 5.87 | 6.05 | Errors |
| `info` | `#0B6C80` | 5.58 | 5.20 | 5.87 | 6.05 | Status |
| `secondary` | `#3D4CF5` | 5.45 | 5.09 | 5.74 | 5.91 | **Large/non-text only.** Raw `#3D4CF5`: fills, borders, large text |
| `fg-faint` | `#9E9CA9` | 2.49 | 2.32 | 2.62 | 2.70 | **Decorative only.** Placeholder, disabled, decorative marks |

| Pair | Foreground | Background | Ratio | Result |
|---|---|---|---:|---|
| `accent-fg` on `accent` (primary button) | `#160716` | `#DD44DD` | 5.52 | AA |
| `accent-fg` on `accent-hover` | `#160716` | `#E46FE3` | 7.14 | AA |
| `secondary-fg` on `secondary` (cobalt button) | `#FFFFFF` | `#3D4CF5` | 5.91 | AA |
| `secondary-fg` on `secondary-hover` | `#FFFFFF` | `#313CD2` | 7.76 | AA |
| `secondary-fg` on `cobalt-700` (pressed) | `#FFFFFF` | `#2732AB` | 9.86 | AA |
| `highlight-fg` on `highlight` (skip link, featured pill) | `#FFFFFF` | `#A12AA2` | 6.23 | AA |
| `danger-fg` on `danger` (destructive button) | `#FFFFFF` | `#BE260B` | 6.05 | AA |
| `link` on `accent-tint` (active chip/badge) | `#932694` | `#FECBFB` | 5.14 | AA |
| `highlight` on `accent-tint` (icon in the active news pill) | `#A12AA2` | `#FECBFB` | 4.50 | AA large / non-text |
| `highlight` on `accent-tint/20` over `surface` (category badge) | `#A12AA2` | `#FCF1FD` | 5.68 | AA |
| `highlight` on `accent-tint/20` over `bg` (category badge) | `#A12AA2` | `#F8EDFA` | 5.49 | AA |
| `link` on `accent-tint/30` over `bg` (admin messages card) | `#932694` | `#F8E8FA` | 6.08 | AA |
| `fg-subtle` on `accent-tint/15` over `bg` (new-message row) | `#63616F` | `#F7EFFA` | 5.38 | AA |
| `fg-muted` on `accent-tint/40` over `bg` (selected option) | `#52505F` | `#F9E4FA` | 6.55 | AA |
| `secondary-soft` on `secondary-tint` (listen-button hover) | `#313CD2` | `#E1E7FE` | 6.30 | AA |
| `secondary-soft` on `secondary-tint/50` over `surface` (scheduled note) | `#313CD2` | `#EFF1FE` | 6.90 | AA |
| `warning` on `warning/10` over `bg` (admin notice) | `#8A5809` | `#EBE5E2` | 4.84 | AA |
| `fg` on `warning/10` over `surface` | `#16141E` | `#F1EBE6` | 15.41 | AA |
| `danger` on `danger/10` over `surface` (dialog error) | `#BE260B` | `#F6E6E6` | 5.01 | AA |
| `success` on `success/15` over `surface-raised` (status select) | `#04673F` | `#D9E8E2` | 5.50 | AA |
| `success` on `success/15` over `bg` (contact success icon) | `#04673F` | `#D2E0DE` | 5.12 | AA |
| `fg-subtle` on `.bg-glow` orchid peak (12% over `bg`) | `#63616F` | `#F3E0F7` | 4.85 | AA |
| `fg-subtle` on `.bg-glow` cobalt peak (12% over `bg`) | `#63616F` | `#E0E1F9` | 4.70 | AA |
| `highlight` focus ring on `bg` (non-text) | `#A12AA2` | `#F6F5FA` | 5.75 | AA |
| `highlight` focus ring on `surface-raised` (non-text) | `#A12AA2` | `#FFFFFF` | 6.23 | AA |
| `orchid-400` on `ink-950/85` over a white photo (fixed-dark label) | `#E46FE3` | `#2F2E33` | 4.93 | AA |
| `paper` on `ink-950/70` over a white photo (fixed-dark name, 70% point) | `#F0EFF5` | `#545357` | 6.68 | AA |
| Gradient start `orchid-500` on `bg` | `#DD44DD` | `#F6F5FA` | 3.26 | AA large / non-text |
| Gradient midpoint on `bg` | `#8D48E9` | `#F6F5FA` | 4.57 | AA |
| Gradient end `cobalt-500` on `bg` | `#3D4CF5` | `#F6F5FA` | 5.45 | AA |
| Gradient end `cobalt-500` on `bg-alt` | `#3D4CF5` | `#EEEDF4` | 5.09 | AA |

## 16. Logo

The client's logo (a magenta → blue gradient bar and note-shaped "M", followed by "ELOPHILE"
lettering) replaces the old text wordmark everywhere. The source file is `public/logo.png`
(1080×1080 with wide transparent margins); the site uses tight crops of it:

| File | Use |
|---|---|
| `public/brand/logo-on-dark.png` (779×196) | Full logo, white lettering, for the dark theme |
| `public/brand/logo-on-light.png` (779×196) | Same artwork with the lettering recoloured to ink `#121117` for the light theme; only colourless pixels changed, the gradient is untouched |
| `public/brand/logo-mark.png` (264×196) | The mark alone (compact spots) |
| `app/icon.png`, `app/apple-icon.png`, `public/brand/icon-{192,512,maskable-512}.png` | Favicon, iOS and PWA icons: the mark on an ink-950 tile (maskable keeps it inside the safe zone) |

- **Theme switching:** `components/site/BrandLogo.tsx` renders both full-logo files and swaps them with
  `block light:hidden` / `hidden light:block`, so the right one is visible on first paint.
- **Editable in the admin:** Admin → Branding stores the three logos (ImageKit URLs) in the
  `sitesettings` singleton; `getBrandAssets()` falls back per file to the bundled files above.
  Header, footer, admin sidebar and sign-in page all read from it.
- **Sizes:** header 30 px tall (36 px from `lg`), footer 56 px (72 px from `md`), admin sidebar 30 px,
  sign-in 44 px. Never stretch it or place the white-lettering file on a light surface.
- The OG image and structured data: the Organization logo points at `logo-on-light.png`.

