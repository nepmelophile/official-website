import type { Metadata } from "next";
import { ArtistCard } from "@/components/cards/ArtistCard";
import { CtaBand } from "@/components/services/CtaBand";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChips } from "@/components/ui/FilterChips";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getArtistGenres, getArtists } from "@/lib/queries/artists";
import { buildMetadata } from "@/lib/site";
import { slugify } from "@/lib/utils";

/** Hourly ISR fallback; admin edits revalidate on demand (lib/revalidate.ts). */
export const revalidate = 3600;

const DESCRIPTION =
  "Meet the Nepali artists we write about, work with and can’t stop playing — from Dharan singer-songwriters to Kathmandu’s indie bands.";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

interface ArtistsPageProps {
  searchParams: SearchParams;
}

function firstParam(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim().slice(0, 80);
  return trimmed ? trimmed : null;
}

/** "folk-pop" → "Folk Pop" (display fallback for a genre that isn't in the list). */
function unslug(value: string): string {
  return value
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Resolves ?genre= (slug or label) against the published genres. */
async function resolveGenre(searchParams: SearchParams) {
  const param = firstParam((await searchParams).genre);
  const genres = await getArtistGenres();
  const key = param ? slugify(param) || param.toLowerCase() : null;
  const match = key ? (genres.find((g) => (slugify(g) || g.toLowerCase()) === key) ?? null) : null;
  return { param, genres, match };
}

export async function generateMetadata({ searchParams }: ArtistsPageProps): Promise<Metadata> {
  const { param, match } = await resolveGenre(searchParams);
  if (!param) return buildMetadata({ title: "Artists", description: DESCRIPTION, path: "/artists" });

  const label = match ?? unslug(param);
  return {
    ...buildMetadata({
      title: `${label} artists`,
      description: `Nepali ${label} artists on Melophile — profiles, releases and news.`,
      path: "/artists",
    }),
    // Filtered views point their canonical at /artists and stay out of the index.
    robots: { index: false, follow: true },
  };
}

export default async function ArtistsPage({ searchParams }: ArtistsPageProps) {
  const { param, genres, match } = await resolveGenre(searchParams);
  // An unknown genre can't match anything, so skip the query.
  const artists = param && !match ? [] : await getArtists({ genre: match });
  const filterLabel = match ?? (param ? unslug(param) : null);
  const count = artists.length;

  return (
    <>
      <Section tone="glow" spacing="none" className="pt-14 pb-12 md:pt-24 md:pb-16" aria-labelledby="artists-title">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <SectionHeading
            as="h1"
            id="artists-title"
            size="xl"
            eyebrow="The roster"
            hairline={false}
            className="lg:col-span-9"
            title={
              <>
                The voices shaping <em>Nepali</em> music
              </>
            }
            description={DESCRIPTION}
          />
          {count > 0 ? (
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle lg:col-span-3 lg:justify-self-end lg:text-right">
              <span className="block font-display text-display-lg leading-none font-extrabold tracking-tight text-fg normal-case tabular-nums">
                {String(count).padStart(2, "0")}
              </span>
              <span className="mt-2 block">
                {count === 1 ? "Artist" : "Artists"}
                {filterLabel ? ` · ${filterLabel}` : ""}
              </span>
            </p>
          ) : null}
        </div>

        {genres.length > 0 ? (
          <FilterChips
            options={genres}
            active={match ?? param}
            basePath="/artists"
            param="genre"
            label="Filter artists by genre"
            allLabel="All artists"
            className="mt-10 border-t border-line pt-6 md:mt-14"
          />
        ) : null}
      </Section>

      <Section spacing="none" className="pb-section" aria-label={filterLabel ? `${filterLabel} artists` : "All artists"}>
        {count > 0 ? (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-14">
            {artists.map((artist, i) => (
              <li key={artist.id}>
                <ArtistCard artist={artist} index={i + 1} headingLevel="h2" preload={i === 0} />
              </li>
            ))}
          </ul>
        ) : param ? (
          <EmptyState
            title={`No ${filterLabel ?? "matching"} artists yet`}
            description="We haven’t featured anyone in this genre so far. Try another genre or browse the full roster."
            action={{ label: "View all artists", href: "/artists" }}
          />
        ) : (
          <EmptyState
            title="The roster is warming up"
            description="Artist profiles are on their way. In the meantime, catch up on the latest from the Nepali music scene."
            action={{ label: "Read the latest news", href: "/news" }}
          />
        )}
      </Section>

      <CtaBand
        id="artists-cta-title"
        eyebrow="For artists"
        title={
          <>
            Making music in Nepal? Let&rsquo;s get you <em>heard</em>.
          </>
        }
        description="From release plans and distribution to press and music videos, we help independent artists reach the listeners they deserve."
        primary={{ label: "Work with us", href: "/contact" }}
        secondary={{ label: "Our services", href: "/services" }}
      />
    </>
  );
}
