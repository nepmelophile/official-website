"use server";

import type { Types } from "mongoose";
import { fail, ok, parseInput, toMongoUpdate, toObjectIds, withAdmin, type ActionResult } from "@/lib/admin/actions";
import { revalidateHomepage } from "@/lib/revalidate";
import { homepageSettingsSchema } from "@/lib/validators/homepage";
import { Article } from "@/models/Article";
import { Artist } from "@/models/Artist";
import { HomepageSettings } from "@/models/HomepageSettings";
import { SINGLETON_KEY } from "@/models/shared";

type IdDoc = { _id: Types.ObjectId };

/** Keeps only ids that still exist, in the editor's order (picks deleted meanwhile are dropped). */
async function keepExisting(
  ids: readonly string[],
  find: (ids: Types.ObjectId[]) => Promise<IdDoc[]>,
): Promise<Types.ObjectId[]> {
  const wanted = toObjectIds(ids);
  if (wanted.length === 0) return [];
  const present = new Set((await find(wanted)).map((doc) => doc._id.toString()));
  return wanted.filter((id) => present.has(id.toString()));
}

/** Upserts the HomepageSettings singleton (key "default"). */
export async function saveHomepageSettings(input: unknown): Promise<ActionResult<{ id: string }>> {
  return withAdmin(async () => {
    const parsed = parseInput(homepageSettingsSchema, input);
    if (!parsed.ok) return parsed;

    const [featuredArticleIds, featuredArtistIds] = await Promise.all([
      keepExisting(parsed.data.featuredArticleIds, (ids) =>
        Article.find({ _id: { $in: ids } }, { _id: 1 }).lean<IdDoc[]>(),
      ),
      keepExisting(parsed.data.featuredArtistIds, (ids) =>
        Artist.find({ _id: { $in: ids } }, { _id: 1 }).lean<IdDoc[]>(),
      ),
    ]);
    const data = { ...parsed.data, featuredArticleIds, featuredArtistIds };

    const doc = await HomepageSettings.findOneAndUpdate(
      { key: SINGLETON_KEY },
      { ...toMongoUpdate(data, ["heroImage"]), $setOnInsert: { key: SINGLETON_KEY } },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true },
    );
    if (!doc) return fail("The homepage settings could not be saved. Please try again.");
    revalidateHomepage();
    return ok({ id: doc._id.toString() }, "Homepage saved");
  });
}
