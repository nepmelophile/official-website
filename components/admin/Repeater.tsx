"use client";

import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { Field } from "./Field";
import { iconButtonClass } from "./styles";

export interface RepeaterRowApi<T> {
  /** Replace the row, or merge a partial patch into it. */
  update: (patch: Partial<T> | ((prev: T) => T)) => void;
  remove: () => void;
  index: number;
  /** Path prefix for error lookups, e.g. `${name}.${index}` → form.error(`${row.path}.url`). */
  path: string;
}

export interface RepeaterProps<T> {
  label: ReactNode;
  /** Field name in the form values (used to build error paths like "embeds.0.url"). */
  name: string;
  items: T[];
  onChange: (items: T[]) => void;
  /** Factory for a new blank row. */
  createItem: () => T;
  /** Render the fields of one row. */
  renderItem: (item: T, row: RepeaterRowApi<T>) => ReactNode;
  /** Optional title for a row header (e.g. the release title); defaults to "Item n". */
  itemTitle?: (item: T, index: number) => ReactNode;
  addLabel?: string;
  hint?: ReactNode;
  /** Error for the list itself (e.g. "At most 10 items"). */
  error?: string;
  emptyText?: ReactNode;
  maxItems?: number;
  /** Allow reordering with up/down buttons (default true). */
  reorderable?: boolean;
  /** Lay each row's fields out inline (compact rows, e.g. social links). */
  compact?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
}

let keySeq = 0;
const newKey = () => `row-${++keySeq}`;

/**
 * Generic list editor: add / remove / reorder rows, each rendered by `renderItem`.
 * Used for embeds, releases, achievements, media, social links, hero CTAs and impact stats.
 */
export function Repeater<T>({
  label,
  name,
  items,
  onChange,
  createItem,
  renderItem,
  itemTitle,
  addLabel = "Add item",
  hint,
  error,
  emptyText = "Nothing added yet.",
  maxItems,
  reorderable = true,
  compact = false,
  disabled,
  id,
  className,
}: RepeaterProps<T>) {
  // Stable row keys (so inputs keep focus/state across reorder). Updated only in handlers; if
  // items change from outside (e.g. form reset) we fall back to index keys until the next edit.
  const [keys, setKeys] = useState<string[]>(() => items.map(() => newKey()));
  const inSync = keys.length === items.length;
  const rowKeys = inSync ? keys : items.map((_, i) => `idx-${i}`);
  const [announcement, setAnnouncement] = useState("");
  const fieldId = id ?? `repeater-${name.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  const full = maxItems !== undefined && items.length >= maxItems;

  function baseKeys(): string[] {
    return inSync ? keys : items.map(() => newKey());
  }

  function add() {
    if (full) return;
    onChange([...items, createItem()]);
    setKeys([...baseKeys(), newKey()]);
    setAnnouncement(`Added item ${items.length + 1}.`);
  }

  function removeAt(index: number) {
    onChange(items.filter((_, i) => i !== index));
    setKeys(baseKeys().filter((_, i) => i !== index));
    setAnnouncement(`Removed item ${index + 1}.`);
  }

  function move(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const nextItems = [...items];
    [nextItems[index], nextItems[target]] = [nextItems[target], nextItems[index]];
    const nextKeys = [...baseKeys()];
    [nextKeys[index], nextKeys[target]] = [nextKeys[target], nextKeys[index]];
    onChange(nextItems);
    setKeys(nextKeys);
    setAnnouncement(`Moved item ${index + 1} to position ${target + 1}.`);
  }

  function updateAt(index: number, patch: Partial<T> | ((prev: T) => T)) {
    onChange(
      items.map((item, i) => {
        if (i !== index) return item;
        if (typeof patch === "function") return patch(item);
        return typeof item === "object" && item !== null ? { ...item, ...patch } : (patch as T);
      }),
    );
  }

  return (
    <Field
      id={fieldId}
      as="group"
      label={label}
      hint={hint}
      error={error}
      className={className}
      labelAside={
        maxItems !== undefined ? (
          <span className="font-mono text-[0.6875rem] tabular-nums text-fg-subtle">
            {items.length}/{maxItems}
          </span>
        ) : undefined
      }
    >
      {items.length === 0 ? (
        <p className="rounded-sm border border-dashed border-line px-4 py-5 text-center text-sm text-fg-subtle">
          {emptyText}
        </p>
      ) : (
        <ol className="space-y-3">
          {items.map((item, index) => {
            const row: RepeaterRowApi<T> = {
              index,
              path: `${name}.${index}`,
              update: (patch) => updateAt(index, patch),
              remove: () => removeAt(index),
            };
            const controls = (
              <div className="flex shrink-0 items-center gap-1">
                {reorderable ? (
                  <>
                    <button
                      type="button"
                      className={iconButtonClass}
                      onClick={() => move(index, -1)}
                      disabled={disabled || index === 0}
                      aria-label={`Move item ${index + 1} up`}
                    >
                      <ArrowUp aria-hidden className="size-4" strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      className={iconButtonClass}
                      onClick={() => move(index, 1)}
                      disabled={disabled || index === items.length - 1}
                      aria-label={`Move item ${index + 1} down`}
                    >
                      <ArrowDown aria-hidden className="size-4" strokeWidth={1.75} />
                    </button>
                  </>
                ) : null}
                <button
                  type="button"
                  className={cn(iconButtonClass, "hover:border-danger/60 hover:text-danger")}
                  onClick={() => removeAt(index)}
                  disabled={disabled}
                  aria-label={`Remove item ${index + 1}`}
                >
                  <X aria-hidden className="size-4" strokeWidth={1.75} />
                </button>
              </div>
            );

            return (
              <li
                key={rowKeys[index]}
                className="rounded-sm border border-line bg-bg-alt"
                aria-label={`Item ${index + 1} of ${items.length}`}
              >
                {compact ? (
                  <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-start">
                    <span className="hidden pt-2 font-mono text-[0.6875rem] tabular-nums text-highlight sm:block">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">{renderItem(item, row)}</div>
                    <div className="self-end sm:self-start sm:pt-6">{controls}</div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
                      <p className="flex min-w-0 items-center gap-2 text-sm font-medium text-fg">
                        <span className="font-mono text-[0.6875rem] tabular-nums text-highlight">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="truncate">{itemTitle?.(item, index) || `Item ${index + 1}`}</span>
                      </p>
                      {controls}
                    </div>
                    <div className="space-y-4 p-3 sm:p-4">{renderItem(item, row)}</div>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      )}

      <div className="pt-1">
        <Button
          size="sm"
          variant="secondary"
          onClick={add}
          disabled={disabled || full}
          icon={<Plus aria-hidden className="size-4" strokeWidth={1.75} />}
        >
          {full ? `Limit of ${maxItems} reached` : addLabel}
        </Button>
      </div>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </Field>
  );
}
