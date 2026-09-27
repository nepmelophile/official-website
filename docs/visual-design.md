# Melophile — Visual Design System

> Source of truth for the look of melophilenp.com. Every token below is mirrored **with identical
> values** in `app/globals.css` (`@theme` blocks). If you change one, change both.

## 1. Direction

**"Night-set editorial."** Melophile should feel like a late-night Kathmandu gig poster crossed
with a print music magazine: a deep, cool near-black page with a faint violet cast, soft
off-white type, and the client's two brand colours: **orchid magenta** (primary) and **electric
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
   links, key numbers (`accent`, `orchid-300`). Its lighter `highlight` tint marks the italic
   heading word and metadata (categories, ranks, counters). Cobalt is the supporting colour:
   listen/play controls, the cobalt fill button, the second glow, blue small text via
   `secondary-soft`. Never put orchid text on a cobalt fill or vice-versa.
3. **Asymmetry over symmetry.** 12-column grid; prefer 7/5, 8/4 and offset splits over 6/6.
4. **Texture, not decoration.** Grain overlay + soft radial glow, thin hairlines, mono metadata.
   The brand gradient (orchid → cobalt) is the only gradient, and it is reserved for a few
   signature moments (§2.4). No stock gradients, no glassmorphism, no emoji.
5. **Dark only** for the public site (no light theme). Admin uses the same palette, calmer.

## 2. Color tokens

Tailwind v4 exposes each as `bg-*`, `text-*`, `border-*`, `ring-*`, `fill-*` etc.
(e.g. `--color-ink-900` → `bg-ink-900`; `--color-fg-muted` → `text-fg-muted`).
Components should use the **semantic aliases** (§2.2). Raw scale steps are for tints the
aliases don't cover (tinted backgrounds, borders, hover text).

### 2.1 Raw palette

**Ink (neutrals).** A cool, slightly violet-tinted near-black ramp (OKLCH hue ≈ 292°, chroma
0.008–0.024), at the same lightness steps as the original warm ramp so contrast is unchanged.

| Token | Hex | Notes |
|---|---|---|
| `--color-ink-950` | `#0A090F` | Page background (cool near-black) |
| `--color-ink-900` | `#121117` | Section alt background, admin sidebar |
| `--color-ink-850` | `#18161E` | Cards / surfaces |
| `--color-ink-800` | `#201E28` | Raised surfaces, inputs |
| `--color-ink-700` | `#2B2934` | Hairline borders |
| `--color-ink-600` | `#3B3946` | Strong borders, dividers on hover |
| `--color-ink-500` | `#585665` | Disabled text, placeholder (decorative only) |
| `--color-ink-400` | `#8E8C9C` | Subtle text |
| `--color-ink-300` | `#A8A5B5` | Muted text |
| `--color-ink-200` | `#CAC9D6` | Secondary text |
| `--color-ink-100` | `#E3E2EB` | Near-paper |
| `--color-paper` | `#F0EFF5` | Primary text (cool off-white) |

**Orchid (primary).** Built around the brand `#DD44DD` at 500 (OKLCH hue 328°).

| Token | Hex | Notes |
|---|---|---|
| `--color-orchid-50` | `#FFF2FE` | Lightest tint (light contexts only) |
| `--color-orchid-100` | `#FEE3FD` | |
| `--color-orchid-200` | `#FECBFB` | |
| `--color-orchid-300` | `#F3A1F0` | Link / hover text on dark (any size) |
| `--color-orchid-400` | `#E46FE3` | = `highlight` and `accent-hover`; icons, active-chip dot |
| `--color-orchid-500` | `#DD44DD` | **Brand primary** (= `accent`): fills, dots, bars, borders |
| `--color-orchid-600` | `#BA32BA` | Link colour on white (email template) |
| `--color-orchid-700` | `#932694` | Dark borders, resting underline decoration |
| `--color-orchid-800` | `#6C1B6C` | |
| `--color-orchid-900` | `#431242` | Tinted background (active chips/badges, drop zones), vinyl label |
| `--color-orchid-950` | `#2A0A29` | Deepest tint (category badge wash) |

