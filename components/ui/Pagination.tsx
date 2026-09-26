import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { hrefWithQuery, type QueryInput } from "./href";

export interface PaginationProps {
  /** Current page (1-based). */
  page: number;
  pageCount: number;
  /** Listing path, e.g. "/news". */
  basePath: string;
  /** Other query params to preserve (e.g. `{ category }`). */
  query?: QueryInput;
  /** Query param name (default "page"). Page 1 omits it for a clean canonical URL. */
  pageParam?: string;
  /** Custom href builder (server components only); overrides basePath/query. */
  hrefFor?: (page: number) => string;
  /** aria-label for the nav landmark (default "Pagination"). */
  label?: string;
  className?: string;
}

type PageSlot = number | "gap-start" | "gap-end";

/** 1 … (p-1) p (p+1) … N, always showing first/last. */
function pageSlots(page: number, pageCount: number): PageSlot[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);
  const slots: PageSlot[] = [1];
  if (start > 2) slots.push("gap-start");
  for (let p = start; p <= end; p++) slots.push(p);
  if (end < pageCount - 1) slots.push("gap-end");
  slots.push(pageCount);
  return slots;
}

const pad = (n: number) => String(n).padStart(2, "0");

const STEP =
  "inline-flex min-h-11 items-center gap-2 rounded-pill border px-4 font-mono text-xs uppercase tracking-[0.14em] transition-colors duration-150";

/** Accessible, link-based pagination with prev/next (`rel`) and numbered pages. */
export function Pagination({
  page,
  pageCount,
  basePath,
  query,
  pageParam = "page",
  hrefFor,
  label = "Pagination",
  className,
}: PaginationProps) {
  if (pageCount <= 1) return null;
  const current = Math.min(Math.max(1, Math.trunc(page) || 1), pageCount);
  const href = (p: number) => hrefFor?.(p) ?? hrefWithQuery(basePath, query, { [pageParam]: p > 1 ? p : null });
  const prev = current > 1 ? current - 1 : null;
  const next = current < pageCount ? current + 1 : null;

  return (
    <nav aria-label={label} className={cn("flex items-center justify-between gap-4 border-t border-line pt-6", className)}>
      {prev ? (
        <Link href={href(prev)} rel="prev" className={cn(STEP, "border-line-strong text-fg hover:border-fg")}>
          <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
          <span>
            Prev<span className="sr-only">ious page</span>
          </span>
        </Link>
      ) : (
        <span aria-disabled="true" className={cn(STEP, "border-line text-ink-500")}>
          <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
          Prev
        </span>
      )}

      <p className="font-mono text-xs uppercase tracking-[0.14em] text-fg-muted sm:hidden">
        <span className="sr-only">Page </span>
        <span className="text-fg">{pad(current)}</span> / {pad(pageCount)}
      </p>

      <ol className="hidden items-center gap-1 sm:flex">
        {pageSlots(current, pageCount).map((slot) =>
          typeof slot === "number" ? (
            <li key={slot}>
              {slot === current ? (
                <span
                  aria-current="page"
                  className="inline-flex size-11 items-center justify-center rounded-pill bg-accent font-mono text-sm font-semibold text-accent-fg"
                >
                  <span className="sr-only">Page </span>
                  {pad(slot)}
                </span>
              ) : (
                <Link
                  href={href(slot)}
                  className="inline-flex size-11 items-center justify-center rounded-pill font-mono text-sm text-fg-muted transition-colors duration-150 hover:bg-surface hover:text-fg"
                >
                  <span className="sr-only">Page </span>
                  {pad(slot)}
                </Link>
              )}
            </li>
          ) : (
            <li key={slot} aria-hidden="true" className="px-1 font-mono text-sm text-ink-500">
              …
            </li>
          ),
        )}
      </ol>

      {next ? (
        <Link href={href(next)} rel="next" className={cn(STEP, "border-line-strong text-fg hover:border-fg")}>
          <span>
            Next<span className="sr-only"> page</span>
          </span>
          <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
        </Link>
      ) : (
        <span aria-disabled="true" className={cn(STEP, "border-line text-ink-500")}>
          Next
          <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
        </span>
      )}
    </nav>
  );
}
