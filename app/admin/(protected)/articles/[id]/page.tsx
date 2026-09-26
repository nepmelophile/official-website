import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyState, PageHeader } from "@/components/admin";
import {
  DB_NOT_CONFIGURED_MESSAGE,
  DB_UNREACHABLE_MESSAGE,
  getAdminArticleById,
  getArticleFormMeta,
  getArticleOptions,
} from "@/lib/admin/queries/articles";
import { requireAdmin } from "@/lib/auth";
import { isDbConfigured } from "@/lib/db";
import type { ArticleDTO } from "@/types/content";
import { ArticleForm } from "../ArticleForm";

export const metadata: Metadata = { title: "Edit article" };

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  let article: ArticleDTO | null;
  try {
    article = await getAdminArticleById(id);
  } catch (error) {
    console.error("[melophile admin] loading article failed", error);
    return (
      <>
        <PageHeader title="Edit article" />
        <EmptyState
          title="Couldn’t load this article"
          description={isDbConfigured() ? DB_UNREACHABLE_MESSAGE : DB_NOT_CONFIGURED_MESSAGE}
        />
      </>
    );
  }
  if (!article) notFound();

  const [articleOptions, meta] = await Promise.all([
    getArticleOptions({ include: article.relatedArticleIds }),
    getArticleFormMeta(),
  ]);

  return (
    // key: remount with fresh server data after each save (the server normalizes values).
    <ArticleForm
      key={article.updatedAt}
      article={article}
      articleOptions={articleOptions}
      categories={meta.categories}
      tagSuggestions={meta.tags}
      authorSuggestions={meta.authors}
      defaultPublishedAt={article.publishedAt}
      renderedAt={new Date().toISOString()}
    />
  );
}
