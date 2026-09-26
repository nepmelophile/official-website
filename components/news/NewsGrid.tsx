import { ArticleCard } from "@/components/cards/ArticleCard";
import { cn } from "@/lib/utils";
import type { ArticleSummary } from "@/types/content";

export interface NewsGridProps {
  articles: ArticleSummary[];
  /**
   * Editorial layout for the first page: lead story (7/5 split), a 2-up row, then the 3-up grid.
   * Later pages use the plain 3-up grid.
   */
  withLead?: boolean;
  className?: string;
}

const GRID_SIZES = "(min-width: 1408px) 430px, (min-width: 1024px) 31vw, (min-width: 640px) 48vw, 100vw";
const PAIR_SIZES = "(min-width: 1408px) 650px, (min-width: 640px) 48vw, 100vw";

/** News listing grid. Cards use h2 titles: the page h1 is the only heading above them. */
export function NewsGrid({ articles, withLead = false, className }: NewsGridProps) {
  if (articles.length === 0) return null;

  if (!withLead) {
    return (
      <ul className={cn("grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3", className)}>
        {articles.map((article, i) => (
          <li key={article.id}>
            <ArticleCard article={article} headingLevel="h2" sizes={GRID_SIZES} preload={i === 0} />
          </li>
        ))}
      </ul>
    );
  }

  const [lead, ...others] = articles;
  const pair = others.slice(0, 2);
  const rest = others.slice(2);

  return (
    <div className={cn("flex flex-col gap-14 md:gap-20", className)}>
      <ArticleCard article={lead} variant="featured" headingLevel="h2" preload />

      {pair.length > 0 ? (
        <ul className="grid gap-x-6 gap-y-14 border-t border-line pt-10 sm:grid-cols-2 md:pt-14">
          {pair.map((article) => (
            <li key={article.id}>
              <ArticleCard article={article} headingLevel="h2" sizes={PAIR_SIZES} />
            </li>
          ))}
        </ul>
      ) : null}

      {rest.length > 0 ? (
        <ul className="grid gap-x-6 gap-y-14 border-t border-line pt-10 sm:grid-cols-2 md:pt-14 lg:grid-cols-3">
          {rest.map((article) => (
            <li key={article.id}>
              <ArticleCard article={article} headingLevel="h2" sizes={GRID_SIZES} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
