"use client";

import { useEffect, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, ButtonLink } from "./Button";
import { DeleteButton, type DeleteButtonProps } from "./DeleteButton";

/** The subset of useAdminForm() FormShell needs (pass the whole `form` object). */
export interface FormShellState {
  submit: (event?: FormEvent) => void;
  pending: boolean;
  dirty: boolean;
  formError?: string;
  reset?: () => void;
}

export interface FormShellProps {
  title: ReactNode;
  description?: ReactNode;
  /** List page to return to (back link + Cancel). */
  backHref: string;
  backLabel?: string;
  form: FormShellState;
  /** Save button text (default "Save changes"; use "Create …" on new pages). */
  submitLabel?: string;
  /** Renders a Delete button (with confirm) in the save bar. `variant`/`size` are set by the shell. */
  deleteProps?: Omit<DeleteButtonProps, "variant" | "size" | "iconOnly">;
  /** Right-hand column on ≥ lg (status, publish date, image…). Omit for a single column. */
  aside?: ReactNode;
  /** Extra header actions, e.g. a "View on site ↗" link. */
  headerActions?: ReactNode;
  /** Small meta line under the title (e.g. "Last updated 12 Sep 2026"). */
  meta?: ReactNode;
  /** Warn before leaving with unsaved changes (default true). */
  guardUnsaved?: boolean;
  children: ReactNode;
  className?: string;
}

const LEAVE_MESSAGE = "You have unsaved changes. Leave this page and discard them?";

/**
 * Page frame for admin create/edit forms: header, two-column body (main + aside), sticky save
 * bar (Save / Cancel / optional Delete), Ctrl/⌘+S to save, and an unsaved-changes guard for
 * reloads, tab closes and in-app link clicks.
 */
export function FormShell({
  title,
  description,
  backHref,
  backLabel = "Back",
  form,
  submitLabel = "Save changes",
  deleteProps,
  aside,
  headerActions,
  meta,
  guardUnsaved = true,
  children,
  className,
}: FormShellProps) {
  const { submit, pending, dirty, formError } = form;
  const guarding = guardUnsaved && dirty && !pending;

  // Unsaved-changes guard: browser unload + in-app link clicks (captured before Next's <Link>).
  useEffect(() => {
    if (!guarding) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      if (!window.confirm(LEAVE_MESSAGE)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [guarding]);

  // Ctrl/⌘ + S saves.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        submit();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [submit]);

  return (
    <form onSubmit={submit} noValidate className={cn("flex min-h-full flex-col", className)}>
      <header className="mb-6 space-y-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-fg-subtle hover:text-fg"
        >
          <ArrowLeft aria-hidden className="size-3.5" strokeWidth={1.75} />
          {backLabel}
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <h1 className="font-display text-2xl font-bold tracking-tight text-fg">{title}</h1>
            {description ? <p className="max-w-prose text-sm text-fg-muted">{description}</p> : null}
            {meta ? <p className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-fg-subtle">{meta}</p> : null}
          </div>
          {headerActions ? <div className="flex flex-wrap items-center gap-2">{headerActions}</div> : null}
        </div>
      </header>

      {formError ? (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-fg"
        >
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-danger" strokeWidth={1.75} />
          <p>{formError}</p>
        </div>
      ) : null}

      <div className={cn("grid flex-1 gap-6", aside && "lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)] lg:items-start")}>
        <div className="min-w-0 space-y-6">{children}</div>
        {aside ? <aside className="min-w-0 space-y-6 lg:sticky lg:top-6">{aside}</aside> : null}
      </div>

      <div className="sticky bottom-0 z-30 -mx-4 mt-8 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <p className="mr-auto flex items-center gap-2 text-xs text-fg-subtle" aria-live="polite">
            {pending ? (
              "Saving…"
            ) : dirty ? (
              <>
                <span aria-hidden className="size-2 rounded-pill bg-highlight" />
                Unsaved changes
              </>
            ) : (
              "All changes saved"
            )}
          </p>
          {deleteProps ? <DeleteButton {...deleteProps} size="md" variant="ghost" /> : null}
          <ButtonLink href={backHref} variant="secondary">
            Cancel
          </ButtonLink>
          <Button type="submit" variant="primary" loading={pending}>
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
