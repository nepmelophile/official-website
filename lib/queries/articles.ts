import "server-only";
import { cache } from "react";
import type { QueryFilter } from "mongoose";
import { ARTICLE_CATEGORIES, HOME_LATEST_NEWS_COUNT, NEWS_PAGE_SIZE, RELATED_ARTICLES_COUNT } from "@/lib/constants";
import { connectToDatabase, isDbConfigured } from "@/lib/db";
import { ARTICLE_DISPLAY_SORT, Article, type ArticleDoc, type ArticleLean } from "@/models/Article";
import { serializeArticle, serializeArticleSummary, toIso } from "@/lib/serialize";
import type { ArticleDTO, ArticleSummary, Paginated } from "@/types/content";
import { isObjectIdString, looseMatch, orderByIds, safeQuery } from "./safe";
import { getHomepageSettings } from "./settings";

/** Fields needed for cards/listings (excludes the markdown body). */
const SUMMARY_FIELDS = "title slug featuredImage excerpt category tags author publishedAt";

/** Published and not scheduled in the future. */
function publishedFilter(): QueryFilter<ArticleDoc> {
  return { status: "published", publishedAt: { $lte: new Date() } };
}

export interface GetPublishedArticlesOptions {
  /** Category label or its slug ("industry", "News"). Case-insensitive. */
  category?: string | null;
  /** Tag label or its slug ("folk-pop", "Folk Pop"). Case-insensitive. */
  tag?: string | null;
  /** 1-based page number (clamped to >= 1). */
  page?: number;
  pageSize?: number;
}

/**
 * Cached on primitive arguments so repeated calls in one request (generateMetadata + page)
 * share a single round-trip — React `cache` compares object arguments by reference.
 */
const queryPublishedArticles = cache(
  async (category: string, tag: string, page: number, size: number): Promise<Paginated<ArticleSummary>> => {
    const empty: Paginated<ArticleSummary> = { items: [], total: 0, page, pageCount: 0 };

    return safeQuery("getPublishedArticles", empty, async () => {
      const filter = publishedFilter();
      if (category) filter.category = looseMatch(category);
      if (tag) filter.tags = looseMatch(tag);

      const [total, docs] = await Promise.all([
        Article.countDocuments(filter),
        Article.find(filter)
          .select(SUMMARY_FIELDS)
          .sort(ARTICLE_DISPLAY_SORT)
          .skip((page - 1) * size)
          .limit(size)
          .lean<ArticleLean[]>(),
      ]);

      return {
        items: docs.map(serializeArticleSummary),
        total,
        page,
        pageCount: Math.ceil(total / size),
      };
    });
  },
);

/** Paginated published articles, newest first, optionally filtered by category and/or tag. */
export async function getPublishedArticles({
  category,
  tag,
  page = 1,
  pageSize = NEWS_PAGE_SIZE,
}: GetPublishedArticlesOptions = {}): Promise<Paginated<ArticleSummary>> {
  const safePage = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
  const size = Number.isFinite(pageSize) ? Math.min(Math.max(1, Math.floor(pageSize)), 48) : NEWS_PAGE_SIZE;
  return queryPublishedArticles(category?.trim() ?? "", tag?.trim() ?? "", safePage, size);
}

/** Published articles in display order — the admin's manual order, then newest (home page "Latest news" top-up). */
export const getLatestArticles = cache(async (limit: number = HOME_LATEST_NEWS_COUNT): Promise<ArticleSummary[]> => {
  return safeQuery("getLatestArticles", [], async () => {
    const docs = await Article.find(publishedFilter())
      .select(SUMMARY_FIELDS)
      .sort(ARTICLE_DISPLAY_SORT)
      .limit(limit)
      .lean<ArticleLean[]>();
    return docs.map(serializeArticleSummary);
  });
});

async function findPublishedArticleBySlug(slug: string): Promise<ArticleDTO | null> {
  const doc = await Article.findOne({ ...publishedFilter(), slug: slug.trim().toLowerCase() }).lean<ArticleLean>();
  return doc ? serializeArticle(doc) : null;
}

/** A single published article by slug, or null. */
export const getArticleBySlug = cache(async (slug: string): Promise<ArticleDTO | null> => {
  if (!slug) return null;
  return safeQuery("getArticleBySlug", null, () => findPublishedArticleBySlug(slug));
});

/**
 * Like getArticleBySlug, but when a database IS configured, connection/query failures are
 * rethrown instead of being turned into `null`. The ISR article page uses this so a transient
 * outage during background regeneration keeps serving the last good page (Next keeps the stale
 * entry when rendering throws) instead of caching a 404 for the whole revalidate window.
 * Without MONGODB_URI, or during `next build`, it degrades to `null` like the safe variant.
 */
