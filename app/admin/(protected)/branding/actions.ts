"use server";

import { fail, ok, parseInput, toMongoUpdate, withAdmin, type ActionResult } from "@/lib/admin/actions";
import { revalidateBranding } from "@/lib/revalidate";
import { siteSettingsSchema } from "@/lib/validators/site-settings";
import { SiteSettings } from "@/models/SiteSettings";
import { SINGLETON_KEY } from "@/models/shared";

/** Upserts the branding singleton. Logos appear on every page, so the whole layout is revalidated. */
export async function saveBranding(input: unknown): Promise<ActionResult<{ id: string }>> {
  return withAdmin(async () => {
    const parsed = parseInput(siteSettingsSchema, input);
    if (!parsed.ok) return parsed;
    const doc = await SiteSettings.findOneAndUpdate(
      { key: SINGLETON_KEY },
      { ...toMongoUpdate(parsed.data, ["logoOnDark", "logoOnLight", "logoMark"]), $setOnInsert: { key: SINGLETON_KEY } },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true },
    );
    if (!doc) return fail("The logos could not be saved. Please try again.");
    revalidateBranding();
    return ok({ id: doc._id.toString() }, "Logos saved");
  });
}
