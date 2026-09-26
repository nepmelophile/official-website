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
import { revalidateArticles } from "@/lib/revalidate";
import { articleSchema } from "@/lib/validators/article";
import { escapeRegExp } from "@/lib/utils";
import { Article } from "@/models/Article";
import { Artist } from "@/models/Artist";
import { HomepageSettings } from "@/models/HomepageSettings";
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

export async function createArticle(input: unknown): Promise<ActionResult<ArticleSaveResult>> {
  return withAdmin(async () => {
    const parsed = parseInput(articleSchema, input);
    if (!parsed.ok) return parsed;
    const data = parsed.data;

    const conflict = await slugConflict(data.slug);
    if (conflict) return conflict;

    const doc = await Article.create({ ...data, relatedArticleIds: await cleanRelatedIds(data.relatedArticleIds) });
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
