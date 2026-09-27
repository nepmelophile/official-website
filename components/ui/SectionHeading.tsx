import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SectionHeadingProps {
  /** Mono kicker, e.g. "Latest news". Rendered uppercase. */
  eyebrow?: string;
  /** Optional section number shown before the eyebrow as "01 — LATEST NEWS". */
  index?: number | string;
  /** Heading content. Wrap one word in <em> to get the serif-italic accent. */
  title: ReactNode;
  /** id for the heading (pair with `<Section aria-labelledby>`). */
  id?: string;
  /** Short supporting copy under the title. */
  description?: ReactNode;
  /** Right-aligned "View all" link. */
  action?: { label: string; href: string };
  /** Heading element (default h2). Use h1 for page heroes. */
  as?: "h1" | "h2" | "h3";
  /** Title size: lg = section title (default), xl = page hero, md = sub-section. */
  size?: "md" | "lg" | "xl";
  /** Drop the top hairline (e.g. directly under a hero). */
  hairline?: boolean;
  className?: string;
}

const TITLE_SIZES = {
  md: "text-display-md",
  lg: "text-display-lg",
  xl: "text-display-xl",
} as const;

function pad(index: number | string): string {
  return typeof index === "number" ? String(index).padStart(2, "0") : index;
}

/**
 * Editorial section header: top hairline, mono kicker, huge display title and optional
 * "View all →" link (stacks on mobile). `<em>` inside the title renders serif italic.
 */
export function SectionHeading({
  eyebrow,
  index,
  title,
  id,
  description,
  action,
  as: Heading = "h2",
  size = "lg",
  hairline = true,
  className,
}: SectionHeadingProps) {
  const kicker = [index !== undefined ? pad(index) : null, eyebrow].filter(Boolean).join(" — ");

  return (
    <header
      className={cn(
        "flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-10",
        hairline && "border-t border-line pt-6",
        className,
      )}
    >
      <div className="min-w-0 max-w-4xl">
        {kicker ? (
          <p className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
            <span aria-hidden="true" className="inline-block size-1.5 rounded-pill bg-accent" />
            {kicker}
          </p>
        ) : null}
        <Heading
          id={id}
          className={cn(
            "font-display font-extrabold text-fg [font-stretch:88%]",
            "[&_em]:font-serif [&_em]:font-normal [&_em]:italic [&_em]:tracking-[-0.01em] [&_em]:[font-stretch:100%] [&_em]:text-highlight",
            TITLE_SIZES[size],
          )}
        >
          {title}
        </Heading>
        {description ? (
          <div className="mt-5 max-w-prose text-base/relaxed text-fg-muted md:text-lg/relaxed">{description}</div>
        ) : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="group inline-flex min-h-11 shrink-0 items-center gap-2 self-start font-mono text-xs uppercase tracking-[0.14em] text-fg transition-colors hover:text-link md:self-end"
        >
          <span className="bg-[linear-gradient(currentColor,currentColor)] bg-size-[0%_1px] bg-left-bottom bg-no-repeat pb-1 transition-[background-size] duration-300 ease-out-expo group-hover:bg-size-[100%_1px]">
            {action.label}
          </span>
          <ArrowRight
            size={16}
            strokeWidth={1.75}
            aria-hidden="true"
            className="transition-transform duration-300 ease-out-expo group-hover:translate-x-1"
          />
        </Link>
      ) : null}
    </header>
  );
}
