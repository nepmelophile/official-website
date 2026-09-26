import "server-only";
import { cache } from "react";
import type { QueryFilter } from "mongoose";
import type { RefOption } from "@/components/admin/RefMultiSelect";
import { isObjectId, toObjectIds } from "@/lib/admin/actions";
import { ADMIN_PAGE_SIZE, searchRegex } from "@/lib/admin/list";
import { connectToDatabase, isDbConfigured } from "@/lib/db";
import { serializeArtist, serializeMedia, toId, toIso } from "@/lib/serialize";
import { escapeRegExp } from "@/lib/utils";
import { Artist, type ArtistDoc, type ArtistLean } from "@/models/Artist";
import type { ArtistDTO, ContentStatus, MediaRef } from "@/types/content";
import { DB_NOT_CONFIGURED_MESSAGE, DB_UNREACHABLE_MESSAGE, type AdminListResult } from "./articles";

/*
 * Admin-side artist reads (drafts included). Call only after requireAdmin().
 * List/option/meta helpers never throw; getAdminArtistById() throws on DB failure.
 */

/** Row shape for the /admin/artists table. */
export interface AdminArtistRow {
  id: string;
  name: string;
  slug: string;
  photo?: MediaRef;
  genres: string[];
  location: string;
  featured: boolean;
  order: number;
  status: ContentStatus;
  releaseCount: number;
  updatedAt: string;
}

export const ADMIN_ARTIST_FEATURED_FILTERS = ["yes", "no"] as const;
export type AdminArtistFeaturedFilter = (typeof ADMIN_ARTIST_FEATURED_FILTERS)[number];

export interface AdminArtistListParams {
  /** Free-text search over name, slug, genres and location. */
  q?: string;
  status?: ContentStatus | "";
  featured?: AdminArtistFeaturedFilter | "";
  /** Exact genre (case-insensitive). */
  genre?: string;
  page?: number;
  pageSize?: number;
}

type ArtistRowLean = Pick<
  ArtistLean,
  "_id" | "name" | "slug" | "photo" | "genres" | "location" | "featured" | "order" | "status" | "updatedAt"
> & { releaseCount?: number };

function toRow(doc: ArtistRowLean): AdminArtistRow {
  return {
    id: toId(doc._id),
    name: doc.name,
    slug: doc.slug,
    photo: serializeMedia(doc.photo),
    genres: doc.genres ?? [],
    location: doc.location ?? "",
    featured: Boolean(doc.featured),
    order: doc.order ?? 0,
    status: doc.status,
    releaseCount: doc.releaseCount ?? 0,
    updatedAt: toIso(doc.updatedAt),
  };
}

/** Paginated admin artist list (ordered like the public page: order, then name). */
export async function listAdminArtists({
  q = "",
  status = "",
  featured = "",
  genre = "",
  page = 1,
  pageSize = ADMIN_PAGE_SIZE,
}: AdminArtistListParams = {}): Promise<AdminListResult<AdminArtistRow>> {
  const empty: AdminListResult<AdminArtistRow> = { items: [], total: 0, page: 1, pageCount: 0 };
  if (!isDbConfigured()) return { ...empty, error: DB_NOT_CONFIGURED_MESSAGE };

  try {
    await connectToDatabase();
    const filter: QueryFilter<ArtistDoc> = {};
    if (status) filter.status = status;
    if (featured) filter.featured = featured === "yes" ? true : { $ne: true };
    if (genre) filter.genres = new RegExp(`^${escapeRegExp(genre)}$`, "i");
    if (q) {
      const rx = searchRegex(q);
      filter.$or = [{ name: rx }, { slug: rx }, { genres: rx }, { location: rx }];
    }

    const total = await Artist.countDocuments(filter);
    const pageCount = Math.ceil(total / pageSize);
    const current = Math.min(Math.max(1, Math.floor(page)), Math.max(1, pageCount));
    // Aggregate (not find) so the row can carry a release count without loading the releases.
    // The filter holds only strings, booleans and regexes, so $match needs no casting.
    const docs = await Artist.aggregate<ArtistRowLean>([
      { $match: filter },
      { $sort: { order: 1, name: 1, _id: 1 } },
      { $skip: (current - 1) * pageSize },
      { $limit: pageSize },
      {
        $project: {
          name: 1,
          slug: 1,
          photo: 1,
          genres: 1,
          location: 1,
          featured: 1,
          order: 1,
          status: 1,
          updatedAt: 1,
          releaseCount: { $size: { $ifNull: ["$releases", []] } },
        },
      },
    ]);

    return { items: docs.map(toRow), total, page: current, pageCount };
  } catch (error) {
    console.error("[melophile admin] listAdminArtists failed", error);
    return { ...empty, error: DB_UNREACHABLE_MESSAGE };
  }
}

