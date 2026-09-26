"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button, type ButtonVariant } from "./Button";

export interface ConfirmDialogProps {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Confirm button style (default "danger"). */
  variant?: ButtonVariant;
  /** Shows a spinner on the confirm button and blocks closing. */
  pending?: boolean;
  /** Inline error shown inside the dialog (e.g. a failed delete). */
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modal confirmation built on the native <dialog> (focus trapping, Esc and inert background
 * come for free). Controlled via `open`.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  variant = "danger",
  pending = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        if (!pending) onCancel();
      }}
      onClick={(e) => {
        // Click on the backdrop (the dialog element itself) closes it.
        if (e.target === e.currentTarget && !pending) onCancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-line-strong bg-surface p-0 text-fg shadow-lift backdrop:bg-ink-950/75 backdrop:backdrop-blur-sm"
    >
      <div className="space-y-4 p-6">
        <h2 id={titleId} className="font-display text-xl font-bold tracking-tight">
          {title}
        </h2>
        {description ? (
          <div id={descId} className="text-sm leading-relaxed text-fg-muted">
            {description}
          </div>
        ) : null}
        {error ? (
          <p role="alert" className="rounded-sm border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel} disabled={pending} autoFocus>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={pending}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
