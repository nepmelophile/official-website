"use server";

import type { Types } from "mongoose";
import {
  fail,
  ok,
  parseInput,
  toMongoUpdate,
  toObjectIdOrThrow,
  toObjectIds,
  withAdmin,
  type ActionFailure,
  type ActionResult,
} from "@/lib/admin/actions";
import { DEFAULT_HOMEPAGE_SETTINGS, HOME_LATEST_NEWS_COUNT } from "@/lib/constants";
import { revalidateArticles, revalidateHomepage } from "@/lib/revalidate";
import { articleFlagSchema, articleMoveSchema, articleSchema } from "@/lib/validators/article";
import { escapeRegExp, formatDate } from "@/lib/utils";
import { ARTICLE_DISPLAY_SORT, Article } from "@/models/Article";
import { Artist } from "@/models/Artist";
import { HomepageSettings } from "@/models/HomepageSettings";
import { SINGLETON_KEY } from "@/models/shared";
import { TrendingItem } from "@/models/TrendingItem";

/*
 * Article CRUD. Every action runs inside withAdmin() (session check + DB connect + error
 * mapping), validates with articleSchema and revalidates the public pages after a write.
 */

/** Optional fields that must be $unset (not ignored) when cleared in the form. */
const OPTIONAL_KEYS = ["author", "metaTitle", "metaDescription"] as const;

export interface ArticleSaveResult {
  id: string;
  slug: string;
}

/** Suggests the next free "<slug>-N" for a taken slug. */
async function suggestFreeSlug(slug: string, excludeId?: Types.ObjectId): Promise<string> {
  const base = slug.replace(/-\d+$/, "") || slug;
  const pattern = new RegExp(`^${escapeRegExp(base)}(?:-(\\d+))?$`);
  const filter = excludeId ? { slug: pattern, _id: { $ne: excludeId } } : { slug: pattern };
  const taken = await Article.find(filter).select("slug").lean<{ slug: string }[]>();
  let highest = 1;
  for (const doc of taken) {
    const n = Number(pattern.exec(doc.slug)?.[1] ?? 1);
    if (n > highest) highest = n;
  }
  return `${base}-${highest + 1}`.slice(0, 120);
}

/** Friendly slug-taken failure (checked before writing; E11000 stays the race-safe backstop). */
async function slugConflict(slug: string, excludeId?: Types.ObjectId): Promise<ActionFailure | null> {
  const exists = await Article.exists(excludeId ? { slug, _id: { $ne: excludeId } } : { slug });
  if (!exists) return null;
  const suggestion = await suggestFreeSlug(slug, excludeId);
  return fail("That slug is already in use.", {
    slug: [`Another article already uses “${slug}”. Try “${suggestion}”.`],
  });
}

/** Keeps only related ids that exist and are not the article itself, in the chosen order. */
async function cleanRelatedIds(ids: readonly string[], selfId?: string): Promise<Types.ObjectId[]> {
  const self = selfId?.toLowerCase();
  const candidates = toObjectIds(ids).filter((oid) => oid.toString() !== self);
  if (candidates.length === 0) return [];
  const existing = await Article.find({ _id: { $in: candidates } }).select("_id").lean<{ _id: Types.ObjectId }[]>();
  const found = new Set(existing.map((doc) => doc._id.toString()));
  return candidates.filter((oid) => found.has(oid.toString()));
}

/* ------------------------------------------------------------------ */
/* Manual order                                                        */
/* ------------------------------------------------------------------ */

interface OrderedArticle {
  _id: Types.ObjectId;
  order?: number;
}

/** Every article (drafts too) in display order — the same sort as the admin list and /news. */
async function loadOrderedArticles(): Promise<OrderedArticle[]> {
  return Article.find({}, { order: 1 }).sort(ARTICLE_DISPLAY_SORT).lean<OrderedArticle[]>();
}

/** Writes order 1…n for the given sequence (only documents whose number changes). */
async function writeArticleOrder(ordered: OrderedArticle[]): Promise<void> {
  const ops = ordered.flatMap((doc, i) =>
    doc.order === i + 1 ? [] : [{ updateOne: { filter: { _id: doc._id }, update: { $set: { order: i + 1 } } } }],
  );
  if (ops.length > 0) await Article.bulkWrite(ops);
}