/**
 * One artist by id, drafts included. Returns null for a malformed or unknown id; throws when
 * the database is unavailable. Cached per request.
 */
export const getAdminArtistById = cache(async (id: string): Promise<ArtistDTO | null> => {
  if (!isObjectId(id)) return null;
  await connectToDatabase();
  const doc = await Artist.findById(id).lean<ArtistLean>();
  return doc ? serializeArtist(doc) : null;
});

type ArtistOptionLean = Pick<ArtistLean, "_id" | "name" | "status" | "genres" | "location">;

function toOption(doc: ArtistOptionLean): RefOption {
  const parts = [
    doc.status === "draft" ? "Draft" : null,
    (doc.genres ?? []).slice(0, 2).join(", ") || null,
    doc.location || null,
  ].filter(Boolean);
  return { id: toId(doc._id), label: doc.name, description: parts.join(" · ") || undefined };
}

export interface ArtistOptionsParams {
  /** Ids that must be present in the options even if beyond the limit (current picks). */
  include?: readonly string[];
}

const OPTION_LIMIT = 1000;

/**
 * Artists as RefMultiSelect / RefSelect options (A–Z, drafts marked "Draft"). Available to other
 * admin sections (homepage featured artists, trending references). Never throws.
 */
export async function getArtistOptions({ include = [] }: ArtistOptionsParams = {}): Promise<RefOption[]> {
  if (!isDbConfigured()) return [];
  try {
    await connectToDatabase();
    const fields = "name status genres location";
    const docs = await Artist.find({}).select(fields).sort({ name: 1, _id: 1 }).limit(OPTION_LIMIT).lean<ArtistOptionLean[]>();
    const seen = new Set(docs.map((doc) => toId(doc._id)));
    const missing = toObjectIds(include).filter((oid) => !seen.has(oid.toString()));
    const extra = missing.length
      ? await Artist.find({ _id: { $in: missing } }).select(fields).lean<ArtistOptionLean[]>()
      : [];
    return [...docs, ...extra].map(toOption);
  } catch (error) {
    console.error("[melophile admin] getArtistOptions failed", error);
    return [];
  }
}

export interface ArtistFormMeta {
  /** Genres already in use (TagInput suggestions, list filter). */
  genres: string[];
  /** Locations already in use, plus common Nepali music hubs. */
  locations: string[];
}

const DEFAULT_LOCATIONS = ["Kathmandu", "Lalitpur", "Bhaktapur", "Pokhara", "Dharan", "Biratnagar", "Butwal", "Chitwan"];

function distinctSorted(values: readonly unknown[], preferred: readonly string[] = []): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of [...values, ...preferred]) {
    if (typeof value !== "string") continue;
    const text = value.trim();
    if (!text || seen.has(text.toLowerCase())) continue;
    seen.add(text.toLowerCase());
    out.push(text);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

/** Suggestions for the artist form and list filters. Never throws. */
export const getArtistFormMeta = cache(async (): Promise<ArtistFormMeta> => {
  const fallback: ArtistFormMeta = { genres: [], locations: [...DEFAULT_LOCATIONS] };
  if (!isDbConfigured()) return fallback;
  try {
    await connectToDatabase();
    const [genres, locations] = await Promise.all([Artist.distinct("genres"), Artist.distinct("location")]);
    return { genres: distinctSorted(genres), locations: distinctSorted(locations, DEFAULT_LOCATIONS) };
  } catch (error) {
    console.error("[melophile admin] getArtistFormMeta failed", error);
    return fallback;
  }
});
