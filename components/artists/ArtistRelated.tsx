import { ArticleCard } from "@/components/cards/ArticleCard";
import { ArtistCard } from "@/components/cards/ArtistCard";
import { Section, type SectionTone } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { ArticleSummary, ArtistSummary } from "@/types/content";

export interface ArtistNewsProps {
  artistName: string;
  articles: ArticleSummary[];
  index: number;
  tone?: SectionTone;
}

/** Related news for an artist (their `relatedArticleIds`). */
export function ArtistNews({ artistName, articles, index, tone = "default" }: ArtistNewsProps) {
  if (articles.length === 0) return null;
  return (
    <Section tone={tone} aria-labelledby="artist-news-title">
      <SectionHeading
        id="artist-news-title"
        index={index}
        eyebrow="In the news"
        title={
          <>
            Stories &amp; <em>updates</em>
          </>
        }
        description={`The latest Melophile coverage of ${artistName}.`}
        action={{ label: "All news", href: "/news" }}
      />
      <ul className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 md:mt-16 lg:grid-cols-3">
        {articles.map((article) => (
          <li key={article.id}>
            <ArticleCard article={article} />
          </li>
        ))}
      </ul>
    </Section>
  );
}

export interface MoreArtistsProps {
  artists: ArtistSummary[];
  index: number;
  tone?: SectionTone;
}

/** "Keep listening": other artists, usually sharing a genre. */
export function MoreArtists({ artists, index, tone = "alt" }: MoreArtistsProps) {
  if (artists.length === 0) return null;
  return (
    <Section tone={tone} aria-labelledby="more-artists-title">
      <SectionHeading
        id="more-artists-title"
        index={index}
        eyebrow="Keep listening"
        title={
          <>
            More <em>artists</em>
          </>
        }
        action={{ label: "All artists", href: "/artists" }}
      />
      <ul className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 md:mt-16 lg:grid-cols-4 lg:gap-x-6">
        {artists.map((artist) => (
          <li key={artist.id}>
            <ArtistCard
              artist={artist}
              maxGenres={2}
              sizes="(min-width: 1280px) 320px, (min-width: 1024px) 25vw, 50vw"
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}