**Cobalt (secondary).** Built around the brand `#3D4CF5` at 500 (OKLCH hue ≈ 271°; the light
steps lean slightly toward 275° so they stay indigo rather than sky blue).

| Token | Hex | Notes |
|---|---|---|
| `--color-cobalt-50` | `#F0F3FF` | Lightest tint (light contexts only) |
| `--color-cobalt-100` | `#E1E7FE` | |
| `--color-cobalt-200` | `#C6D0FD` | |
| `--color-cobalt-300` | `#A2B2FD` | Prose inline code, soft blue text |
| `--color-cobalt-400` | `#7288FB` | = `secondary-soft`: blue text and icons at any size |
| `--color-cobalt-500` | `#3D4CF5` | **Brand secondary** (= `secondary`): fills, borders, large text only |
| `--color-cobalt-600` | `#313CD2` | = `secondary-hover` |
| `--color-cobalt-700` | `#2732AB` | Pressed fill of secondary |
| `--color-cobalt-800` | `#1D277E` | |
| `--color-cobalt-900` | `#141E55` | |
| `--color-cobalt-950` | `#0C1336` | Tinted background (listen-button hover, scheduled note) |

**Status.**

| Token | Hex | Notes |
|---|---|---|
| `--color-success` | `#4CC38A` | Form success, "published" badge |
| `--color-warning` | `#FBBF24` | Amber. Notices: `border-warning/40 bg-warning/10`, icon/code `text-warning` |
| `--color-danger` | `#FE674C` | Errors, destructive buttons. Orange-red (hue 32°) so it never reads as the magenta accent (hue 328°) |
| `--color-info` | `#4CD1EE` | Neutral info. Cyan (hue 215°), clearly apart from the cobalt brand blue (hue 271°) |

### 2.2 Semantic aliases (use these in components)

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#0A090F` | `bg-bg` — page |
| `--color-bg-alt` | `#121117` | `bg-bg-alt` — alternating sections |
| `--color-surface` | `#18161E` | `bg-surface` — cards |
| `--color-surface-raised` | `#201E28` | `bg-surface-raised` — inputs, popovers |
| `--color-line` | `#2B2934` | `border-line` — hairlines |
| `--color-line-strong` | `#3B3946` | `border-line-strong` |
| `--color-fg` | `#F0EFF5` | `text-fg` — body/headlines |
| `--color-fg-muted` | `#A8A5B5` | `text-fg-muted` — secondary copy |
| `--color-fg-subtle` | `#8E8C9C` | `text-fg-subtle` — metadata, captions |
| `--color-accent` | `#DD44DD` | `bg-accent` — primary CTA fill, active states, live dots, nav bar |
| `--color-accent-hover` | `#E46FE3` | hover fill of accent (lighter; pair with `shadow-glow`). Pressed returns to `accent` |
| `--color-accent-fg` | `#160716` | text on accent / accent-hover (deep plum; white is only 3.5:1 on `#DD44DD`) |
| `--color-secondary` | `#3D4CF5` | `bg-secondary` — cobalt fill button, now-playing toggle, sticker spindle, borders |
| `--color-secondary-hover` | `#313CD2` | hover fill of secondary (darker, so white text gains contrast) |
| `--color-secondary-fg` | `#FFFFFF` | text on secondary / secondary-hover |
| `--color-secondary-soft` | `#7288FB` | `text-secondary-soft` — blue text/icons safe at small sizes on every surface |
| `--color-highlight` | `#E46FE3` | `text-highlight` — italic heading words, categories, ranks, counters; focus ring |
| `--color-highlight-fg` | `#160716` | text on highlight fills (skip link, "featured" pill, record sticker) |

### 2.3 Contrast (computed)

WCAG 2.x ratios, computed from the values above (script: relative luminance per WCAG, alpha
tints composited over their real background). Normal text needs **≥ 4.5:1**; large text
(≥ 24px, or ≥ 19px bold) and non-text UI need **≥ 3:1**.

