"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastKind = "success" | "error" | "info";

export interface ToastInput {
  message: string;
  kind?: ToastKind;
  /** Auto-dismiss after ms (default 4500; errors 7000). 0 = sticky. */
  duration?: number;
}

interface ToastItem extends Required<Omit<ToastInput, "duration">> {
  id: number;
}

interface ToastApi {
  toast: (input: ToastInput | string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

let nextToastId = 1;

/**
 * Mounted once in the protected admin layout. Because the layout persists across client
 * navigations, a toast fired right before router.push() stays visible on the next page.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput | string) => {
      const { message, kind = "info", duration } = typeof input === "string" ? { message: input } : input;
      const id = nextToastId++;
      setToasts((list) => [...list.slice(-3), { id, message, kind }]);
      const ms = duration ?? (kind === "error" ? 7000 : 4500);
      if (ms > 0) window.setTimeout(() => dismiss(id), ms);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      toast,
      dismiss,
      success: (message) => toast({ message, kind: "success" }),
      error: (message) => toast({ message, kind: "error" }),
      info: (message) => toast({ message, kind: "info" }),
    }),
    [toast, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-6 sm:bottom-24 sm:items-end">
        {/* Separate live regions so errors are announced assertively. */}
        <div role="status" aria-live="polite" className="flex flex-col items-center gap-2 sm:items-end">
          {toasts
            .filter((t) => t.kind !== "error")
            .map((t) => (
              <ToastCard key={t.id} item={t} onDismiss={dismiss} />
            ))}
        </div>
        <div role="alert" aria-live="assertive" className="flex flex-col items-center gap-2 sm:items-end">
          {toasts
            .filter((t) => t.kind === "error")
            .map((t) => (
              <ToastCard key={t.id} item={t} onDismiss={dismiss} />
            ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

const KIND_STYLES: Record<ToastKind, { icon: ReactNode; className: string }> = {
  success: {
    icon: <CheckCircle2 aria-hidden className="size-4 shrink-0 text-success" strokeWidth={1.75} />,
    className: "border-success/40",
  },
  error: {
    icon: <TriangleAlert aria-hidden className="size-4 shrink-0 text-danger" strokeWidth={1.75} />,
    className: "border-danger/50",
  },
  info: {
    icon: <Info aria-hidden className="size-4 shrink-0 text-info" strokeWidth={1.75} />,
    className: "border-line-strong",
  },
};

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  const style = KIND_STYLES[item.kind];
  return (
    <div
      className={cn(
        "pointer-events-auto flex w-full max-w-sm animate-fade-up items-start gap-3 rounded-md border bg-surface-raised py-3 pl-4 pr-2 text-sm text-fg shadow-lift",
        style.className,
      )}
    >
      <span className="mt-0.5">{style.icon}</span>
      <p className="min-w-0 flex-1 leading-snug">{item.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        aria-label="Dismiss notification"
        className="-my-1 inline-flex size-8 shrink-0 items-center justify-center rounded-xs text-fg-subtle hover:bg-line hover:text-fg"
      >
        <X aria-hidden className="size-4" strokeWidth={1.75} />
      </button>
    </div>
  );
}

const noop = () => {};
const FALLBACK: ToastApi = { toast: noop, success: noop, error: noop, info: noop, dismiss: noop };

/** Access toasts. Outside a ToastProvider it is a silent no-op (never throws). */
export function useToast(): ToastApi {
  return useContext(ToastContext) ?? FALLBACK;
}
