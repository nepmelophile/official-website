import { slugify } from "@/lib/utils";

/** Heading split so one word can render in the serif-italic accent (`<em>`). */
export interface HeadingParts {
  before?: string;
  em?: string;
  after?: string;
}

export interface ListingCopy {
  /** Plain title used for <title> / Open Graph ("New releases"). */
  title: string;
  /** Display heading for the page hero. */
  heading: HeadingParts;
  /** Intro paragraph / meta description. */
  blurb: string;
  /** Mono kicker above the heading. */
  eyebrow: string;
}

export const NEWS_DEFAULT_COPY: ListingCopy = {
  title: "News & Updates",
  heading: { before: "News & ", em: "updates" },
  blurb:
    "Releases, interviews, gigs and industry moves from across the Nepali music scene — reported from Kathmandu by the Melophile desk.",
  eyebrow: "The Melophile desk",
};

/** Editorial copy for the suggested categories (keyed by slug). Other categories get a generic line. */
const CATEGORY_COPY: Record<string, Omit<ListingCopy, "eyebrow">> = {
  news: {
    title: "Latest news",
    heading: { before: "Latest ", em: "news" },
    blurb: "Headlines, announcements and scene updates from across Nepali music, as they happen.",
  },
  release: {
    title: "New releases",
    heading: { before: "New ", em: "releases" },
    blurb: "Fresh singles, EPs and albums worth your time — with players so you can listen right here.",
  },
  interview: {
    title: "Interviews",
    heading: { before: "In ", em: "conversation" },
    blurb: "Long-form conversations with the artists, producers and people behind the music.",
  },
  event: {
    title: "Gigs & events",
    heading: { before: "Gigs & ", em: "events" },
    blurb: "Concerts, festivals and showcases — what's coming up, and what you missed.",
  },
  feature: {
    title: "Features",
    heading: { before: "Features & ", em: "long reads" },
    blurb: "Deep dives, profiles and stories from inside the Nepali music scene.",
  },
  industry: {
    title: "Industry",
    heading: { before: "The ", em: "business", after: " of music" },
    blurb: "Labels, streaming, royalties, policy and the money side of Nepali music.",
  },
};

/** Copy for a category listing (`label` is the stored category, e.g. "Release"). */
export function categoryCopy(label: string): ListingCopy {
  const known = CATEGORY_COPY[slugify(label)];
  if (known) return { ...known, eyebrow: `Filed under ${label}` };
  return {
    title: `${label} stories`,
    heading: { before: `${label} `, em: "stories" },
    blurb: `Every ${label.toLowerCase()} story from the Melophile desk, newest first.`,
    eyebrow: `Filed under ${label}`,
  };
}

/** Copy for a tag listing, optionally narrowed to a category. */
export function tagCopy(tag: string, category?: string | null): ListingCopy {
  return {
    title: category ? `${category} stories tagged “${tag}”` : `Stories tagged “${tag}”`,
    heading: { before: "Tagged ", em: tag },
    blurb: category
      ? `${category} stories from the Melophile desk tagged “${tag}”, newest first.`
      : `Every Melophile story tagged “${tag}”, newest first.`,
    eyebrow: category ? `Tag · ${category}` : "Tag",
  };
}

/** "hip-hop" → "Hip Hop" (display fallback for filters that match nothing). */
export function humanizeSlug(value: string): string {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\p{L}/gu, (c) => c.toUpperCase());
}
