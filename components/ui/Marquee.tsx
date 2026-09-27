"use client";

import { Fragment, useCallback, useState, type ReactNode } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MarqueeProps {
  /** Items to scroll. Each is wrapped in an <li>. */
  items: ReactNode[];
  /** Accessible name of the list, e.g. "Trending now". */
  label: string;
  /** Seconds per loop (default 45). Scale with item count for a steady speed. */
  durationSeconds?: number;
  /** Scroll left-to-right instead. */
  reverse?: boolean;
  /** Node between items (default a ✦ in line-strong). Pass null for none. */
  separator?: ReactNode;
  /** Show the pause/play button (default true). WCAG 2.2.2 — keep it on for auto-moving content. */
  showControl?: boolean;
  className?: string;
  /** Classes for each <li>. */
  itemClassName?: string;
}

const DEFAULT_SEPARATOR = (
  <span aria-hidden="true" className="text-line-strong">
    ✦
  </span>
);

/**
 * Infinite CSS marquee. Content is duplicated once (the copy is aria-hidden and its focusables are
 * removed from the tab order — not `inert`, which would also swallow mouse clicks on whichever copy
 * happens to be on screen) and the
 * track translates -50%. Pauses on hover/focus-within and via the pause button; under reduced
 * motion it becomes a static horizontally-scrollable row.
 */
export function Marquee({
  items,
  label,
  durationSeconds = 45,
  reverse = false,
  separator = DEFAULT_SEPARATOR,
  showControl = true,
  className,
  itemClassName,
}: MarqueeProps) {
  const [paused, setPaused] = useState(false);

  // Keep the visual duplicate clickable but out of the keyboard/AT order. Re-applied when the
  // copy's children change (e.g. a Listen button re-rendering).
  const copyRef = useCallback((node: HTMLUListElement | null) => {
    if (!node) return;
    const sync = () => {
      node
        .querySelectorAll<HTMLElement>("a[href], button, input, select, textarea, iframe, [tabindex]")
        .forEach((el) => {
          if (el.getAttribute("tabindex") !== "-1") el.setAttribute("tabindex", "-1");
        });
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(node, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  if (items.length === 0) return null;

  const renderList = (copy: boolean) => (
    <ul
      ref={copy ? copyRef : undefined}
      aria-label={copy ? undefined : label}
      aria-hidden={copy || undefined}
      className={cn("flex shrink-0 items-center gap-8 pr-8 md:gap-10 md:pr-10", copy && "motion-reduce:hidden")}
    >
      {items.map((item, i) => (
        <Fragment key={i}>
          <li className={cn("flex shrink-0 items-center", itemClassName)}>{item}</li>
          {separator !== null ? (
            <li aria-hidden="true" className="flex shrink-0 items-center">
              {separator}
            </li>
          ) : null}
        </Fragment>
      ))}
    </ul>
  );

  return (
    <div className={cn("relative flex items-center", className)}>
      <div
        className={cn(
          "marquee min-w-0 flex-1 overflow-hidden motion-reduce:overflow-x-auto",
          "mask-[linear-gradient(to_right,transparent,black_3rem,black_calc(100%-3rem),transparent)]",
        )}
      >
        <div
          className="marquee-track py-3"
          style={{
            animationDuration: `${durationSeconds}s`,
            animationDirection: reverse ? "reverse" : undefined,
            animationPlayState: paused ? "paused" : undefined,
          }}
        >
          {renderList(false)}
          {renderList(true)}
        </div>
      </div>
      {showControl ? (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
          aria-label={paused ? `Play ${label.toLowerCase()} ticker` : `Pause ${label.toLowerCase()} ticker`}
          className="ml-2 inline-flex size-11 shrink-0 items-center justify-center rounded-pill border border-line text-fg-muted transition-colors duration-150 hover:border-fg hover:text-fg motion-reduce:hidden"
        >
          {paused ? (
            <Play size={16} strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <Pause size={16} strokeWidth={1.75} aria-hidden="true" />
          )}
        </button>
      ) : null}
    </div>
  );
}
