/**
 * Helpers for admin list pages (search / filter / pagination via URL search params).
 * Pure functions; usable in server components.
 */
import { escapeRegExp } from "@/lib/utils";

export const ADMIN_PAGE_SIZE = 25;

export type RawSearchParams = Record<string, string | string[] | undefined>;

/** First value of a search param, trimmed ("" when absent). */
export function paramValue(params: RawSearchParams, key: string): string {
  const raw = params[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return (value ?? "").trim();
}

export interface ListParams {
  /** Search text (`?q=`), max 100 chars. */
  q: string;
  /** Filter value (`?status=`), "" when not set. */
  status: string;
  /** 1-based page (`?page=`). */
  page: number;
}

/**
 * Parses `q`, `status` and `page` from awaited searchParams.
 * `allowedStatuses` whitelists the status filter (anything else → "").
 */
export function parseListParams(params: RawSearchParams, allowedStatuses: readonly string[] = []): ListParams {
  const q = paramValue(params, "q").slice(0, 100);
  const statusRaw = paramValue(params, "status");
  const status = allowedStatuses.includes(statusRaw) ? statusRaw : "";
  const pageNum = Number.parseInt(paramValue(params, "page"), 10);
  return { q, status, page: Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1 };
}

/** Case-insensitive "contains" regex for Mongo queries (input is escaped). */
export function searchRegex(q: string): RegExp {
  return new RegExp(escapeRegExp(q), "i");
}

/** skip/limit for a page. */
export function pageWindow(page: number, pageSize = ADMIN_PAGE_SIZE): { skip: number; limit: number } {
  return { skip: (Math.max(1, page) - 1) * pageSize, limit: pageSize };
}

/** Builds `path?…` keeping the given params and dropping blanks (and page=1). */
export function buildListHref(path: string, params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "" || (key === "page" && Number(value) <= 1)) continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}
