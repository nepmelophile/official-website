import "server-only";
import { headers } from "next/headers";

/*
 * Best-effort client IP for rate limiting (admin login throttle, contact form limit).
 *
 * The LEFT-most X-Forwarded-For value is whatever the client sent, so it must never be trusted:
 * rotating it would give every request a fresh throttle key. Instead:
 *
 * - On Vercel the edge overwrites X-Forwarded-For and sets x-real-ip / x-vercel-forwarded-for
 *   to the real client address, so those are used.
 * - Elsewhere, only entries appended by our own reverse proxies are trusted: with
 *   TRUSTED_PROXY_HOPS=N (default 1: one nginx / Caddy / Cloudflare hop in front of
 *   `next start`) the N-th entry from the RIGHT is the address that proxy saw.
 *   Set TRUSTED_PROXY_HOPS=0 when `next start` is exposed directly (no proxy): every header is
 *   then client-controlled and ignored, and callers fall back to their shared key.
 */

function parseHops(): number {
  const raw = process.env.TRUSTED_PROXY_HOPS?.trim();
  if (!raw) return 1;
  const hops = Number.parseInt(raw, 10);
  return Number.isFinite(hops) && hops >= 0 ? Math.min(hops, 10) : 1;
}

function firstEntry(value: string | null): string | null {
  const entry = value?.split(",")[0]?.trim();
  return entry || null;
}

/** Returns the client IP, or null when it cannot be determined from trusted headers. */
export async function getClientIp(): Promise<string | null> {
  let h: Awaited<ReturnType<typeof headers>>;
  try {
    h = await headers();
  } catch {
    return null;
  }

  if (process.env.VERCEL) {
    return (
      firstEntry(h.get("x-vercel-forwarded-for")) ??
      firstEntry(h.get("x-real-ip")) ??
      firstEntry(h.get("x-forwarded-for"))
    );
  }

  const hops = parseHops();
  if (hops === 0) return null;

  const chain = (h.get("x-forwarded-for") ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (chain.length >= hops) return chain[chain.length - hops] ?? null;

  // Shorter chain than configured: the request did not pass through all trusted proxies.
  return null;
}
