/**
 * Remote image hosts. Keep in sync with `images.remotePatterns` in next.config.ts.
 * Isomorphic: NEXT_PUBLIC_* env vars are inlined on the client.
 */
export const IMAGE_REMOTE_HOSTS = ["ik.imagekit.io", "picsum.photos", "fastly.picsum.photos"] as const;

/** Host of a custom ImageKit URL endpoint (e.g. media.melophilenp.com), if configured. */
export function imagekitCustomHost(): string | null {
  const endpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT?.trim();
  if (!endpoint) return null;
  try {
    return new URL(endpoint).hostname;
  } catch {
    return null;
  }
}

/**
 * True when next/image can optimise this src (relative path or an allowed remote host).
 * For anything else render with `unoptimized` so an admin-pasted URL never crashes a page.
 */
export function isOptimizableImageUrl(src: string | null | undefined): boolean {
  if (!src) return false;
  if (src.startsWith("/") && !src.startsWith("//")) return true;
  try {
    const url = new URL(src);
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    return (IMAGE_REMOTE_HOSTS as readonly string[]).includes(host) || host === imagekitCustomHost();
  } catch {
    return false;
  }
}