export const getArticleBySlugStrict = cache(async (slug: string): Promise<ArticleDTO | null> => {
  if (!slug || !isDbConfigured()) return null;
  if (process.env.NEXT_PHASE === "phase-production-build") return getArticleBySlug(slug);
  await connectToDatabase();
  return findPublishedArticleBySlug(slug);
});

/** Published articles by id, in the given order (unpublished/missing ids are dropped). */
export const getArticlesByIds = cache(async (ids: readonly string[]): Promise<ArticleSummary[]> => {
  const validIds = ids.filter(isObjectIdString);
  if (validIds.length === 0) return [];
  return safeQuery("getArticlesByIds", [], async () => {
    const docs = await Article.find({ ...publishedFilter(), _id: { $in: validIds } })
      .select(SUMMARY_FIELDS)
      .lean<ArticleLean[]>();
    return orderByIds(docs.map(serializeArticleSummary), validIds);
  });
});

/**
 * Home page featured articles: HomepageSettings.featuredArticleIds when set,
 * otherwise the latest published articles.
 */
export const getFeaturedArticles = cache(async (limit: number = HOME_LATEST_NEWS_COUNT): Promise<ArticleSummary[]> => {
  const settings = await getHomepageSettings();
  if (settings.featuredArticleIds.length > 0) {
    const picked = await getArticlesByIds(settings.featuredArticleIds);
    if (picked.length > 0) return picked.slice(0, limit);
  }
  return getLatestArticles(limit);
});

/** Distinct categories that have published articles, suggested categories first. */
export const getArticleCategories = cache(async (): Promise<string[]> => {
  return safeQuery("getArticleCategories", [], async () => {
    const categories = (await Article.distinct("category", publishedFilter())) as string[];
    const known: readonly string[] = ARTICLE_CATEGORIES;
    return categories
      .filter((c): c is string => typeof c === "string" && c.trim().length > 0)
      .sort((a, b) => {
        const ia = known.indexOf(a);
        const ib = known.indexOf(b);
        if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
        return a.localeCompare(b);
      });
  });
});

/** Distinct tags used by published articles, alphabetically (case-insensitive). */
export const getArticleTags = cache(async (): Promise<string[]> => {
  return safeQuery("getArticleTags", [], async () => {
    const tags = (await Article.distinct("tags", publishedFilter())) as unknown[];
    return tags
      .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
      .sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
  });
});

/**
 * Related articles: explicit relatedArticleIds first, then filled with the most recent
 * articles sharing the category or a tag. Never includes the article itself.
 */
export async function getRelatedArticles(
  article: Pick<ArticleDTO, "id" | "relatedArticleIds" | "category" | "tags">,
  limit: number = RELATED_ARTICLES_COUNT,
): Promise<ArticleSummary[]> {
  const explicit = (await getArticlesByIds(article.relatedArticleIds)).filter((a) => a.id !== article.id);
  if (explicit.length >= limit) return explicit.slice(0, limit);

  const exclude = [article.id, ...explicit.map((a) => a.id)].filter(isObjectIdString);
  const fill = await safeQuery("getRelatedArticles", [] as ArticleSummary[], async () => {
    const or: QueryFilter<ArticleDoc>[] = [];
    if (article.category) or.push({ category: article.category });
    if (article.tags.length > 0) or.push({ tags: { $in: article.tags } });
    const filter: QueryFilter<ArticleDoc> = { ...publishedFilter(), _id: { $nin: exclude } };
    if (or.length > 0) filter.$or = or;

    const docs = await Article.find(filter)
      .select(SUMMARY_FIELDS)
      .sort({ publishedAt: -1 })
      .limit(limit - explicit.length)
      .lean<ArticleLean[]>();
    return docs.map(serializeArticleSummary);
  });

  return [...explicit, ...fill].slice(0, limit);
}

/** All published article slugs (for generateStaticParams). Returns [] without a DB. */
export async function getAllArticleSlugs(): Promise<string[]> {
  return safeQuery("getAllArticleSlugs", [], async () => {
    const docs = await Article.find(publishedFilter()).select("slug").lean<Pick<ArticleLean, "_id" | "slug">[]>();
    return docs.map((d) => d.slug);
  });
}

/** Slugs + last-modified dates for sitemap.ts. */
export async function getArticleSitemapEntries(): Promise<{ slug: string; lastModified: string }[]> {
  return safeQuery("getArticleSitemapEntries", [], async () => {
    const docs = await Article.find(publishedFilter())
      .select("slug updatedAt publishedAt")
      .lean<Pick<ArticleLean, "_id" | "slug" | "updatedAt" | "publishedAt">[]>();
    return docs.map((d) => ({ slug: d.slug, lastModified: toIso(d.updatedAt ?? d.publishedAt) }));
  });
}
