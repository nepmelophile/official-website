import "server-only";
import { DEFAULT_PAGE_SETTINGS } from "@/lib/constants";
import { connectToDatabase, isDbConfigured } from "@/lib/db";
import { serializeTestimonialsPageSettings, serializeTrendingPageSettings } from "@/lib/serialize";
import { PageSettings, type PageSettingsLean } from "@/models/PageSettings";
import type { PageKey, PageSettingsMap } from "@/types/content";
import type { AdminSingleton } from "./settings";

/*
 * Admin read helper for the managed page settings (/trending, /testimonials). Call only after
 * requireAdmin(). Never throws: with no document yet (or the DB down) it returns the public
 * defaults with `saved: false`, so the editor shows exactly what the site is using.
 */

const NOT_CONFIGURED = "The database is not configured (MONGODB_URI is missing), so changes can’t be saved yet.";
const UNREACHABLE = "The database is unreachable right now — showing the site defaults. Saving will fail until it’s back.";

function serialize<K extends PageKey>(page: K, doc: PageSettingsLean): PageSettingsMap[K] {
  return (page === "trending" ? serializeTrendingPageSettings(doc) : serializeTestimonialsPageSettings(doc)) as PageSettingsMap[K];
}

export async function getAdminPageSettings<K extends PageKey>(page: K): Promise<AdminSingleton<PageSettingsMap[K]>> {
  const fallback: AdminSingleton<PageSettingsMap[K]> = { value: DEFAULT_PAGE_SETTINGS[page], saved: false };
  if (!isDbConfigured()) return { ...fallback, error: NOT_CONFIGURED };
  try {
    await connectToDatabase();
    const doc = await PageSettings.findOne({ page }).lean<PageSettingsLean>();
    return doc ? { value: serialize(page, doc), saved: true } : fallback;
  } catch (error) {
    console.error(`[melophile admin] getAdminPageSettings(${page}) failed`, error);
    return { ...fallback, error: UNREACHABLE };
  }
}
