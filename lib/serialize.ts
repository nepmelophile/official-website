/**
 * Map lean Mongoose documents to plain, serializable DTOs (ObjectId → string, Date → ISO).
 * Pure functions — safe for server components, server actions and scripts.
 */
import type { Types } from "mongoose";
import type { ArticleLean } from "@/models/Article";
import type { ArtistLean } from "@/models/Artist";
import type { ContactInfoLean } from "@/models/ContactInfo";
import type { ContactMessageLean } from "@/models/ContactMessage";
import type { HomepageSettingsLean } from "@/models/HomepageSettings";
import type { ServiceLean } from "@/models/Service";
import type { MediaRefDoc, SocialLinkDoc } from "@/models/shared";
import type { TestimonialLean } from "@/models/Testimonial";
import type { TrendingItemLean } from "@/models/TrendingItem";
import type {
  ArticleDTO,
  ArticleSummary,
  ArtistDTO,
  ArtistSummary,
  ContactInfoDTO,
  ContactMessageDTO,
  HomepageSettingsDTO,
  MediaRef,
  ServiceDTO,
  SocialLink,
  TestimonialDTO,
  TrendingItemDTO,
} from "@/types/content";

type IdLike = Types.ObjectId | string | { toString(): string };

/** ObjectId (or anything with toString) → string. */
export function toId(value: IdLike | null | undefined): string {
  return value == null ? "" : value.toString();
}

/** Array of ObjectIds → string[] (drops empties). */
export function toIds(values: readonly (IdLike | null | undefined)[] | null | undefined): string[] {
  return (values ?? []).map(toId).filter(Boolean);
}

/** Date | string → ISO string ("" when missing/invalid). */
export function toIso(value: Date | string | null | undefined): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function optionalIso(value: Date | string | null | undefined): string | undefined {
  return toIso(value) || undefined;
}

/** Remove keys whose value is undefined/null/"" so optional DTO fields stay absent. */
function optional<T extends string | number>(value: T | null | undefined): T | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
}

export function serializeMedia(media: MediaRefDoc): MediaRef;
export function serializeMedia(media: MediaRefDoc | null | undefined): MediaRef | undefined;
export function serializeMedia(media: MediaRefDoc | null | undefined): MediaRef | undefined {
  if (!media?.url) return undefined;
  const out: MediaRef = { url: media.url };
  if (media.alt) out.alt = media.alt;
  if (media.fileId) out.fileId = media.fileId;
  return out;
}

/** For required media fields: always returns a MediaRef (empty url when missing). */
function requiredMedia(media: MediaRefDoc | null | undefined): MediaRef {
  return serializeMedia(media) ?? { url: "" };
}

export function serializeSocialLinks(links: readonly SocialLinkDoc[] | null | undefined): SocialLink[] {
  return (links ?? []).filter((l) => l?.url).map((l) => ({ platform: l.platform, url: l.url }));
}

/* ------------------------------------------------------------------ */
/* Article                                                             */
/* ------------------------------------------------------------------ */

export function serializeArticleSummary(doc: ArticleLean): ArticleSummary {
  return {
    id: toId(doc._id),
    title: doc.title,
    slug: doc.slug,
    featuredImage: requiredMedia(doc.featuredImage),
    excerpt: doc.excerpt ?? "",
    category: doc.category ?? "",
    tags: doc.tags ?? [],
    author: optional(doc.author),
    publishedAt: toIso(doc.publishedAt),
  };
}

