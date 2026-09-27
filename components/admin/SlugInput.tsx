"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { Link2, RefreshCw } from "lucide-react";
import { cn, slugify } from "@/lib/utils";
import { Field, fieldDescribedBy } from "./Field";
import { inputClass } from "./styles";

export interface SlugInputProps {
  value: string;
  onChange: (slug: string) => void;
  /** Text the slug is generated from (title / name). */
  source: string;
  label?: ReactNode;
  /** Public URL prefix shown before the input, e.g. "/news/". */
  prefix?: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
}

/**
 * Slug field that follows `source` (via slugify) while it is in auto mode.
 * Auto mode is on when the initial slug is empty or already equals slugify(source), and turns
 * off as soon as the editor types in the slug. "Regenerate" switches it back on.
 * (Changing the slug of a published item breaks old links — the hint says so.)
 */
export function SlugInput({
  value,
  onChange,
  source,
  label = "Slug",
  prefix,
  hint,
  error,
  required = true,
  disabled,
  id,
  className,
}: SlugInputProps) {
  const generatedId = useId();
  const fieldId = id ?? `slug${generatedId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [auto, setAuto] = useState(() => !value || value === slugify(source));

  useEffect(() => {
    if (!auto) return;
    const next = slugify(source);
    if (next !== value) onChange(next);
  }, [auto, source, value, onChange]);

  const derived = slugify(source);
  const fallbackHint =
    auto && !derived && source.trim()
      ? "Couldn't build a slug from this title (non-Latin text) — type one in English."
      : "Lowercase letters, numbers and hyphens. Changing it later breaks existing links.";
  const fullHint = hint ?? fallbackHint;

  return (
    <Field
      id={fieldId}
      label={label}
      hint={fullHint}
      error={error}
      required={required}
      className={className}
      labelAside={
        disabled ? undefined : auto ? (
          <span className="inline-flex items-center gap-1 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-fg-subtle">
            <Link2 aria-hidden className="size-3" strokeWidth={1.75} /> Auto
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setAuto(true)}
            className="inline-flex items-center gap-1 rounded-xs px-1 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-orchid-300 hover:text-fg"
          >
            <RefreshCw aria-hidden className="size-3" strokeWidth={1.75} /> Regenerate
          </button>
        )
      }
    >
      <div className={cn("flex items-stretch", prefix && "rounded-sm")}>
        {prefix ? (
          <span
            aria-hidden
            className="inline-flex shrink-0 items-center rounded-l-sm border border-r-0 border-line bg-bg-alt px-2.5 font-mono text-xs text-fg-subtle"
          >
            {prefix}
          </span>
        ) : null}
        <input
          id={fieldId}
          type="text"
          value={value}
          onChange={(e) => {
            setAuto(false);
            onChange(e.target.value.toLowerCase().replace(/\s+/g, "-"));
          }}
          onBlur={(e) => {
            const clean = slugify(e.target.value);
            if (clean !== e.target.value) onChange(clean);
          }}
          required={required}
          disabled={disabled}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={fieldDescribedBy(fieldId, fullHint, error)}
          className={cn(inputClass, "font-mono text-[0.8125rem]", prefix && "rounded-l-none")}
        />
      </div>
    </Field>
  );
}
