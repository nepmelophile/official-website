import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/constants";
import type { MediaRef } from "@/types/content";

function resolveSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  // Vercel preview deployments expose their host; fall back to localhost for dev.
  const vercelHost = process.env.VERCEL_URL?.trim();
  if (vercelHost) return `https://${vercelHost}`;
  return "http://localhost:3000";
}

/** Canonical site origin without trailing slash, e.g. "https://melophilenp.com". */
export const siteUrl: string = resolveSiteUrl();

/** Absolute URL for a path ("/news/x") or pass-through for already absolute URLs. */
export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl}${normalized === "/" ? "" : normalized}` || siteUrl;
}

/** File-based share image (app/opengraph-image.tsx), 1200×630. */
export const DEFAULT_OG_IMAGE = "/opengraph-image";

export interface BuildMetadataInput {
  /** Page title (the root layout template appends " · Melophile"). Omit for the default title. */
  title?: string;
  description?: string;
  /** Route path used for the canonical URL, e.g. "/news/my-article". */
  path?: string;
  /** OG/Twitter image: URL string or MediaRef. Defaults to the branded /opengraph-image. */
  image?: string | MediaRef | null;
  /** OpenGraph type — "article" for news posts, "profile" for artists. */
  type?: "website" | "article" | "profile";
  /** ISO date for article:published_time. */
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  tags?: string[];
  /** Exclude from search engines (e.g. admin, filtered listings). */
  noIndex?: boolean;
}

/** Builds consistent title/description/canonical/OpenGraph/Twitter metadata for a page. */
export function buildMetadata({
  title,
  description = SITE_DESCRIPTION,
  path = "/",
  image,
  type = "website",
  publishedTime,
  modifiedTime,
  authors,
  tags,
  noIndex = false,
}: BuildMetadataInput = {}): Metadata {
  const url = absoluteUrl(path);
  const fullTitle = title ? `${title} · ${SITE_NAME}` : SITE_NAME;
  const customImageUrl = (typeof image === "string" ? image : image?.url)?.trim();
  // Next replaces the parent's openGraph.images whenever a page sets openGraph, so always
  // provide one: the page's own image, else the branded file-based share image.
  const imageUrl = customImageUrl || DEFAULT_OG_IMAGE;
  const imageAlt =
    typeof image === "object" && image?.alt ? image.alt : (title ?? `${SITE_NAME} — ${SITE_TAGLINE}`);
  const images = [
    customImageUrl
      ? { url: absoluteUrl(imageUrl), alt: imageAlt }
      : { url: absoluteUrl(imageUrl), alt: imageAlt, width: 1200, height: 630 },
  ];

  const openGraph: Metadata["openGraph"] =
    type === "article"
      ? {
          type: "article",
          url,
          title: fullTitle,
          description,
          siteName: SITE_NAME,
          images,
          publishedTime,
          modifiedTime,
          authors,
          tags,
        }
      : { type, url, title: fullTitle, description, siteName: SITE_NAME, images };

  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: url },
    openGraph,
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: images.map((i) => i.url),
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}
