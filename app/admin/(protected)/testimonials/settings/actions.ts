"use server";

import { parseInput, withAdmin, type ActionResult } from "@/lib/admin/actions";
import { upsertPageSettings } from "@/lib/admin/page-settings";
import { testimonialsPageSettingsSchema } from "@/lib/validators/page-settings";

/** Upserts the /testimonials page settings (PageSettings with page "testimonials"). */
export async function saveTestimonialsPageSettings(input: unknown): Promise<ActionResult<{ id: string }>> {
  return withAdmin(async () => {
    const parsed = parseInput(testimonialsPageSettingsSchema, input);
    if (!parsed.ok) return parsed;
    return upsertPageSettings("testimonials", parsed.data, "Testimonials page saved");
  });
}
