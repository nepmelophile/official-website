import { ArtistCard } from "@/components/cards/ArtistCard";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";
import type { ArtistSummary } from "@/types/content";

export interface FeaturedArtistsProps {
  artists: ArtistSummary[];
  index?: number;
}

/**
 * Desktop layout for the number of artists shown: a column count that avoids a lonely last
 * row, plus the selector that drops the in-between columns for the staggered rhythm.
 */
function desktopLayout(count: number): string {
  if (count <= 2) return "lg:max-w-3xl lg:grid-cols-2";
  if (count === 3 || count === 5 || count === 6) {
    return "lg:grid-cols-3 lg:pb-16 lg:[&>li:nth-child(3n+2)]:translate-y-16";
  }
  return "lg:grid-cols-4 lg:pb-16 lg:[&>li:nth-child(even)]:translate-y-16";
}

/**
 * Featured artists: portrait cards in a staggered editorial grid (every other column drops
 * on desktop). Picks come from HomepageSettings.featuredArtistIds, else `featured` artists.
 */
export function FeaturedArtists({ artists, index }: FeaturedArtistsProps) {
  if (artists.length === 0) return null;

  return (
    <Section aria-labelledby="home-artists-title">
      <SectionHeading
        id="home-artists-title"
        index={index}
        eyebrow="Featured artists"
        title={
          <>
            Voices you <em>need</em> to hear
          </>
        }
        description="Songwriters, bands and producers from across Nepal — and the stories behind their sound."
        action={{ label: "All artists", href: "/artists" }}
      />

      <ul
        className={cn(
          "mt-12 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:mt-16",
          desktopLayout(artists.length),
        )}
      >
        {artists.map((artist, i) => (
          <li key={artist.id}>
            <ArtistCard
              artist={artist}
              index={i + 1}
              sizes="(min-width: 1280px) 320px, (min-width: 1024px) 25vw, 50vw"
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}