| Text token | Hex | on `bg` | on `bg-alt` | on `surface` | on `surface-raised` | Use |
|---|---|---:|---:|---:|---:|---|
| `fg` | `#F0EFF5` | 17.35 | 16.43 | 15.67 | 14.38 | Body + headings |
| `fg-muted` | `#A8A5B5` | 8.23 | 7.79 | 7.43 | 6.82 | Secondary copy |
| `fg-subtle` | `#8E8C9C` | 6.03 | 5.71 | 5.44 | 4.99 | Metadata, captions |
| `highlight` | `#E46FE3` | 7.25 | 6.87 | 6.55 | 6.01 | Heading em, categories, ranks |
| `secondary-soft` | `#7288FB` | 6.26 | 5.93 | 5.66 | 5.19 | Small blue text/icons |
| `orchid-300` | `#F3A1F0` | 10.55 | 9.99 | 9.53 | 8.74 | Link / hover text |
| `cobalt-300` | `#A2B2FD` | 9.75 | 9.23 | 8.81 | 8.08 | Prose inline code |
| `accent` | `#DD44DD` | 5.61 | 5.32 | 5.07 | 4.65 | Passes everywhere, thin margin on raised: prefer `highlight`/`orchid-300` for small text |
| `success` | `#4CC38A` | 8.95 | 8.48 | 8.09 | 7.42 | Status |
| `warning` | `#FBBF24` | 11.88 | 11.25 | 10.73 | 9.85 | Status |
| `danger` | `#FE674C` | 6.86 | 6.49 | 6.19 | 5.68 | Errors |
| `info` | `#4CD1EE` | 11.01 | 10.43 | 9.95 | 9.13 | Status |
| `secondary` / `cobalt-500` | `#3D4CF5` | 3.35 | 3.18 | 3.03 | 2.78 | **Large/non-text only**, and never as text on `surface-raised` |
| `ink-500` | `#585665` | 2.77 | 2.62 | 2.50 | 2.30 | **Decorative only** (placeholder, disabled, marks) |

| Pair | Foreground | Background | Ratio | Result |
|---|---|---|---:|---|
| `accent-fg` on `accent` | `#160716` | `#DD44DD` | 5.52 | AA |
| `accent-fg` on `accent-hover` | `#160716` | `#E46FE3` | 7.14 | AA |
| `secondary-fg` on `secondary` | `#FFFFFF` | `#3D4CF5` | 5.91 | AA |
| `secondary-fg` on `secondary-hover` | `#FFFFFF` | `#313CD2` | 7.76 | AA |
| `secondary-fg` on `cobalt-700` (pressed) | `#FFFFFF` | `#2732AB` | 9.86 | AA |
| `highlight-fg` on `highlight` | `#160716` | `#E46FE3` | 7.14 | AA |
| `ink-950` on `danger` | `#0A090F` | `#FE674C` | 6.86 | AA |
| `ink-950` on `success` | `#0A090F` | `#4CC38A` | 8.95 | AA |
| `orchid-300` on `orchid-900` (active chip/badge) | `#F3A1F0` | `#431242` | 7.95 | AA |
| `highlight` on `orchid-950/40` over `surface` (category badge) | `#E46FE3` | `#1F1122` | 6.61 | AA |
| `highlight` on `orchid-950/40` over `surface-raised` | `#E46FE3` | `#241628` | 6.29 | AA |
| `orchid-300` on `orchid-900/30` over `bg` (admin messages card) | `#F3A1F0` | `#1B0C1E` | 9.99 | AA |
| `fg-subtle` on `orchid-900/15` over `bg` (new-message row) | `#8E8C9C` | `#130A17` | 5.89 | AA |
| `secondary-soft` on `cobalt-950` (listen-button hover) | `#7288FB` | `#0C1336` | 5.71 | AA |
| `secondary-soft` on `cobalt-950/50` over `surface` (scheduled note) | `#7288FB` | `#12152A` | 5.68 | AA |
| `warning` on `warning/10` over `bg` (admin notice) | `#FBBF24` | `#221B11` | 10.20 | AA |
| `fg` on `warning/10` over `surface` | `#F0EFF5` | `#2F271F` | 12.84 | AA |
| `fg-subtle` on `.bg-glow` orchid peak (16% over `bg`) | `#8E8C9C` | `#2C1230` | 5.16 | AA |
| `fg-subtle` on `.bg-glow` cobalt peak (20% over `bg`) | `#8E8C9C` | `#14163D` | 5.27 | AA |
| `highlight` on `ink-950/85` over a white photo (worst case) | `#E46FE3` | `#2F2E33` | 4.93 | AA |
| Gradient start `orchid-500` on `bg` | `#DD44DD` | `#0A090F` | 5.61 | AA |
| Gradient midpoint on `bg` | `#8D48E9` | `#0A090F` | 4.00 | Large only |
| Gradient end `cobalt-500` on `bg` | `#3D4CF5` | `#0A090F` | 3.35 | Large only |
| Gradient end `cobalt-500` on `bg-alt` | `#3D4CF5` | `#121117` | 3.18 | Large only |

