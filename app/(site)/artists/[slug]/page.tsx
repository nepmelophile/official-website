import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import type { ReactNode } from "react";
import { ArtistAbout } from "@/components/artists/ArtistAbout";
import { ArtistAchievements } from "@/components/artists/ArtistAchievements";
import { ArtistHero } from "@/components/artists/ArtistHero";
import { ArtistMedia } from "@/components/artists/ArtistMedia";
import { ArtistNews, MoreArtists } from "@/components/artists/ArtistRelated";
import { ArtistReleases } from "@/components/artists/ArtistReleases";
import { buildArtistStructuredData } from "@/components/artists/artist-structured-data";
import { JsonLd } from "@/components/ui/JsonLd";
import type { SectionTone } from "@/components/ui/Section";
import { getArticlesByIds } from "@/lib/queries/articles";
import { getAllArtistSlugs, getArtistBySlug, getRelatedArtists } from "@/lib/queries/artists";
import { requireLiveData } from "@/lib/queries/safe";
import { buildMetadata } from "@/lib/site";
import { stripMarkdown, truncate } from "@/lib/utils";

/** Hourly ISR fallback; admin edits revalidate on demand (lib/revalidate.ts). */
export const revalidate = 3600;

interface ArtistPageProps {
  params: Promise<{ slug: string }>;
}

/** Pre-render published artists at build time; returns [] without a database (slugs render on demand). */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    const slugs = await getAllArtistSlugs();
    return slugs.filter(Boolean).map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

/**
 * Strict load for this cached (ISR) page: a DB failure throws (Next keeps the last good page)
 * instead of resolving to null and caching a 404 for the whole revalidate window.
 */
async function loadArtist(slug: string) {
  await requireLiveData();
  return getArtistBySlug(slug);
}

export async function generateMetadata({ params }: ArtistPageProps): Promise<Metadata> {
  const { slug } = await params;
  const artist = await loadArtist(slug);
  if (!artist) {
    return { title: "Artist not found", robots: { index: false, follow: true } };
  }

  const description = truncate(
    artist.shortBio || stripMarkdown(artist.bio) || `${artist.name} on Melophile — music, releases and news.`,
    160,
  );
  // Wide cover art makes a better share card; fall back to the portrait.
  const image = artist.coverImage?.url ? artist.coverImage : artist.photo?.url ? artist.photo : undefined;

  return buildMetadata({
    title: artist.name,
    description,
    path: `/artists/${artist.slug}`,
    image: image ? { ...image, alt: image.alt || artist.name } : undefined,
    type: "profile",
  });
}

type SectionSlot = { index: number; tone: SectionTone };

export default async function ArtistPage({ params }: ArtistPageProps) {
  const { slug } = await params;
  const artist = await loadArtist(slug);
  if (!artist) notFound();
  // Mixed-case or otherwise non-canonical slugs resolve (the query lowercases) — redirect once.
  if (artist.slug !== slug) permanentRedirect(`/artists/${artist.slug}`);

  const [articles, moreArtists] = await Promise.all([
    getArticlesByIds(artist.relatedArticleIds),
    getRelatedArtists(artist, 4),
  ]);

  const hasMedia = artist.media.some((m) => /^https?:\/\//i.test(m.url));
  const blocks: ((slot: SectionSlot) => ReactNode)[] = [
    (slot) => <ArtistAbout key="about" artist={artist} {...slot} />,
  ];
  if (artist.releases.length > 0) {
    blocks.push((slot) => (
      <ArtistReleases key="releases" artistName={artist.name} releases={artist.releases} {...slot} />
    ));
  }
  if (hasMedia) {
    blocks.push((slot) => <ArtistMedia key="media" artistName={artist.name} media={artist.media} {...slot} />);
  }
  if (artist.achievements.length > 0) {
    blocks.push((slot) => <ArtistAchievements key="milestones" achievements={artist.achievements} {...slot} />);
  }
  if (articles.length > 0) {
    blocks.push((slot) => <ArtistNews key="news" artistName={artist.name} articles={articles.slice(0, 6)} {...slot} />);
  }
  if (moreArtists.length > 0) {
    blocks.push((slot) => <MoreArtists key="more" artists={moreArtists} {...slot} />);
  }

  return (
    <>
      <JsonLd data={buildArtistStructuredData(artist)} />
      <ArtistHero artist={artist} />
      {blocks.map((render, i) =>
        render({ index: i + 1, tone: i % 2 === 0 ? "default" : "alt" }),
      )}
    </>
  );
}
