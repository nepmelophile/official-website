/**
 * Converts public Spotify / YouTube / SoundCloud page URLs into safe iframe embeds.
 * Pure + isomorphic (usable from server, client and zod validators).
 * Only hosts on the strict allow-list below are ever turned into iframe sources.
 */

export type EmbedProvider = "spotify" | "youtube" | "soundcloud";

export interface EmbedInfo {
  provider: EmbedProvider;
  /** iframe src (always https, always on the provider's official embed host). */
  src: string;
  /** Recommended iframe height in px (for YouTube, prefer `aspectRatio` and ignore height). */
  height: number;
  /** CSS aspect-ratio for responsive video embeds (YouTube only). */
  aspectRatio?: string;
}

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtube-nocookie.com",
  "youtube-nocookie.com",
]);

const SPOTIFY_HOSTS = new Set(["open.spotify.com"]);

const SOUNDCLOUD_HOSTS = new Set(["soundcloud.com", "www.soundcloud.com", "m.soundcloud.com"]);
const SOUNDCLOUD_PLAYER_HOST = "w.soundcloud.com";

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_LIST_ID = /^[A-Za-z0-9_-]{10,64}$/;
const SPOTIFY_ID = /^[A-Za-z0-9]{22}$/;
const SPOTIFY_TYPES = new Set(["track", "album", "playlist", "artist", "episode", "show"]);

function parseUrl(input: string): URL | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (url.username || url.password) return null;
    return url;
  } catch {
    return null;
  }
}

function youtube(url: URL): EmbedInfo | null {
  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split("/").filter(Boolean);
  let videoId: string | null = null;

  if (host === "youtu.be") {
    videoId = segments[0] ?? null;
  } else if (segments[0] === "watch") {
    videoId = url.searchParams.get("v");
  } else if (segments[0] && ["shorts", "embed", "live", "v"].includes(segments[0])) {
    videoId = segments[1] ?? null;
  } else if (segments[0] === "playlist") {
    const list = url.searchParams.get("list");
    if (list && YOUTUBE_LIST_ID.test(list)) {
      return {
        provider: "youtube",
        src: `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(list)}`,
        height: 315,
        aspectRatio: "16 / 9",
      };
    }
    return null;
  }

  if (!videoId || !YOUTUBE_ID.test(videoId)) return null;

  const params = new URLSearchParams({ rel: "0", modestbranding: "1" });
  const start = url.searchParams.get("t") ?? url.searchParams.get("start");
  const seconds = start ? parseYouTubeTime(start) : 0;
  if (seconds > 0) params.set("start", String(seconds));

  return {
    provider: "youtube",
    src: `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`,
    height: 315,
    aspectRatio: "16 / 9",
  };
}

function parseYouTubeTime(value: string): number {
  if (/^\d+$/.test(value)) return Number(value);
  const match = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(value);
  if (!match) return 0;
  const [, h = "0", m = "0", s = "0"] = match;
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

function spotify(url: URL): EmbedInfo | null {
  let segments = url.pathname.split("/").filter(Boolean);
  // Localised links: /intl-xx/track/ID
  if (segments[0]?.startsWith("intl-")) segments = segments.slice(1);
  // Already an embed link: /embed/track/ID
  if (segments[0] === "embed") segments = segments.slice(1);

  const [type, id] = segments;
  if (!type || !id || !SPOTIFY_TYPES.has(type) || !SPOTIFY_ID.test(id)) return null;

  const compact = type === "track" || type === "episode";
  return {
    provider: "spotify",
    src: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`,
    height: compact ? 152 : 352,
  };
}

function soundcloudPlayer(trackUrl: string, isSet: boolean): EmbedInfo {
  const params = new URLSearchParams({
    url: trackUrl,
    color: "#e8391f",
    auto_play: "false",
    hide_related: "true",
    show_comments: "false",
    show_user: "true",
    show_reposts: "false",
    show_teaser: "false",
    visual: "false",
  });
  return {
    provider: "soundcloud",
    src: `https://${SOUNDCLOUD_PLAYER_HOST}/player/?${params.toString()}`,
    height: isSet ? 450 : 166,
  };
}

function soundcloud(url: URL): EmbedInfo | null {
  const host = url.hostname.toLowerCase();

  if (host === SOUNDCLOUD_PLAYER_HOST) {
    // Existing widget URL: validate its inner `url` param points at SoundCloud.
    const inner = url.searchParams.get("url");
    const innerUrl = inner ? parseUrl(inner) : null;
    if (!innerUrl) return null;
    const innerHost = innerUrl.hostname.toLowerCase();
    if (!SOUNDCLOUD_HOSTS.has(innerHost) && innerHost !== "api.soundcloud.com") return null;
    return soundcloudPlayer(innerUrl.toString(), innerUrl.pathname.includes("/playlists/"));
  }

  const segments = url.pathname.split("/").filter(Boolean);
  // Need at least /artist/track (or /artist/sets/name); a bare profile also embeds fine.
  if (segments.length < 1) return null;
  const clean = `https://soundcloud.com/${segments.join("/")}`;
  return soundcloudPlayer(clean, segments[1] === "sets" || segments.length === 1);
}

/** Returns iframe details for an allowed music/video URL, or null when it is not embeddable. */
export function toEmbed(input: string | null | undefined): EmbedInfo | null {
  if (!input) return null;
  const url = parseUrl(input);
  if (!url) return null;
  const host = url.hostname.toLowerCase();

  if (YOUTUBE_HOSTS.has(host)) return youtube(url);
  if (SPOTIFY_HOSTS.has(host)) return spotify(url);
  if (SOUNDCLOUD_HOSTS.has(host) || host === SOUNDCLOUD_PLAYER_HOST) return soundcloud(url);
  return null;
}

/** True when `toEmbed(url)` would produce an embed. */
export function isEmbeddableUrl(input: string | null | undefined): boolean {
  return toEmbed(input) !== null;
}

/** Provider of an embeddable URL (or null). Handy for labels/icons. */
export function getEmbedProvider(input: string | null | undefined): EmbedProvider | null {
  return toEmbed(input)?.provider ?? null;
}

export const EMBED_PROVIDER_LABELS: Record<EmbedProvider, string> = {
  spotify: "Spotify",
  youtube: "YouTube",
  soundcloud: "SoundCloud",
};

/** Hosts allowed in iframe `src` (useful for a CSP frame-src directive). */
export const EMBED_FRAME_HOSTS = [
  "https://open.spotify.com",
  "https://www.youtube-nocookie.com",
  "https://w.soundcloud.com",
] as const;
