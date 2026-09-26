import "server-only";
import { cache } from "react";
import type { QueryFilter } from "mongoose";
import { HOME_FEATURED_ARTISTS_COUNT } from "@/lib/constants";
import { serializeArtist, serializeArtistSummary, toIso } from "@/lib/serialize";
import { slugify } from "@/lib/utils";
import { Artist, type ArtistDoc, type ArtistLean } from "@/models/Artist";
import type { ArtistDTO, ArtistSummary } from "@/types/content";
import { isObjectIdString, looseMatch, orderByIds, safeQuery } from "./safe";
import { getHomepageSettings } from "./settings";

const SUMMARY_FIELDS = "name slug photo shortBio genres location featured";
const LISTING_SORT = { order: 1, name: 1 } as const;

function publishedFilter(): QueryFilter<ArtistDoc> {
  return { status: "published" };
}

export interface GetArtistsOptions {
  /** Genre label or slug ("hip-hop", "Folk Fusion"). Case-insensitive. */
  genre?: string | null;
}

/** Published artists ordered by `order` then name, optionally filtered by genre. */
export const getArtists = cache(async ({ genre }: GetArtistsOptions = {}): Promise<ArtistSummary[]> => {
  return safeQuery("getArtists", [], async () => {
    const filter = publishedFilter();
    if (genre?.trim()) filter.genres = looseMatch(genre);
    const docs = await Artist.find(filter).select(SUMMARY_FIELDS).sort(LISTING_SORT).lean<ArtistLean[]>();
    return docs.map(serializeArtistSummary);
  });
});

/** A single published artist by slug, or null. */
export const getArtistBySlug = cache(async (slug: string): Promise<ArtistDTO | null> => {
  if (!slug) return null;
  return safeQuery("getArtistBySlug", null, async () => {
    const doc = await Artist.findOne({ status: "published", slug: slug.toLowerCase() }).lean<ArtistLean>();
    return doc ? serializeArtist(doc) : null;
  });
});

/** Published artists by id, in the given order. */
export const getArtistsByIds = cache(async (ids: readonly string[]): Promise<ArtistSummary[]> => {
  const validIds = ids.filter(isObjectIdString);
  if (validIds.length === 0) return [];
  return safeQuery("getArtistsByIds", [], async () => {
    const docs = await Artist.find({ status: "published", _id: { $in: validIds } })
      .select(SUMMARY_FIELDS)
      .lean<ArtistLean[]>();
    return orderByIds(docs.map(serializeArtistSummary), validIds);
  });
});

/**
 * Featured artists for the home page: HomepageSettings.featuredArtistIds when set, otherwise
 * artists flagged `featured`, topped up with other published artists if there are too few.
 */
export const getFeaturedArtists = cache(
  async (limit: number = HOME_FEATURED_ARTISTS_COUNT): Promise<ArtistSummary[]> => {
    const settings = await getHomepageSettings();
    if (settings.featuredArtistIds.length > 0) {
      const picked = await getArtistsByIds(settings.featuredArtistIds);
      if (picked.length > 0) return picked.slice(0, limit);
    }

    return safeQuery("getFeaturedArtists", [], async () => {
      const featured = await Artist.find({ status: "published", featured: true })
        .select(SUMMARY_FIELDS)
        .sort(LISTING_SORT)
        .limit(limit)
        .lean<ArtistLean[]>();
      if (featured.length >= limit) return featured.map(serializeArtistSummary);

      const rest = await Artist.find({ status: "published", featured: { $ne: true } })
        .select(SUMMARY_FIELDS)
        .sort(LISTING_SORT)
        .limit(limit - featured.length)
        .lean<ArtistLean[]>();
      return [...featured, ...rest].map(serializeArtistSummary);
    });
  },
);

/**
 * Distinct genres across published artists, alphabetical. Variants that share a URL slug
 * ("Folk Pop" / "folk-pop") collapse into one, so filter chips never duplicate.
 */
export const getArtistGenres = cache(async (): Promise<string[]> => {
  return safeQuery("getArtistGenres", [], async () => {
    const genres = (await Artist.distinct("genres", { status: "published" })) as string[];
    const seen = new Map<string, string>();
    for (const genre of genres) {
      if (typeof genre !== "string" || !genre.trim()) continue;
      const key = slugify(genre) || genre.trim().toLowerCase();
      if (!seen.has(key)) seen.set(key, genre.trim());
    }
    return [...seen.values()].sort((a, b) => a.localeCompare(b));
  });
});

/**
 * "More artists" for an artist page: other published artists sharing at least one genre
 * (featured first, then `order`/name), topped up with other published artists when there are
 * too few. Never includes the artist itself.
 */
export async function getRelatedArtists(
  artist: Pick<ArtistDTO, "id" | "genres">,
  limit: number = 4,
): Promise<ArtistSummary[]> {
  if (limit <= 0) return [];
  return safeQuery("getRelatedArtists", [], async () => {
    const exclude = isObjectIdString(artist.id) ? [artist.id] : [];
    const genreMatchers = artist.genres.filter((g) => g.trim()).map(looseMatch);
    const sort = { featured: -1, ...LISTING_SORT } as const;

    let sameGenre: ArtistLean[] = [];
    if (genreMatchers.length > 0) {
      const filter: QueryFilter<ArtistDoc> = {
        ...publishedFilter(),
        _id: { $nin: exclude },
        genres: { $in: genreMatchers },
      };
      sameGenre = await Artist.find(filter).select(SUMMARY_FIELDS).sort(sort).limit(limit).lean<ArtistLean[]>();
    }
    if (sameGenre.length >= limit) return sameGenre.map(serializeArtistSummary);

    const taken = [...exclude, ...sameGenre.map((doc) => doc._id.toString())];
    const rest = await Artist.find({ ...publishedFilter(), _id: { $nin: taken } })
      .select(SUMMARY_FIELDS)
      .sort(sort)
      .limit(limit - sameGenre.length)
      .lean<ArtistLean[]>();
    return [...sameGenre, ...rest].map(serializeArtistSummary);
  });
}

/** All published artist slugs (for generateStaticParams). Returns [] without a DB. */
export async function getAllArtistSlugs(): Promise<string[]> {
  return safeQuery("getAllArtistSlugs", [], async () => {
    const docs = await Artist.find({ status: "published" }).select("slug").lean<Pick<ArtistLean, "_id" | "slug">[]>();
    return docs.map((d) => d.slug);
  });
}

/** Slugs + last-modified dates for sitemap.ts. */
export async function getArtistSitemapEntries(): Promise<{ slug: string; lastModified: string }[]> {
  return safeQuery("getArtistSitemapEntries", [], async () => {
    const docs = await Artist.find({ status: "published" })
      .select("slug updatedAt")
      .lean<Pick<ArtistLean, "_id" | "slug" | "updatedAt">[]>();
    return docs.map((d) => ({ slug: d.slug, lastModified: toIso(d.updatedAt) }));
  });
}
