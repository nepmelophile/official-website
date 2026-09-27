import Link from "next/link";
import { MapPin } from "lucide-react";
import { Tag } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { SmartImage } from "@/components/ui/SmartImage";
import { SocialLinks } from "@/components/ui/SocialLinks";
import { cn, slugify } from "@/lib/utils";
import type { ArtistDTO } from "@/types/content";
import { META } from "./styles";

export interface ArtistHeroProps {
  artist: ArtistDTO;
}

/**
 * Artist page hero: full-bleed cover (when set) under a scrim, the portrait overlapping it,
 * breadcrumb, huge display name, serif short bio, location, genre links and socials.
 */
export function ArtistHero({ artist }: ArtistHeroProps) {
  const cover = artist.coverImage?.url ? artist.coverImage : undefined;
  const initial = artist.name.trim().charAt(0).toUpperCase() || "M";

  return (
    <header className="relative isolate overflow-hidden">
      {cover ? (
        <div className="relative -z-10">
          <SmartImage
            image={cover}
            alt={cover.alt || `${artist.name} cover image`}
            decorative={!cover.alt}
            sizes="100vw"
            quality={90}
            preload
            className="h-[clamp(15rem,46vw,36rem)] w-full"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-linear-to-t from-bg via-bg/60 to-bg/5"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-linear-to-r from-bg/70 via-bg/10 to-transparent"
          />
        </div>
      ) : (
        <div aria-hidden="true" className="bg-glow absolute inset-0 -z-10" />
      )}

      <Container
        className={cn(
          "relative pb-14 md:pb-20",
          cover ? "-mt-24 sm:-mt-32 md:-mt-48 lg:-mt-56" : "pt-14 md:pt-24",
        )}
      >
        <div className="grid items-end gap-8 md:grid-cols-12 md:gap-10">
          <SmartImage
            image={artist.photo}
            alt={artist.name}
            sizes="(min-width: 1024px) 22vw, (min-width: 768px) 30vw, 13rem"
            quality={90}
            preload
            monogram={initial}
            className="aspect-[4/5] w-40 rounded-lg border border-line-strong shadow-lift sm:w-52 md:col-span-4 md:w-full lg:col-span-3"
          />

          <div className="min-w-0 md:col-span-8 md:pb-1 lg:col-span-9">
            <nav aria-label="Breadcrumb">
              <ol className={cn(META, "flex flex-wrap items-center gap-2 text-fg-subtle")}>
                <li className="flex items-center gap-2">
                  <span aria-hidden="true" className="inline-block size-1.5 rounded-pill bg-accent" />
                  <Link
                    href="/artists"
                    className="inline-flex min-h-8 items-center transition-colors duration-150 hover:text-fg"
                  >
                    Artists
                  </Link>
                </li>
                <li aria-hidden="true" className="text-line-strong">
                  /
                </li>
                <li aria-current="page" className="min-w-0 truncate text-fg-muted">
                  {artist.name}
                </li>
              </ol>
            </nav>

            <h1 className="mt-4 font-display text-display-xl font-extrabold break-words text-fg [font-stretch:85%]">
              {artist.name}
            </h1>

            {artist.shortBio ? (
              <p className="mt-5 max-w-2xl font-serif text-2xl/snug text-fg-soft italic md:mt-6 md:text-3xl/snug">
                {artist.shortBio}
              </p>
            ) : null}

            {artist.location || artist.genres.length > 0 ? (
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
                {artist.location ? (
                  <p className={cn(META, "flex items-center gap-2 text-fg-muted")}>
                    <MapPin size={16} strokeWidth={1.75} aria-hidden="true" className="text-highlight" />
                    <span className="sr-only">Based in </span>
                    {artist.location}
                  </p>
                ) : null}
                {artist.genres.length > 0 ? (
                  <ul aria-label="Genres" className="flex flex-wrap gap-2">
                    {artist.genres.map((genre) => (
                      <li key={genre}>
                        <Tag href={`/artists?genre=${slugify(genre) || encodeURIComponent(genre)}`} tone="category">
                          {genre}
                        </Tag>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            <SocialLinks
              links={artist.socialLinks}
              owner={artist.name}
              label={`${artist.name} online`}
              className="mt-7"
            />
          </div>
        </div>
      </Container>
    </header>
  );
}
