import type { ContactInfoDTO, HomepageSettingsDTO } from "@/types/content";

/* ------------------------------------------------------------------ */
/* Site identity                                                       */
/* ------------------------------------------------------------------ */

export const SITE_NAME = "Melophile";
export const SITE_DOMAIN = "melophilenp.com";
export const SITE_TAGLINE = "The sound of Nepal, amplified";
export const SITE_DESCRIPTION =
  "Melophile is Nepal's home for music news, artist stories and services that help independent Nepali musicians grow — from Kathmandu's underground to the world stage.";

/** Primary navigation (public header/footer). */
export const NAV_LINKS = [
  { label: "News", href: "/news" },
  { label: "Artists", href: "/artists" },
  { label: "Services", href: "/services" },
  { label: "Contact", href: "/contact" },
] as const;

/* ------------------------------------------------------------------ */
/* Enumerations shared by models, validators and UI                    */
/* ------------------------------------------------------------------ */

export const CONTENT_STATUSES = ["draft", "published"] as const;

/** Suggested article categories (free text is still allowed in the admin). */
export const ARTICLE_CATEGORIES = ["News", "Release", "Interview", "Event", "Feature", "Industry"] as const;

export const SOCIAL_PLATFORMS = [
  "spotify",
  "youtube",
  "instagram",
  "facebook",
  "tiktok",
  "x",
  "apple-music",
  "soundcloud",
  "website",
] as const;

export const SOCIAL_PLATFORM_LABELS: Record<(typeof SOCIAL_PLATFORMS)[number], string> = {
  spotify: "Spotify",
  youtube: "YouTube",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  x: "X",
  "apple-music": "Apple Music",
  soundcloud: "SoundCloud",
  website: "Website",
};

export const RELEASE_TYPES = ["single", "ep", "album"] as const;
export const RELEASE_TYPE_LABELS: Record<(typeof RELEASE_TYPES)[number], string> = {
  single: "Single",
  ep: "EP",
  album: "Album",
};

export const ARTIST_MEDIA_TYPES = ["image", "video"] as const;
export const TRENDING_TYPES = ["artist", "song", "update"] as const;
export const TRENDING_TYPE_LABELS: Record<(typeof TRENDING_TYPES)[number], string> = {
  artist: "Artist",
  song: "Song",
  update: "Update",
};

export const CONTACT_MESSAGE_STATUSES = ["new", "read", "archived"] as const;

/* ------------------------------------------------------------------ */
/* Listing sizes                                                       */
/* ------------------------------------------------------------------ */

export const NEWS_PAGE_SIZE = 9;
export const HOME_LATEST_NEWS_COUNT = 6;
export const HOME_FEATURED_ARTISTS_COUNT = 6;
export const TRENDING_LIMIT = 10;
export const RELATED_ARTICLES_COUNT = 3;

/**
 * ISR fallback interval (seconds). NOTE: route segment config must be a literal, so pages
 * write `export const revalidate = 3600` directly; this constant documents the value.
 */
export const REVALIDATE_SECONDS = 3600;

/* ------------------------------------------------------------------ */
/* Singleton defaults (used when the DB is empty or unreachable)       */
/* ------------------------------------------------------------------ */

export const DEFAULT_HOMEPAGE_SETTINGS: HomepageSettingsDTO = {
  heroHeadline: "The sound of Nepal, amplified.",
  heroSubcopy:
    "News, stories and services for the artists shaping Nepali music — from Kathmandu basements to global playlists.",
  heroImage: undefined,
  heroCtas: [
    { label: "Read the latest", href: "/news" },
    { label: "Work with us", href: "/contact" },
  ],
  impactStats: [
    { label: "Artists supported", value: 120, suffix: "+" },
    { label: "Stories published", value: 850, suffix: "+" },
    { label: "Monthly listeners reached", value: 2, suffix: "M" },
    { label: "Live events", value: 45, suffix: "+" },
  ],
  featuredArticleIds: [],
  featuredArtistIds: [],
};

export const DEFAULT_CONTACT_INFO: ContactInfoDTO = {
  email: "hello@melophilenp.com",
  phone: "+977 1-5550123",
  address: "Jhamsikhel, Lalitpur, Nepal",
  mapEmbedUrl: undefined,
  officeHours: "Sun–Fri, 10:00–18:00 NPT",
  socialLinks: [
    { platform: "instagram", url: "https://www.instagram.com/melophilenp" },
    { platform: "facebook", url: "https://www.facebook.com/melophilenp" },
    { platform: "youtube", url: "https://www.youtube.com/@melophilenp" },
    { platform: "spotify", url: "https://open.spotify.com/user/melophilenp" },
  ],
};
