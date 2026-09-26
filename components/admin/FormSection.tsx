import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FormSectionProps {
  title: ReactNode;
  description?: ReactNode;
  /** Right side of the header row (e.g. an "Add" button). */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Titled panel grouping related fields (main column or aside). Renders a labelled <section>. */
export function FormSection({ title, description, actions, children, className }: FormSectionProps) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className={cn("rounded-md border border-line bg-surface", className)}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-3.5">
        <div className="min-w-0">
          <h2 id={headingId} className="font-display text-base font-bold tracking-tight text-fg">
            {title}
          </h2>
          {description ? <p className="mt-0.5 text-xs text-fg-subtle">{description}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </header>
      <div className="space-y-5 p-5">{children}</div>
    </section>
  );
}
