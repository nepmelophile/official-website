"use client";

import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Field, fieldDescribedBy } from "./Field";
import { iconButtonClass, inputClass } from "./styles";

export interface RefOption {
  id: string;
  label: string;
  /** Secondary text (e.g. category · date, or "Draft"). */
  description?: string;
}

export interface RefMultiSelectProps {
  /** Selectable documents (build on the server: `articles.map(a => ({ id: a.id, label: a.title }))`). */
  options: readonly RefOption[];
  /** Selected ids, in display order. */
  value: string[];
  onChange: (ids: string[]) => void;
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  placeholder?: string;
  maxItems?: number;
  /** Ids that can't be picked (e.g. the article being edited). */
  excludeIds?: readonly string[];
  /** Show up/down buttons (order matters for featured picks). Default true. */
  reorderable?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
}

const MAX_RESULTS = 50;

/**
 * Pick document ids from a list with type-ahead search (ARIA combobox). Selected items are
 * listed in order with move/remove controls. Used for related articles and featured picks.
 */
export function RefMultiSelect({
  options,
  value,
  onChange,
  label = "Related items",
  hint,
  error,
  placeholder = "Search to add…",
  maxItems,
  excludeIds,
  reorderable = true,
  disabled,
  id,
  className,
}: RefMultiSelectProps) {
  const generatedId = useId();
  const fieldId = id ?? `ref${generatedId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const listboxId = `${fieldId}-listbox`;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const byId = new Map(options.map((o) => [o.id, o]));
  const selected = new Set(value);
  const excluded = new Set(excludeIds ?? []);
  const full = maxItems !== undefined && value.length >= maxItems;
  const q = query.trim().toLowerCase();
  const results = options
    .filter((o) => !selected.has(o.id) && !excluded.has(o.id))
    .filter((o) => !q || o.label.toLowerCase().includes(q) || o.description?.toLowerCase().includes(q))
    .slice(0, MAX_RESULTS);
  const activeIndex = Math.min(active, Math.max(0, results.length - 1));
  const showList = open && !full && !disabled;

  function add(optionId: string) {
    if (full || selected.has(optionId)) return;
    onChange([...value, optionId]);
    setQuery("");
    setActive(0);
  }

  function remove(optionId: string) {
    onChange(value.filter((v) => v !== optionId));
  }

  function move(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive(results.length ? (activeIndex + 1) % results.length : 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setActive(results.length ? (activeIndex - 1 + results.length) % results.length : 0);
    } else if (e.key === "Enter") {
      if (showList && results[activeIndex]) {
        e.preventDefault();
        add(results[activeIndex].id);
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
      }
    }
  }

  return (
    <Field
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      className={className}
      labelAside={
        maxItems !== undefined ? (
          <span className="font-mono text-[0.6875rem] tabular-nums text-fg-subtle">
            {value.length}/{maxItems}
          </span>
        ) : undefined
      }
    >
      {value.length > 0 ? (
        <ol className="mb-2 divide-y divide-line rounded-sm border border-line bg-bg-alt" aria-label="Selected">
          {value.map((selectedId, index) => {
            const option = byId.get(selectedId);
            return (
              <li key={selectedId} className="flex items-center gap-3 px-3 py-1.5">
                <span className="w-5 shrink-0 font-mono text-[0.6875rem] tabular-nums text-highlight">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate text-sm", option ? "text-fg" : "text-fg-subtle italic")}>
                    {option?.label ?? "Missing item (deleted?)"}
                  </p>
                  {option?.description ? <p className="truncate text-xs text-fg-subtle">{option.description}</p> : null}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {reorderable ? (
                    <>
                      <button
                        type="button"
                        className={iconButtonClass}
                        onClick={() => move(index, -1)}
                        disabled={disabled || index === 0}
                        aria-label={`Move ${option?.label ?? "item"} up`}
                      >
                        <ArrowUp aria-hidden className="size-4" strokeWidth={1.75} />
                      </button>
                      <button
                        type="button"
                        className={iconButtonClass}
                        onClick={() => move(index, 1)}
                        disabled={disabled || index === value.length - 1}
                        aria-label={`Move ${option?.label ?? "item"} down`}
                      >
                        <ArrowDown aria-hidden className="size-4" strokeWidth={1.75} />
                      </button>
                    </>
                  ) : null}
                  <button
                    type="button"
                    className={cn(iconButtonClass, "hover:border-danger/60 hover:text-danger")}
                    onClick={() => remove(selectedId)}
                    disabled={disabled}
                    aria-label={`Remove ${option?.label ?? "item"}`}
                  >
                    <X aria-hidden className="size-4" strokeWidth={1.75} />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      ) : null}

      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle"
          strokeWidth={1.75}
        />
        <input
          id={fieldId}
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={showList && results[activeIndex] ? `${listboxId}-${results[activeIndex].id}` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={fieldDescribedBy(fieldId, hint, error)}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          placeholder={full ? `Limit of ${maxItems} reached` : placeholder}
          disabled={disabled || full}
          autoComplete="off"
          className={cn(inputClass, "pl-9")}
        />
        {showList ? (
          <ul
            id={listboxId}
            role="listbox"
            aria-label="Suggestions"
            className="absolute inset-x-0 top-full z-40 mt-1 max-h-72 overflow-y-auto rounded-sm border border-line-strong bg-surface-raised py-1 shadow-lift"
          >
            {results.length === 0 ? (
              <li role="presentation" className="px-3 py-2 text-sm text-fg-subtle">
                {options.length === 0 ? "Nothing to choose from yet." : "No matches."}
              </li>
            ) : (
              results.map((option, index) => (
                <li
                  key={option.id}
                  id={`${listboxId}-${option.id}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  // mousedown (not click) so the input's blur doesn't close the list first.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    add(option.id);
                  }}
                  onMouseEnter={() => setActive(index)}
                  className={cn(
                    "cursor-pointer px-3 py-2",
                    index === activeIndex ? "bg-ink-700 text-fg" : "text-fg-muted",
                  )}
                >
                  <p className="truncate text-sm">{option.label}</p>
                  {option.description ? <p className="truncate text-xs text-fg-subtle">{option.description}</p> : null}
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>
    </Field>
  );
}

/* ------------------------------------------------------------------ */
/* RefSelect — single reference                                        */
/* ------------------------------------------------------------------ */

export interface RefSelectProps {
  options: readonly RefOption[];
  /** Selected id or "" for none. */
  value: string | undefined;
  onChange: (id: string) => void;
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  /** Text of the empty option (default "— None —"). */
  noneLabel?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

/** Single document reference as a native <select> (e.g. TrendingItem.refId). */
export function RefSelect({
  options,
  value,
  onChange,
  label = "Reference",
  hint,
  error,
  noneLabel = "— None —",
  disabled,
  id,
  className,
}: RefSelectProps) {
  const generatedId = useId();
  const fieldId = id ?? `refsel${generatedId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const missing = value && !options.some((o) => o.id === value);
  return (
    <Field id={fieldId} label={label} hint={hint} error={error} className={className}>
      <select
        id={fieldId}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={fieldDescribedBy(fieldId, hint, error)}
        className={cn(inputClass, "cursor-pointer")}
      >
        <option value="">{noneLabel}</option>
        {missing ? <option value={value}>Missing item (deleted?)</option> : null}
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.description ? `${o.label} — ${o.description}` : o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
