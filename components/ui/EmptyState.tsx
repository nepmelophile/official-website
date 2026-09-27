import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ButtonLink } from "./Button";

export interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  /** Optional call to action (renders a secondary pill button). */
  action?: { label: string; href: string };
  /** Optional decorative icon (rendered aria-hidden). Defaults to a vinyl-groove motif. */
  icon?: ReactNode;
  /** Heading level for the title (default h2). */
  as?: "h2" | "h3" | "p";
  className?: string;
}

function Grooves() {
  return (
    <svg viewBox="0 0 120 120" className="size-24 text-line" fill="none" aria-hidden="true">
      {[56, 46, 38, 30, 22].map((r) => (
        <circle key={r} cx="60" cy="60" r={r} stroke="currentColor" strokeWidth="1.25" />
      ))}
      <circle cx="60" cy="60" r="9" className="fill-accent" />
      <circle cx="60" cy="60" r="2.5" className="fill-bg" />
    </svg>
  );
}

/** Friendly placeholder when a list is empty or the database is unavailable. */
export function EmptyState({ title, description, action, icon, as: Title = "h2", className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-lg border border-dashed border-line-strong bg-surface/40 px-6 py-14 text-center md:py-20",
        className,
      )}
    >
      <div aria-hidden="true" className="mb-6">
        {icon ?? <Grooves />}
      </div>
      <Title className="font-display text-display-sm font-bold text-fg">{title}</Title>
      {description ? <div className="mt-3 max-w-md text-fg-muted">{description}</div> : null}
      {action ? (
        <ButtonLink href={action.href} variant="secondary" size="md" icon="arrow-right" className="mt-8">
          {action.label}
        </ButtonLink>
      ) : null}
    </div>
  );
}
