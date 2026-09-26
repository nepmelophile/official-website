"use server";

import { redirect } from "next/navigation";
import { safeAdminRedirect, isAuthConfigured } from "@/lib/admin/session";
import { createSession, destroySession, verifyCredentials } from "@/lib/auth";
import { getClientIp } from "@/lib/client-ip";

/* Login / logout server actions for /admin. */

export interface LoginState {
  error?: string;
  /** Echoed back so the email field keeps its value after a failed attempt. */
  email?: string;
}

/* ---- Best-effort brute-force throttle (per server instance) ----
 * Two layers: a per-IP limit (IP from trusted proxy headers only — see lib/client-ip.ts) and a
 * global ceiling on failed logins across all keys, so rotating a spoofed IP header (possible
 * when no trusted proxy is in front of `next start`) cannot give an attacker unlimited guesses. */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 8;
/** Failed logins allowed from ALL clients combined per window before every attempt is throttled. */
const MAX_GLOBAL_FAILURES = 50;
const GLOBAL_KEY = "__all__";
const FAILURE_DELAY_MS = 800;

interface Attempts {
  count: number;
  firstAt: number;
}

const globalForLogin = globalThis as typeof globalThis & { __melophileLoginAttempts?: Map<string, Attempts> };
const attempts = (globalForLogin.__melophileLoginAttempts ??= new Map<string, Attempts>());

async function clientKey(): Promise<string> {
  return `ip:${(await getClientIp()) ?? "unknown"}`;
}

function currentAttempts(key: string, now: number): Attempts | undefined {
  const entry = attempts.get(key);
  if (entry && now - entry.firstAt > WINDOW_MS) {
    attempts.delete(key);
    return undefined;
  }
  return entry;
}

function recordFailure(key: string, now: number): void {
  const entry = currentAttempts(key, now);
  if (entry) entry.count += 1;
  else attempts.set(key, { count: 1, firstAt: now });
  // Keep the map bounded.
  if (attempts.size > 5000) {
    for (const [k, v] of attempts) if (now - v.firstAt > WINDOW_MS) attempts.delete(k);
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** useActionState-compatible login action (progressively enhanced <form>). */
export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().slice(0, 320);
  const password = String(formData.get("password") ?? "").slice(0, 1024);
  const next = safeAdminRedirect(String(formData.get("next") ?? ""));

  if (!isAuthConfigured()) {
    return {
      email,
      error: "Admin sign-in is not configured. Set ADMIN_EMAIL, ADMIN_PASSWORD and AUTH_SECRET (32+ characters).",
    };
  }

  const key = await clientKey();
  const now = Date.now();
  const entry = currentAttempts(key, now);
  const global = currentAttempts(GLOBAL_KEY, now);
  const blocking =
    entry && entry.count >= MAX_FAILURES ? entry : global && global.count >= MAX_GLOBAL_FAILURES ? global : undefined;
  if (blocking) {
    await sleep(FAILURE_DELAY_MS);
    const minutes = Math.max(1, Math.ceil((blocking.firstAt + WINDOW_MS - now) / 60_000));
    return { email, error: `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` };
  }

  if (!email || !password || !verifyCredentials(email, password)) {
    recordFailure(key, now);
    recordFailure(GLOBAL_KEY, now);
    await sleep(FAILURE_DELAY_MS);
    return { email, error: "Incorrect email or password." };
  }

  attempts.delete(key);
  await createSession(email);
  redirect(next);
}

/** Clears the session and returns to the login page. */
export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}
