import "server-only";
import { cache } from "react";
import { DbUnavailableError, connectToDatabase, isDbConfigured } from "@/lib/db";

const logged = new Set<string>();

function logOnce(key: string, message: string, error?: unknown): void {
  if (logged.has(key)) return;
  logged.add(key);
  if (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.warn(`[melophile] ${message}: ${detail}`);
  } else {
    console.warn(`[melophile] ${message}`);
  }
}

/** True while `next build` is prerendering (fallbacks keep the build DB-independent). */
function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

/**
 * Per-render "strict" flag (React `cache` is scoped to a single server render/request).
 * Set by `requireLiveData()`; while set, `safeQuery` rethrows instead of serving fallbacks.
 */
const renderMode = cache((): { strict: boolean } => ({ strict: false }));

/**
 * Call at the top of every ISR page render (and its generateMetadata) whose output is cached.
 *
 * Why: at runtime a regeneration that silently renders fallbacks (empty lists, a 404 for a
 * missing artist) would be stored as the new cache entry for the whole `revalidate` window,
 * so a few seconds of Atlas trouble would stick for an hour. When rendering THROWS, Next keeps
 * serving the last good (stale) page instead; first-time renders show the error boundary.
 *
 * - No MONGODB_URI, or during `next build`: no-op — fallbacks keep builds/previews working.
 * - Otherwise: connects now (throwing if the DB is unreachable or in the post-failure back-off)
 *   and switches every later `safeQuery` in this render to rethrow its errors.
 *
 * Dynamic (per-request) pages and the shared site layout do NOT call this, so they keep
 * degrading gracefully — nothing of theirs is cached.
 */
export async function requireLiveData(): Promise<void> {
  if (!isDbConfigured() || isBuildPhase()) return;
  renderMode().strict = true;
  await connectToDatabase();
}

/**
 * Runs a read against MongoDB, returning `fallback` instead of throwing when the database is
 * not configured (e.g. Vercel preview without MONGODB_URI, CI builds) or unreachable.
 * Inside a render that called `requireLiveData()` errors propagate instead (see above).
 * Errors are logged once per query label so builds and logs stay readable.
 */
export async function safeQuery<T>(
  label: string,
  fallback: T,
  run: () => Promise<T>,
  options: { /** Never rethrow, even in a strict render (site chrome shared by every page). */ lenient?: boolean } = {},
): Promise<T> {
  if (!isDbConfigured()) {
    logOnce("__no_db__", "MONGODB_URI is not set — serving empty/default content");
    return fallback;
  }
  try {
    await connectToDatabase();
    return await run();
  } catch (error) {
    if (!options.lenient && renderMode().strict && !isBuildPhase()) {
      console.error(`[melophile] Query "${label}" failed during a cached render; keeping the stale page`, error);
      throw error;
    }
    if (error instanceof DbUnavailableError) {
      logOnce("__db_backoff__", "Database unavailable (back-off) — serving fallbacks");
      return fallback;
    }
    logOnce(label, `Query "${label}" failed; serving fallback`, error);
    return fallback;
  }
}

/** True for a 24-char hex MongoDB ObjectId string. */
export function isObjectIdString(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{24}$/i.test(value);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Case-insensitive exact-match regex that treats spaces and hyphens as interchangeable, so a
 * URL slug ("hip-hop", "behind-the-scenes") matches the stored label ("Hip Hop", "Behind the Scenes").
 */
export function looseMatch(value: string): RegExp {
  const parts = value.trim().split(/[\s-]+/).filter(Boolean).map(escapeRegExp);
  return new RegExp(`^${parts.join("[\\s-]+")}$`, "i");
}

/** Keeps the order of `ids`, dropping ids that did not resolve. */
export function orderByIds<T extends { id: string }>(items: T[], ids: readonly string[]): T[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  return ids.map((id) => byId.get(id)).filter((item): item is T => Boolean(item));
}
