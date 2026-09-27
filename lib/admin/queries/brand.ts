import "server-only";
import { DEFAULT_BRAND_ASSETS } from "@/lib/brand";
import { connectToDatabase, isDbConfigured } from "@/lib/db";
import { serializeMedia, toIso } from "@/lib/serialize";
import { SiteSettings, type SiteSettingsLean } from "@/models/SiteSettings";
import { SINGLETON_KEY } from "@/models/shared";
import type { BrandAssetsDTO, MediaRef } from "@/types/content";

/** What the branding form edits: stored values only (blank = using the bundled file). */
export interface AdminBrandAssets {
  stored: { logoOnDark?: MediaRef; logoOnLight?: MediaRef; logoMark?: MediaRef };
  /** What the site shows right now (stored value, else the bundled default). */
  effective: BrandAssetsDTO;
  saved: boolean;
  error?: string;
}

/** Admin read for the branding singleton. Call only after requireAdmin(). Never throws. */
export async function getAdminBrandAssets(): Promise<AdminBrandAssets> {
  const fallback: AdminBrandAssets = { stored: {}, effective: DEFAULT_BRAND_ASSETS, saved: false };
  if (!isDbConfigured()) return { ...fallback, error: "The database is not configured (MONGODB_URI is missing), so logos can’t be saved yet." };
  try {
    await connectToDatabase();
    const doc = await SiteSettings.findOne({ key: SINGLETON_KEY }).lean<SiteSettingsLean>();
    if (!doc) return fallback;
    const stored = {
      logoOnDark: serializeMedia(doc.logoOnDark),
      logoOnLight: serializeMedia(doc.logoOnLight),
      logoMark: serializeMedia(doc.logoMark),
    };
    return {
      stored,
      effective: {
        logoOnDark: stored.logoOnDark ?? DEFAULT_BRAND_ASSETS.logoOnDark,
        logoOnLight: stored.logoOnLight ?? DEFAULT_BRAND_ASSETS.logoOnLight,
        logoMark: stored.logoMark ?? DEFAULT_BRAND_ASSETS.logoMark,
        updatedAt: toIso(doc.updatedAt) || undefined,
      },
      saved: true,
    };
  } catch (error) {
    console.error("[melophile admin] getAdminBrandAssets failed", error);
    return { ...fallback, error: "The database is unreachable right now — showing the bundled logos. Saving will fail until it’s back." };
  }
}
