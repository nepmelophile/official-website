import type { Metadata } from "next";
import { getArticleFormMeta, getArticleOptions } from "@/lib/admin/queries/articles";
import { requireAdmin } from "@/lib/auth";
import { ArticleForm } from "../ArticleForm";

export const metadata: Metadata = { title: "New article" };

export default async function NewArticlePage() {
  await requireAdmin();
  const [articleOptions, meta] = await Promise.all([getArticleOptions(), getArticleFormMeta()]);
  const now = new Date().toISOString();

  return (
    <ArticleForm
      articleOptions={articleOptions}
      categories={meta.categories}
      tagSuggestions={meta.tags}
      authorSuggestions={meta.authors}
      defaultPublishedAt={now}
      renderedAt={now}
    />
  );
}
