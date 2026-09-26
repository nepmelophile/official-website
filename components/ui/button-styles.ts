import { cn } from "@/lib/utils";

export const BUTTON_VARIANTS = {
  primary:
    "bg-accent text-accent-fg hover:bg-accent-hover hover:shadow-glow active:bg-vermilion-700",
  secondary: "border border-line-strong bg-transparent text-fg hover:border-fg hover:bg-surface",
  ghost:
    "rounded-none bg-transparent px-0! text-fg underline decoration-accent decoration-1 underline-offset-[6px] hover:decoration-2 hover:text-paper",
  marigold: "bg-highlight text-highlight-fg hover:bg-marigold-300 hover:shadow-glow-marigold active:bg-marigold-500",
  danger: "bg-danger text-ink-950 hover:brightness-110",
} as const;

export const BUTTON_SIZES = {
  sm: "min-h-9 px-4 py-2 text-xs",
  md: "min-h-11 px-6 py-3 text-sm",
  lg: "min-h-13 px-8 py-4 text-base",
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANTS;
export type ButtonSize = keyof typeof BUTTON_SIZES;

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretch to container width. */
  block?: boolean;
  className?: string;
}

/**
 * Class string for pill buttons. Use it to style non-Button elements (e.g. a <label> or a
 * form submit rendered by another component) consistently.
 */
export function buttonClasses({ variant = "primary", size = "md", block = false, className }: ButtonStyleOptions = {}) {
  return cn(
    "group/button focus-ring-custom inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2 rounded-pill font-sans font-semibold leading-none tracking-[-0.005em] whitespace-nowrap",
    "transition-[background-color,border-color,color,box-shadow,text-decoration-thickness] duration-150 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
    "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
    BUTTON_SIZES[size],
    BUTTON_VARIANTS[variant],
    block && "w-full",
    className,
  );
}
