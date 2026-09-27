import "server-only";
import { cache } from "react";
import { TRENDING_LIMIT, TRENDING_PAGE_LIMIT } from "@/lib/constants";
import { serializeMedia, serializeTrendingItem, toId } from "@/lib/serialize";
import { Article, type ArticleLean } from "@/models/Article";
import { Artist, type ArtistLean, type ReleaseDoc } from "@/models/Artist";
import { TrendingItem, type TrendingItemLean } from "@/models/TrendingItem";
import type { MediaRef, TrendingCard, TrendingChart, TrendingChartEntry, TrendingItemDTO } from "@/types/content";
import { safeQuery } from "./safe";

type ArtistRef = Pick<ArtistLean, "_id" | "name" | "slug" | "photo" | "genres" | "location" | "releases">;
type ArticleRef = Pick<ArticleLean, "_id" | "title" | "slug" | "featuredImage" | "category" | "publishedAt">;

/** Most recent release (by releaseDate, falling back to list order). */
function latestRelease(releases: readonly ReleaseDoc[] | undefined): ReleaseDoc | undefined {
  if (!releases || releases.length === 0) return undefined;
  const dated = releases.filter((r) => r.releaseDate);
  if (dated.length === 0) return releases[0];
  return [...dated].sort((a, b) => new Date(b.releaseDate!).getTime() - new Date(a.releaseDate!).getTime())[0];
}

interface Resolved {
  title?: string;
  subtitle?: string;
  image?: MediaRef;
  href?: string;
  embedUrl?: string;
}

function fromArtist(type: "artist" | "song", artist: ArtistRef): Resolved {
  const href = `/artists/${artist.slug}`;
  if (type === "artist") {
    return {
      title: artist.name,
      subtitle: artist.genres?.[0] ?? (artist.location || undefined),
      image: serializeMedia(artist.photo),
      href,
    };
  }
  const release = latestRelease(artist.releases);
  return {
    title: release?.title,
    subtitle: artist.name,
    image: serializeMedia(release?.coverImage) ?? serializeMedia(artist.photo),
    href,
    embedUrl: release?.embedUrl,
  };
}

function fromArticle(article: ArticleRef): Resolved {
  return {
    title: article.title,
    subtitle: article.category,
    image: serializeMedia(article.featuredImage),
    href: `/news/${article.slug}`,
  };
}

/**
 * Manual fields win when manualOverride is on (or there is no ref); ref fills the gaps.
 * The admin's live preview (app/admin/(protected)/trending/resolve.ts) mirrors these rules and
 * the skip rules in getTrending below — change both together.
 */
function merge(item: TrendingItemDTO, ref: Resolved | undefined): Resolved {
  const manual: Resolved = {
    title: item.title,
    subtitle: item.subtitle,
    image: item.image,
    href: item.href,
    embedUrl: item.embedUrl,
  };
  if (!ref) return manual;
  if (item.manualOverride) {
    return {
      title: manual.title ?? ref.title,
      subtitle: manual.subtitle ?? ref.subtitle,
      image: manual.image ?? ref.image,
      href: manual.href ?? ref.href,
      embedUrl: manual.embedUrl ?? ref.embedUrl,
    };
  }
  // Not overridden: the referenced content is the source of truth; manual embed may add audio.
  return { ...ref, embedUrl: ref.embedUrl ?? manual.embedUrl };
}

/**
 * Active trending items ordered by rank, with artist/article references resolved into a
 * uniform card shape. Items whose reference is unpublished/missing and that have no manual
 * title are skipped — so extra candidates are fetched and the list is cut to `limit` only
 * after filtering (otherwise one draft artist in the top N would leave the list short).
 * `position` numbers the resulting entries 1…n (stored ranks can have gaps where hidden items sit).
 */
async function loadTrendingEntries(limit: number): Promise<TrendingChartEntry[]> {
  const items = (
    await TrendingItem.find({ active: true })
      .sort({ rank: 1, updatedAt: -1 })
      .limit(Math.max(limit * 3, limit + 20))
      .lean<TrendingItemLean[]>()
  ).map(serializeTrendingItem);

  const artistIds = items.filter((i) => i.refId && i.type !== "update").map((i) => i.refId!);
  const articleIds = items.filter((i) => i.refId && i.type === "update").map((i) => i.refId!);

  const [artists, articles] = await Promise.all([
    artistIds.length
      ? Artist.find({ _id: { $in: artistIds }, status: "published" })
          .select("name slug photo genres location releases")
          .lean<ArtistRef[]>()
      : Promise.resolve([] as ArtistRef[]),
    articleIds.length
      ? Article.find({ _id: { $in: articleIds }, status: "published", publishedAt: { $lte: new Date() } })
          .select("title slug featuredImage category publishedAt")
          .lean<ArticleRef[]>()
      : Promise.resolve([] as ArticleRef[]),
  ]);

  const artistById = new Map(artists.map((a) => [toId(a._id), a]));
  const articleById = new Map(articles.map((a) => [toId(a._id), a]));

  const entries: TrendingChartEntry[] = [];
  for (const item of items) {
    if (entries.length >= limit) break;
    let ref: Resolved | undefined;
    if (item.refId) {
      if (item.type === "update") {
        const article = articleById.get(item.refId);
        if (article) ref = fromArticle(article);
      } else {
        const artist = artistById.get(item.refId);
        if (artist) ref = fromArtist(item.type, artist);
      }
      // Referenced content gone/unpublished and not manually curated → skip.
      if (!ref && !item.manualOverride && !item.title) continue;
    }

    const resolved = merge(item, ref);
    if (!resolved.title) continue;

    entries.push({
      id: item.id,
      type: item.type,
      rank: item.rank,
      position: entries.length + 1,
      title: resolved.title,
      subtitle: resolved.subtitle,
      image: resolved.image,
      href: resolved.href,
      embedUrl: resolved.embedUrl,
      movement: item.movement,
      updatedAt: item.updatedAt,
    });
  }
  return entries;
}

/** The homepage strip: the first `limit` showable items (see loadTrendingEntries). */
export const getTrending = cache(async (limit: number = TRENDING_LIMIT): Promise<TrendingCard[]> => {
  return safeQuery("getTrending", [], () => loadTrendingEntries(limit));
});

/** Newest ISO date in the list, else undefined. */
function newestDate(values: readonly string[]): string | undefined {
  let latest: number | undefined;
  for (const value of values) {
    const time = Date.parse(value);
    if (Number.isFinite(time) && (latest === undefined || time > latest)) latest = time;
  }
  return latest === undefined ? undefined : new Date(latest).toISOString();
}

/** The /trending chart: up to `limit` entries plus when the chart was last edited. */
export const getTrendingChart = cache(async (limit: number = TRENDING_PAGE_LIMIT): Promise<TrendingChart> => {
  return safeQuery<TrendingChart>("getTrendingChart", { entries: [] }, async () => {
    const entries = await loadTrendingEntries(limit);
    return { entries, updatedAt: newestDate(entries.map((e) => e.updatedAt)) };
  });
});