**Usage rules**

- Small text may use `fg`, `fg-muted`, `fg-subtle`, `highlight`, `secondary-soft`, `orchid-300`,
  `cobalt-300`, `accent` and the status colours. Nothing else.
- **Raw `cobalt-500` / `secondary` is never used for small text** (3.35:1 on `bg`). As large text
  it is fine on `bg`, `bg-alt` and `surface`, and never on `surface-raised` (2.78:1). For blue
  text use `secondary-soft`.
- Text on `accent`/`accent-hover`/`highlight` fills is always the deep plum `accent-fg` /
  `highlight-fg`, **never white** (3.5:1). Text on `secondary` fills is `secondary-fg` (white).
- The pressed state of orchid fills stays on `accent`: `orchid-600` and darker drop below 4.5:1
  with the dark foreground. Cobalt fills press to `cobalt-700`.
- Coloured text on a photo needs a scrim of `bg-ink-950/85` or darker (the highlight tint drops
  to 2.8:1 on `/70` over a white photo).
- `ink-500` (≤ 2.8:1) is for disabled/placeholder/decorative marks only; use `fg-subtle` for
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
- The logo dot: `Wordmark`, `app/icon.svg`, the apple/PWA icons.
- The OG image: wordmark dot and the italic "Nepal" (`backgroundClip: "text"` works in next/og).
- Oversized decorative numerals or glyphs at display size.

Rules:

- **Large text only** (≥ 24px, or ≥ 19px bold). The midpoint is 4.0:1 and the blue end 3.35:1
  on `bg`.
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
| `--shadow-card` | `0 1px 0 0 rgb(255 255 255 / 0.04) inset, 0 24px 48px -28px rgb(0 0 0 / 0.9)` |
| `--shadow-lift` | `0 1px 0 0 rgb(255 255 255 / 0.06) inset, 0 32px 64px -24px rgb(0 0 0 / 0.95)` |
| `--shadow-glow` | `0 0 0 1px rgb(221 68 221 / 0.45), 0 18px 50px -18px rgb(221 68 221 / 0.55)` |
| `--shadow-glow-secondary` | `0 0 0 1px rgb(61 76 245 / 0.5), 0 18px 50px -18px rgb(61 76 245 / 0.6)` |

Shadows are subtle on dark; separation mostly comes from surfaces + hairlines. `shadow-glow`
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
  components do nothing. Class `.no-grain` on `<body>` disables it (admin uses it).
- **Glow:** utility class `.bg-glow` = two soft radial gradients (orchid `#DD44DD` top-left at
  16%, cobalt `#3D4CF5` bottom-right at 20%; blue carries less luminance, so it gets more alpha)
  for heroes and CTA bands. The footer adds one orchid radial at 12%.
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
- **Ghost / link:** `text-fg underline-offset-4 hover:underline decoration-accent`.
- **Cobalt (variant `cobalt`, sparingly, e.g. "Listen"):** `bg-secondary text-secondary-fg
  hover:bg-secondary-hover hover:shadow-glow-secondary active:bg-cobalt-700`.
- **Danger:** `bg-danger text-ink-950 hover:brightness-110`.
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
- Testimonial: large `font-serif italic` quote (`text-2xl md:text-3xl`), `text-accent` opening “
  glyph, avatar 48px round + name + designation mono.
