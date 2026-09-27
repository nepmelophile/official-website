import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { TRENDING_MOVEMENT_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { TrendingMovement } from "@/types/content";

export interface MovementProps {
  movement?: TrendingMovement;
  /** sm = chart rows and admin lists; lg = the #1 feature (arrow + word). */
  size?: "sm" | "lg";
  className?: string;
}

const WORDS: Record<Exclude<TrendingMovement, "new">, string> = { up: "Up", down: "Down", steady: "Steady" };

/**
 * Chart movement: a "NEW" badge, or an up / down / steady arrow. The arrow's shape carries the
 * meaning (colour is extra), and screen readers get the full label ("Moving up"). Renders
 * nothing when the item has no movement set. Server-safe (used by the admin list too).
 */
export function Movement({ movement, size = "sm", className }: MovementProps) {
  if (!movement) return null;
  const label = TRENDING_MOVEMENT_LABELS[movement];

  if (movement === "new") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-xs bg-secondary font-mono font-semibold uppercase leading-none tracking-[0.14em] text-secondary-fg",
          size === "lg" ? "px-2 py-1 text-xs" : "px-1.5 py-1 text-[0.625rem]",
          className,
        )}
      >
        <span aria-hidden="true">New</span>
        <span className="sr-only">{label}</span>
      </span>
    );
  }

  const Icon = movement === "up" ? ArrowUp : movement === "down" ? ArrowDown : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono uppercase leading-none tracking-[0.14em]",
        movement === "up" ? "text-highlight" : "text-fg-subtle",
        size === "lg" ? "text-xs" : "text-[0.625rem]",
        className,
      )}
    >
      <Icon aria-hidden="true" strokeWidth={2} className={size === "lg" ? "size-4" : "size-3.5"} />
      {size === "lg" ? <span aria-hidden="true">{WORDS[movement]}</span> : null}
      <span className="sr-only">{label}</span>
    </span>
  );
}
