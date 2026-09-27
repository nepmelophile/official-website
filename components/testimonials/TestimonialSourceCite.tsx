import { ArrowUpRight } from "lucide-react";
import { META } from "@/components/cards/card-styles";
import { cn } from "@/lib/utils";
import type { TestimonialSource } from "@/types/content";

export interface TestimonialSourceCiteProps {
  source?: TestimonialSource;
  className?: string;
}

/** "Via Instagram ↗": where the quote was first published, linked when there is a URL. */
export function TestimonialSourceCite({ source, className }: TestimonialSourceCiteProps) {
  if (!source?.label) return null;
  return (
    <cite className={cn(META, "block text-[0.6875rem] not-italic text-fg-subtle", className)}>
      <span aria-hidden="true">Via </span>
      <span className="sr-only">Source: </span>
      {source.url ? (
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-6 items-center gap-1 text-fg-muted underline decoration-line-strong underline-offset-4 transition-colors duration-150 hover:text-fg hover:decoration-accent"
        >
          {source.label}
          <ArrowUpRight size={12} strokeWidth={1.75} aria-hidden="true" />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ) : (
        <span className="text-fg-muted">{source.label}</span>
      )}
    </cite>
  );
}
