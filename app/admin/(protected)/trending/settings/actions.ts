"use server";

import { parseInput, withAdmin, type ActionResult } from "@/lib/admin/actions";
import { upsertPageSettings } from "@/lib/admin/page-settings";
import { trendingPageSettingsSchema } from "@/lib/validators/page-settings";

/** Upserts the /trending page settings (PageSettings with page "trending"). */
export async function saveTrendingPageSettings(input: unknown): Promise<ActionResult<{ id: string }>> {
  return withAdmin(async () => {
    const parsed = parseInput(trendingPageSettingsSchema, input);
    if (!parsed.ok) return parsed;
    return upsertPageSettings("trending", parsed.data, "Trending page saved");
  });
}
