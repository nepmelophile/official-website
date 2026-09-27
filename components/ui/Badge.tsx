import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TONES = {
  default: "border-line text-fg-muted",
  category: "border-accent-tint bg-accent-tint/20 text-highlight",
  active: "border-accent bg-accent-tint text-link",
  accent: "border-accent/60 text-link",
  success: "border-success/40 text-success",
  muted: "border-line text-fg-subtle",
} as const;

export type BadgeTone = keyof typeof TONES;

const BASE =
  "inline-flex items-center gap-1.5 rounded-xs border px-2 py-0.5 font-mono text-[0.6875rem] leading-5 uppercase tracking-[0.14em] whitespace-nowrap";

export interface BadgeProps {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}

/** Small mono label (category, genre, status). Non-interactive. */
export function Badge({ tone = "default", className, children }: BadgeProps) {
  return <span className={cn(BASE, TONES[tone], className)}>{children}</span>;
}

export interface TagProps extends BadgeProps {
  /** When set, the tag is a link (internal paths use next/link). */
  href?: string;
  /** Marks the tag as the current filter (`aria-current="page"`, active styling). */
  active?: boolean;
}

/**
 * Tag: a Badge that can be a link. Use for article tags and genre links outside cards
 * (cards themselves are single links, so they use Badge).
 */
export function Tag({ href, active = false, tone, className, children }: TagProps) {
  const resolvedTone: BadgeTone = active ? "active" : (tone ?? "default");
  if (!href) return <Badge tone={resolvedTone} className={className}>{children}</Badge>;
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        BASE,
        TONES[resolvedTone],
        "min-h-8 px-2.5 transition-colors duration-150 hover:border-line-strong hover:text-fg",
        active && "hover:border-accent hover:text-link",
        className,
      )}
    >
      {children}
    </Link>
  );
}
