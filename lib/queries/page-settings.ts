import "server-only";
import { cache } from "react";
import { DEFAULT_PAGE_SETTINGS, PAGE_SETTINGS_KEYS } from "@/lib/constants";
import { serializeTestimonialsPageSettings, serializeTrendingPageSettings } from "@/lib/serialize";
import { PageSettings, type PageSettingsLean } from "@/models/PageSettings";
import type { PageKey, PageSettingsMap } from "@/types/content";
import { safeQuery } from "./safe";

/**
 * Settings for every managed page in one query. A page without a document (the production
 * database starts with none) gets DEFAULT_PAGE_SETTINGS, which are live and shown in the menu.
 */
async function findAllPageSettings(): Promise<PageSettingsMap> {
  const docs = await PageSettings.find({ page: { $in: PAGE_SETTINGS_KEYS } }).lean<PageSettingsLean[]>();
  const trending = docs.find((doc) => doc.page === "trending");
  const testimonials = docs.find((doc) => doc.page === "testimonials");
  return {
    trending: trending ? serializeTrendingPageSettings(trending) : DEFAULT_PAGE_SETTINGS.trending,
    testimonials: testimonials ? serializeTestimonialsPageSettings(testimonials) : DEFAULT_PAGE_SETTINGS.testimonials,
  };
}

/** All page settings (strict inside requireLiveData renders, like the other content queries). */
export const getAllPageSettings = cache(async (): Promise<PageSettingsMap> => {
  return safeQuery("getAllPageSettings", DEFAULT_PAGE_SETTINGS, findAllPageSettings);
});

/** Settings for one page, e.g. `await getPageSettings("trending")`. */
export async function getPageSettings<K extends PageKey>(page: K): Promise<PageSettingsMap[K]> {
  return (await getAllPageSettings())[page];
}

/**
 * Page settings for the site-wide header/footer (menu links). Always falls back to the defaults
 * instead of throwing, for the same reason as getSiteChromeContactInfo: the shared layout sits
 * outside the (site) error boundary.
 */
export const getSiteChromePageSettings = cache(async (): Promise<PageSettingsMap> => {
  return safeQuery("getSiteChromePageSettings", DEFAULT_PAGE_SETTINGS, findAllPageSettings, { lenient: true });
});
