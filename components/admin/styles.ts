/**
 * Shared admin class strings (docs/visual-design.md §13). Import these instead of re-typing
 * the input / label recipes so every admin form looks identical.
 */

/** Text-like inputs, selects and textareas. Add `aria-invalid` for the error state. */
export const inputClass =
  "block w-full rounded-sm border border-line bg-surface-raised px-3 py-2 text-sm text-fg outline-none transition-colors duration-150 placeholder:text-fg-faint hover:border-line-strong focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/30 focus-ring-custom";

export const labelClass = "block text-sm font-medium text-fg";
export const hintClass = "text-xs text-fg-subtle";
export const errorClass = "text-xs font-medium text-danger";

/** Mono uppercase metadata (table headers, kickers). */
export const metaClass = "font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-fg-subtle";

/** Panel / card surface used for form sections and dashboard tiles. */
export const panelClass = "rounded-md border border-line bg-surface";

/** Small square icon button (row actions: move up/down, remove). 36px visual, 44px hit area via padding. */
export const iconButtonClass =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-sm border border-line text-fg-muted transition-colors duration-150 hover:border-line-strong hover:text-fg disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight focus-ring-custom";
