/**
 * Pure helpers for the managed pages (/trending, /testimonials). Safe on server and client.
 */
import { stripAccentMarkers } from "@/components/home/emphasis";
import { stripMarkdown, truncate } from "@/lib/utils";
import type { PageSettingsDTO } from "@/types/content";

/** <title> for a managed page: the SEO title, else the menu label ("Trending"). */
export function pageMetaTitle(settings: PageSettingsDTO): string {
  return settings.metaTitle?.trim() || settings.navLabel;
}

/** Meta description: the SEO description, else the intro as plain text (≤ 160 chars), else `fallback`. */
export function pageMetaDescription(settings: PageSettingsDTO, fallback: string): string {
  const custom = settings.metaDescription?.trim();
  if (custom) return custom;
  const intro = stripMarkdown(settings.intro ?? "");
  return intro ? truncate(intro, 160) : fallback;
}

/** The heading without *accent* markers (JSON-LD names, aria labels). */
export function plainHeading(settings: PageSettingsDTO): string {
  return stripAccentMarkers(settings.heading);
}
