"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface StatCounterProps {
  value: number;
  /** Rendered in the accent colour after the number, e.g. "+", "M", "%". */
  suffix?: string;
  label: string;
  /** Count-up duration in ms (default 1600). */
  durationMs?: number;
  className?: string;
}

function decimalsOf(value: number): number {
  if (Number.isInteger(value)) return 0;
  return Math.min(2, (String(value).split(".")[1] ?? "").length);
}

/**
 * Impact number that counts up the first time it scrolls into view. Server HTML contains the
 * final value (no-JS / SEO safe); reduced-motion users always see the final value. The
 * animated digits are aria-hidden; screen readers get the final value.
 */
export function StatCounter({ value, suffix, label, durationMs = 1600, className }: StatCounterProps) {
  const numberRef = useRef<HTMLSpanElement>(null);
  const decimals = decimalsOf(value);
  const format = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  useEffect(() => {
    const el = numberRef.current;
    if (!el) return;
    const formatter = (n: number) =>
      n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    const final = formatter(value);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      return;
    }

    let frame = 0;
    el.textContent = formatter(0);
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / durationMs);
          const eased = 1 - Math.pow(1 - t, 4);
          const current = Number((value * eased).toFixed(decimals));
          el.textContent = t < 1 ? formatter(current) : final;
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.35 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      el.textContent = final;
    };
  }, [value, decimals, durationMs]);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <p className="font-display text-display-xl font-extrabold text-fg tabular-nums [font-stretch:85%]" aria-hidden="true">
        <span ref={numberRef}>{format(value)}</span>
        {suffix ? <span className="text-accent">{suffix}</span> : null}
      </p>
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-fg-muted">
        <span className="sr-only">
          {format(value)}
          {suffix}{" "}
        </span>
        {label}
      </p>
    </div>
  );
}
