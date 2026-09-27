import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface WordmarkProps {
  className?: string;
  /** Visual size: sm (header) or lg (footer). */
  size?: "sm" | "lg";
  /** Render as a link to "/" (default true). */
  asLink?: boolean;
}

/** "MELOPHILE●" wordmark with a brand-gradient (orchid → cobalt) dot. */
export function Wordmark({ className, size = "sm", asLink = true }: WordmarkProps) {
  const mark = (
    <span
      className={cn(
        "inline-flex items-baseline font-display leading-none font-extrabold tracking-[-0.03em] text-fg uppercase [font-stretch:85%]",
        size === "sm" ? "text-[1.375rem]" : "text-display-xl",
      )}
    >
      {SITE_NAME}
      <span
        aria-hidden="true"
        className={cn(
          "inline-block rounded-pill bg-brand-gradient",
          size === "sm" ? "ml-0.5 size-[0.3em]" : "ml-[0.04em] size-[0.18em]",
        )}
      />
    </span>
  );
  if (!asLink) return <span className={className}>{mark}</span>;
  return (
    <Link href="/" className={cn("inline-flex min-h-11 items-center", className)} aria-label={`${SITE_NAME} — home`}>
      {mark}
    </Link>
  );
}
