/**
 * Pure, client-safe resolution of a trending item into what the public card shows.
 *
 * This mirrors the rules in lib/queries/trending.ts (getTrending) so the admin can show a
 * faithful "resolved preview" — keep the two in sync:
 *   - linked + no override → everything comes from the linked artist / article;
 *   - linked + override    → manual fields win, blank ones inherit from the link;
 *   - not linked           → only the manual fields exist.
 * Links to drafts, scheduled articles or deleted documents don't resolve; such items only
 * show when they carry their own (manual) title.
 */
import type { TrendingArticleOption, TrendingArtistOption, TrendingRefOptions } from "@/lib/admin/queries/trending";
import { TRENDING_TYPE_LABELS } from "@/lib/constants";
import { isEmbeddableUrl } from "@/lib/embeds";
import { formatDate } from "@/lib/utils";
import type { MediaRef, TrendingType } from "@/types/content";

export type RefKind = "artist" | "article";

/** Artist for "artist" / "song" items, Article for "update" items. */
export function refKindFor(type: TrendingType): RefKind {
  return type === "update" ? "article" : "artist";
}

/** The fields a trending item stores that affect how it is displayed. */
export interface TrendingDraft {
  type: TrendingType;
  refId?: string;
  manualOverride: boolean;
  active: boolean;
  title?: string;
  subtitle?: string;
  image?: MediaRef;
  href?: string;
  embedUrl?: string;
}

export const DISPLAY_FIELDS = ["title", "subtitle", "image", "href", "embedUrl"] as const;
export type DisplayField = (typeof DISPLAY_FIELDS)[number];

export interface DisplayValues {
  title?: string;
  subtitle?: string;
  image?: MediaRef;
  href?: string;
  embedUrl?: string;
}

/** Where a displayed value comes from. */
export type FieldSource = "linked" | "manual";

export type LinkState = "published" | "draft" | "scheduled" | "missing";

export interface LinkedInfo {
  kind: RefKind;
  id: string;
  label: string;
  state: LinkState;
  /** Admin edit page of the linked document. */
  adminHref: string;
  /** Publish date of a scheduled article. */
  scheduledFor?: string;
}

export type HiddenCode = "inactive" | "missing-link" | "draft-link" | "scheduled-link" | "no-title";

export interface TrendingResolution {
  /** Values the public card renders. */
  display: DisplayValues;
  sources: Partial<Record<DisplayField, FieldSource>>;
  linked?: LinkedInfo;
  /** True when the item renders in the public strip (ignoring the top-N cut-off). */
  visible: boolean;
  hiddenCode?: HiddenCode;
  /** Sentence explaining why the item is hidden. */
  hiddenReason?: string;
  /** Non-blocking advice (no image, no link, …). */
  notes: TrendingNote[];
}

export interface TrendingNote {
  text: string;
  tone: "info" | "warning";
}

export const HIDDEN_LABELS: Record<HiddenCode, string> = {
  inactive: "Switched off",
  "missing-link": "Link missing",
  "draft-link": "Linked draft",
  "scheduled-link": "Scheduled",
  "no-title": "No title",
};

export interface RefLookup {
  artists: Map<string, TrendingArtistOption>;
  articles: Map<string, TrendingArticleOption>;
}

export function buildRefLookup(options: TrendingRefOptions): RefLookup {
  return {
    artists: new Map(options.artists.map((a) => [a.id, a])),
    articles: new Map(options.articles.map((a) => [a.id, a])),
  };
}

function isHttpUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** Manual image only when it is a usable absolute URL (never crash next/image on a half-typed URL). */
function cleanImage(image: MediaRef | undefined): MediaRef | undefined {
  const url = image?.url?.trim();
  if (!url || !isHttpUrl(url)) return undefined;
  return image?.alt ? { url, alt: image.alt } : { url };
}

function fromArtist(type: "artist" | "song", artist: TrendingArtistOption): DisplayValues {
  const href = `/artists/${artist.slug}`;
  if (type === "artist") {
    return { title: artist.name, subtitle: artist.genre ?? artist.location, image: artist.photo, href };
  }
  const release = artist.latestRelease;
  return {
    title: release?.title,
    subtitle: artist.name,
    image: release?.coverImage ?? artist.photo,
    href,
    embedUrl: release?.embedUrl,
  };
}

function fromArticle(article: TrendingArticleOption): DisplayValues {
  return {
    title: article.title,
    subtitle: article.category || undefined,
    image: article.featuredImage,
    href: `/news/${article.slug}`,
  };
}

/** What the linked document alone would display (published or not) — used for placeholders. */
export function linkedDisplay(type: TrendingType, refId: string | undefined, lookup: RefLookup): DisplayValues | undefined {
  if (!refId) return undefined;
  if (type === "update") {
    const article = lookup.articles.get(refId);
    return article ? fromArticle(article) : undefined;
  }
  const artist = lookup.artists.get(refId);
  return artist ? fromArtist(type, artist) : undefined;
}

function linkedInfo(type: TrendingType, refId: string, lookup: RefLookup): LinkedInfo {
  if (type === "update") {
    const article = lookup.articles.get(refId);
    if (!article) return { kind: "article", id: refId, label: "Deleted article", state: "missing", adminHref: "/admin/articles" };
    return {
      kind: "article",
      id: refId,
      label: article.title,
      state: article.status !== "published" ? "draft" : article.scheduled ? "scheduled" : "published",
      adminHref: `/admin/articles/${article.id}`,
      scheduledFor: article.scheduled ? article.publishedAt : undefined,
    };
  }
  const artist = lookup.artists.get(refId);
  if (!artist) return { kind: "artist", id: refId, label: "Deleted artist", state: "missing", adminHref: "/admin/artists" };
  return {
    kind: "artist",
    id: refId,
    label: artist.name,
    state: artist.status === "published" ? "published" : "draft",
    adminHref: `/admin/artists/${artist.id}`,
  };
}

