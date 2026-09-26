import type { MetadataRoute } from "next";
import { getArticleSitemapEntries } from "@/lib/queries/articles";
import { getArtistSitemapEntries } from "@/lib/queries/artists";
import { requireLiveData } from "@/lib/queries/safe";
import { absoluteUrl } from "@/lib/site";

/** Hourly fallback; article/artist mutations also revalidate /sitemap.xml on demand. */
export const revalidate = 3600;

type Entry = { slug: string; lastModified: string };

/** Newest valid date among entries (for listing pages), else undefined. */
function newest(entries: readonly Entry[]): Date | undefined {
  let latest: number | undefined;
  for (const entry of entries) {
    const time = Date.parse(entry.lastModified);
    if (Number.isFinite(time) && (latest === undefined || time > latest)) latest = time;
  }
  return latest === undefined ? undefined : new Date(latest);
}

function validDate(value: string): Date | undefined {
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time) : undefined;
}


/**
 * sitemap.xml: static routes plus every published article and artist. Without a database it
 * still returns the static routes.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Cached (ISR): if the DB is configured but unreachable, fail this regeneration so the last
  // complete sitemap keeps being served (no-op without MONGODB_URI or during `next build`).
  await requireLiveData();
  const [articles, artists] = await Promise.all([getArticleSitemapEntries(), getArtistSitemapEntries()]);
  const latestArticle = newest(articles);
  const latestArtist = newest(artists);
  const latestContent = [latestArticle, latestArtist]
    .filter((d): d is Date => Boolean(d))
    .sort((a, b) => b.getTime() - a.getTime())[0];

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: latestContent, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/news"), lastModified: latestArticle, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/artists"), lastModified: latestArtist, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/services"), changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/contact"), changeFrequency: "yearly", priority: 0.5 },
  ];

  const articleRoutes: MetadataRoute.Sitemap = articles
    .filter((entry) => entry.slug)
    .map((entry) => ({
      url: absoluteUrl(`/news/${encodeURIComponent(entry.slug)}`),
      lastModified: validDate(entry.lastModified),
      changeFrequency: "monthly",
      priority: 0.7,
    }));

  const artistRoutes: MetadataRoute.Sitemap = artists
    .filter((entry) => entry.slug)
    .map((entry) => ({
      url: absoluteUrl(`/artists/${encodeURIComponent(entry.slug)}`),
      lastModified: validDate(entry.lastModified),
      changeFrequency: "weekly",
      priority: 0.6,
    }));

  return [...staticRoutes, ...articleRoutes, ...artistRoutes];
}