/**
 * Order number for a new article so it lands at the top. The first time ordering is used,
 * existing (unnumbered) articles are numbered 1…n in their current date order.
 */
async function topArticleOrder(): Promise<number> {
  const ordered = await loadOrderedArticles();
  if (ordered.length === 0) return 1;
  if (ordered.some((doc) => doc.order == null)) {
    await writeArticleOrder(ordered);
    return 0;
  }
  return Math.min(...ordered.map((doc) => doc.order as number)) - 1;
}

export async function createArticle(input: unknown): Promise<ActionResult<ArticleSaveResult>> {
  return withAdmin(async () => {
    const parsed = parseInput(articleSchema, input);
    if (!parsed.ok) return parsed;
    const data = parsed.data;

    const conflict = await slugConflict(data.slug);
    if (conflict) return conflict;

    const doc = await Article.create({
      ...data,
      relatedArticleIds: await cleanRelatedIds(data.relatedArticleIds),
      order: await topArticleOrder(),
    });
    revalidateArticles(doc.slug);
    return ok(
      { id: doc._id.toString(), slug: doc.slug },
      doc.status === "published" ? "Article published" : "Draft created",
    );
  });
}

export async function updateArticle(id: string, input: unknown): Promise<ActionResult<ArticleSaveResult>> {
  return withAdmin(async () => {
    const oid = toObjectIdOrThrow(id);
    const parsed = parseInput(articleSchema, input);
    if (!parsed.ok) return parsed;
    const data = parsed.data;

    const before = await Article.findById(oid).select("slug status").lean<{ slug: string; status: string }>();
    if (!before) return fail("This article no longer exists — it may have been deleted in another tab.");

    const conflict = await slugConflict(data.slug, oid);
    if (conflict) return conflict;

    const relatedArticleIds = await cleanRelatedIds(data.relatedArticleIds, id);
    const doc = await Article.findByIdAndUpdate(oid, toMongoUpdate({ ...data, relatedArticleIds }, OPTIONAL_KEYS), {
      returnDocument: "after",
      runValidators: true,
    })
      .select("slug status")
      .lean<{ slug: string; status: string }>();
    if (!doc) return fail("This article no longer exists — it may have been deleted in another tab.");

    revalidateArticles(doc.slug);
    if (before.slug !== doc.slug) revalidateArticles(before.slug);

    let message = "Changes saved";
    if (before.status !== doc.status) message = doc.status === "published" ? "Article published" : "Article moved back to drafts";
    return ok({ id, slug: doc.slug }, message);
  });
}

export async function deleteArticle(id: string): Promise<ActionResult> {
  return withAdmin(async () => {
    const oid = toObjectIdOrThrow(id);
    const doc = await Article.findByIdAndDelete(oid).select("title slug").lean<{ title: string; slug: string }>();
    if (!doc) return fail("This article was already deleted.");

    // Drop dangling references so pickers and public "related" lists stay clean.
    const cleanup = await Promise.allSettled([
      Article.updateMany({ relatedArticleIds: oid }, { $pull: { relatedArticleIds: oid } }),
      Artist.updateMany({ relatedArticleIds: oid }, { $pull: { relatedArticleIds: oid } }),
      HomepageSettings.updateMany({ featuredArticleIds: oid }, { $pull: { featuredArticleIds: oid } }),
      // Retire trending items that pointed at it (cards with their own manual title keep showing).
      TrendingItem.updateMany(
        { refId: oid, title: { $in: [null, ""] } },
        { $set: { active: false } },
      ),
    ]);
    for (const result of cleanup) {
      if (result.status === "rejected") console.error("[melophile admin] article reference cleanup failed", result.reason);
    }

    revalidateArticles(doc.slug);
    return ok(undefined, `Deleted “${doc.title}”`);
  });
}

/* ------------------------------------------------------------------ */
/* Inline list actions                                                 */
/* ------------------------------------------------------------------ */

