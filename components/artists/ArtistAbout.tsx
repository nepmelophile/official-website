import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Prose } from "@/components/ui/Prose";
import { Section, type SectionTone } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RELEASE_TYPE_LABELS } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import type { ArtistDTO, Release } from "@/types/content";
import { META } from "./styles";

export interface ArtistAboutProps {
  artist: ArtistDTO;
  index: number;
  tone?: SectionTone;
}

/** Most recent release by date (falls back to the first listed release). */
function latestRelease(releases: Release[]): Release | undefined {
  let latest: Release | undefined;
  let latestTime = Number.NEGATIVE_INFINITY;
  for (const release of releases) {
    const time = release.releaseDate ? Date.parse(release.releaseDate) : Number.NaN;
    if (!Number.isNaN(time) && time > latestTime) {
      latest = release;
      latestTime = time;
    }
  }
  return latest ?? releases[0];
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5 py-4 first:pt-0 last:pb-0">
      <dt className={cn(META, "text-[0.6875rem] text-fg-subtle")}>{label}</dt>
      <dd className="text-fg">{children}</dd>
    </div>
  );
}

/** Biography (markdown) with an "at a glance" fact panel and an enquiry CTA. */
export function ArtistAbout({ artist, index, tone = "default" }: ArtistAboutProps) {
  const latest = latestRelease(artist.releases);
  const latestDate = latest?.releaseDate ? formatDate(latest.releaseDate, "medium") : "";
  const enquiryHref = `/contact?subject=${encodeURIComponent(`Enquiry about ${artist.name}`.slice(0, 150))}`;
  const bio = artist.bio?.trim();

  return (
    <Section tone={tone} spacing="none" className="pt-6 pb-section md:pt-10" aria-labelledby="artist-about-title">
      <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="min-w-0 lg:col-span-7">
          <SectionHeading
            id="artist-about-title"
            index={index}
            eyebrow="Biography"
            title={
              <>
                The <em>story</em> so far
              </>
            }
            size="md"
          />
          {bio ? (
            <Prose className="mt-10">{bio}</Prose>
          ) : (
            <p className="mt-10 max-w-reading text-lg/relaxed text-fg-muted">
              {artist.shortBio || `A full biography of ${artist.name} is on its way.`}
            </p>
          )}
        </div>

        <aside aria-labelledby="artist-facts-title" className="lg:col-span-4 lg:col-start-9">
          <div className="rounded-lg border border-line bg-surface p-6 shadow-card md:p-8 lg:sticky lg:top-28">
            <h2 id="artist-facts-title" className={cn(META, "flex items-center gap-2 text-fg-subtle")}>
              <span aria-hidden="true" className="size-1.5 rounded-pill bg-highlight" />
              At a glance
            </h2>
            <dl className="mt-6 divide-y divide-line">
              <Fact label="Artist">{artist.name}</Fact>
              {artist.location ? <Fact label="Based in">{artist.location}</Fact> : null}
              {artist.genres.length > 0 ? <Fact label="Genres">{artist.genres.join(" · ")}</Fact> : null}
              {latest ? (
                <Fact label="Latest release">
                  <a
                    href="#artist-releases"
                    className="font-medium underline decoration-accent decoration-1 underline-offset-4 transition-colors hover:text-orchid-300"
                  >
                    {latest.title}
                  </a>
                  <span className="mt-1 block text-sm text-fg-muted">
                    {[latest.type ? RELEASE_TYPE_LABELS[latest.type] : null, latestDate || null]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </Fact>
              ) : null}
              {artist.releases.length > 1 ? (
                <Fact label="Releases">{artist.releases.length}</Fact>
              ) : null}
            </dl>
            <ButtonLink href={enquiryHref} variant="secondary" block icon="arrow-right" className="mt-8">
              Bookings &amp; enquiries
              <span className="sr-only"> about {artist.name}</span>
            </ButtonLink>
          </div>
        </aside>
      </div>
    </Section>
  );
}
