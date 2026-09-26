/**
 * Admin session token primitives (JWT, HS256 via `jose`).
 *
 * Deliberately free of `server-only`, `next/headers` and Node-only APIs so it can be imported
 * from BOTH `proxy.ts` and server code (`lib/auth.ts`). Cookie handling lives in lib/auth.ts.
 */
import { jwtVerify, SignJWT, type JWTPayload } from "jose";

/** Name of the httpOnly session cookie. */
export const SESSION_COOKIE = "melophile_admin";

/** Session lifetime: 7 days. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const ISSUER = "melophile";
const AUDIENCE = "melophile-admin";
const MIN_SECRET_LENGTH = 32;

/** Payload stored in the session JWT. */
export interface AdminSession {
  /** Admin email (JWT `sub`). */
  email: string;
  role: "admin";
  /** Issued-at / expiry as epoch seconds. */
  issuedAt: number;
  expiresAt: number;
}

/** Thrown when AUTH_SECRET is missing or too weak. */
export class AuthConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthConfigError";
  }
}

let warnedShortSecret = false;

/**
 * Returns the HMAC key derived from AUTH_SECRET.
 * - Missing → throws (always).
 * - Shorter than 32 chars → throws in production, warns once in development.
 */
export function getSessionSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    throw new AuthConfigError(
      "AUTH_SECRET is not set. Generate one with `openssl rand -base64 48` and add it to .env.local / Vercel env.",
    );
  }
  if (secret.length < MIN_SECRET_LENGTH) {
    if (process.env.NODE_ENV === "production") {
      throw new AuthConfigError(`AUTH_SECRET must be at least ${MIN_SECRET_LENGTH} characters in production.`);
    }
    if (!warnedShortSecret) {
      warnedShortSecret = true;
      console.warn(`[melophile] AUTH_SECRET is shorter than ${MIN_SECRET_LENGTH} characters; fine for dev, not for production.`);
    }
  }
  return new TextEncoder().encode(secret);
}

/** True when AUTH_SECRET, ADMIN_EMAIL and ADMIN_PASSWORD are all present (and the secret is valid). */
export function isAuthConfigured(): boolean {
  if (!process.env.ADMIN_EMAIL?.trim() || !process.env.ADMIN_PASSWORD) return false;
  try {
    getSessionSecret();
    return true;
  } catch {
    return false;
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Short fingerprint of the current ADMIN_PASSWORD: first 16 hex chars of
 * HMAC-SHA256(AUTH_SECRET, ADMIN_PASSWORD). Stored in the token as `pwv` so rotating
 * ADMIN_PASSWORD revokes every existing session. Uses Web Crypto (works in proxy + Node).
 */
async function passwordVersion(): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`pwv:${process.env.ADMIN_PASSWORD ?? ""}`));
  return Array.from(new Uint8Array(mac).slice(0, 8), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Signs a new 7-day admin session token. */
export async function signSessionToken(email: string): Promise<string> {
  return new SignJWT({ role: "admin", pwv: await passwordVersion() })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(normalizeEmail(email))
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSessionSecret());
}

/**
 * Verifies a session token. Returns the session, or null when the token is missing, expired,
 * tampered with, signed with another secret, or issued for an email / password that is no longer
 * ADMIN_EMAIL / ADMIN_PASSWORD (changing ADMIN_EMAIL, ADMIN_PASSWORD or AUTH_SECRET therefore
 * signs everyone out).
 * Never throws.
 */
export async function verifySessionToken(token: string | null | undefined): Promise<AdminSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify<JWTPayload & { role?: unknown; pwv?: unknown }>(token, getSessionSecret(), {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    const adminEmail = process.env.ADMIN_EMAIL?.trim();
    if (payload.role !== "admin" || !payload.sub || !adminEmail) return null;
    if (payload.sub !== normalizeEmail(adminEmail)) return null;
    if (typeof payload.pwv !== "string" || payload.pwv !== (await passwordVersion())) return null;
    return {
      email: payload.sub,
      role: "admin",
      issuedAt: payload.iat ?? 0,
      expiresAt: payload.exp ?? 0,
    };
  } catch {
    return null;
  }
}

/**
 * Returns a safe post-login redirect target: only same-origin paths under /admin
 * (never /admin/login itself, protocol-relative URLs or other origins). Falls back to /admin.
 */
export function safeAdminRedirect(next: string | null | undefined): string {
  if (!next || typeof next !== "string") return "/admin";
  const value = next.trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/admin";
  try {
    const base = "http://melophile.invalid";
    const url = new URL(value, base);
    if (url.origin !== base) return "/admin";
    if (url.pathname !== "/admin" && !url.pathname.startsWith("/admin/")) return "/admin";
    if (url.pathname === "/admin/login" || url.pathname.startsWith("/admin/login/")) return "/admin";
    return `${url.pathname}${url.search}`;
  } catch {
    return "/admin";
  }
}
