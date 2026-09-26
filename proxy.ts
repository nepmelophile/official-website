import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/admin/session";

/*
 * Next 16 Proxy (formerly middleware). Optimistic auth gate for the admin area:
 *   - /admin/* (except /admin/login) → redirect to /admin/login?next=… without a valid session
 *   - /api/imagekit/*                → 401 JSON without a valid session
 *
 * This is NOT the security boundary: every admin page calls requireAdmin() and every server
 * action / API route checks the session itself (lib/auth.ts, lib/admin/actions.ts).
 */

/** Keep in sync with ADMIN_PATH_HEADER in lib/auth.ts. */
const ADMIN_PATH_HEADER = "x-melophile-admin-path";

function isLoginPath(pathname: string): boolean {
  return pathname === "/admin/login" || pathname.startsWith("/admin/login/");
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");

  // Record the requested admin path for requireAdmin()'s ?next= (overwrites any client value).
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(ADMIN_PATH_HEADER, `${pathname}${search}`);
  const pass = () => NextResponse.next({ request: { headers: requestHeaders } });

  if (!isApi && isLoginPath(pathname)) return pass();

  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (session) return pass();

  if (isApi) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Server action POSTs are let through: the action itself (withAdmin) rejects them with a
  // readable { ok: false } result, instead of the client choking on a redirect to HTML.
  if (request.method === "POST" && request.headers.has("next-action")) return pass();

  const loginUrl = new URL("/admin/login", request.url);
  const next = `${pathname}${search}`;
  if (next !== "/admin") loginUrl.searchParams.set("next", next);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/imagekit/:path*"],
};
