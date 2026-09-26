import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  signSessionToken,
  verifySessionToken,
  type AdminSession,
} from "@/lib/admin/session";

/*
 * Admin authentication (single admin account from env).
 *
 *   Pages / layouts / server components  →  await requireAdmin()
 *       Redirects to /admin/login?next=<current path> when signed out. Returns the session.
 *
 *   Server actions                        →  wrap the body in withAdmin() (lib/admin/actions.ts),
 *                                            which calls assertAdminForAction() for you.
 *       assertAdminForAction() throws UnauthorizedError (never redirects), so the client gets a
 *       normal { ok: false, error } result instead of a navigation.
 *
 *   Route handlers                        →  const session = await getSession();
 *                                            if (!session) return 401 JSON.
 *
 * proxy.ts also gates /admin/* and /api/imagekit/*, but that is only an optimistic check:
 * server actions are directly invokable, so EVERY action and API route must check itself.
 */

export type { AdminSession } from "@/lib/admin/session";
export { SESSION_COOKIE } from "@/lib/admin/session";

/** Request header set by proxy.ts with the requested admin path (used for ?next=). */
export const ADMIN_PATH_HEADER = "x-melophile-admin-path";

/** Thrown by assertAdminForAction() when there is no valid session. */
export class UnauthorizedError extends Error {
  constructor(message = "Your session has expired. Please sign in again.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

function sha256(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

/** Constant-time string comparison (hash both sides so lengths always match). */
function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(sha256(a), sha256(b));
}

/**
 * Checks credentials against ADMIN_EMAIL / ADMIN_PASSWORD in constant time.
 * Email is compared case-insensitively. Returns false when the env vars are not configured.
 */
export function verifyCredentials(email: string, password: string): boolean {
  const expectedEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
  const expectedPassword = process.env.ADMIN_PASSWORD ?? "";
  // Always run both comparisons so timing does not reveal which part was wrong.
  const emailOk = safeEqual(email.trim().toLowerCase(), expectedEmail);
  const passwordOk = safeEqual(password, expectedPassword);
  return Boolean(expectedEmail && expectedPassword) && emailOk && passwordOk;
}

/** Signs a session JWT and stores it in the httpOnly cookie. Call only from a server action / route handler. */
export async function createSession(email: string): Promise<void> {
  const token = await signSessionToken(email);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/** Clears the session cookie. Call only from a server action / route handler. */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/** Current admin session, or null. Never throws or redirects. */
export async function getSession(): Promise<AdminSession | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/** True when the current request has a valid admin session. */
export async function isAdmin(): Promise<boolean> {
  return (await getSession()) !== null;
}

/**
 * For pages, layouts and other server components. Returns the session or redirects to
 * /admin/login?next=<path>. `nextPath` defaults to the path proxy.ts recorded for this request.
 * Do NOT use in server actions — use withAdmin() / assertAdminForAction() there.
 */
export async function requireAdmin(nextPath?: string): Promise<AdminSession> {
  const session = await getSession();
  if (session) return session;
  let next = nextPath;
  if (!next) {
    const headerStore = await headers();
    next = headerStore.get(ADMIN_PATH_HEADER) ?? undefined;
  }
  const query = next && next !== "/admin" ? `?next=${encodeURIComponent(next)}` : "";
  redirect(`/admin/login${query}`);
}

/**
 * For server actions (and anything that must not redirect). Returns the session or throws
 * UnauthorizedError. Prefer withAdmin() from lib/admin/actions.ts, which calls this and turns
 * the error into { ok: false, error }.
 */
export async function assertAdminForAction(): Promise<AdminSession> {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  return session;
}
