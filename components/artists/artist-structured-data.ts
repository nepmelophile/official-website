import { SITE_NAME } from "@/lib/constants";
import { absoluteUrl } from "@/lib/site";
import { stripMarkdown, truncate } from "@/lib/utils";
import type { ArtistDTO, MediaRef, Release } from "@/types/content";
import type { JsonLdData } from "@/components/ui/JsonLd";

function imageUrl(media: MediaRef | undefined): string | undefined {
  return media?.url ? absoluteUrl(media.url) : undefined;
}

function releaseDate(release: Release): string | undefined {
  return release.releaseDate ? release.releaseDate.slice(0, 10) : undefined;
}

/**
 * schema.org structured data for an artist page: a `MusicGroup` (schema.org defines it as
 * "a musical group … can also be a solo musician") plus a breadcrumb trail.
 */
export function buildArtistStructuredData(artist: ArtistDTO): JsonLdData {
  const url = absoluteUrl(`/artists/${artist.slug}`);
  const images = [imageUrl(artist.photo), imageUrl(artist.coverImage)].filter((u): u is string => Boolean(u));
  const description = artist.shortBio || truncate(stripMarkdown(artist.bio), 300);

  const albums = artist.releases
    .filter((r) => r.type === "album" || r.type === "ep")
    .map((r) => ({
      "@type": "MusicAlbum",
      name: r.title,
      url: r.embedUrl,
      datePublished: releaseDate(r),
      image: imageUrl(r.coverImage),
      albumReleaseType: r.type === "ep" ? "https://schema.org/EPRelease" : "https://schema.org/AlbumRelease",
      byArtist: { "@id": `${url}#artist` },
    }));

  const tracks = artist.releases
    .filter((r) => r.type !== "album" && r.type !== "ep")
    .map((r) => ({
      "@type": "MusicRecording",
      name: r.title,
      url: r.embedUrl,
      datePublished: releaseDate(r),
      image: imageUrl(r.coverImage),
      byArtist: { "@id": `${url}#artist` },
    }));

  const musicGroup: JsonLdData = {
    "@type": "MusicGroup",
    "@id": `${url}#artist`,
    name: artist.name,
    url,
    description,
    image: images.length > 0 ? images : undefined,
    genre: artist.genres.length > 0 ? artist.genres : undefined,
    location: artist.location ? { "@type": "Place", name: artist.location } : undefined,
    sameAs: artist.socialLinks.length > 0 ? artist.socialLinks.map((l) => l.url) : undefined,
    album: albums.length > 0 ? albums : undefined,
    track: tracks.length > 0 ? tracks : undefined,
    award:
      artist.achievements.length > 0
        ? artist.achievements.map((a) => (a.year ? `${a.title} (${a.year})` : a.title))
        : undefined,
    mainEntityOfPage: url,
  };

  const breadcrumb: JsonLdData = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Artists", item: absoluteUrl("/artists") },
      { "@type": "ListItem", position: 3, name: artist.name, item: url },
    ],
  };

  return { "@context": "https://schema.org", "@graph": [musicGroup, breadcrumb] };
}