/**
 * Show / hide an article on the site without opening it: flips status between published
 * and draft. The publish date is left alone, so a future date means "scheduled".
 */
export async function setArticlePublished(id: string, published: unknown): Promise<ActionResult<{ published: boolean }>> {
  return withAdmin(async () => {
    const oid = toObjectIdOrThrow(id);
    const parsed = parseInput(articleFlagSchema, published);
    if (!parsed.ok) return parsed;
    const doc = await Article.findByIdAndUpdate(
      oid,
      { $set: { status: parsed.data ? "published" : "draft" } },
      { returnDocument: "after" },
    )
      .select("title slug publishedAt")
      .lean<{ title: string; slug: string; publishedAt: Date }>();
    if (!doc) return fail("This article no longer exists — it may have been deleted in another tab.");

    revalidateArticles(doc.slug);
    let message = `“${doc.title}” is hidden from the site`;
    if (parsed.data) {
      message =
        doc.publishedAt.getTime() > Date.now()
          ? `“${doc.title}” is scheduled for ${formatDate(doc.publishedAt, "medium")}`
          : `“${doc.title}” is now live`;
    }
    return ok({ published: parsed.data }, message);
  });
}

/**
 * Feature / unfeature an article on the home page. The picks live in
 * HomepageSettings.featuredArticleIds (the same list the Homepage editor orders), so the
 * star and that editor always agree. New picks are appended to the end.
 */
export async function setArticleFeatured(id: string, featured: unknown): Promise<ActionResult<{ featured: boolean }>> {
  return withAdmin<{ featured: boolean }>(async () => {
    const oid = toObjectIdOrThrow(id);
    const parsed = parseInput(articleFlagSchema, featured);
    if (!parsed.ok) return parsed;
    const article = await Article.findById(oid).select("title status").lean<{ title: string; status: string }>();
    if (!article) return fail("This article no longer exists — it may have been deleted in another tab.");

    const settings = await HomepageSettings.findOneAndUpdate(
      { key: SINGLETON_KEY },
      parsed.data
        ? {
            $addToSet: { featuredArticleIds: oid },
            // First write ever: seed the required hero copy with the defaults the site already shows.
            $setOnInsert: { key: SINGLETON_KEY, heroHeadline: DEFAULT_HOMEPAGE_SETTINGS.heroHeadline },
          }
        : { $pull: { featuredArticleIds: oid } },
      { upsert: parsed.data, returnDocument: "after" },
    )
      .select("featuredArticleIds")
      .lean<{ featuredArticleIds: Types.ObjectId[] }>();

    revalidateHomepage();
    if (!parsed.data) return ok({ featured: parsed.data }, `“${article.title}” is no longer featured on the homepage`);

    const position = (settings?.featuredArticleIds ?? []).findIndex((pick) => pick.equals(oid)) + 1;
    let message = `Featured “${article.title}” on the homepage`;
    if (article.status !== "published") message += " — it appears there once published";
    else if (position > HOME_LATEST_NEWS_COUNT)
      message += ` (pick ${position}; the homepage shows the first ${HOME_LATEST_NEWS_COUNT} — reorder them under Homepage)`;
    return ok({ featured: parsed.data }, message);
  });
}

/** Swap an article with its neighbour above / below, then renumber `order` 1…n (only changed ones are written). */
export async function moveArticle(id: string, direction: unknown): Promise<ActionResult<{ order: number }>> {
  return withAdmin(async () => {
    const oid = toObjectIdOrThrow(id);
    const parsed = parseInput(articleMoveSchema, direction);
    if (!parsed.ok) return parsed;

    const ordered = await loadOrderedArticles();
    const index = ordered.findIndex((doc) => doc._id.equals(oid));
    if (index === -1) return fail("This article no longer exists — it may have been deleted in another tab.");
    const target = parsed.data === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= ordered.length) return ok({ order: index + 1 });

    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    await writeArticleOrder(ordered);
    revalidateArticles();
    return ok({ order: target + 1 }, `Moved to position ${target + 1}`);
  });
}