/** Why a link doesn't resolve: a short statement plus the advice for fixing it. */
function linkProblem(linked: LinkedInfo): { code: HiddenCode; statement: string; advice: string } {
  switch (linked.state) {
    case "missing":
      return {
        code: "missing-link",
        statement: `The linked ${linked.kind} was deleted`,
        advice: "Pick another one, remove the link, or turn on override and enter a title.",
      };
    case "scheduled":
      return {
        code: "scheduled-link",
        statement: `“${linked.label}” isn’t live until ${formatDate(linked.scheduledFor, "medium")}`,
        advice: "The item appears once the article goes live.",
      };
    default:
      return {
        code: "draft-link",
        statement: `“${linked.label}” is a draft`,
        advice: "Publish it, or turn on override and enter your own title.",
      };
  }
}

/** Resolve an item exactly as the public trending strip would. */
export function resolveTrending(draft: TrendingDraft, lookup: RefLookup): TrendingResolution {
  const manual: DisplayValues = {
    title: clean(draft.title),
    subtitle: clean(draft.subtitle),
    image: cleanImage(draft.image),
    href: clean(draft.href),
    embedUrl: clean(draft.embedUrl),
  };
  const refId = clean(draft.refId);
  const linked = refId ? linkedInfo(draft.type, refId, lookup) : undefined;
  const ref = linked?.state === "published" ? linkedDisplay(draft.type, refId, lookup) : undefined;

  const display: DisplayValues = {};
  const sources: Partial<Record<DisplayField, FieldSource>> = {};
  for (const field of DISPLAY_FIELDS) {
    let value: DisplayValues[DisplayField];
    let source: FieldSource | undefined;
    if (!ref) {
      value = manual[field];
      source = value ? "manual" : undefined;
    } else if (draft.manualOverride) {
      value = manual[field] ?? ref[field];
      source = manual[field] ? "manual" : ref[field] ? "linked" : undefined;
    } else if (field === "embedUrl") {
      value = ref.embedUrl ?? manual.embedUrl;
      source = ref.embedUrl ? "linked" : manual.embedUrl ? "manual" : undefined;
    } else {
      value = ref[field];
      source = value ? "linked" : undefined;
    }
    if (value) {
      (display as Record<DisplayField, DisplayValues[DisplayField]>)[field] = value;
      if (source) sources[field] = source;
    }
  }

  const result: TrendingResolution = { display, sources, linked, visible: false, notes: [] };

  // Why it would be skipped (same order as getTrending).
  if (linked && !ref && !draft.manualOverride && !manual.title) {
    const problem = linkProblem(linked);
    result.hiddenCode = problem.code;
    result.hiddenReason = `${problem.statement}. ${problem.advice}`;
  } else if (!display.title) {
    result.hiddenCode = "no-title";
    if (linked?.kind === "artist" && ref && draft.type === "song") {
      result.hiddenReason = `${linked.label} has no releases yet, so there is no song to show. Add a release to the artist, or turn on override and enter a title.`;
    } else if (linked && !ref) {
      result.hiddenReason = `${linkProblem(linked).statement}, so its details can’t be used. Enter a title.`;
    } else {
      result.hiddenReason = "Add a title, or link an artist or article.";
    }
  } else if (!draft.active) {
    result.hiddenCode = "inactive";
    result.hiddenReason = "Switched off. Turn on “Active” to show it in the trending strip.";
  } else {
    result.visible = true;
  }

  // Advice.
  if (linked && !ref && linked.state !== "missing" && draft.manualOverride && manual.title) {
    result.notes.push({ text: `The linked ${linked.kind} isn’t live, so only your override fields are used.`, tone: "info" });
  }
  if (display.title && !display.image) result.notes.push({ text: "No image: the card shows the Melophile monogram.", tone: "info" });
  if (display.title && !display.href && !display.embedUrl) result.notes.push({ text: "The card doesn’t link anywhere.", tone: "info" });
  if (draft.type === "song" && display.title && !display.embedUrl) {
    result.notes.push({ text: "No player link, so there’s no Listen button.", tone: "info" });
  }
  if (display.embedUrl && !isEmbeddableUrl(display.embedUrl)) {
    result.notes.push({ text: "The player link isn’t a Spotify, YouTube or SoundCloud URL.", tone: "warning" });
  } else if (display.embedUrl && draft.type !== "song") {
    result.notes.push({ text: `Only Song items get a Listen button; on ${TRENDING_TYPE_LABELS[draft.type]} items the player link is just the card’s link.`, tone: "info" });
  }

  return result;
}

/** Human description of a linked artist option for the picker (depends on the item type). */
export function describeArtistOption(artist: TrendingArtistOption, type: TrendingType): string {
  const parts: string[] = [];
  if (artist.status !== "published") parts.push("Draft");
  if (type === "song") {
    parts.push(artist.latestRelease ? `Plays “${artist.latestRelease.title}”` : "No releases yet");
  } else {
    if (artist.genre) parts.push(artist.genre);
    if (artist.location) parts.push(artist.location);
  }
  return parts.join(" · ");
}

export function describeArticleOption(article: TrendingArticleOption): string {
  const parts: string[] = [];
  if (article.status !== "published") parts.push("Draft");
  else if (article.scheduled) parts.push(`Scheduled · ${formatDate(article.publishedAt, "medium")}`);
  else parts.push(formatDate(article.publishedAt, "medium"));
  if (article.category) parts.push(article.category);
  return parts.join(" · ");
}
