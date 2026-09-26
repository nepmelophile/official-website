"use client";

import { useCallback, useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ActionFieldErrors, ActionResult } from "@/lib/admin/types";
import { useToast } from "./Toast";

export interface UseAdminFormOptions<V, R> {
  /** Initial form state (usually derived from the DTO passed by the server page). */
  initial: V;
  /** Server action called with the current values (a plain object, NOT FormData). */
  action: (values: V) => Promise<ActionResult<R>>;
  /**
   * Where to go after a successful save:
   *   - string / function returning a string → router.push(href)
   *   - undefined (default) → router.refresh() and stay on the page
   */
  redirectTo?: string | ((data: R | undefined, values: V) => string | undefined);
  /** Toast text on success (defaults to the action's `message`, else "Saved"). `false` disables it. */
  successMessage?: string | false;
  /** Extra hook after success (runs before navigation). */
  onSuccess?: (data: R | undefined, values: V) => void;
}

export interface AdminFormApi<V> {
  values: V;
  /** Set one top-level field; clears errors under that path. */
  set: <K extends keyof V>(key: K, value: V[K]) => void;
  /** Curried setter for `onChange`: `onChange={form.setter("title")}`. */
  setter: <K extends keyof V>(key: K) => (value: V[K]) => void;
  /** Shallow-merge a patch (or updater fn) into values. */
  update: (patch: Partial<V> | ((prev: V) => V)) => void;
  errors: ActionFieldErrors;
  /** First error message for a path such as "title" or "embeds.0.url". */
  error: (path: string) => string | undefined;
  /** Top-level error from the last failed submit. */
  formError: string | undefined;
  pending: boolean;
  /** True when values differ from the last saved/initial state. */
  dirty: boolean;
  /** Submit handler: use as `<form onSubmit={form.submit}>` or call directly. */
  submit: (event?: FormEvent) => void;
  /** Revert to the last saved state. */
  reset: () => void;
  /** Mark the current values as saved (clears `dirty`). */
  markSaved: () => void;
  setErrors: (errors: ActionFieldErrors) => void;
}

function clearErrorsUnder(errors: ActionFieldErrors, key: string): ActionFieldErrors {
  let changed = false;
  const next: ActionFieldErrors = {};
  for (const [path, messages] of Object.entries(errors)) {
    if (path === key || path.startsWith(`${key}.`) || path === "_form") {
      changed = true;
      continue;
    }
    next[path] = messages;
  }
  return changed ? next : errors;
}

function snapshot(value: unknown): string {
  return JSON.stringify(value);
}

/**
 * State + submit plumbing for admin edit/create forms:
 * holds values with useState, calls the server action inside useTransition, maps
 * `fieldErrors` to fields (focusing the first invalid control), toasts the result and refreshes
 * or navigates.
 */
export function useAdminForm<V extends object, R = unknown>({
  initial,
  action,
  redirectTo,
  successMessage,
  onSuccess,
}: UseAdminFormOptions<V, R>): AdminFormApi<V> {
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState<V>(initial);
  const [saved, setSaved] = useState<string>(() => snapshot(initial));
  const [errors, setErrors] = useState<ActionFieldErrors>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  // Bumped after each failed submit; the effect below moves focus to the first invalid field.
  const [failedSubmits, setFailedSubmits] = useState(0);

  useEffect(() => {
    if (failedSubmits === 0) return;
    const target = document.querySelector<HTMLElement>('#admin-main [aria-invalid="true"]');
    if (!target) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
    target.focus({ preventScroll: true });
  }, [failedSubmits]);

  const set = useCallback(<K extends keyof V>(key: K, value: V[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => clearErrorsUnder(prev, String(key)));
  }, []);

  const setter = useCallback(<K extends keyof V>(key: K) => (value: V[K]) => set(key, value), [set]);

  const update = useCallback((patch: Partial<V> | ((prev: V) => V)) => {
    setValues((prev) => (typeof patch === "function" ? patch(prev) : { ...prev, ...patch }));
  }, []);

  const dirty = snapshot(values) !== saved;

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (pending) return;
    const submitted = values;
    setFormError(undefined);
    startTransition(async () => {
      let result: ActionResult<R>;
      try {
        result = await action(submitted);
      } catch (error) {
        console.error(error);
        const message = "Could not reach the server. Check your connection and try again.";
        setFormError(message);
        toast.error(message);
        return;
      }
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.error);
        toast.error(result.error);
        if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) setFailedSubmits((n) => n + 1);
        return;
      }
      setErrors({});
      setSaved(snapshot(submitted));
      if (successMessage !== false) toast.success(successMessage ?? result.message ?? "Saved");
      onSuccess?.(result.data, submitted);
      const href = typeof redirectTo === "function" ? redirectTo(result.data, submitted) : redirectTo;
      if (href) router.push(href);
      else router.refresh();
    });
  }

  return {
    values,
    set,
    setter,
    update,
    errors,
    error: (path: string) => errors[path]?.[0],
    formError,
    pending,
    dirty,
    submit,
    reset: () => {
      setValues(JSON.parse(saved) as V);
      setErrors({});
      setFormError(undefined);
    },
    markSaved: () => setSaved(snapshot(values)),
    setErrors,
  };
}
