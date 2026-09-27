import Link from "next/link";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { SmartImage } from "@/components/ui/SmartImage";
import { cn } from "@/lib/utils";
import type { ArtistSummary } from "@/types/content";
import { CARD_FOCUS, META, STRETCHED_LINK } from "./card-styles";

export interface ArtistCardProps {
  artist: ArtistSummary;
  /** Heading element for the name (default h3). */
  headingLevel?: "h2" | "h3" | "h4";
  /** Optional position number shown top-left ("01"). */
  index?: number;
  /** Show at most this many genre tags (default 3). */
  maxGenres?: number;
  preload?: boolean;
  sizes?: string;
  className?: string;
}

/**
 * Portrait artist card: 4:5 photo (slightly desaturated → colour on hover), name overlaid on a
 * bottom scrim, genres as mono tags underneath. Whole card links to /artists/[slug].
 */
export function ArtistCard({
  artist,
  headingLevel: Heading = "h3",
  index,
  maxGenres = 3,
  preload = false,
  sizes = "(min-width: 1280px) 320px, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw",
  className,
}: ArtistCardProps) {
  const genres = artist.genres.slice(0, maxGenres);
  return (
    <article className={cn("group relative flex flex-col rounded-md", CARD_FOCUS, className)}>
      <div className="relative overflow-hidden rounded-md">
        <SmartImage
          image={artist.photo}
          alt={artist.name}
          sizes={sizes}
          preload={preload}
          monogram={artist.name.trim().charAt(0).toUpperCase() || "M"}
          className="aspect-[4/5]"
          imgClassName="grayscale-[35%] transition-[filter,transform] duration-700 ease-out-expo group-hover:scale-[1.04] group-hover:grayscale-0"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-ink-950/90 via-ink-950/25 to-transparent"
        />
        {index !== undefined ? (
          <span
            aria-hidden="true"
            className={cn(META, "absolute top-3 left-3 rounded-xs bg-ink-950/85 px-2 py-1 text-orchid-400 backdrop-blur-sm")}
          >
            {String(index).padStart(2, "0")}
          </span>
        ) : null}
        {artist.featured ? (
          <span className={cn(META, "absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-xs bg-highlight px-2 py-1 text-[0.625rem] text-highlight-fg")}>
            Featured
          </span>
        ) : null}
        <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
          <Heading className="font-display text-display-sm font-extrabold text-paper [font-stretch:90%]">
            <Link href={`/artists/${artist.slug}`} className={STRETCHED_LINK}>
              {artist.name}
            </Link>
          </Heading>
          {artist.location ? (
            <p className={cn(META, "mt-2 flex items-center gap-1.5 text-[0.6875rem] text-ink-200")}>
              <MapPin size={12} strokeWidth={1.75} aria-hidden="true" />
              {artist.location}
            </p>
          ) : null}
        </div>
      </div>
      {genres.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Genres">
          {genres.map((genre) => (
            <li key={genre}>
              <Badge>{genre}</Badge>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
