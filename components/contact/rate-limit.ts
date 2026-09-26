import "server-only";

/*
 * Best-effort, in-memory rate limit for the public contact form (per server instance). It
 * complements the honeypot and duplicate check; it is not a security boundary on its own.
 */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_SUBMISSIONS = 5;
const MAX_TRACKED_KEYS = 5000;

const globalStore = globalThis as typeof globalThis & { __melophileContactRate?: Map<string, number[]> };
const store: Map<string, number[]> = (globalStore.__melophileContactRate ??= new Map());

function prune(now: number): void {
  for (const [key, hits] of store) {
    const recent = hits.filter((t) => now - t < WINDOW_MS);
    if (recent.length === 0) store.delete(key);
    else store.set(key, recent);
  }
  // Still too many (e.g. a flood of spoofed keys): drop the oldest entries.
  if (store.size > MAX_TRACKED_KEYS) {
    const overflow = store.size - MAX_TRACKED_KEYS;
    let removed = 0;
    for (const key of store.keys()) {
      if (removed++ >= overflow) break;
      store.delete(key);
    }
  }
}

/**
 * Records a submission for `key` (usually the client IP) and returns true when the key has
 * exceeded MAX_SUBMISSIONS in the last 10 minutes. A null key is never limited.
 */
export function isRateLimited(key: string | null, now: number = Date.now()): boolean {
  if (!key) return false;
  const hits = (store.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_SUBMISSIONS) {
    store.set(key, hits);
    return true;
  }
  hits.push(now);
  store.set(key, hits);
  if (store.size > MAX_TRACKED_KEYS) prune(now);
  return false;
}
