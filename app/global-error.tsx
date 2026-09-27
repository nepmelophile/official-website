"use client";

import { useEffect } from "react";
import { SITE_NAME } from "@/lib/constants";
import { THEME_ATTRIBUTE, THEME_STORAGE_KEY } from "@/lib/theme";
import "./globals.css";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
}

/*
 * Last-resort boundary for errors in the root layout itself. It replaces the whole document,
 * so it renders its own <html>/<body>, imports the global stylesheet and relies on the font
 * fallbacks (the next/font variables live on the root layout, which is not rendered here).
 * Kept dependency-free on purpose: nothing here should be able to fail again.
 */
export default function GlobalError({ error, retry }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  // This document replaces the root layout (and its no-flash script), so re-apply the stored
  // theme here. No stored choice leaves the attribute off, which CSS treats as System.
  useEffect(() => {
    try {
      const mode = localStorage.getItem(THEME_STORAGE_KEY);
      if (mode === "light" || mode === "dark") document.documentElement.setAttribute(THEME_ATTRIBUTE, mode);
    } catch {
      // Storage unavailable: follow the OS preference.
    }
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-glow flex min-h-dvh flex-col bg-bg font-sans text-fg antialiased">
        <title>{`Something went wrong · ${SITE_NAME}`}</title>
        <main className="mx-auto flex w-full max-w-content flex-1 flex-col justify-center px-gutter py-20">
          <p className="font-display text-2xl font-extrabold tracking-[-0.03em] uppercase">
            {SITE_NAME}
            <span aria-hidden="true" className="text-accent">
              .
            </span>
          </p>
          <p className="mt-16 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
            <span aria-hidden="true" className="size-1.5 rounded-pill bg-danger" />
            Unexpected error
          </p>
          <h1 className="mt-6 max-w-[16ch] font-display text-display-lg font-extrabold">
            The whole band stopped playing.
          </h1>
          <p className="mt-6 max-w-prose text-lg/relaxed text-fg-muted">
            Something broke while loading {SITE_NAME}. Please try again in a moment.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => retry()}
              className="inline-flex min-h-13 items-center justify-center rounded-pill bg-accent px-8 py-4 text-base font-semibold text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              Try again
            </button>
            {/* A full page load (not client navigation) so the root layout is rebuilt from scratch. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="inline-flex min-h-13 items-center justify-center rounded-pill border border-line-strong px-8 py-4 text-base font-semibold text-fg transition-colors hover:border-fg"
            >
              Back to home
            </a>
          </div>
          {error.digest ? (
            <p className="mt-12 font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
              Reference <span className="text-fg-muted normal-case tracking-normal">{error.digest}</span>
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
