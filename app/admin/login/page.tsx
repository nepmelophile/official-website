import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { BrandLogo } from "@/components/site/BrandLogo";
import { isAuthConfigured, safeAdminRedirect } from "@/lib/admin/session";
import { getSession } from "@/lib/auth";
import { getBrandAssets } from "@/lib/queries/brand";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const next = safeAdminRedirect(rawNext);

  if (await getSession()) redirect(next);

  const configured = isAuthConfigured();
  const brand = await getBrandAssets();

  return (
    <main
      id="main"
      className="relative grid min-h-dvh place-items-center overflow-hidden bg-bg px-4 py-12"
    >
      {/* Oversized wordmark as quiet texture */}
      <p
        aria-hidden
        className="pointer-events-none absolute -bottom-[0.18em] left-1/2 -translate-x-1/2 select-none font-display text-[clamp(6rem,22vw,20rem)] font-extrabold leading-none tracking-[-0.05em] whitespace-nowrap text-bg-alt"
      >
        MELOPHILE
      </p>

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex justify-center rounded-xs" aria-label="Melophile — back to the site">
            <BrandLogo brand={brand} height={44} decorative eager />
          </Link>
          <p className="mt-2 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-fg-subtle">Backstage · Admin</p>
        </div>

        <div className="rounded-lg border border-line bg-surface p-6 shadow-card sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="inline-flex size-9 items-center justify-center rounded-pill border border-line-strong text-link">
              <LockKeyhole aria-hidden className="size-4" strokeWidth={1.75} />
            </span>
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight">Sign in</h1>
              <p className="text-xs text-fg-subtle">Editors only. Sessions last 7 days.</p>
            </div>
          </div>

          {!configured ? (
            <div role="status" className="mb-5 rounded-sm border border-warning/40 bg-warning/10 px-3 py-2.5 text-sm text-fg">
              Sign-in isn’t configured yet. Set <code className="font-mono text-xs text-warning">ADMIN_EMAIL</code>,{" "}
              <code className="font-mono text-xs text-warning">ADMIN_PASSWORD</code> and{" "}
              <code className="font-mono text-xs text-warning">AUTH_SECRET</code> (32+ characters) in the environment.
            </div>
          ) : null}

          <LoginForm next={next} disabled={!configured} />
        </div>

        <p className="mt-6 text-center text-xs text-fg-subtle">
          <Link href="/" className="underline-offset-4 hover:text-fg hover:underline">
            ← Back to melophilenp.com
          </Link>
        </p>
      </div>
    </main>
  );
}
