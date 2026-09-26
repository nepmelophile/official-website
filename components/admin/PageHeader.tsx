import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { ButtonLink } from "./Button";

export interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** Shown next to the title in mono, e.g. the total count. */
  count?: number;
  /** Primary "New …" button. */
  action?: { href: string; label: string };
  /** Extra actions rendered before the primary button. */
  children?: ReactNode;
}

/** Admin page title row with an optional "New …" button. Renders the page's <h1>. */
export function PageHeader({ title, description, count, action, children }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
      <div className="min-w-0 space-y-1">
        <h1 className="flex items-baseline gap-3 font-display text-2xl font-bold tracking-tight text-fg">
          {title}
          {count !== undefined ? (
            <span className="font-mono text-xs font-normal tabular-nums text-fg-subtle">{count}</span>
          ) : null}
        </h1>
        {description ? <p className="max-w-prose text-sm text-fg-muted">{description}</p> : null}
      </div>
      {action || children ? (
        <div className="flex flex-wrap items-center gap-2">
          {children}
          {action ? (
            <ButtonLink href={action.href} variant="primary" icon={<Plus aria-hidden className="size-4" strokeWidth={2} />}>
              {action.label}
            </ButtonLink>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
