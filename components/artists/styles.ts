/** Mono metadata row (dates, kickers, counters). */
export const META = "font-mono text-xs uppercase tracking-[0.14em]";

/** Hover zoom used on gallery thumbnails (the button carries `group`). */
export const IMAGE_ZOOM = "transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]";

/** Round 44px icon button used by the gallery lightbox. */
export const ICON_BUTTON =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-pill border border-line-strong text-fg transition-colors duration-150 hover:border-fg hover:bg-surface disabled:pointer-events-none disabled:opacity-40";

/** Two-digit counter, e.g. 3 → "03". */
export function pad2(value: number): string {
  return String(value).padStart(2, "0");
}