export function serializeArticle(doc: ArticleLean): ArticleDTO {
  return {
    ...serializeArticleSummary(doc),
    body: doc.body ?? "",
    status: doc.status,
    embeds: (doc.embeds ?? [])
      .filter((e) => e?.url)
      .map((e) => (e.title ? { url: e.url, title: e.title } : { url: e.url })),
    relatedArticleIds: toIds(doc.relatedArticleIds),
    metaTitle: optional(doc.metaTitle),
    metaDescription: optional(doc.metaDescription),
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

/* ------------------------------------------------------------------ */
/* Artist                                                              */
/* ------------------------------------------------------------------ */

export function serializeArtistSummary(doc: ArtistLean): ArtistSummary {
  return {
    id: toId(doc._id),
    name: doc.name,
    slug: doc.slug,
    photo: requiredMedia(doc.photo),
    shortBio: doc.shortBio ?? "",
    genres: doc.genres ?? [],
    location: doc.location ?? "",
    featured: Boolean(doc.featured),
  };
}

export function serializeArtist(doc: ArtistLean): ArtistDTO {
  return {
    ...serializeArtistSummary(doc),
    coverImage: serializeMedia(doc.coverImage),
    bio: doc.bio ?? "",
    socialLinks: serializeSocialLinks(doc.socialLinks),
    releases: (doc.releases ?? []).map((r) => ({
      title: r.title,
      embedUrl: r.embedUrl,
      type: r.type ?? undefined,
      releaseDate: optionalIso(r.releaseDate),
      coverImage: serializeMedia(r.coverImage),
    })),
    media: (doc.media ?? []).map((m) => ({
      type: m.type,
      url: m.url,
      caption: optional(m.caption),
      fileId: optional(m.fileId),
    })),
    achievements: (doc.achievements ?? []).map((a) => ({
      title: a.title,
      year: optional(a.year),
      description: optional(a.description),
    })),
    relatedArticleIds: toIds(doc.relatedArticleIds),
    order: doc.order ?? 0,
    status: doc.status,
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

/* ------------------------------------------------------------------ */
/* Service / Testimonial / Trending                                    */
/* ------------------------------------------------------------------ */

export function serializeService(doc: ServiceLean): ServiceDTO {
  return {
    id: toId(doc._id),
    name: doc.name,
    slug: doc.slug,
    image: requiredMedia(doc.image),
    description: doc.description ?? "",
    details: doc.details ?? "",
    formLink: doc.formLink ?? "",
    order: doc.order ?? 0,
    active: Boolean(doc.active),
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

export function serializeTestimonial(doc: TestimonialLean): TestimonialDTO {
  return {
    id: toId(doc._id),
    name: doc.name,
    designation: doc.designation ?? "",
    image: serializeMedia(doc.image),
    quote: doc.quote,
    order: doc.order ?? 0,
    active: Boolean(doc.active),
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

export function serializeTrendingItem(doc: TrendingItemLean): TrendingItemDTO {
  return {
    id: toId(doc._id),
    type: doc.type,
    refId: doc.refId ? toId(doc.refId) : undefined,
    rank: doc.rank,
    manualOverride: Boolean(doc.manualOverride),
    active: Boolean(doc.active),
    title: optional(doc.title),
    subtitle: optional(doc.subtitle),
    image: serializeMedia(doc.image),
    href: optional(doc.href),
    embedUrl: optional(doc.embedUrl),
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

/* ------------------------------------------------------------------ */
/* Singletons & messages                                               */
/* ------------------------------------------------------------------ */

export function serializeHomepageSettings(doc: HomepageSettingsLean): HomepageSettingsDTO {
  return {
    id: toId(doc._id),
    heroHeadline: doc.heroHeadline,
    heroSubcopy: doc.heroSubcopy ?? "",
    heroImage: serializeMedia(doc.heroImage),
    heroCtas: (doc.heroCtas ?? []).map((c) => ({ label: c.label, href: c.href })),
    impactStats: (doc.impactStats ?? []).map((s) => ({
      label: s.label,
      value: s.value,
      suffix: optional(s.suffix),
    })),
    featuredArticleIds: toIds(doc.featuredArticleIds),
    featuredArtistIds: toIds(doc.featuredArtistIds),
    updatedAt: optionalIso(doc.updatedAt),
  };
}

export function serializeContactInfo(doc: ContactInfoLean): ContactInfoDTO {
  return {
    id: toId(doc._id),
    email: doc.email,
    phone: doc.phone ?? "",
    address: doc.address ?? "",
    mapEmbedUrl: optional(doc.mapEmbedUrl),
    officeHours: optional(doc.officeHours),
    socialLinks: serializeSocialLinks(doc.socialLinks),
    updatedAt: optionalIso(doc.updatedAt),
  };
}

export function serializeContactMessage(doc: ContactMessageLean): ContactMessageDTO {
  return {
    id: toId(doc._id),
    name: doc.name,
    email: doc.email,
    phone: optional(doc.phone),
    subject: optional(doc.subject),
    service: optional(doc.service),
    message: doc.message,
    status: doc.status,
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}
