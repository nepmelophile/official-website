import { clsx, type ClassValue } from "clsx";

/** Merge conditional class names (clsx). */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/**
 * URL-safe slug: lowercase ASCII, words joined by single hyphens.
 * Diacritics are stripped; Devanagari and other non-Latin characters are dropped, so callers
 * should fall back to a manual slug when the result is empty.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 120)
    .replace(/-+$/g, "");
}

type DateStyle = "long" | "medium" | "short" | "month-year";

const DATE_FORMATS: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  long: { day: "numeric", month: "long", year: "numeric" },
  medium: { day: "numeric", month: "short", year: "numeric" },
  short: { day: "numeric", month: "short" },
  "month-year": { month: "long", year: "numeric" },
};

const formatterCache = new Map<DateStyle, Intl.DateTimeFormat>();

/**
 * Formats a date deterministically on server and client (fixed en-US month names,
 * Asia/Kathmandu time zone, day-month-year order), so hydration never mismatches.
 * long → "12 September 2026", medium → "12 Sep 2026", short → "12 Sep",
 * month-year → "September 2026". Returns "" for invalid input.
 */
export function formatDate(value: string | Date | null | undefined, style: DateStyle = "long"): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  let formatter = formatterCache.get(style);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", { ...DATE_FORMATS[style], timeZone: "Asia/Kathmandu" });
    formatterCache.set(style, formatter);
  }
  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value;
  return [get("day"), get("month"), get("year")].filter(Boolean).join(" ");
}

/** ISO date (YYYY-MM-DD) in Asia/Kathmandu — for <time dateTime> and date inputs. */
export function toDateInputValue(value: string | Date | null | undefined): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Kathmandu",
  }).format(date);
}

/** Truncate text to `max` characters on a word boundary, appending an ellipsis. */
export function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, Math.max(0, max - 1));
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s.,;:!?-]+$/, "")}…`;
}

/** Strip common markdown syntax to plain text (for excerpts / meta descriptions). */
export function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, "")
    .replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** Estimated reading time in whole minutes (min 1) at ~220 wpm. */
export function readingTime(markdown: string): number {
  const words = stripMarkdown(markdown).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

/** Compact number formatting, e.g. 12500 → "12.5K". Deterministic locale. */
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

/** Escape a string for safe use inside a RegExp. */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** True for absolute http(s) URLs. */
export function isExternalUrl(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
