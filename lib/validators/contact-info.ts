import { z } from "zod";
import { isHttpUrl, optionalText, requiredText, socialLinksSchema } from "./common";

const GOOGLE_MAP_HOSTS = ["www.google.com", "google.com", "maps.google.com"];
const OSM_HOSTS = ["www.openstreetmap.org", "openstreetmap.org"];

/**
 * Accepts only URLs that can actually be framed:
 *   - Google Maps "Embed a map" links (https://www.google.com/maps/embed?pb=…),
 *   - Google Maps links with output=embed (https://www.google.com/maps?q=…&output=embed),
 *   - OpenStreetMap export embeds (https://www.openstreetmap.org/export/embed.html?…).
 */
export function isMapEmbedUrl(value: string): boolean {
  if (!isHttpUrl(value)) return false;
  const url = new URL(value);
  if (url.protocol !== "https:") return false;
  const host = url.hostname.toLowerCase();
  if (GOOGLE_MAP_HOSTS.includes(host)) {
    return url.pathname.startsWith("/maps/embed") || (url.pathname.startsWith("/maps") && url.searchParams.get("output") === "embed");
  }
  if (OSM_HOSTS.includes(host)) return url.pathname === "/export/embed.html";
  return false;
}

/**
 * Editors often paste Google's whole `<iframe src="…" …></iframe>` snippet. Pull the src out
 * (and decode `&amp;`) so either form is accepted.
 */
export function extractMapEmbedSrc(value: string): string {
  const trimmed = value.trim();
  if (!/^<iframe[\s>]/i.test(trimmed)) return trimmed;
  const match = /\ssrc\s*=\s*(["'])(.*?)\1/i.exec(trimmed);
  return match ? match[2].replace(/&amp;/g, "&").trim() : trimmed;
}

/** Admin payload for the ContactInfo singleton. */
export const contactInfoSchema = z.object({
  email: z.string({ error: "Email is required" }).trim().toLowerCase().pipe(z.email("Enter a valid email address")),
  phone: requiredText(40, "Phone"),
  address: requiredText(300, "Address"),
  mapEmbedUrl: z.preprocess(
    (v) => {
      if (typeof v !== "string") return v;
      const src = extractMapEmbedSrc(v);
      return src === "" ? undefined : src;
    },
    z
      .string()
      .max(2048, "URL is too long")
      .refine(
        isMapEmbedUrl,
        "Use the embed link from Google Maps → Share → Embed a map (https://www.google.com/maps/embed?…) or an OpenStreetMap embed",
      )
      .optional(),
  ),
  officeHours: optionalText(200, "Office hours"),
  socialLinks: socialLinksSchema,
});

export type ContactInfoInput = z.infer<typeof contactInfoSchema>;
export type ContactInfoFormValues = z.input<typeof contactInfoSchema>;
