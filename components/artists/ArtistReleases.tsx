import { Embed } from "@/components/ui/Embed";
import { Section, type SectionTone } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SmartImage } from "@/components/ui/SmartImage";
import { RELEASE_TYPE_LABELS } from "@/lib/constants";
import { cn, formatDate, toDateInputValue } from "@/lib/utils";
import type { Release } from "@/types/content";
import { META } from "./styles";

export interface ArtistReleasesProps {
  artistName: string;
  releases: Release[];
  index: number;
  tone?: SectionTone;
}

function ReleaseItem({ release, artistName, id }: { release: Release; artistName: string; id: string }) {
  const typeLabel = release.type ? RELEASE_TYPE_LABELS[release.type] : null;
  const date = release.releaseDate ? formatDate(release.releaseDate, "medium") : "";

  return (
    <article aria-labelledby={id} className="flex h-full flex-col">
      <div className="flex items-end gap-5 border-b border-line pb-5">
        <SmartImage
          image={release.coverImage}
          alt={`${release.title} cover art`}
          sizes="112px"
          monogram={release.title.trim().charAt(0).toUpperCase() || "M"}
          className="size-24 shrink-0 rounded-md border border-line sm:size-28"
        />
        <div className="min-w-0">
          {typeLabel || date ? (
            <p className={cn(META, "flex flex-wrap items-center gap-x-2 gap-y-1 text-fg-subtle")}>
              {typeLabel ? <span className="text-highlight">{typeLabel}</span> : null}
              {typeLabel && date ? <span aria-hidden="true">·</span> : null}
              {date ? <time dateTime={toDateInputValue(release.releaseDate)}>{date}</time> : null}
            </p>
          ) : null}
          <h3 id={id} className="mt-2 font-display text-display-sm font-bold break-words text-fg">
            {release.title}
          </h3>
        </div>
      </div>
      <Embed url={release.embedUrl} title={`${release.title} by ${artistName}`} className="mt-5" />
    </article>
  );
}

/** Discography: one card per release with cover, type, date and an embedded player. */
export function ArtistReleases({ artistName, releases, index, tone = "alt" }: ArtistReleasesProps) {
  if (releases.length === 0) return null;
  return (
    <Section tone={tone} id="artist-releases" aria-labelledby="artist-releases-title">
      <SectionHeading
        id="artist-releases-title"
        index={index}
        eyebrow="Discography"
        title={
          <>
            Press <em>play</em>
          </>
        }
        description={`Singles, EPs and albums from ${artistName} — stream them right here.`}
      />
      <ol className="mt-12 grid items-start gap-x-10 gap-y-14 md:mt-16 lg:grid-cols-2">
        {releases.map((release, i) => (
          <li key={`${release.title}-${i}`}>
            <ReleaseItem release={release} artistName={artistName} id={`release-${i + 1}-title`} />
          </li>
        ))}
      </ol>
    </Section>
  );
}
