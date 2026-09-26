import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ArticleEmbeds, LISTEN_SECTION_ID, embedKind, playableEmbeds } from "@/components/news/ArticleEmbeds";
import { ArticleHero } from "@/components/news/ArticleHero";
import { ArticleJsonLd } from "@/components/news/ArticleJsonLd";
import { ArticleTags } from "@/components/news/ArticleTags";
import { RelatedArticles } from "@/components/news/RelatedArticles";
import { ShareLinks } from "@/components/news/ShareLinks";
import { Container } from "@/components/ui/Container";
import { Prose } from "@/components/ui/Prose";
import { SITE_NAME } from "@/lib/constants";
import { getAllArticleSlugs, getArticleBySlugStrict, getRelatedArticles } from "@/lib/queries/articles";
import { requireLiveData } from "@/lib/queries/safe";
import { absoluteUrl, buildMetadata } from "@/lib/site";
import { cn, readingTime, stripMarkdown, truncate } from "@/lib/utils";
import { SLUG_REGEX } from "@/lib/validators/common";

/** Hourly ISR fallback; admin publishes revalidate the article on demand (lib/revalidate.ts). */
export const revalidate = 3600;

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

/** Pre-render published articles at build time. Without a database this is [] (rendered on demand). */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    const slugs = await getAllArticleSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

/** Valid slugs only ever contain [a-z0-9-]; skip the database for anything else. */
async function loadArticle(slug: string) {
  const normalized = slug.trim().toLowerCase();
  if (!SLUG_REGEX.test(normalized)) return null;
  // Also makes the related-articles query strict for this cached render (see requireLiveData).
  await requireLiveData();
  return getArticleBySlugStrict(normalized);
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await loadArticle(slug);
  if (!article) {
    return { title: "Story not found", robots: { index: false, follow: true } };
  }

  const description =
    article.metaDescription || article.excerpt || truncate(stripMarkdown(article.body), 160) || undefined;

  return buildMetadata({
    title: article.metaTitle || article.title,
    description,
    path: `/news/${article.slug}`,
    // Without a featured image, fall back to the site-wide share card (app/opengraph-image.tsx).
    image: article.featuredImage.url
      ? { url: article.featuredImage.url, alt: article.featuredImage.alt || article.title }
      : { url: "/opengraph-image", alt: SITE_NAME },
    type: "article",
    publishedTime: article.publishedAt,
    modifiedTime: article.updatedAt,
    authors: article.author ? [article.author] : undefined,
    tags: article.tags.length > 0 ? article.tags : undefined,
  });
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await loadArticle(slug);
  if (!article) notFound();

  const related = await getRelatedArticles(article);
  const embeds = playableEmbeds(article.embeds);
  const kind = embeds.length > 0 ? embedKind(embeds) : null;
  const minutes = readingTime(article.body);
  const wordCount = stripMarkdown(article.body).split(" ").filter(Boolean).length;
  const shareUrl = absoluteUrl(`/news/${article.slug}`);

  return (
    <>
      <ArticleJsonLd article={article} wordCount={wordCount} />

      <article aria-labelledby="article-title">
        <ArticleHero
          article={article}
          readingMinutes={minutes}
          titleId="article-title"
          listen={
            kind
              ? {
                  href: `#${LISTEN_SECTION_ID}`,
                  kind,
                  label: kind === "video" ? "Watch now" : kind === "mixed" ? "Listen & watch" : "Listen now",
                }
              : null
          }
        />

        <Container className="pt-12 pb-section md:pt-20">
          <div className="grid gap-y-14 lg:grid-cols-12 lg:gap-x-10">
            <aside aria-label="Share and navigation" className="hidden lg:col-span-3 lg:block">
              <div className="sticky top-28 flex flex-col gap-10">
                <ShareLinks variant="rail" url={shareUrl} title={article.title} />
                <Link
                  href="/news"
                  className="group inline-flex min-h-11 items-center gap-2 self-start font-mono text-xs uppercase tracking-[0.14em] text-fg-muted transition-colors hover:text-fg"
                >
                  <ArrowLeft
                    size={16}
                    strokeWidth={1.75}
                    aria-hidden="true"
                    className="transition-transform duration-300 ease-out-expo group-hover:-translate-x-1"
                  />
                  All news
                </Link>
              </div>
            </aside>

            <div className="min-w-0 lg:col-span-9">
              <Prose>{article.body}</Prose>

              <ArticleEmbeds embeds={embeds} articleTitle={article.title} className="mt-16" />

              <footer
                className={cn(
                  "mt-16 flex max-w-reading flex-col gap-10 border-t border-line pt-8",
                  article.tags.length === 0 && "lg:hidden",
                )}
              >
                <ArticleTags tags={article.tags} />
                <ShareLinks variant="bar" url={shareUrl} title={article.title} className="lg:hidden" />
              </footer>
            </div>
          </div>
        </Container>
      </article>

      <RelatedArticles articles={related} />
    </>
  );
}
