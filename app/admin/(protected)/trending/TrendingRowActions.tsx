"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp } from "lucide-react";
import { DeleteButton, iconButtonClass, useToast } from "@/components/admin";
import type { ActionResult } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import { deleteTrendingItem, moveTrendingItem, setTrendingItemActive } from "./actions";

export interface TrendingRowActionsProps {
  id: string;
  /** Name used in accessible labels and the delete dialog. */
  label: string;
  active: boolean;
  isFirst: boolean;
  isLast: boolean;
}

/** Inline controls for a trending row: move up / down, show / hide, delete. */
export function TrendingRowActions({ id, label, active, isFirst, isLast }: TrendingRowActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<ActionResult<unknown>>, quiet = false) {
    startTransition(async () => {
      let result: ActionResult<unknown>;
      try {
        result = await action();
      } catch {
        toast.error("Could not reach the server. Check your connection and try again.");
        return;
      }
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (!quiet && result.message) toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-end gap-1.5" aria-busy={pending || undefined}>
      <button
        type="button"
        className={iconButtonClass}
        onClick={() => run(() => moveTrendingItem(id, "up"), true)}
        disabled={pending || isFirst}
        aria-label={`Move “${label}” up`}
        title="Move up"
      >
        <ArrowUp aria-hidden className="size-4" strokeWidth={1.75} />
      </button>
      <button
        type="button"
        className={iconButtonClass}
        onClick={() => run(() => moveTrendingItem(id, "down"), true)}
        disabled={pending || isLast}
        aria-label={`Move “${label}” down`}
        title="Move down"
      >
        <ArrowDown aria-hidden className="size-4" strokeWidth={1.75} />
      </button>
      <button
        type="button"
        role="switch"
        aria-checked={active}
        aria-label={`Show “${label}” in the trending strip`}
        title={active ? "Active — click to hide" : "Hidden — click to show"}
        disabled={pending}
        onClick={() => run(() => setTrendingItemActive(id, !active))}
        className={cn(
          "relative mx-1 inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-pill border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-wait disabled:opacity-60 focus-ring-custom",
          active ? "border-accent bg-accent" : "border-line-strong bg-surface-raised",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "inline-block size-4 rounded-pill transition-transform duration-150",
            active ? "translate-x-6 bg-accent-fg" : "translate-x-1 bg-fg-muted",
          )}
        />
      </button>
      <DeleteButton
        action={deleteTrendingItem}
        id={id}
        itemLabel={label}
        label="Remove"
        description="The linked artist or article is not affected."
        iconOnly
        size="sm"
      />
    </div>
  );
}
