import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Artist not found",
  robots: { index: false, follow: true },
};

function Grooves() {
  return (
    <svg viewBox="0 0 200 200" fill="none" aria-hidden="true" className="size-full text-ink-700">
      {[96, 84, 72, 60, 48, 36].map((r) => (
        <circle key={r} cx="100" cy="100" r={r} stroke="currentColor" strokeWidth="1.25" />
      ))}
      <circle cx="100" cy="100" r="20" className="fill-vermilion-500" />
      <circle cx="100" cy="100" r="4" className="fill-bg" />
    </svg>
  );
}

/** 404 for a missing or unpublished artist (rendered inside the public layout). */
export default function ArtistNotFound() {
  return (
    <section aria-labelledby="artist-not-found-title" className="bg-glow relative overflow-hidden">
      <Container className="grid items-center gap-12 py-section md:grid-cols-12">
        <div className="md:col-span-7">
          <p className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
            <span aria-hidden="true" className="inline-block size-1.5 rounded-pill bg-vermilion-500" />
            404 — Artist not found
          </p>
          <h1
            id="artist-not-found-title"
            className="font-display text-display-xl font-extrabold text-fg [font-stretch:88%] [&_em]:font-serif [&_em]:font-normal [&_em]:text-highlight [&_em]:italic"
          >
            This artist has left the <em>stage</em>.
          </h1>
          <p className="mt-6 max-w-prose text-lg/relaxed text-fg-muted">
            The profile you&rsquo;re looking for doesn&rsquo;t exist or isn&rsquo;t public yet. The rest of the
            line-up is still here.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href="/artists" icon="arrow-right">
              Browse all artists
            </ButtonLink>
            <ButtonLink href="/news" variant="secondary">
              Read the latest news
            </ButtonLink>
          </div>
        </div>
        <div className="hidden md:col-span-4 md:col-start-9 md:block">
          <div className="mx-auto aspect-square w-full max-w-sm">
            <Grooves />
          </div>
        </div>
      </Container>
    </section>
  );
}
