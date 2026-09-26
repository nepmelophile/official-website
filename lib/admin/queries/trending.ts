import "server-only";
import { toObjectId } from "@/lib/admin/actions";
import { connectToDatabase, isDbConfigured } from "@/lib/db";
import { serializeMedia, serializeTrendingItem, toId, toIso } from "@/lib/serialize";
import { Article, type ArticleLean } from "@/models/Article";
import { Artist, type ArtistLean, type ReleaseDoc } from "@/models/Artist";
import { TrendingItem, type TrendingItemLean } from "@/models/TrendingItem";
import type { ContentStatus, MediaRef, TrendingItemDTO } from "@/types/content";

/*
 * Admin read helpers for the Trending section. Call only after requireAdmin().
 * The option types are plain DTOs, so client components can `import type` them.
 */

/** An artist that a trending "artist" or "song" item can link to. */
export interface TrendingArtistOption {
  id: string;
  name: string;
  slug: string;
  status: ContentStatus;
  photo?: MediaRef;
  /** First genre (the public card's subtitle). */
  genre?: string;
  location?: string;
  /** The release a "song" item plays (newest by releaseDate, else the first listed). */
  latestRelease?: { title: string; embedUrl: string; coverImage?: MediaRef };
}

/** An article that a trending "update" item can link to. */
export interface TrendingArticleOption {
  id: string;
  title: string;
  slug: string;
  status: ContentStatus;
  category: string;
  featuredImage?: MediaRef;
  /** ISO publish date. */
  publishedAt: string;
  /** Published but dated in the future (not live yet). */
  scheduled: boolean;
}

export interface TrendingRefOptions {
  artists: TrendingArtistOption[];
  articles: TrendingArticleOption[];
}

export interface AdminTrendingList {
  /** Every item (active and inactive) in public order: rank ↑, then most recently updated. */
  items: TrendingItemDTO[];
  options: TrendingRefOptions;
  error?: string;
}

/** Newest release by date, falling back to list order — mirrors lib/queries/trending.ts. */
function latestRelease(releases: readonly ReleaseDoc[] | undefined): ReleaseDoc | undefined {
  if (!releases || releases.length === 0) return undefined;
  const dated = releases.filter((r) => r.releaseDate);
  if (dated.length === 0) return releases[0];
  return [...dated].sort((a, b) => new Date(b.releaseDate!).getTime() - new Date(a.releaseDate!).getTime())[0];
}

type ArtistOptionDoc = Pick<ArtistLean, "_id" | "name" | "slug" | "status" | "photo" | "genres" | "location" | "releases">;
type ArticleOptionDoc = Pick<ArticleLean, "_id" | "title" | "slug" | "status" | "category" | "featuredImage" | "publishedAt">;

/** Cap on the article picker (newest first) so the form payload stays small. */
const ARTICLE_OPTION_LIMIT = 400;

async function loadRefOptions(): Promise<TrendingRefOptions> {
  const [artists, articles] = await Promise.all([
    Artist.find({})
      .select("name slug status photo genres location releases")
      .sort({ name: 1 })
      .lean<ArtistOptionDoc[]>(),
    Article.find({})
      .select("title slug status category featuredImage publishedAt")
      .sort({ publishedAt: -1 })
      .limit(ARTICLE_OPTION_LIMIT)
      .lean<ArticleOptionDoc[]>(),
  ]);

  const now = Date.now();
  return {
    artists: artists.map((a) => {
      const release = latestRelease(a.releases);
      const option: TrendingArtistOption = {
        id: toId(a._id),
        name: a.name,
        slug: a.slug,
        status: a.status,
        photo: serializeMedia(a.photo),
        genre: a.genres?.[0] || undefined,
        location: a.location || undefined,
      };
      if (release?.title) {
        option.latestRelease = {
          title: release.title,
          embedUrl: release.embedUrl,
          coverImage: serializeMedia(release.coverImage),
        };
      }
      return option;
    }),
    articles: articles.map((a) => ({
      id: toId(a._id),
      title: a.title,
      slug: a.slug,
      status: a.status,
      category: a.category ?? "",
      featuredImage: serializeMedia(a.featuredImage),
      publishedAt: toIso(a.publishedAt),
      scheduled: a.status === "published" && Boolean(a.publishedAt) && new Date(a.publishedAt).getTime() > now,
    })),
  };
}

const EMPTY_OPTIONS: TrendingRefOptions = { artists: [], articles: [] };

/** Artists and articles for the trending reference picker (drafts included, flagged by status). */
export async function getTrendingRefOptions(): Promise<{ options: TrendingRefOptions; error?: string }> {
  if (!isDbConfigured()) {
    return { options: EMPTY_OPTIONS, error: "The database is not configured (MONGODB_URI is missing)." };
  }
  try {
    await connectToDatabase();
    return { options: await loadRefOptions() };
  } catch (error) {
    console.error("[melophile admin] getTrendingRefOptions failed", error);
    return { options: EMPTY_OPTIONS, error: "Could not load artists and articles — is the database reachable?" };
  }
}

/** All trending items in public order plus the data needed to resolve their cards. */
export async function listAdminTrending(): Promise<AdminTrendingList> {
  if (!isDbConfigured()) {
    return { items: [], options: EMPTY_OPTIONS, error: "The database is not configured (MONGODB_URI is missing)." };
  }
  try {
    await connectToDatabase();
    const [docs, options] = await Promise.all([
      TrendingItem.find({}).sort({ rank: 1, updatedAt: -1 }).lean<TrendingItemLean[]>(),
      loadRefOptions(),
    ]);
    return { items: docs.map(serializeTrendingItem), options };
  } catch (error) {
    console.error("[melophile admin] listAdminTrending failed", error);
    return { items: [], options: EMPTY_OPTIONS, error: "Could not load trending items — is the database reachable?" };
  }
}

/** One trending item by id (null for a malformed or unknown id). Throws when the DB is unavailable. */
export async function getAdminTrendingItem(id: string): Promise<TrendingItemDTO | null> {
  const oid = toObjectId(id);
  if (!oid) return null;
  await connectToDatabase();
  const doc = await TrendingItem.findById(oid).lean<TrendingItemLean>();
  return doc ? serializeTrendingItem(doc) : null;
}

/** Rank that appends a new item to the end of the strip. */
export async function getNextTrendingRank(): Promise<number> {
  if (!isDbConfigured()) return 1;
  try {
    await connectToDatabase();
    return (await TrendingItem.countDocuments({})) + 1;
  } catch {
    return 1;
  }
}
