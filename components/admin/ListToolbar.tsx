"use client";

import { useId, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { inputClass } from "./styles";

export interface ListFilter {
  /** Search param name, e.g. "status". */
  param: string;
  label: string;
  options: readonly { value: string; label: string }[];
  /** Label of the "no filter" option (default "All"). */
  allLabel?: string;
}

export interface ListToolbarProps {
  searchPlaceholder?: string;
  /** Set false to hide the search box. */
  search?: boolean;
  filters?: readonly ListFilter[];
  className?: string;
}

/**
 * Search box (`?q=`, debounced) + filter selects that update the URL; the server list page
 * re-renders with the new searchParams. Changing anything resets `?page`.
 */
export function ListToolbar({ searchPlaceholder = "Search…", search = true, filters = [], className }: ListToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchId = useId();

  function navigate(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    const qs = params.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  function onSearchChange(value: string) {
    setQuery(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => navigate({ q: value.trim() }), 300);
  }

  return (
    <div
      role="search"
      className={cn("mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end", className)}
      aria-busy={pending || undefined}
    >
      {search ? (
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <label htmlFor={searchId} className="sr-only">
            {searchPlaceholder}
          </label>
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle" strokeWidth={1.75} />
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (timer.current) clearTimeout(timer.current);
                navigate({ q: query.trim() });
              }
            }}
            placeholder={searchPlaceholder}
            autoComplete="off"
            className={cn(inputClass, "pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden")}
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                if (timer.current) clearTimeout(timer.current);
                setQuery("");
                navigate({ q: "" });
              }}
              aria-label="Clear search"
              className="absolute top-1/2 right-1.5 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-xs text-fg-subtle hover:text-fg"
            >
              <X aria-hidden className="size-4" strokeWidth={1.75} />
            </button>
          ) : null}
        </div>
      ) : null}

      {filters.map((filter) => {
        const filterId = `${searchId}-${filter.param}`;
        return (
          <div key={filter.param} className="flex items-center gap-2">
            <label htmlFor={filterId} className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-fg-subtle">
              {filter.label}
            </label>
            <select
              id={filterId}
              value={searchParams.get(filter.param) ?? ""}
              onChange={(e) => navigate({ [filter.param]: e.target.value })}
              className={cn(inputClass, "w-auto cursor-pointer pr-8")}
            >
              <option value="">{filter.allLabel ?? "All"}</option>
              {filter.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        );
      })}

      {pending ? (
        <LoaderCircle aria-label="Updating results" className="size-4 animate-spin self-center text-fg-subtle" strokeWidth={1.75} />
      ) : null}
    </div>
  );
}
