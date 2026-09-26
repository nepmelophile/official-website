import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildListHref } from "@/lib/admin/list";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  page: number;
  pageCount: number;
  /** List path, e.g. "/admin/articles". */
  basePath: string;
  /** Other params to keep (q, status…). */
  params?: Record<string, string | undefined>;
  total?: number;
}

const linkClass =
  "inline-flex min-h-9 items-center gap-1 rounded-pill border border-line-strong px-3 text-xs font-semibold text-fg transition-colors duration-150 hover:border-fg";

/** Previous / next pager for admin lists (server component). Renders nothing for one page. */
export function Pagination({ page, pageCount, basePath, params = {}, total }: PaginationProps) {
  if (pageCount <= 1) return null;
  const prev = page > 1 ? buildListHref(basePath, { ...params, page: page - 1 }) : null;
  const next = page < pageCount ? buildListHref(basePath, { ...params, page: page + 1 }) : null;
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-3">
      <p className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-fg-subtle tabular-nums">
        Page {page} of {pageCount}
        {total !== undefined ? ` · ${total} total` : ""}
      </p>
      <div className="flex gap-2">
        {prev ? (
          <Link href={prev} className={linkClass} rel="prev">
            <ChevronLeft aria-hidden className="size-4" strokeWidth={1.75} /> Previous
          </Link>
        ) : (
          <span aria-disabled className={cn(linkClass, "pointer-events-none opacity-40")}>
            <ChevronLeft aria-hidden className="size-4" strokeWidth={1.75} /> Previous
          </span>
        )}
        {next ? (
          <Link href={next} className={linkClass} rel="next">
            Next <ChevronRight aria-hidden className="size-4" strokeWidth={1.75} />
          </Link>
        ) : (
          <span aria-disabled className={cn(linkClass, "pointer-events-none opacity-40")}>
            Next <ChevronRight aria-hidden className="size-4" strokeWidth={1.75} />
          </span>
        )}
      </div>
    </nav>
  );
}
