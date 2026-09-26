const GOOGLE_MAP_HOSTS = new Set(["www.google.com", "google.com", "maps.google.com"]);
const OSM_HOSTS = new Set(["www.openstreetmap.org", "openstreetmap.org"]);

/** Pulls the `src` out of a pasted `<iframe …>` snippet (a common copy/paste from Google Maps). */
function extractIframeSrc(input: string): string {
  if (!/<iframe/i.test(input)) return input;
  const match = /\ssrc\s*=\s*(["'])(.*?)\1/i.exec(input);
  return match ? match[2].replace(/&amp;/g, "&") : "";
}

/**
 * Returns a safe map iframe `src`, or null. Only official embed URLs are allowed:
 * - Google Maps: https://www.google.com/maps/embed?pb=…, /maps/embed/v1/…, /maps/d/embed?mid=…,
 *   or /maps?…&output=embed
 * - OpenStreetMap: https://www.openstreetmap.org/export/embed.html?… (accepted by the admin form)
 * Anything else (other hosts, http:, credentials, non-embed paths) is rejected.
 */
export function toSafeMapEmbedUrl(input: string | null | undefined): string | null {
  const raw = input?.trim();
  if (!raw) return null;

  let url: URL;
  try {
    url = new URL(extractIframeSrc(raw).trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return null;

  const host = url.hostname.toLowerCase();
  const path = url.pathname;

  if (GOOGLE_MAP_HOSTS.has(host)) {
    const embedPath = path === "/maps/embed" || path.startsWith("/maps/embed/") || path === "/maps/d/embed";
    const outputEmbed =
      (path === "/maps" || path.startsWith("/maps/")) && url.searchParams.get("output") === "embed";
    return embedPath || outputEmbed ? url.toString() : null;
  }

  if (OSM_HOSTS.has(host) && path === "/export/embed.html") return url.toString();

  return null;
}

/** Google Maps search link for "Get directions" (opens the address in Maps). */
export function mapsSearchUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
