import { ArticleCard } from "@/components/cards/ArticleCard";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { ArticleSummary } from "@/types/content";

export interface LatestNewsProps {
  articles: ArticleSummary[];
  index?: number;
}

/**
 * Latest news: one lead story (7/5 split), then either a plain grid or — with enough
 * stories — two cards plus a numbered "More headlines" rail. Hidden when there are none.
 */
export function LatestNews({ articles, index }: LatestNewsProps) {
  if (articles.length === 0) return null;

  const [lead, ...rest] = articles;
  const withRail = rest.length >= 4;
  const grid = withRail ? rest.slice(0, 2) : rest.slice(0, 3);
  const rail = withRail ? rest.slice(2, 5) : [];

  return (
    <Section tone="alt" aria-labelledby="home-news-title">
      <SectionHeading
        id="home-news-title"
        index={index}
        eyebrow="Latest news"
        title={
          <>
            Fresh from the <em>scene</em>
          </>
        }
        action={{ label: "View all news", href: "/news" }}
      />

      <ArticleCard article={lead} variant="featured" className="mt-12 md:mt-16" />

      {grid.length > 0 ? (
        <div className="mt-16 grid gap-x-6 gap-y-12 border-t border-line pt-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-x-8">
          {grid.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              className={withRail ? "lg:col-span-4" : grid.length === 1 ? "lg:col-span-6" : "lg:col-span-4"}
              sizes="(min-width: 1280px) 400px, (min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
            />
          ))}

          {rail.length > 0 ? (
            <aside
              aria-labelledby="home-news-more"
              className="sm:col-span-2 lg:col-span-4 lg:border-l lg:border-line lg:pl-8"
            >
              <h3
                id="home-news-more"
                className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle"
              >
                <span aria-hidden="true" className="size-1.5 rounded-pill bg-highlight" />
                More headlines
              </h3>
              <ol className="mt-6 flex flex-col divide-y divide-line">
                {rail.map((article, i) => (
                  <li key={article.id} className="flex gap-4 py-5 first:pt-0 last:pb-0">
                    <span
                      aria-hidden="true"
                      className="w-7 shrink-0 pt-0.5 font-mono text-sm font-medium text-highlight"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <ArticleCard article={article} variant="compact" headingLevel="h4" className="min-w-0 flex-1" />
                  </li>
                ))}
              </ol>
            </aside>
          ) : null}
        </div>
      ) : null}
    </Section>
  );
}
