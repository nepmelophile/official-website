"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import { CONTENT_STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ContentStatus } from "@/types/content";
import { Field, fieldDescribedBy } from "./Field";
import { inputClass } from "./styles";

/*
 * Controlled admin inputs. Every input takes `value` + `onChange(value)` (not events) and
 * renders its own <Field> (label, hint, error) with correct aria wiring.
 */

export interface BaseFieldProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  /** Shows "(optional)" next to the label. */
  optional?: boolean;
  disabled?: boolean;
  hideLabel?: boolean;
  /** Custom id (defaults to useId()). */
  id?: string;
  /** Classes for the Field wrapper. */
  className?: string;
}

function useFieldId(id?: string): string {
  const generated = useId();
  return id ?? `f${generated.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

function Counter({ length, max }: { length: number; max: number }) {
  const over = length > max;
  return (
    <span className={cn("font-mono text-[0.6875rem] tabular-nums", over ? "text-danger" : "text-fg-subtle")} aria-hidden>
      {length}/{max}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* TextInput                                                           */
/* ------------------------------------------------------------------ */

export interface TextInputProps extends BaseFieldProps {
  value: string | undefined | null;
  onChange: (value: string) => void;
  type?: "text" | "email" | "url" | "tel" | "password" | "search";
  placeholder?: string;
  maxLength?: number;
  /** Show a live `n/max` counter (requires maxLength). */
  showCount?: boolean;
  /** Autocomplete suggestions (rendered as a <datalist>, free text still allowed). */
  suggestions?: readonly string[];
  autoComplete?: string;
  /** Extra props for the <input> (escape hatch). */
  inputProps?: Omit<ComponentProps<"input">, "value" | "onChange" | "id" | "type">;
}

export function TextInput({
  label,
  hint,
  error,
  required,
  optional,
  disabled,
  hideLabel,
  id,
  className,
  value,
  onChange,
  type = "text",
  placeholder,
  maxLength,
  showCount,
  suggestions,
  autoComplete,
  inputProps,
}: TextInputProps) {
  const fieldId = useFieldId(id);
  const text = value ?? "";
  return (
    <Field
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      optional={optional}
      hideLabel={hideLabel}
      className={className}
      labelAside={showCount && maxLength ? <Counter length={text.length} max={maxLength} /> : undefined}
    >
      <input
        id={fieldId}
        type={type}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={showCount ? undefined : maxLength}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete ?? "off"}
        list={suggestions?.length ? `${fieldId}-list` : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={fieldDescribedBy(fieldId, hint, error)}
        className={inputClass}
        {...inputProps}
      />
      {suggestions?.length ? (
        <datalist id={`${fieldId}-list`}>
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      ) : null}
    </Field>
  );
}

/* ------------------------------------------------------------------ */
/* TextArea                                                            */
/* ------------------------------------------------------------------ */

export interface TextAreaProps extends BaseFieldProps {
  value: string | undefined | null;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  maxLength?: number;
  showCount?: boolean;
  /** Monospace text (for code / markdown). */
  mono?: boolean;
  textareaProps?: Omit<ComponentProps<"textarea">, "value" | "onChange" | "id">;
}

export function TextArea({
  label,
  hint,
  error,
  required,
  optional,
  disabled,
  hideLabel,
  id,
  className,
  value,
  onChange,
  rows = 4,
  placeholder,
  maxLength,
  showCount,
  mono,
  textareaProps,
}: TextAreaProps) {
  const fieldId = useFieldId(id);
  const text = value ?? "";
  return (
    <Field
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      optional={optional}
      hideLabel={hideLabel}
      className={className}
      labelAside={showCount && maxLength ? <Counter length={text.length} max={maxLength} /> : undefined}
    >
      <textarea
        id={fieldId}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={fieldDescribedBy(fieldId, hint, error)}
        className={cn(inputClass, "min-h-20 resize-y leading-relaxed", mono && "font-mono text-[0.8125rem]")}
        {...textareaProps}
      />
    </Field>
  );
}

/* ------------------------------------------------------------------ */
/* NumberInput                                                         */
/* ------------------------------------------------------------------ */

export interface NumberInputProps extends BaseFieldProps {
  value: number | undefined | null;
  /** Emits undefined when the input is cleared. */
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  /** Narrow width (for order / rank / year). */
  compact?: boolean;
}

export function NumberInput({
  label,
  hint,
  error,
  required,
  optional,
  disabled,
  hideLabel,
  id,
  className,
  value,
  onChange,
  min,
  max,
  step = 1,
  placeholder,
  compact,
}: NumberInputProps) {
  const fieldId = useFieldId(id);
  return (
    <Field
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      optional={optional}
      hideLabel={hideLabel}
      className={className}
    >
      <input
        id={fieldId}
        type="number"
        inputMode={step % 1 === 0 ? "numeric" : "decimal"}
        value={value ?? ""}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") return onChange(undefined);
          const n = e.target.valueAsNumber;
          onChange(Number.isNaN(n) ? undefined : n);
        }}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={fieldDescribedBy(fieldId, hint, error)}
        className={cn(inputClass, "tabular-nums", compact && "max-w-32")}
      />
    </Field>
  );
}

/* ------------------------------------------------------------------ */
/* DateInput (Nepal time)                                              */
/* ------------------------------------------------------------------ */

/** Asia/Kathmandu is UTC+05:45 all year (no DST). */
const NPT_OFFSET_MS = (5 * 60 + 45) * 60 * 1000;

/** ISO string → "YYYY-MM-DDTHH:mm" (datetime) or "YYYY-MM-DD" (date) in Nepal time. */
export function isoToNepalInput(iso: string | undefined | null, mode: "datetime" | "date" = "datetime"): string {
  if (!iso) return "";
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return "";
  const shifted = new Date(time + NPT_OFFSET_MS).toISOString();
  return mode === "date" ? shifted.slice(0, 10) : shifted.slice(0, 16);
}

/** "YYYY-MM-DD[THH:mm]" in Nepal time → ISO string ("" when blank/invalid). */
export function nepalInputToIso(local: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(local.trim());
  if (!match) return "";
  const [, y, mo, d, h = "0", mi = "0"] = match;
  const utc = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi)) - NPT_OFFSET_MS;
  return Number.isNaN(utc) ? "" : new Date(utc).toISOString();
}

export interface DateInputProps extends BaseFieldProps {
  /** ISO-8601 string ("" / undefined when empty). */
  value: string | undefined | null;
  /** Emits an ISO string, or "" when cleared. */
  onChange: (iso: string) => void;
  /** "datetime" (default) uses datetime-local; "date" a date-only picker. */
  mode?: "datetime" | "date";
  /** Show a "Now" / "Today" shortcut button. */
  showNow?: boolean;
}

/**
 * Date / date-time picker. Values are edited in Nepal time (NPT, UTC+05:45) — deterministic on
 * server and client and consistent with formatDate() on the public site.
 */
export function DateInput({
  label,
  hint,
  error,
  required,
  optional,
  disabled,
  hideLabel,
  id,
  className,
  value,
  onChange,
  mode = "datetime",
  showNow = mode === "datetime",
}: DateInputProps) {
  const fieldId = useFieldId(id);
  const fullHint = hint ?? (mode === "datetime" ? "Nepal time (NPT)" : undefined);
  return (
    <Field
      id={fieldId}
      label={label}
      hint={fullHint}
      error={error}
      required={required}
      optional={optional}
      hideLabel={hideLabel}
      className={className}
      labelAside={
        showNow && !disabled ? (
          <button
            type="button"
            onClick={() => onChange(new Date().toISOString())}
            className="rounded-xs px-1 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-vermilion-300 hover:text-fg"
          >
            {mode === "datetime" ? "Now" : "Today"}
          </button>
        ) : undefined
      }
    >
      <input
        id={fieldId}
        type={mode === "datetime" ? "datetime-local" : "date"}
        value={isoToNepalInput(value, mode)}
        onChange={(e) => onChange(nepalInputToIso(e.target.value))}
        required={required}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={fieldDescribedBy(fieldId, fullHint, error)}
        className={cn(inputClass, "[color-scheme:dark] tabular-nums")}
      />
    </Field>
  );
}

/* ------------------------------------------------------------------ */
/* Select                                                              */
/* ------------------------------------------------------------------ */

export interface SelectOption<V extends string = string> {
  value: V;
  label: string;
  disabled?: boolean;
}

export interface SelectProps<V extends string = string> extends BaseFieldProps {
  value: V | "" | undefined | null;
  onChange: (value: V | "") => void;
  options: readonly SelectOption<V>[];
  /** Adds a first empty option with this text (value ""). */
  placeholder?: string;
}

export function Select<V extends string = string>({
  label,
  hint,
  error,
  required,
  optional,
  disabled,
  hideLabel,
  id,
  className,
  value,
  onChange,
  options,
  placeholder,
}: SelectProps<V>) {
  const fieldId = useFieldId(id);
  return (
    <Field
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      optional={optional}
      hideLabel={hideLabel}
      className={className}
    >
      <select
        id={fieldId}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value as V | "")}
        required={required}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={fieldDescribedBy(fieldId, hint, error)}
        className={cn(inputClass, "cursor-pointer pr-8")}
      >
        {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

/* ------------------------------------------------------------------ */
/* Checkbox / Toggle                                                   */
/* ------------------------------------------------------------------ */

export interface CheckboxProps {
  label: ReactNode;
  description?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  error?: string;
  id?: string;
  className?: string;
}

export function Checkbox({ label, description, checked, onChange, disabled, error, id, className }: CheckboxProps) {
  const fieldId = useFieldId(id);
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex min-h-11 items-start gap-3 py-1">
        <input
          id={fieldId}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={fieldDescribedBy(fieldId, description, error)}
          className="mt-0.5 size-4.5 shrink-0 cursor-pointer rounded-xs border-line-strong bg-surface-raised accent-[var(--color-accent)]"
        />
        <div className="min-w-0">
          <label htmlFor={fieldId} className="cursor-pointer text-sm font-medium text-fg">
            {label}
          </label>
          {description ? (
            <p id={`${fieldId}-hint`} className="text-xs text-fg-subtle">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {error ? (
        <p id={`${fieldId}-error`} className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export type ToggleProps = CheckboxProps;

/** On/off switch (role="switch"). Use for active / featured / manualOverride flags. */
export function Toggle({ label, description, checked, onChange, disabled, error, id, className }: ToggleProps) {
  const fieldId = useFieldId(id);
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex min-h-11 items-start justify-between gap-4 py-1">
        <div className="min-w-0">
          <label htmlFor={fieldId} className="cursor-pointer text-sm font-medium text-fg">
            {label}
          </label>
          {description ? (
            <p id={`${fieldId}-hint`} className="text-xs text-fg-subtle">
              {description}
            </p>
          ) : null}
        </div>
        <button
          id={fieldId}
          type="button"
          role="switch"
          aria-checked={checked}
          aria-describedby={fieldDescribedBy(fieldId, description, error)}
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-pill border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-50 focus-ring-custom",
            checked ? "border-accent bg-accent" : "border-line-strong bg-surface-raised",
          )}
        >
          <span className="sr-only">{checked ? "On" : "Off"}</span>
          <span
            aria-hidden
            className={cn(
              "inline-block size-4 rounded-pill transition-transform duration-150",
              checked ? "translate-x-6 bg-accent-fg" : "translate-x-1 bg-ink-300",
            )}
          />
        </button>
      </div>
      {error ? (
        <p id={`${fieldId}-error`} className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* StatusSelect                                                        */
/* ------------------------------------------------------------------ */

export interface StatusSelectProps {
  value: ContentStatus;
  onChange: (value: ContentStatus) => void;
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

const STATUS_LABELS: Record<ContentStatus, string> = { draft: "Draft", published: "Published" };

/** Draft / Published segmented control (radio group). */
export function StatusSelect({ value, onChange, label = "Status", hint, error, disabled, id, className }: StatusSelectProps) {
  const fieldId = useFieldId(id);
  return (
    <Field id={fieldId} as="group" label={label} hint={hint} error={error} className={className}>
      <div className="grid grid-cols-2 gap-1 rounded-sm border border-line bg-surface-raised p-1">
        {CONTENT_STATUSES.map((status) => {
          const selected = value === status;
          return (
            <label
              key={status}
              className={cn(
                "flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-xs px-3 text-sm font-medium transition-colors duration-150 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-highlight",
                selected
                  ? status === "published"
                    ? "bg-success/15 text-success"
                    : "bg-ink-700 text-fg"
                  : "text-fg-muted hover:text-fg",
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              <input
                type="radio"
                name={`${fieldId}-status`}
                value={status}
                checked={selected}
                onChange={() => onChange(status)}
                disabled={disabled}
                className="sr-only"
              />
              <span
                aria-hidden
                className={cn("size-2 rounded-pill", status === "published" ? "bg-success" : "bg-ink-400")}
              />
              {STATUS_LABELS[status]}
            </label>
          );
        })}
      </div>
    </Field>
  );
}
