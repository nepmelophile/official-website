"use server";

import type { Types } from "mongoose";
import {
  fail,
  ok,
  parseInput,
  toMongoUpdate,
  toObjectIdOrThrow,
  withAdmin,
  type ActionFailure,
  type ActionResult,
} from "@/lib/admin/actions";
import { revalidateTrending } from "@/lib/revalidate";
import {
  trendingActiveSchema,
  trendingItemSchema,
  trendingMoveSchema,
  type TrendingItemInput,
} from "@/lib/validators/trending";
import { Article } from "@/models/Article";
import { Artist } from "@/models/Artist";
import { TrendingItem } from "@/models/TrendingItem";

/* ------------------------------------------------------------------ */
/* Helpers (not exported: only async actions may leave this module)    */
/* ------------------------------------------------------------------ */

/** Manual display fields; cleared when an item is linked without an override. */
const MANUAL_FIELDS = ["title", "subtitle", "image", "href", "embedUrl"] as const;

/**
 * Linked + no override means "show the linked item as is", so stale manual values are dropped
 * (otherwise they would silently resurface if the link stopped resolving).
 */
function normalize(data: TrendingItemInput): TrendingItemInput {
  if (!data.refId || data.manualOverride) return data;
  const next = { ...data };
  for (const field of MANUAL_FIELDS) next[field] = undefined;
  return next;
}

/** The linked document must exist and match the item type (artist/song → Artist, update → Article). */
async function checkReference(data: TrendingItemInput): Promise<ActionFailure | null> {
  if (!data.refId) return null;
  const isArticle = data.type === "update";
  const exists = isArticle ? await Article.exists({ _id: data.refId }) : await Artist.exists({ _id: data.refId });
  if (exists) return null;
  const message = isArticle
    ? "No such article (it may have been deleted) — pick one from the list."
    : "No such artist (it may have been deleted) — pick one from the list.";
  return fail("The linked item could not be found.", { refId: [message] });
}

interface RankedDoc {
  _id: Types.ObjectId;
  rank: number;
}

/** Every item in display order (same sort as the admin list and the public strip). */
async function loadOrdered(): Promise<RankedDoc[]> {
  return TrendingItem.find({}, { rank: 1 }).sort({ rank: 1, updatedAt: -1, _id: 1 }).lean<RankedDoc[]>();
}

/** Renumber items 1…n in the given order, writing only the ranks that changed. */
async function writeRanks(ordered: readonly RankedDoc[]): Promise<void> {
  const ops = ordered.flatMap((doc, index) =>
    doc.rank === index + 1 ? [] : [{ updateOne: { filter: { _id: doc._id }, update: { $set: { rank: index + 1 } } } }],
  );
  if (ops.length > 0) await TrendingItem.bulkWrite(ops);
}

/**
 * Put `id` at position `rank` (1-based) and renumber the rest around it, so ranks stay a tidy
 * 1…n sequence and the number an editor types is the position the item ends up in.
 * Returns the final rank.
 */
async function placeAt(id: Types.ObjectId, rank: number): Promise<number> {
  const all = await loadOrdered();
  const self = all.find((doc) => doc._id.equals(id));
  const others = all.filter((doc) => !doc._id.equals(id));
  if (!self) {
    await writeRanks(others);
    return rank;
  }
  const index = Math.min(Math.max(rank - 1, 0), others.length);
  others.splice(index, 0, self);
  await writeRanks(others);
  return index + 1;
}

/* ------------------------------------------------------------------ */
/* CRUD                                                                */
/* ------------------------------------------------------------------ */

export async function createTrendingItem(input: unknown): Promise<ActionResult<{ id: string; rank: number }>> {
  return withAdmin(async () => {
    const parsed = parseInput(trendingItemSchema, input);
    if (!parsed.ok) return parsed;
    const data = normalize(parsed.data);
    const refProblem = await checkReference(data);
    if (refProblem) return refProblem;

    const doc = await TrendingItem.create(data);
    const rank = await placeAt(doc._id, data.rank);
    revalidateTrending();
    return ok({ id: doc._id.toString(), rank }, `Added to trending at #${String(rank).padStart(2, "0")}`);
  });
}

export async function updateTrendingItem(id: string, input: unknown): Promise<ActionResult<{ id: string; rank: number }>> {
  return withAdmin(async () => {
    const oid = toObjectIdOrThrow(id);
    const parsed = parseInput(trendingItemSchema, input);
    if (!parsed.ok) return parsed;
    const data = normalize(parsed.data);
    const refProblem = await checkReference(data);
    if (refProblem) return refProblem;

    const doc = await TrendingItem.findByIdAndUpdate(oid, toMongoUpdate(data, ["refId", ...MANUAL_FIELDS]), {
      returnDocument: "after",
      runValidators: true,
    });
    if (!doc) return fail("This trending item no longer exists.");
    const rank = await placeAt(oid, data.rank);
    revalidateTrending();
    return ok({ id, rank }, `Saved at #${String(rank).padStart(2, "0")}`);
  });
}

export async function deleteTrendingItem(id: string): Promise<ActionResult> {
  return withAdmin(async () => {
    const doc = await TrendingItem.findByIdAndDelete(toObjectIdOrThrow(id));
    if (!doc) return fail("This trending item was already deleted.");
    await writeRanks(await loadOrdered());
    revalidateTrending();
    return ok(undefined, "Removed from trending");
  });
}

/* ------------------------------------------------------------------ */
/* Inline list actions                                                 */
/* ------------------------------------------------------------------ */

/** Swap an item with its neighbour above / below and renumber 1…n. */
export async function moveTrendingItem(id: string, direction: unknown): Promise<ActionResult<{ rank: number }>> {
  return withAdmin(async () => {
    const oid = toObjectIdOrThrow(id);
    const parsed = parseInput(trendingMoveSchema, direction);
    if (!parsed.ok) return parsed;

    const ordered = await loadOrdered();
    const index = ordered.findIndex((doc) => doc._id.equals(oid));
    if (index === -1) return fail("This trending item no longer exists.");
    const target = parsed.data === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= ordered.length) return ok({ rank: index + 1 });

    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    await writeRanks(ordered);
    revalidateTrending();
    return ok({ rank: target + 1 }, `Moved to #${String(target + 1).padStart(2, "0")}`);
  });
}

/** Show / hide an item in the public strip without opening it. */
export async function setTrendingItemActive(id: string, active: unknown): Promise<ActionResult<{ active: boolean }>> {
  return withAdmin(async () => {
    const oid = toObjectIdOrThrow(id);
    const parsed = parseInput(trendingActiveSchema, active);
    if (!parsed.ok) return parsed;
    const doc = await TrendingItem.findByIdAndUpdate(oid, { $set: { active: parsed.data } }, { returnDocument: "after" });
    if (!doc) return fail("This trending item no longer exists.");
    revalidateTrending();
    return ok({ active: parsed.data }, parsed.data ? "Shown in the trending strip" : "Hidden from the trending strip");
  });
}
