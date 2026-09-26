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
import { revalidateArtists } from "@/lib/revalidate";
import { escapeRegExp } from "@/lib/utils";
import { artistSchema } from "@/lib/validators/artist";
import { Article } from "@/models/Article";
import { Artist } from "@/models/Artist";
import { HomepageSettings } from "@/models/HomepageSettings";
import { TrendingItem } from "@/models/TrendingItem";

/*
 * Artist CRUD. Every action runs inside withAdmin() (session check + DB connect + error
 * mapping), validates with artistSchema and revalidates the public pages after a write.
 */

/** Optional fields that must be $unset (not ignored) when cleared in the form. */
const OPTIONAL_KEYS = ["coverImage"] as const;

export interface ArtistSaveResult {
  id: string;
  slug: string;
}

/** Suggests the next free "<slug>-N" for a taken slug. */
async function suggestFreeSlug(slug: string, excludeId?: Types.ObjectId): Promise<string> {
  const base = slug.replace(/-\d+$/, "") || slug;
  const pattern = new RegExp(`^${escapeRegExp(base)}(?:-(\\d+))?$`);
  const filter = excludeId ? { slug: pattern, _id: { $ne: excludeId } } : { slug: pattern };
  const taken = await Artist.find(filter).select("slug").lean<{ slug: string }[]>();
  let highest = 1;
  for (const doc of taken) {
    const n = Number(pattern.exec(doc.slug)?.[1] ?? 1);
    if (n > highest) highest = n;
  }
  return `${base}-${highest + 1}`.slice(0, 120);
}

/** Friendly slug-taken failure (checked before writing; E11000 stays the race-safe backstop). */
async function slugConflict(slug: string, excludeId?: Types.ObjectId): Promise<ActionFailure | null> {
  const exists = await Artist.exists(excludeId ? { slug, _id: { $ne: excludeId } } : { slug });
  if (!exists) return null;
  const suggestion = await suggestFreeSlug(slug, excludeId);
  return fail("That slug is already in use.", {
    slug: [`Another artist already uses “${slug}”. Try “${suggestion}”.`],
  });
}

/** Keeps only related article ids that still exist, in the chosen order. */
async function cleanArticleIds(ids: readonly string[]): Promise<Types.ObjectId[]> {
  const candidates = toObjectIds(ids);
  if (candidates.length === 0) return [];
  const existing = await Article.find({ _id: { $in: candidates } }).select("_id").lean<{ _id: Types.ObjectId }[]>();
  const found = new Set(existing.map((doc) => doc._id.toString()));
  return candidates.filter((oid) => found.has(oid.toString()));
}

export async function createArtist(input: unknown): Promise<ActionResult<ArtistSaveResult>> {
  return withAdmin(async () => {
    const parsed = parseInput(artistSchema, input);
    if (!parsed.ok) return parsed;
    const data = parsed.data;

    const conflict = await slugConflict(data.slug);
    if (conflict) return conflict;

    const doc = await Artist.create({ ...data, relatedArticleIds: await cleanArticleIds(data.relatedArticleIds) });
    revalidateArtists(doc.slug);
    return ok(
      { id: doc._id.toString(), slug: doc.slug },
      doc.status === "published" ? "Artist published" : "Draft artist created",
    );
  });
}

export async function updateArtist(id: string, input: unknown): Promise<ActionResult<ArtistSaveResult>> {
  return withAdmin(async () => {
    const oid = toObjectIdOrThrow(id);
    const parsed = parseInput(artistSchema, input);
    if (!parsed.ok) return parsed;
    const data = parsed.data;

    const before = await Artist.findById(oid).select("slug status").lean<{ slug: string; status: string }>();
    if (!before) return fail("This artist no longer exists — it may have been deleted in another tab.");

    const conflict = await slugConflict(data.slug, oid);
    if (conflict) return conflict;

    const relatedArticleIds = await cleanArticleIds(data.relatedArticleIds);
    const doc = await Artist.findByIdAndUpdate(oid, toMongoUpdate({ ...data, relatedArticleIds }, OPTIONAL_KEYS), {
      returnDocument: "after",
      runValidators: true,
    })
      .select("slug status")
      .lean<{ slug: string; status: string }>();
    if (!doc) return fail("This artist no longer exists — it may have been deleted in another tab.");

    revalidateArtists(doc.slug);
    if (before.slug !== doc.slug) revalidateArtists(before.slug);

    let message = "Changes saved";
    if (before.status !== doc.status) message = doc.status === "published" ? "Artist published" : "Artist moved back to drafts";
    return ok({ id, slug: doc.slug }, message);
  });
}

export async function deleteArtist(id: string): Promise<ActionResult> {
  return withAdmin(async () => {
    const oid = toObjectIdOrThrow(id);
    const doc = await Artist.findByIdAndDelete(oid).select("name slug").lean<{ name: string; slug: string }>();
    if (!doc) return fail("This artist was already deleted.");

    // Drop the artist from the homepage picks so the featured row doesn't reference a ghost, and
    // retire trending items that pointed at it (cards with their own manual title keep showing).
    const cleanup = await Promise.allSettled([
      HomepageSettings.updateMany({ featuredArtistIds: oid }, { $pull: { featuredArtistIds: oid } }),
      TrendingItem.updateMany(
        { refId: oid, title: { $in: [null, ""] } },
        { $set: { active: false } },
      ),
    ]);
    for (const result of cleanup) {
      if (result.status === "rejected") console.error("[melophile admin] artist reference cleanup failed", result.reason);
    }

    revalidateArtists(doc.slug);
    return ok(undefined, `Deleted “${doc.name}”`);
  });
}
