import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { ButtonLink } from "./Button";

export interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  action?: { href: string; label: string };
  icon?: ReactNode;
}

/** Friendly empty panel for lists with no rows (or no search matches). */
export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-line-strong px-6 py-14 text-center">
      {icon ?? (
        <span aria-hidden className="font-display text-5xl font-extrabold leading-none text-ink-700">
          M<span className="text-orchid-700">.</span>
        </span>
      )}
      <p className="font-display text-lg font-bold text-fg">{title}</p>
      {description ? <p className="max-w-sm text-sm text-fg-muted">{description}</p> : null}
      {action ? (
        <ButtonLink href={action.href} variant="primary" size="sm" className="mt-2" icon={<Plus aria-hidden className="size-4" strokeWidth={2} />}>
          {action.label}
        </ButtonLink>
      ) : null}
    </div>
  );
}
