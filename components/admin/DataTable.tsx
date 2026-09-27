import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { EmptyState, type EmptyStateProps } from "./EmptyState";

export interface DataTableColumn<T> {
  /** Unique column key. */
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /**
   * The row's main cell (e.g. title): wrapped in a link to `rowHref(row)` whose hit area covers
   * the whole row. Exactly one column should be primary.
   */
  primary?: boolean;
  /** Cell contains its own buttons/links (e.g. DeleteButton): lifted above the row link. */
  interactive?: boolean;
  align?: "left" | "right" | "center";
  /** Hide the column below this breakpoint. */
  hideBelow?: "sm" | "md" | "lg";
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  rows: readonly T[];
  columns: readonly DataTableColumn<T>[];
  rowKey: (row: T) => string;
  /** Edit URL for a row (makes the whole row clickable via the primary cell's link). */
  rowHref?: (row: T) => string;
  /** Accessible table caption (visually hidden). */
  caption: string;
  /** Shown instead of the table when `rows` is empty. */
  empty?: EmptyStateProps;
  /** Highlight a row (e.g. unread messages). */
  rowClassName?: (row: T) => string | undefined;
}

const HIDE: Record<NonNullable<DataTableColumn<unknown>["hideBelow"]>, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
};

const ALIGN = { left: "text-left", right: "text-right", center: "text-center" } as const;

/**
 * Admin list table (server component — column `cell` functions run on the server). Rows link to
 * their edit page; header row in mono caps; hover highlight; 44px min row height.
 */
export function DataTable<T>({ rows, columns, rowKey, rowHref, caption, empty, rowClassName }: DataTableProps<T>) {
  if (rows.length === 0) {
    return <EmptyState {...(empty ?? { title: "Nothing here yet" })} />;
  }

  return (
    // `relative`: absolutely positioned descendants (sr-only header labels, row-link overlays) use
    // this scroll box as their containing block, so they are clipped instead of widening the page.
    <div className="relative overflow-x-auto rounded-md border border-line bg-bg">
      <table className="w-full min-w-[36rem] border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line bg-bg-alt">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  "px-4 py-2.5 font-mono text-[0.6875rem] font-normal uppercase tracking-[0.12em] whitespace-nowrap text-fg-subtle",
                  ALIGN[col.align ?? "left"],
                  col.hideBelow && HIDE[col.hideBelow],
                  col.headerClassName,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const href = rowHref?.(row);
            return (
              <tr
                key={rowKey(row)}
                className={cn(
                  "relative border-b border-line transition-colors duration-150 last:border-b-0 hover:bg-surface focus-within:bg-surface",
                  rowClassName?.(row),
                )}
              >
                {columns.map((col) => {
                  const content = col.cell(row);
                  return (
                    <td
                      key={col.key}
                      className={cn(
                        "h-11 px-4 py-2.5 align-middle text-fg-muted",
                        ALIGN[col.align ?? "left"],
                        col.hideBelow && HIDE[col.hideBelow],
                        col.primary && "font-medium text-fg",
                        col.interactive && "relative z-10",
                        col.className,
                      )}
                    >
                      {col.primary && href ? (
                        <Link
                          href={href}
                          className="after:absolute after:inset-0 hover:text-orchid-300 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-highlight focus-visible:after:ring-inset focus-ring-custom"
                        >
                          {content}
                        </Link>
                      ) : (
                        content
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
