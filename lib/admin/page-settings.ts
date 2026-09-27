import "server-only";
import { fail, ok, toMongoUpdate, type ActionResult } from "@/lib/admin/actions";
import { revalidatePageSettings } from "@/lib/revalidate";
import {
  PAGE_SETTINGS_OPTIONAL_KEYS,
  TESTIMONIALS_PAGE_OPTIONAL_KEYS,
  type TestimonialsPageSettingsInput,
  type TrendingPageSettingsInput,
} from "@/lib/validators/page-settings";
import { PageSettings } from "@/models/PageSettings";
import type { PageKey } from "@/types/content";

/**
 * Upserts the PageSettings document for `page` with already-validated data, then revalidates
 * the page, the home page, the sitemap and the layout (menu). Call inside withAdmin().
 */
export async function upsertPageSettings(
  page: PageKey,
  data: TrendingPageSettingsInput | TestimonialsPageSettingsInput,
  message: string,
): Promise<ActionResult<{ id: string }>> {
  // Cleared optional fields (SEO, share image, CTA label/link) are removed from the document,
  // so the public page falls back to its defaults for them.
  const optionalKeys: readonly string[] =
    page === "testimonials" ? TESTIMONIALS_PAGE_OPTIONAL_KEYS : PAGE_SETTINGS_OPTIONAL_KEYS;
  const doc = await PageSettings.findOneAndUpdate(
    { page },
    {
      ...toMongoUpdate(data as Record<string, unknown>, optionalKeys),
      $setOnInsert: { page },
    },
    { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true },
  );
  if (!doc) return fail("The page settings could not be saved. Please try again.");
  revalidatePageSettings(page);
  return ok({ id: doc._id.toString() }, message);
}
