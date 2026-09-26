import type { Metadata } from "next";
import { getArticleOptions } from "@/lib/admin/queries/articles";
import { getArtistFormMeta } from "@/lib/admin/queries/artists";
import { requireAdmin } from "@/lib/auth";
import { ArtistForm } from "../ArtistForm";

export const metadata: Metadata = { title: "New artist" };

export default async function NewArtistPage() {
  await requireAdmin();
  const [articleOptions, meta] = await Promise.all([getArticleOptions(), getArtistFormMeta()]);

  return (
    <ArtistForm articleOptions={articleOptions} genreSuggestions={meta.genres} locationSuggestions={meta.locations} />
  );
}
