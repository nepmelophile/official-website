"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ExternalLink, Star } from "lucide-react";
import { DeleteButton, iconButtonClass, useToast } from "@/components/admin";
import type { ActionResult } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import { deleteArticle, moveArticle, setArticleFeatured, setArticlePublished } from "./actions";

export interface ArticleRowActionsProps {
  id: string;
  title: string;
  slug: string;
  /** status === "published" (live, or scheduled when the publish date is still ahead). */
  published: boolean;
  /** Published and the publish date has passed — the public page exists. */
  live: boolean;
  /** In the homepage picks (HomepageSettings.featuredArticleIds). */
  featured: boolean;
  /** First / last in the overall order (across pages). */
  isFirst: boolean;
  isLast: boolean;
  /** Only in the unfiltered "Position" view (elsewhere neighbours may be hidden, so moving is off). */
  reorderable: boolean;
}

/** Inline controls for an article row: move up / down, view on site, feature on homepage, show / hide, delete. */
export function ArticleRowActions({ id, title, slug, published, live, featured, isFirst, isLast, reorderable }: ArticleRowActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const label = `“${title}”`;
  const moveHint = reorderable ? undefined : "Sort by Position and clear the search and filters to reorder";

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
        onClick={() => run(() => moveArticle(id, "up"), true)}
        disabled={pending || !reorderable || isFirst}
        aria-label={`Move ${label} up`}
        title={moveHint ?? "Move up"}
      >
        <ArrowUp aria-hidden className="size-4" strokeWidth={1.75} />
      </button>
      <button
        type="button"
        className={iconButtonClass}
        onClick={() => run(() => moveArticle(id, "down"), true)}
        disabled={pending || !reorderable || isLast}
        aria-label={`Move ${label} down`}
        title={moveHint ?? "Move down"}
      >
        <ArrowDown aria-hidden className="size-4" strokeWidth={1.75} />
      </button>
      {live ? (
        <a
          href={`/news/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className={iconButtonClass}
          aria-label={`View ${label} on the site (opens in a new tab)`}
          title="View on site"
        >
          <ExternalLink aria-hidden className="size-4" strokeWidth={1.75} />
        </a>
      ) : null}
      <button
        type="button"
        className={cn(iconButtonClass, featured && "border-highlight/50 text-highlight hover:border-highlight hover:text-highlight")}
        onClick={() => run(() => setArticleFeatured(id, !featured))}
        disabled={pending}
        aria-pressed={featured}
        aria-label={`Feature ${label} on the homepage`}
        title={featured ? "On the homepage — click to remove" : "Not on the homepage — click to feature"}
      >
        <Star aria-hidden className={cn("size-4", featured && "fill-current")} strokeWidth={1.75} />
      </button>
      <button
        type="button"
        role="switch"
        aria-checked={published}
        aria-label={`Show ${label} on the site`}
        title={published ? "Published — click to hide (moves it to drafts)" : "Draft — click to publish"}
        disabled={pending}
        onClick={() => run(() => setArticlePublished(id, !published))}
        className={cn(
          "relative mx-1 inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-pill border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-wait disabled:opacity-60 focus-ring-custom",
          published ? "border-accent bg-accent" : "border-line-strong bg-surface-raised",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "inline-block size-4 rounded-pill transition-transform duration-150",
            published ? "translate-x-6 bg-accent-fg" : "translate-x-1 bg-fg-muted",
          )}
        />
      </button>
      <DeleteButton
        action={deleteArticle}
        id={id}
        itemLabel={title}
        iconOnly
        size="sm"
        description="It disappears from the site straight away and is removed from related-article lists."
      />
    </div>
  );
}
