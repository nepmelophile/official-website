import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { errorClass, hintClass, labelClass } from "./styles";

/** ids for aria-describedby: `${id}-hint` / `${id}-error`. */
export function fieldDescribedBy(id: string, hint?: ReactNode, error?: string): string | undefined {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

export interface FieldProps {
  /** id of the control the <label> points at (also the base for hint/error ids). */
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  /** Shows a subtle "optional" marker next to the label. */
  optional?: boolean;
  /** Visually hide the label (still read by screen readers). */
  hideLabel?: boolean;
  /** Extra element on the right of the label row (e.g. a counter or "Regenerate" button). */
  labelAside?: ReactNode;
  /**
   * "label" (default) renders <label htmlFor={id}>. "group" renders a labelled role="group"
   * (label id `${id}-label`) for controls made of several inputs (repeaters, tag lists).
   */
  as?: "label" | "group";
  className?: string;
  children: ReactNode;
}

/**
 * Label + control + hint + error. Wire the control with
 * `aria-describedby={fieldDescribedBy(id, hint, error)}` and `aria-invalid={!!error}` —
 * the kit's inputs do this for you.
 */
export function Field({
  id,
  label,
  hint,
  error,
  required,
  optional,
  hideLabel,
  labelAside,
  as = "label",
  className,
  children,
}: FieldProps) {
  const labelContent = (
    <>
      {label}
      {required ? (
        <span aria-hidden className="ml-0.5 text-vermilion-300">
          *
        </span>
      ) : null}
      {optional ? <span className="ml-1.5 font-normal text-fg-subtle">(optional)</span> : null}
    </>
  );

  const footer = (
    <>
      {hint ? (
        <p id={`${id}-hint`} className={hintClass}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className={errorClass}>
          {error}
        </p>
      ) : null}
    </>
  );

  if (as === "group") {
    // role="group" + aria-labelledby (rather than <fieldset>/<legend>) so the label row can
    // also hold an interactive `labelAside`.
    return (
      <div
        role="group"
        aria-labelledby={`${id}-label`}
        aria-describedby={fieldDescribedBy(id, hint, error)}
        className={cn("min-w-0 space-y-1.5", className)}
      >
        <div className="flex items-end justify-between gap-3">
          <span id={`${id}-label`} className={cn(labelClass, hideLabel && "sr-only")}>
            {labelContent}
          </span>
          {labelAside}
        </div>
        {children}
        {footer}
      </div>
    );
  }

  return (
    <div className={cn("min-w-0 space-y-1.5", className)}>
      <div className="flex items-end justify-between gap-3">
        <label id={`${id}-label`} htmlFor={id} className={cn(labelClass, hideLabel && "sr-only")}>
          {labelContent}
        </label>
        {labelAside}
      </div>
      {children}
      {footer}
    </div>
  );
}
