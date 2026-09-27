"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Star } from "lucide-react";
import { DeleteButton, iconButtonClass, useToast } from "@/components/admin";
import type { ActionResult } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import { deleteTestimonial, moveTestimonial, setTestimonialActive, setTestimonialFeatured } from "./actions";

export interface TestimonialRowActionsProps {
  id: string;
  /** Person's name, used in accessible labels and the delete dialog. */
  name: string;
  active: boolean;
  featured: boolean;
  isFirst: boolean;
  isLast: boolean;
  /** False while the list is searched / filtered (neighbours may be hidden, so moving is off). */
  reorderable: boolean;
}

/** Inline controls for a testimonial row: move up / down, feature, show / hide, delete. */
export function TestimonialRowActions({ id, name, active, featured, isFirst, isLast, reorderable }: TestimonialRowActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const label = `${name}’s testimonial`;
  const moveHint = reorderable ? undefined : "Clear the search and filters to reorder";

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
        onClick={() => run(() => moveTestimonial(id, "up"), true)}
        disabled={pending || !reorderable || isFirst}
        aria-label={`Move ${label} up`}
        title={moveHint ?? "Move up"}
      >
        <ArrowUp aria-hidden className="size-4" strokeWidth={1.75} />
      </button>
      <button
        type="button"
        className={iconButtonClass}
        onClick={() => run(() => moveTestimonial(id, "down"), true)}
        disabled={pending || !reorderable || isLast}
        aria-label={`Move ${label} down`}
        title={moveHint ?? "Move down"}
      >
        <ArrowDown aria-hidden className="size-4" strokeWidth={1.75} />
      </button>
      <button
        type="button"
        className={cn(iconButtonClass, featured && "border-highlight/50 text-highlight hover:border-highlight hover:text-highlight")}
        onClick={() => run(() => setTestimonialFeatured(id, !featured))}
        disabled={pending}
        aria-pressed={featured}
        aria-label={`Feature ${label} on the testimonials page`}
        title={featured ? "Featured — click to unfeature" : "Not featured — click to feature"}
      >
        <Star aria-hidden className={cn("size-4", featured && "fill-current")} strokeWidth={1.75} />
      </button>
      <button
        type="button"
        role="switch"
        aria-checked={active}
        aria-label={`Show ${label} on the site`}
        title={active ? "Active — click to hide" : "Hidden — click to show"}
        disabled={pending}
        onClick={() => run(() => setTestimonialActive(id, !active))}
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
      <DeleteButton action={deleteTestimonial} id={id} itemLabel={label} iconOnly size="sm" />
    </div>
  );
}
