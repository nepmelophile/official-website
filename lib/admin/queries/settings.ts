import "server-only";
import type { RefOption } from "@/components/admin";
import { connectToDatabase, isDbConfigured } from "@/lib/db";
import { DEFAULT_CONTACT_INFO, DEFAULT_HOMEPAGE_SETTINGS } from "@/lib/constants";
import { serializeContactInfo, serializeHomepageSettings, toId } from "@/lib/serialize";
import { formatDate } from "@/lib/utils";
import { Article, type ArticleLean } from "@/models/Article";
import { Artist, type ArtistLean } from "@/models/Artist";
import { ContactInfo, type ContactInfoLean } from "@/models/ContactInfo";
import { HomepageSettings, type HomepageSettingsLean } from "@/models/HomepageSettings";
import { SINGLETON_KEY } from "@/models/shared";
import type { ContactInfoDTO, HomepageSettingsDTO } from "@/types/content";

/*
 * Admin read helpers for the two singletons (Homepage settings, Contact info) and the pickers
 * the homepage editor needs. Call only after requireAdmin(). They never throw: when nothing is
 * stored yet (or the DB is down) they return the site defaults with `saved: false`.
 */

const NOT_CONFIGURED = "The database is not configured (MONGODB_URI is missing), so changes can’t be saved yet.";
const UNREACHABLE = "The database is unreachable right now — showing the site defaults. Saving will fail until it’s back.";

export interface AdminSingleton<T> {
  value: T;
  /** False when no document exists yet (the form shows the public fallbacks). */
  saved: boolean;
  error?: string;
}

export async function getAdminHomepageSettings(): Promise<AdminSingleton<HomepageSettingsDTO>> {
  const fallback: AdminSingleton<HomepageSettingsDTO> = { value: DEFAULT_HOMEPAGE_SETTINGS, saved: false };
  if (!isDbConfigured()) return { ...fallback, error: NOT_CONFIGURED };
  try {
    await connectToDatabase();
    const doc = await HomepageSettings.findOne({ key: SINGLETON_KEY }).lean<HomepageSettingsLean>();
    return doc ? { value: serializeHomepageSettings(doc), saved: true } : fallback;
  } catch (error) {
    console.error("[melophile admin] getAdminHomepageSettings failed", error);
    return { ...fallback, error: UNREACHABLE };
  }
}

export async function getAdminContactInfo(): Promise<AdminSingleton<ContactInfoDTO>> {
  const fallback: AdminSingleton<ContactInfoDTO> = { value: DEFAULT_CONTACT_INFO, saved: false };
  if (!isDbConfigured()) return { ...fallback, error: NOT_CONFIGURED };
  try {
    await connectToDatabase();
    const doc = await ContactInfo.findOne({ key: SINGLETON_KEY }).lean<ContactInfoLean>();
    return doc ? { value: serializeContactInfo(doc), saved: true } : fallback;
  } catch (error) {
    console.error("[melophile admin] getAdminContactInfo failed", error);
    return { ...fallback, error: UNREACHABLE };
  }
}

export interface FeaturedPickerOptions {
  articles: RefOption[];
  artists: RefOption[];
}

type ArticlePick = Pick<ArticleLean, "_id" | "title" | "status" | "category" | "publishedAt">;
type ArtistPick = Pick<ArtistLean, "_id" | "name" | "status" | "genres" | "location" | "featured">;

const ARTICLE_OPTION_LIMIT = 400;

function articleDescription(a: ArticlePick, now: number): string {
  const parts: string[] = [];
  const published = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
  if (a.status !== "published") parts.push("Draft — hidden until published");
  else if (published > now) parts.push(`Scheduled · ${formatDate(a.publishedAt, "medium")}`);
  else parts.push(formatDate(a.publishedAt, "medium"));
  if (a.category) parts.push(a.category);
  return parts.join(" · ");
}

function artistDescription(a: ArtistPick): string {
  const parts: string[] = [];
  if (a.status !== "published") parts.push("Draft — hidden until published");
  if (a.featured) parts.push("★ Featured");
  if (a.genres?.[0]) parts.push(a.genres[0]);
  if (a.location) parts.push(a.location);
  return parts.join(" · ");
}

/** Options for the featured article / artist pickers (drafts included and labelled). */
export async function getFeaturedPickerOptions(): Promise<FeaturedPickerOptions> {
  if (!isDbConfigured()) return { articles: [], artists: [] };
  try {
    await connectToDatabase();
    const [articles, artists] = await Promise.all([
      Article.find({})
        .select("title status category publishedAt")
        .sort({ publishedAt: -1 })
        .limit(ARTICLE_OPTION_LIMIT)
        .lean<ArticlePick[]>(),
      Artist.find({}).select("name status genres location featured").sort({ name: 1 }).lean<ArtistPick[]>(),
    ]);
    const now = Date.now();
    return {
      articles: articles.map((a) => ({ id: toId(a._id), label: a.title, description: articleDescription(a, now) })),
      artists: artists.map((a) => ({ id: toId(a._id), label: a.name, description: artistDescription(a) })),
    };
  } catch (error) {
    console.error("[melophile admin] getFeaturedPickerOptions failed", error);
    return { articles: [], artists: [] };
  }
}