- Coloured labels over photos (artist genre, trending rank) sit on a `bg-ink-950/85` scrim or
  darker (see §2.3).

### Tags / badges
`inline-flex items-center rounded-xs border border-line px-2 py-0.5 font-mono text-[0.6875rem]
uppercase tracking-[0.14em] text-fg-muted`. Active/filter-selected: `border-accent
bg-orchid-900 text-orchid-300` (dot `bg-orchid-400`). Category badge: `border-orchid-900
bg-orchid-950/40 text-highlight`; inline category text uses `text-highlight`.

### Section headers
Top hairline (`border-t border-line pt-6`), row with: mono kicker (`01 — LATEST NEWS` in
`text-fg-subtle`), large `font-display text-display-lg` title (one word may be `font-serif
italic`), and a right-aligned "View all →" link. Stack on mobile.

### Navigation
- Sticky header, `bg-bg/80 backdrop-blur-md border-b border-line`, height 64px (72px ≥ lg).
- Left: wordmark "MELOPHILE" in `font-display font-extrabold tracking-tight` with a
  `bg-brand-gradient` dot. Center/right: links (News, Artists, Services, Contact) `text-sm
  text-fg-muted hover:text-fg`; active link `text-fg` with 2px `bg-accent` underline bar. Right CTA pill
  "Work with us" → /contact.
- Mobile: menu button (≥44px, `aria-expanded`, `aria-controls`) opens a full-screen overlay with
  links at `text-display-md`; focus trapped, Esc closes, body scroll locked.
- Skip link "Skip to content" as first focusable element.

### Trending strip (marquee)
Full-bleed band `bg-bg-alt border-y border-line`, left sticky label `● TRENDING` (pulsing
`bg-accent` dot, mono). Items: rank in `font-mono text-highlight` (`#01`), 40px thumb, title
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
`orchid-300` (underline `accent/60`, hover `orchid-300`), quotes `font-serif italic` with an
`accent` left border, bullets `accent`, inline code `cobalt-300`).

### Listen / now playing
Play toggles are cobalt: idle `border-line-strong text-secondary-soft hover:border-secondary-soft
hover:bg-cobalt-950`; active `border-secondary bg-secondary text-secondary-fg
shadow-glow-secondary`. The "Listen" pill on article heroes uses the `cobalt` button variant.

## 11. Image treatment

- Always `next/image` with explicit `sizes`. Remote hosts: `ik.imagekit.io` (+ custom ImageKit
  endpoint), `picsum.photos` (seed data).
- Rounded `rounded-md` (cards) / `rounded-xl` (hero). `object-cover`.
- Images sit on `bg-surface` while loading; hero images get a bottom
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
  `text-orchid-300 border-accent/40` with a `bg-accent` dot, featured `text-highlight
  border-highlight/40`, manual `text-info border-info/40`, archived `text-fg-subtle`.
- Sidebar active item: `bg-surface-raised text-fg` with a 2px `bg-accent` bar; unread badge
  `bg-accent text-accent-fg`.
- Notices: warnings `border-warning/40 bg-warning/10` with `text-warning` icon/code; info
  `border-info/40 bg-info/10`; the "scheduled" note is cobalt (`border-secondary/50
  bg-cobalt-950/50`, icon `text-secondary-soft`). New/unread rows get `bg-orchid-900/15`.
- Buttons: same pill components at `sm`/`md`; destructive = `bg-danger text-ink-950
  hover:brightness-110`, always confirmed.
- Toast/inline feedback via `role="status"` / `aria-live="polite"`.

## 14. Accessibility checklist

- Visible focus everywhere: global `:focus-visible` = 2px `highlight` (`#E46FE3`) outline, 3px
  offset (7.25:1 on `bg`, 6.01:1 on `surface-raised`); utilities use `ring-highlight`.
- Text contrast: see §2.3. Run the numbers again whenever a colour token changes.
- Color is never the only signal (active nav also bold/underlined; errors have text).
- Hit targets ≥ 44×44px. Landmarks: header, nav, main#main, footer. One `h1` per page.
- Respect reduced motion (section 7). Iframes have `title`.
