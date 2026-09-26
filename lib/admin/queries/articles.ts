import "server-only";
import { cache } from "react";
import type { QueryFilter } from "mongoose";
import type { RefOption } from "@/components/admin/RefMultiSelect";
import { isObjectId, toObjectIds } from "@/lib/admin/actions";
import { ADMIN_PAGE_SIZE, searchRegex } from "@/lib/admin/list";
import { ARTICLE_CATEGORIES } from "@/lib/constants";
import { connectToDatabase, isDbConfigured } from "@/lib/db";
import { serializeArticle, serializeMedia, toId, toIso } from "@/lib/serialize";
import { escapeRegExp, formatDate } from "@/lib/utils";
import { Article, type ArticleDoc, type ArticleLean } from "@/models/Article";
import type { ArticleDTO, ContentStatus, MediaRef } from "@/types/content";

/*
 * Admin-side article reads (drafts included). Call only after requireAdmin().
 * List/option/meta helpers never throw — they report `error` or fall back to empty values so
 * the admin UI can render a notice. getAdminArticleById() throws on DB failure so the edit page
 * can tell "not found" (null) apart from "database down" (throw).
 */

export const DB_NOT_CONFIGURED_MESSAGE = "MONGODB_URI is not set, so there is no content to manage yet.";
export const DB_UNREACHABLE_MESSAGE = "Could not reach the database. Check that it is running and try again.";

/** Row shape for the /admin/articles table (no body). */
export interface AdminArticleRow {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: ContentStatus;
  author?: string;
  featuredImage?: MediaRef;
  publishedAt: string;
  updatedAt: string;
}

export interface AdminListResult<T> {
  items: T[];
  total: number;
  /** Page actually shown (clamped to the last page). */
  page: number;
  pageCount: number;
  /** Human-readable problem when the DB could not be queried. */
  error?: string;
}

export const ADMIN_ARTICLE_SORTS = ["published", "updated", "title"] as const;
export type AdminArticleSort = (typeof ADMIN_ARTICLE_SORTS)[number];

export function parseArticleSort(value: string | undefined | null): AdminArticleSort {
  return (ADMIN_ARTICLE_SORTS as readonly string[]).includes(value ?? "") ? (value as AdminArticleSort) : "published";
}

const SORTS: Record<AdminArticleSort, Record<string, 1 | -1>> = {
  published: { publishedAt: -1, _id: -1 },
  updated: { updatedAt: -1, _id: -1 },
  title: { title: 1, _id: 1 },
};

export interface AdminArticleListParams {
  /** Free-text search over title, slug, category, tags and author. */
  q?: string;
  status?: ContentStatus | "";
  /** Exact category (case-insensitive). */
  category?: string;
  sort?: AdminArticleSort;
  page?: number;
  pageSize?: number;
}

const ROW_FIELDS = "title slug category status author featuredImage publishedAt updatedAt";

type ArticleRowLean = Pick<
  ArticleLean,
  "_id" | "title" | "slug" | "category" | "status" | "author" | "featuredImage" | "publishedAt" | "updatedAt"
>;

