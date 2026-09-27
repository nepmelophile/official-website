import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/** Public form control styling (docs/visual-design.md → Forms). */
export const CONTROL =
  "block min-h-12 w-full rounded-sm border border-line bg-surface-raised px-4 py-3 text-base text-fg outline-hidden transition-[border-color,box-shadow] duration-150 placeholder:text-fg-faint hover:border-line-strong focus:border-accent focus:ring-2 focus:ring-accent/30 aria-invalid:border-danger aria-invalid:focus:ring-danger/30";

export interface ControlA11yProps {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
}

export interface FieldProps {
  id: string;
  label: string;
  /** Shows an "Optional" tag next to the label. */
  optional?: boolean;
  hint?: ReactNode;
  error?: string;
  /** Extra content on the label row's right (e.g. a character counter). */
  aside?: ReactNode;
  className?: string;
  /** Renders the control; spread the a11y props onto it. */
  children: (a11y: ControlA11yProps) => ReactNode;
}

/**
 * Label above control, hint and error below. The error is linked via `aria-describedby` and
 * the control gets `aria-invalid`, so the message is announced when the field is focused.
 */
export function Field({ id, label, optional = false, hint, error, aside, className, children }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex min-w-0 flex-col", className)}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-fg">
          {label}
          {optional ? (
            <span className="ml-2 font-mono text-[0.6875rem] font-normal uppercase tracking-[0.14em] text-fg-subtle">
              Optional
            </span>
          ) : null}
        </label>
        {aside}
      </div>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {error ? (
        <p id={errorId} className="mt-2 flex items-start gap-1.5 text-sm text-danger">
          <CircleAlert size={16} strokeWidth={1.75} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
      {hint ? (
        <p id={hintId} className="mt-2 text-xs text-fg-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
