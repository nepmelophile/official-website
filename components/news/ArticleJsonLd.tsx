import { JsonLd } from "@/components/ui/JsonLd";
import { SITE_NAME } from "@/lib/constants";
import { absoluteUrl, siteUrl } from "@/lib/site";
import { slugify, truncate } from "@/lib/utils";
import type { ArticleDTO } from "@/types/content";

export interface ArticleJsonLdProps {
  article: Pick<
    ArticleDTO,
    | "title"
    | "slug"
    | "excerpt"
    | "metaDescription"
    | "featuredImage"
    | "category"
    | "tags"
    | "author"
    | "publishedAt"
    | "updatedAt"
  >;
  /** Word count of the body (optional, helps rich results). */
  wordCount?: number;
}

/** schema.org NewsArticle + BreadcrumbList for an article page. */
export function ArticleJsonLd({ article, wordCount }: ArticleJsonLdProps) {
  const url = absoluteUrl(`/news/${article.slug}`);
  const organization = { "@type": "Organization", "@id": `${siteUrl}/#organization`, name: SITE_NAME, url: siteUrl };

  const newsArticle = {
    "@type": "NewsArticle",
    "@id": `${url}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    headline: truncate(article.title, 110),
    description: article.metaDescription || article.excerpt || undefined,
    image: article.featuredImage?.url ? [absoluteUrl(article.featuredImage.url)] : undefined,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: article.author ? { "@type": "Person", name: article.author } : organization,
    publisher: organization,
    articleSection: article.category || undefined,
    keywords: article.tags.length > 0 ? article.tags.join(", ") : undefined,
    wordCount,
    inLanguage: "en",
    isAccessibleForFree: true,
  };

  const breadcrumbs = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "News", item: absoluteUrl("/news") },
      ...(article.category
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: article.category,
              item: absoluteUrl(`/news?category=${encodeURIComponent(slugify(article.category))}`),
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: article.category ? 4 : 3,
        name: article.title,
        item: url,
      },
    ],
  };

  return <JsonLd data={{ "@context": "https://schema.org", "@graph": [newsArticle, breadcrumbs] }} />;
}
