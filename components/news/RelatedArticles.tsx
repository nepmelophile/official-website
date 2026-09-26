import { ArticleCard } from "@/components/cards/ArticleCard";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { ArticleSummary } from "@/types/content";

export interface RelatedArticlesProps {
  articles: ArticleSummary[];
}

/** "Keep reading" band under an article (hidden when there is nothing related). */
export function RelatedArticles({ articles }: RelatedArticlesProps) {
  if (articles.length === 0) return null;

  return (
    <Section tone="alt" aria-labelledby="related-heading" className="border-t border-line">
      <SectionHeading
        id="related-heading"
        eyebrow="Related stories"
        title={
          <>
            Keep <em>reading</em>
          </>
        }
        action={{ label: "All news", href: "/news" }}
      />
      <ul className="mt-12 grid gap-x-6 gap-y-14 md:mt-16 md:grid-cols-3">
        {articles.map((article) => (
          <li key={article.id}>
            <ArticleCard
              article={article}
              headingLevel="h3"
              sizes="(min-width: 1408px) 430px, (min-width: 768px) 31vw, 100vw"
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}
