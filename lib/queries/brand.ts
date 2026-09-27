import "server-only";
import { cache } from "react";
import { DEFAULT_BRAND_ASSETS } from "@/lib/brand";
import { serializeMedia, toIso } from "@/lib/serialize";
import { SiteSettings, type SiteSettingsLean } from "@/models/SiteSettings";
import { SINGLETON_KEY } from "@/models/shared";
import type { BrandAssetsDTO } from "@/types/content";
import { safeQuery } from "./safe";

/**
 * Logo files for the header, footer and admin. Falls back per file to the bundled /public/brand
 * assets, and never throws (lenient): the shared layout sits outside the (site) error boundary.
 */
export const getBrandAssets = cache(async (): Promise<BrandAssetsDTO> => {
  return safeQuery("getBrandAssets", DEFAULT_BRAND_ASSETS, async () => {
    const doc = await SiteSettings.findOne({ key: SINGLETON_KEY }).lean<SiteSettingsLean>();
    if (!doc) return DEFAULT_BRAND_ASSETS;
    return {
      logoOnDark: serializeMedia(doc.logoOnDark) ?? DEFAULT_BRAND_ASSETS.logoOnDark,
      logoOnLight: serializeMedia(doc.logoOnLight) ?? DEFAULT_BRAND_ASSETS.logoOnLight,
      logoMark: serializeMedia(doc.logoMark) ?? DEFAULT_BRAND_ASSETS.logoMark,
      updatedAt: toIso(doc.updatedAt) || undefined,
    };
  }, { lenient: true });
});
