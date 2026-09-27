import Link from "next/link";
import { cn, slugify } from "@/lib/utils";
import { hrefWithQuery, type QueryInput } from "./href";

export type FilterOption = string | { label: string; value: string };

export interface FilterChipsProps {
  /** Labels (value = slugify(label)) or explicit {label, value} pairs. */
  options: readonly FilterOption[];
  /** Current value from searchParams (label or slug; compared by slug, case-insensitive). */
  active?: string | null;
  /** Listing path, e.g. "/news". */
  basePath: string;
  /** Query param, e.g. "category" or "genre". */
  param: string;
  /** Other params to keep. Pagination ("page") is always reset. */
  query?: QueryInput;
  /** Label of the reset chip (default "All"); pass null to hide it. */
  allLabel?: string | null;
  /** Accessible name of the filter nav, e.g. "Filter by category". */
  label: string;
  className?: string;
}

function normalise(option: FilterOption): { label: string; value: string } {
  return typeof option === "string" ? { label: option, value: slugify(option) || option } : option;
}

const CHIP =
  "inline-flex min-h-11 shrink-0 snap-start items-center gap-2 rounded-pill border px-4 font-mono text-xs uppercase tracking-[0.14em] whitespace-nowrap transition-colors duration-150";

/**
 * Link-based filter chips (works without JS, shareable URLs). The active chip gets
 * `aria-current="page"` plus a dot, so colour is never the only signal. Scrolls horizontally on
 * small screens.
 */
export function FilterChips({
  options,
  active,
  basePath,
  param,
  query,
  allLabel = "All",
  label,
  className,
}: FilterChipsProps) {
  const items = options.map(normalise);
  const activeKey = active ? slugify(active) || active.toLowerCase() : null;
  const isActive = (value: string) => activeKey !== null && (slugify(value) || value.toLowerCase()) === activeKey;
  const anyActive = items.some((o) => isActive(o.value));
  const base = { ...query, page: null };

  const chip = (key: string, text: string, href: string, current: boolean) => (
    <li key={key}>
      <Link
        href={href}
        aria-current={current ? "page" : undefined}
        scroll={false}
        className={cn(
          CHIP,
          current
            ? "border-accent bg-orchid-900 text-orchid-300"
            : "border-line text-fg-muted hover:border-line-strong hover:text-fg",
        )}
      >
        {current ? <span aria-hidden="true" className="size-1.5 rounded-pill bg-orchid-400" /> : null}
        {text}
      </Link>
    </li>
  );

  return (
    <nav aria-label={label} className={cn("relative", className)}>
      <ul className="-mx-gutter flex snap-x scroll-px-gutter gap-2 overflow-x-auto px-gutter pb-2 [scrollbar-width:thin] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {allLabel !== null ? chip("__all", allLabel, hrefWithQuery(basePath, base, { [param]: null }), !anyActive) : null}
        {items.map((o) => chip(o.value, o.label, hrefWithQuery(basePath, base, { [param]: o.value }), isActive(o.value)))}
      </ul>
    </nav>
  );
}
