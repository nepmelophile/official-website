import type { Metadata } from "next";
import Link from "next/link";
import { VinylGrooves } from "@/components/home/decor";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import SiteLayout from "./(site)/layout";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you were looking for could not be found on Melophile.",
  robots: { index: false, follow: true },
};

const DIGIT = "font-display text-[clamp(7rem,4rem+16vw,17rem)] leading-[0.8] font-extrabold tracking-[-0.06em] text-ink-700 [font-stretch:80%]";

/**
 * Branded 404 for unmatched URLs and notFound() calls (missing or unpublished articles and
 * artists). It lives at the app root, outside the (site) group, so it wraps itself in the
 * public chrome (skip link, header, footer) — the (site) layout is not rendered around it.
 */
export default function NotFound() {
  return (
    <SiteLayout>
      <section aria-labelledby="not-found-title" className="bg-glow relative isolate overflow-hidden bg-bg">
        <Container className="grid items-center gap-12 py-16 md:py-24 lg:grid-cols-12 lg:gap-8 lg:py-32">
          <div className="lg:col-span-7">
            <p className="flex animate-fade-up items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
              <span aria-hidden="true" className="size-1.5 animate-pulse-dot rounded-pill bg-accent" />
              Error 404 — track not found
            </p>
            <h1
              id="not-found-title"
              className="mt-6 animate-fade-up font-display text-display-xl font-extrabold tracking-[-0.025em] text-fg [animation-delay:80ms] [font-stretch:88%] [&_em]:font-serif [&_em]:font-normal [&_em]:tracking-[-0.02em] [&_em]:text-highlight [&_em]:italic [&_em]:[font-stretch:100%]"
            >
              This page <em>skipped</em> a beat.
            </h1>
            <p className="mt-6 max-w-prose animate-fade-up text-lg/relaxed text-fg-muted [animation-delay:160ms]">
              The page you were looking for may have moved, been taken down, or never existed. Try one of these
              instead.
            </p>
            <ul className="mt-10 flex animate-fade-up flex-wrap items-center gap-3 [animation-delay:240ms]" aria-label="Suggested pages">
              <li>
                <ButtonLink href="/" size="lg" icon="arrow-right">
                  Back to home
                </ButtonLink>
              </li>
              <li>
                <ButtonLink href="/news" variant="secondary" size="lg">
                  Latest news
                </ButtonLink>
              </li>
              <li>
                <ButtonLink href="/artists" variant="secondary" size="lg">
                  Browse artists
                </ButtonLink>
              </li>
            </ul>
            <p className="mt-10 text-sm text-fg-subtle">
              Followed a broken link?{" "}
              <Link
                href="/contact"
                className="text-orchid-300 underline decoration-orchid-700 underline-offset-4 transition-colors hover:text-fg hover:decoration-orchid-300"
              >
                Let us know
              </Link>
              .
            </p>
          </div>

          <div aria-hidden="true" className="flex animate-fade-up items-center justify-center gap-2 [animation-delay:200ms] lg:col-span-5 lg:justify-end">
            <span className={DIGIT}>4</span>
            <VinylGrooves className="size-[clamp(6rem,3.5rem+13vw,14rem)] shrink-0 text-ink-600" />
            <span className={DIGIT}>4</span>
          </div>
        </Container>
      </section>
    </SiteLayout>
  );
}
