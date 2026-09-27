"use client";

import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Field, fieldDescribedBy } from "./Field";

export interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  placeholder?: string;
  /** Suggestions offered via <datalist> (e.g. existing genres). */
  suggestions?: readonly string[];
  maxItems?: number;
  maxLength?: number;
  disabled?: boolean;
  id?: string;
  className?: string;
}

/**
 * string[] editor: type and press Enter or comma to add, Backspace on an empty input removes
 * the last tag. Pasting "a, b, c" adds all three. Case-insensitive de-duplication.
 */
export function TagInput({
  value,
  onChange,
  label = "Tags",
  hint,
  error,
  placeholder = "Type and press Enter",
  suggestions,
  maxItems = 20,
  maxLength = 40,
  disabled,
  id,
  className,
}: TagInputProps) {
  const generatedId = useId();
  const fieldId = id ?? `tags${generatedId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [draft, setDraft] = useState("");
  const full = value.length >= maxItems;
  const fullHint = hint ?? `Press Enter or comma to add. Up to ${maxItems}.`;

  function add(raw: string) {
    const parts = raw
      .split(/[,\n]/)
      .map((p) => p.trim().slice(0, maxLength))
      .filter(Boolean);
    if (!parts.length) return;
    const next = [...value];
    const seen = new Set(next.map((t) => t.toLowerCase()));
    for (const part of parts) {
      if (next.length >= maxItems) break;
      if (seen.has(part.toLowerCase())) continue;
      seen.add(part.toLowerCase());
      next.push(part);
    }
    if (next.length !== value.length) onChange(next);
    setDraft("");
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      e.preventDefault();
      remove(value.length - 1);
    }
  }

  const available = suggestions?.filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()));

  return (
    <Field id={fieldId} label={label} hint={fullHint} error={error} className={className}>
      <div
        className={cn(
          "flex min-h-10 flex-wrap items-center gap-1.5 rounded-sm border bg-surface-raised px-2 py-1.5 transition-colors duration-150 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30",
          error ? "border-danger" : "border-line hover:border-line-strong",
          disabled && "opacity-60",
        )}
      >
        <ul className="contents" aria-label="Selected">
          {value.map((tag, index) => (
            <li
              key={`${tag}-${index}`}
              className="inline-flex items-center gap-1 rounded-xs border border-line-strong bg-surface py-0.5 pl-2 pr-0.5 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-fg-muted"
            >
              {tag}
              <button
                type="button"
                onClick={() => remove(index)}
                disabled={disabled}
                aria-label={`Remove ${tag}`}
                className="inline-flex size-5 items-center justify-center rounded-xs text-fg-subtle hover:bg-line hover:text-fg"
              >
                <X aria-hidden className="size-3" strokeWidth={2} />
              </button>
            </li>
          ))}
        </ul>
        <input
          id={fieldId}
          type="text"
          value={draft}
          onChange={(e) => {
            const text = e.target.value;
            if (text.includes(",")) add(text);
            else setDraft(text);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => add(draft)}
          placeholder={full ? `Limit of ${maxItems} reached` : placeholder}
          disabled={disabled || full}
          list={available?.length ? `${fieldId}-list` : undefined}
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={fieldDescribedBy(fieldId, fullHint, error)}
          className="min-w-32 flex-1 bg-transparent px-1 py-1 text-sm text-fg outline-none placeholder:text-fg-faint disabled:cursor-not-allowed focus-ring-custom"
        />
        {available?.length ? (
          <datalist id={`${fieldId}-list`}>
            {available.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        ) : null}
      </div>
    </Field>
  );
}
