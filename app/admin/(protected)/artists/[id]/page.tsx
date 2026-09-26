import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyState, PageHeader } from "@/components/admin";
import { DB_NOT_CONFIGURED_MESSAGE, DB_UNREACHABLE_MESSAGE, getArticleOptions } from "@/lib/admin/queries/articles";
import { getAdminArtistById, getArtistFormMeta } from "@/lib/admin/queries/artists";
import { requireAdmin } from "@/lib/auth";
import { isDbConfigured } from "@/lib/db";
import type { ArtistDTO } from "@/types/content";
import { ArtistForm } from "../ArtistForm";

export const metadata: Metadata = { title: "Edit artist" };

export default async function EditArtistPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  let artist: ArtistDTO | null;
  try {
    artist = await getAdminArtistById(id);
  } catch (error) {
    console.error("[melophile admin] loading artist failed", error);
    return (
      <>
        <PageHeader title="Edit artist" />
        <EmptyState
          title="Couldn’t load this artist"
          description={isDbConfigured() ? DB_UNREACHABLE_MESSAGE : DB_NOT_CONFIGURED_MESSAGE}
        />
      </>
    );
  }
  if (!artist) notFound();

  const [articleOptions, meta] = await Promise.all([
    getArticleOptions({ include: artist.relatedArticleIds }),
    getArtistFormMeta(),
  ]);

  return (
    // key: remount with fresh server data after each save (the server normalizes values).
    <ArtistForm
      key={artist.updatedAt}
      artist={artist}
      articleOptions={articleOptions}
      genreSuggestions={meta.genres}
      locationSuggestions={meta.locations}
    />
  );
}
