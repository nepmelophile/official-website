import "server-only";
import { hrefWithQuery } from "@/components/ui/href";
import { NEWS_PAGE_SIZE } from "@/lib/constants";
import { getArticleCategories, getArticleTags, getPublishedArticles } from "@/lib/queries/articles";
import { slugify } from "@/lib/utils";
import type { ArticleSummary, Paginated } from "@/types/content";
import { NEWS_DEFAULT_COPY, categoryCopy, humanizeSlug, tagCopy, type ListingCopy } from "./news-copy";

export type NewsSearchParams = Record<string, string | string[] | undefined>;

/** Longest filter value we bother matching (anything longer cannot be a real category/tag). */
const MAX_FILTER_LENGTH = 80;
/** Upper bound for ?page= so absurd numbers never reach the database as huge skips. */
const MAX_PAGE = 10_000;

export interface NewsListing {
  /** Resolved stored category label, or null. */
  category: string | null;
  /** URL value for the category filter (slug of the label, or of the raw param when unknown). */
  categorySlug: string | null;
  /** Resolved stored tag label, or null. */
  tag: string | null;
  tagSlug: string | null;
  /** Display label for the tag (stored label, or a humanised fallback when unknown). */
  tagLabel: string | null;
  /** Display label for the category (stored label, or a humanised fallback when unknown). */
  categoryLabel: string | null;
  /** Requested page (sanitised, >= 1). */
  page: number;
  /** Categories that have published articles (for the filter chips). */
  categories: string[];
  result: Paginated<ArticleSummary>;
  /** A filter was given that matches no published category/tag. */
  unknownFilter: boolean;
  /** The page is past the last page of a non-empty result. */
  outOfRange: boolean;
  hasFilters: boolean;
  copy: ListingCopy;
  /** Normalised path for this view (canonical): /news?category=…&tag=…&page=… */
  path: string;
}

function firstValue(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed.slice(0, MAX_FILTER_LENGTH) : null;
}

/** "3" → 3; anything that is not a plain positive integer ("0", "-2", "1.5", "abc") → 1. */
export function parsePage(value: string | string[] | undefined): number {
  const raw = firstValue(value);
  if (!raw || !/^\d{1,7}$/.test(raw)) return 1;
  const page = Number.parseInt(raw, 10);
  return page >= 1 ? Math.min(page, MAX_PAGE) : 1;
}

const toKey = (value: string) => slugify(value) || value.toLowerCase();

/** Finds the stored label whose slug matches the URL value (labels and slugs both accepted). */
function resolveLabel(options: readonly string[], raw: string | null): string | null {
  if (!raw) return null;
  const key = toKey(raw);
  return options.find((option) => toKey(option) === key) ?? null;
}

/**
 * Parses /news search params and loads the matching page of articles. Shared by
 * generateMetadata and the page; every query underneath is request-memoised, so the database
 * is hit once per request.
 */
export async function loadNewsListing(searchParams: NewsSearchParams): Promise<NewsListing> {
  const rawCategory = firstValue(searchParams.category);
  const rawTag = firstValue(searchParams.tag);
  const page = parsePage(searchParams.page);

  const [categories, tags] = await Promise.all([
    getArticleCategories(),
    rawTag ? getArticleTags() : Promise.resolve<string[]>([]),
  ]);

  const category = resolveLabel(categories, rawCategory);
  const tag = resolveLabel(tags, rawTag);
  const unknownFilter = Boolean((rawCategory && !category) || (rawTag && !tag));

  const result: Paginated<ArticleSummary> = unknownFilter
    ? { items: [], total: 0, page, pageCount: 0 }
    : await getPublishedArticles({ category, tag, page, pageSize: NEWS_PAGE_SIZE });

  const categoryLabel = category ?? (rawCategory ? humanizeSlug(rawCategory) : null);
  const tagLabel = tag ?? (rawTag ? humanizeSlug(rawTag) : null);
  const categorySlug = rawCategory ? toKey(category ?? rawCategory) : null;
  const tagSlug = rawTag ? toKey(tag ?? rawTag) : null;

  const copy = tagLabel
    ? tagCopy(tagLabel, categoryLabel)
    : categoryLabel
      ? categoryCopy(categoryLabel)
      : NEWS_DEFAULT_COPY;

  return {
    category,
    categorySlug,
    categoryLabel,
    tag,
    tagSlug,
    tagLabel,
    page,
    categories,
    result,
    unknownFilter,
    outOfRange: result.total > 0 && page > result.pageCount,
    hasFilters: Boolean(rawCategory || rawTag),
    copy,
    path: hrefWithQuery("/news", { category: categorySlug, tag: tagSlug, page: page > 1 ? page : null }),
  };
}
