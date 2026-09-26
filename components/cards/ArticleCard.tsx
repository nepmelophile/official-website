import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { cn, formatDate } from "@/lib/utils";
import type { ArticleSummary } from "@/types/content";
import { CARD_FOCUS, GROW_UNDERLINE, IMAGE_ZOOM, META, STRETCHED_LINK } from "./card-styles";

export type ArticleCardVariant = "default" | "featured" | "compact";

export interface ArticleCardProps {
  article: ArticleSummary;
  /** default = grid card; featured = lead card (7/5 split on lg); compact = small row (sidebars/related). */
  variant?: ArticleCardVariant;
  /** Heading element for the title (default h3). */
  headingLevel?: "h2" | "h3" | "h4";
  /** Preload the image (only for the LCP card, e.g. first lead card). */
  preload?: boolean;
  /** Override responsive `sizes` for the image. */
  sizes?: string;
  /** Hide the excerpt (default & featured show it). */
  hideExcerpt?: boolean;
  className?: string;
}

const DEFAULT_SIZES: Record<ArticleCardVariant, string> = {
  default: "(min-width: 1280px) 400px, (min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw",
  featured: "(min-width: 1024px) 55vw, 100vw",
  compact: "112px",
};

function Meta({ article, className }: { article: ArticleSummary; className?: string }) {
  const date = formatDate(article.publishedAt, "medium");
  return (
    <p className={cn(META, "flex flex-wrap items-center gap-x-2 gap-y-1 text-fg-subtle", className)}>
      {article.category ? <span className="text-highlight">{article.category}</span> : null}
      {article.category && date ? <span aria-hidden="true">·</span> : null}
      {date ? <time dateTime={article.publishedAt}>{date}</time> : null}
    </p>
  );
}

/** News card. The title link covers the whole card (one tab stop, no nested links). */
export function ArticleCard({
  article,
  variant = "default",
  headingLevel: Heading = "h3",
  preload = false,
  sizes,
  hideExcerpt = false,
  className,
}: ArticleCardProps) {
  const href = `/news/${article.slug}`;
  const imageSizes = sizes ?? DEFAULT_SIZES[variant];

  if (variant === "compact") {
    return (
      <article className={cn("group relative flex items-start gap-4 rounded-sm", CARD_FOCUS, className)}>
        <SmartImage
          image={article.featuredImage}
          alt={article.title}
          sizes={imageSizes}
          preload={preload}
          className="aspect-square w-24 shrink-0 rounded-sm sm:w-28"
          imgClassName={IMAGE_ZOOM}
        />
        <div className="min-w-0 flex-1 pt-0.5">
          <Meta article={article} className="text-[0.6875rem]" />
          <Heading className="mt-2 line-clamp-3 font-display text-lg leading-snug font-bold tracking-tight text-fg">
            <Link href={href} className={STRETCHED_LINK}>
              <span className={GROW_UNDERLINE}>{article.title}</span>
            </Link>
          </Heading>
        </div>
      </article>
    );
  }

  if (variant === "featured") {
    return (
      <article
        className={cn("group relative grid gap-6 rounded-lg lg:grid-cols-12 lg:gap-10", CARD_FOCUS, className)}
      >
        <SmartImage
          image={article.featuredImage}
          alt={article.title}
          sizes={imageSizes}
          preload={preload}
          quality={90}
          className="aspect-[16/10] rounded-lg lg:col-span-7"
          imgClassName={IMAGE_ZOOM}
        />
        <div className="flex flex-col justify-end lg:col-span-5 lg:pb-2">
          <p className={cn(META, "mb-5 flex items-center gap-2 text-fg-subtle")}>
            <span aria-hidden="true" className="size-1.5 rounded-pill bg-vermilion-500" />
            Lead story
          </p>
          <Meta article={article} />
          <Heading className="mt-4 font-display text-display-md font-extrabold text-fg [font-stretch:90%]">
            <Link href={href} className={STRETCHED_LINK}>
              <span className={GROW_UNDERLINE}>{article.title}</span>
            </Link>
          </Heading>
          {!hideExcerpt && article.excerpt ? (
            <p className="mt-5 line-clamp-4 max-w-prose text-base/relaxed text-fg-muted md:text-lg/relaxed">
              {article.excerpt}
            </p>
          ) : null}
          <p className="mt-8 flex items-center gap-3 text-sm text-fg-muted">
            {article.author ? (
              <span>
                By <span className="text-fg">{article.author}</span>
              </span>
            ) : null}
            <span
              aria-hidden="true"
              className={cn(META, "ml-auto inline-flex items-center gap-2 text-fg transition-colors group-hover:text-vermilion-300")}
            >
              Read story
              <ArrowRight size={16} strokeWidth={1.75} className="transition-transform duration-300 ease-out-expo group-hover:translate-x-1" />
            </span>
          </p>
        </div>
      </article>
    );
  }

  return (
    <article className={cn("group relative flex flex-col rounded-md", CARD_FOCUS, className)}>
      <SmartImage
        image={article.featuredImage}
        alt={article.title}
        sizes={imageSizes}
        preload={preload}
        className="aspect-[16/10] rounded-md"
        imgClassName={IMAGE_ZOOM}
      />
      <Meta article={article} className="mt-5" />
      <Heading className="mt-3 font-display text-display-sm font-bold text-fg">
        <Link href={href} className={STRETCHED_LINK}>
          <span className={GROW_UNDERLINE}>{article.title}</span>
        </Link>
      </Heading>
      {!hideExcerpt && article.excerpt ? (
        <p className="mt-3 line-clamp-2 text-fg-muted">{article.excerpt}</p>
      ) : null}
    </article>
  );
}
