/**
 * Plain, serializable DTO types shared between server queries, server components and client
 * components. IDs are strings, dates are ISO-8601 strings. Never pass Mongoose documents to
 * the UI — map them with lib/serialize.ts.
 */
import type {
  ARTIST_MEDIA_TYPES,
  CONTACT_MESSAGE_STATUSES,
  CONTENT_STATUSES,
  RELEASE_TYPES,
  SOCIAL_PLATFORMS,
  TRENDING_TYPES,
} from "@/lib/constants";

/* ------------------------------------------------------------------ */
/* Shared primitives                                                   */
/* ------------------------------------------------------------------ */

export type ContentStatus = (typeof CONTENT_STATUSES)[number];
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];
export type ReleaseType = (typeof RELEASE_TYPES)[number];
export type ArtistMediaType = (typeof ARTIST_MEDIA_TYPES)[number];
export type TrendingType = (typeof TRENDING_TYPES)[number];
export type ContactMessageStatus = (typeof CONTACT_MESSAGE_STATUSES)[number];

/** Reference to an image hosted on ImageKit (or any allowed remote host). */
export interface MediaRef {
  url: string;
  alt?: string;
  /** ImageKit file id, when uploaded through the admin (lets us delete/replace later). */
  fileId?: string;
}

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
}

export interface EmbedRef {
  /** Spotify / YouTube / SoundCloud page URL (converted to an iframe src by lib/embeds.ts). */
  url: string;
  title?: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageCount: number;
}

interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* Article                                                             */
/* ------------------------------------------------------------------ */

export interface ArticleDTO extends Timestamps {
  id: string;
  title: string;
  slug: string;
  featuredImage: MediaRef;
  excerpt: string;
  /** Markdown. */
  body: string;
  category: string;
  tags: string[];
  author?: string;
  publishedAt: string;
  status: ContentStatus;
  embeds: EmbedRef[];
  relatedArticleIds: string[];
  metaTitle?: string;
  metaDescription?: string;
}

/** Lightweight article shape for listings/cards (no body). */
export type ArticleSummary = Pick<
  ArticleDTO,
  "id" | "title" | "slug" | "featuredImage" | "excerpt" | "category" | "tags" | "author" | "publishedAt"
>;

/* ------------------------------------------------------------------ */
/* Artist                                                              */
/* ------------------------------------------------------------------ */

export interface Release {
  title: string;
  embedUrl: string;
  type?: ReleaseType;
  releaseDate?: string;
  coverImage?: MediaRef;
}

export interface ArtistMedia {
  type: ArtistMediaType;
  url: string;
  caption?: string;
  fileId?: string;
}

export interface Achievement {
  title: string;
  year?: number;
  description?: string;
}

export interface ArtistDTO extends Timestamps {
  id: string;
  name: string;
  slug: string;
  photo: MediaRef;
  coverImage?: MediaRef;
  shortBio: string;
  /** Markdown. */
  bio: string;
  genres: string[];
  location: string;
  socialLinks: SocialLink[];
  releases: Release[];
  media: ArtistMedia[];
  achievements: Achievement[];
  relatedArticleIds: string[];
  featured: boolean;
  order: number;
  status: ContentStatus;
}

/** Lightweight artist shape for listings/cards. */
export type ArtistSummary = Pick<
  ArtistDTO,
  "id" | "name" | "slug" | "photo" | "shortBio" | "genres" | "location" | "featured"
>;

/* ------------------------------------------------------------------ */
/* Service / Testimonial                                               */
/* ------------------------------------------------------------------ */

export interface ServiceDTO extends Timestamps {
  id: string;
  name: string;
  slug: string;
  image: MediaRef;
  description: string;
  /** Markdown. */
  details: string;
  /** Absolute URL (e.g. Google Form) or internal path such as /contact?service=slug. */
  formLink: string;
  order: number;
  active: boolean;
}

export interface TestimonialDTO extends Timestamps {
  id: string;
  name: string;
  designation: string;
  image?: MediaRef;
  quote: string;
  order: number;
  active: boolean;
}

/* ------------------------------------------------------------------ */
/* Trending                                                            */
/* ------------------------------------------------------------------ */

/** Raw trending item as stored (used by the admin). */
export interface TrendingItemDTO extends Timestamps {
  id: string;
  type: TrendingType;
  /** Artist id for 'artist' | 'song'; Article id for 'update'. */
  refId?: string;
  rank: number;
  manualOverride: boolean;
  active: boolean;
  title?: string;
  subtitle?: string;
  image?: MediaRef;
  href?: string;
  embedUrl?: string;
}

/** Trending item resolved for display (refs resolved, manual overrides applied). */
export interface TrendingCard {
  id: string;
  type: TrendingType;
  rank: number;
  title: string;
  subtitle?: string;
  image?: MediaRef;
  href?: string;
  embedUrl?: string;
}

/* ------------------------------------------------------------------ */
/* Singletons                                                          */
/* ------------------------------------------------------------------ */

export interface HeroCta {
  label: string;
  href: string;
}

export interface ImpactStat {
  label: string;
  value: number;
  suffix?: string;
}

export interface HomepageSettingsDTO {
  id?: string;
  heroHeadline: string;
  heroSubcopy: string;
  heroImage?: MediaRef;
  heroCtas: HeroCta[];
  impactStats: ImpactStat[];
  featuredArticleIds: string[];
  featuredArtistIds: string[];
  updatedAt?: string;
}

export interface ContactInfoDTO {
  id?: string;
  email: string;
  phone: string;
  address: string;
  mapEmbedUrl?: string;
  officeHours?: string;
  socialLinks: SocialLink[];
  updatedAt?: string;
}

/* ------------------------------------------------------------------ */
/* Contact messages                                                    */
/* ------------------------------------------------------------------ */

export interface ContactMessageDTO extends Timestamps {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  service?: string;
  message: string;
  status: ContactMessageStatus;
}