function toRow(doc: ArticleRowLean): AdminArticleRow {
  return {
    id: toId(doc._id),
    title: doc.title,
    slug: doc.slug,
    category: doc.category ?? "",
    status: doc.status,
    author: doc.author || undefined,
    featuredImage: serializeMedia(doc.featuredImage),
    publishedAt: toIso(doc.publishedAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

/** Case-insensitive exact match (for category filters). */
function exactInsensitive(value: string): RegExp {
  return new RegExp(`^${escapeRegExp(value)}$`, "i");
}

/** Paginated admin article list with search, status/category filters and sorting. */
export async function listAdminArticles({
  q = "",
  status = "",
  category = "",
  sort = "published",
  page = 1,
  pageSize = ADMIN_PAGE_SIZE,
}: AdminArticleListParams = {}): Promise<AdminListResult<AdminArticleRow>> {
  const empty: AdminListResult<AdminArticleRow> = { items: [], total: 0, page: 1, pageCount: 0 };
  if (!isDbConfigured()) return { ...empty, error: DB_NOT_CONFIGURED_MESSAGE };

  try {
    await connectToDatabase();
    const filter: QueryFilter<ArticleDoc> = {};
    if (status) filter.status = status;
    if (category) filter.category = exactInsensitive(category);
    if (q) {
      const rx = searchRegex(q);
      filter.$or = [{ title: rx }, { slug: rx }, { category: rx }, { tags: rx }, { author: rx }];
    }

    const total = await Article.countDocuments(filter);
    const pageCount = Math.ceil(total / pageSize);
    const current = Math.min(Math.max(1, Math.floor(page)), Math.max(1, pageCount));
    const docs = await Article.find(filter)
      .select(ROW_FIELDS)
      .sort(SORTS[sort])
      .skip((current - 1) * pageSize)
      .limit(pageSize)
      .lean<ArticleRowLean[]>();

    return { items: docs.map(toRow), total, page: current, pageCount };
  } catch (error) {
    console.error("[melophile admin] listAdminArticles failed", error);
    return { ...empty, error: DB_UNREACHABLE_MESSAGE };
  }
}

/**
 * One article by id, drafts included. Returns null for a malformed or unknown id; throws when
 * the database is unavailable. Cached per request.
 */
export const getAdminArticleById = cache(async (id: string): Promise<ArticleDTO | null> => {
  if (!isObjectId(id)) return null;
  await connectToDatabase();
  const doc = await Article.findById(id).lean<ArticleLean>();
  return doc ? serializeArticle(doc) : null;
});

/** Upper bound of options sent to pickers (the newest articles, plus any explicitly included). */
const OPTION_LIMIT = 1000;

type ArticleOptionLean = Pick<ArticleLean, "_id" | "title" | "status" | "category" | "publishedAt">;

function toOption(doc: ArticleOptionLean): RefOption {
  const parts = [
    doc.status === "draft" ? "Draft" : null,
    doc.category || null,
    formatDate(doc.publishedAt, "medium") || null,
  ].filter(Boolean);
  return { id: toId(doc._id), label: doc.title, description: parts.join(" · ") };
}

export interface ArticleOptionsParams {
  /** Ids that must be present in the options even if older than the limit (current picks). */
  include?: readonly string[];
}

/**
 * Articles as RefMultiSelect / RefSelect options (newest first, drafts marked "Draft").
 * Used by the article/artist forms (related news) and available to other admin sections
 * (homepage featured picks, trending references). Never throws; [] when the DB is unavailable.
 */
export async function getArticleOptions({ include = [] }: ArticleOptionsParams = {}): Promise<RefOption[]> {
  if (!isDbConfigured()) return [];
  try {
    await connectToDatabase();
    const fields = "title status category publishedAt";
    const recent = await Article.find({})
      .select(fields)
      .sort({ publishedAt: -1, _id: -1 })
      .limit(OPTION_LIMIT)
      .lean<ArticleOptionLean[]>();
    const seen = new Set(recent.map((doc) => toId(doc._id)));
    const missing = toObjectIds(include).filter((oid) => !seen.has(oid.toString()));
    const extra = missing.length
      ? await Article.find({ _id: { $in: missing } }).select(fields).lean<ArticleOptionLean[]>()
      : [];
    return [...recent, ...extra].map(toOption);
  } catch (error) {
    console.error("[melophile admin] getArticleOptions failed", error);
    return [];
  }
}

export interface ArticleFormMeta {
  /** Suggested categories first (lib/constants), then any others already in use. */
  categories: string[];
  /** Tags already in use (for TagInput suggestions). */
  tags: string[];
  /** Author names already in use. */
  authors: string[];
}

/** Case-insensitive de-duplication that keeps the first spelling, then sorts the tail. */
function mergeDistinct(preferred: readonly string[], found: readonly unknown[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of preferred) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  const tail: string[] = [];
  for (const value of found) {
    if (typeof value !== "string") continue;
    const text = value.trim();
    const key = text.toLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    tail.push(text);
  }
  return [...out, ...tail.sort((a, b) => a.localeCompare(b))];
}

/** Suggestions for the article form and list filters. Never throws. */
export const getArticleFormMeta = cache(async (): Promise<ArticleFormMeta> => {
  const fallback: ArticleFormMeta = { categories: [...ARTICLE_CATEGORIES], tags: [], authors: [] };
  if (!isDbConfigured()) return fallback;
  try {
    await connectToDatabase();
    const [categories, tags, authors] = await Promise.all([
      Article.distinct("category"),
      Article.distinct("tags"),
      Article.distinct("author"),
    ]);
    return {
      categories: mergeDistinct(ARTICLE_CATEGORIES, categories),
      tags: mergeDistinct([], tags),
      authors: mergeDistinct([], authors),
    };
  } catch (error) {
    console.error("[melophile admin] getArticleFormMeta failed", error);
    return fallback;
  }
});
