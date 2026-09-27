import Link from "next/link";
import { Clock, Headphones, Play } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SmartImage } from "@/components/ui/SmartImage";
import { hrefWithQuery } from "@/components/ui/href";
import { cn, formatDate, slugify } from "@/lib/utils";
import type { ArticleDTO } from "@/types/content";

export interface ArticleHeroProps {
  article: Pick<ArticleDTO, "title" | "excerpt" | "category" | "author" | "publishedAt" | "featuredImage">;
  readingMinutes: number;
  /** id for the <h1> (lets the surrounding <article> use aria-labelledby). */
  titleId?: string;
  /** In-page link to the players section, when the story has embeds. */
  listen?: { href: string; label: string; kind: "audio" | "video" | "mixed" } | null;
}

export const FALLBACK_AUTHOR = "Melophile Desk";

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? [words[0], words[words.length - 1]] : words;
  return letters.map((w) => w.charAt(0).toUpperCase()).join("");
}

function AuthorMark({ author }: { author?: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-pill border border-line-strong bg-surface-raised font-display text-sm font-bold tracking-tight text-fg"
    >
      {author ? (
        initials(author)
      ) : (
        <>
          M<span className="text-accent">.</span>
        </>
      )}
    </span>
  );
}

const META = "font-mono text-xs uppercase tracking-[0.14em]";

/** Article masthead: breadcrumb, category + reading time, headline, standfirst, byline, hero image. */
export function ArticleHero({ article, readingMinutes, titleId, listen }: ArticleHeroProps) {
  const categoryHref = article.category ? hrefWithQuery("/news", { category: slugify(article.category) }) : null;
  const published = formatDate(article.publishedAt, "long");
  const ListenIcon = listen?.kind === "video" ? Play : Headphones;

  return (
    <header>
      <div className="bg-glow">
        <Container className="pt-8 pb-10 md:pt-12 md:pb-14">
          <nav aria-label="Breadcrumb">
            <ol className={cn(META, "flex flex-wrap items-center gap-2 text-fg-subtle")}>
              <li>
                <Link href="/news" className="inline-flex min-h-11 items-center transition-colors hover:text-fg">
                  News
                </Link>
              </li>
              {article.category && categoryHref ? (
                <>
                  <li aria-hidden="true" className="text-line-strong">
                    /
                  </li>
                  <li>
                    <Link href={categoryHref} className="inline-flex min-h-11 items-center transition-colors hover:text-fg">
                      {article.category}
                    </Link>
                  </li>
                </>
              ) : null}
            </ol>
          </nav>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3 md:mt-8">
            {article.category ? <Badge tone="category">{article.category}</Badge> : null}
            <p className={cn(META, "inline-flex items-center gap-2 text-fg-subtle")}>
              <Clock size={14} strokeWidth={1.75} aria-hidden="true" />
              {readingMinutes} min read
            </p>
          </div>

          <h1
            id={titleId}
            className="mt-6 max-w-5xl font-display text-display-lg font-extrabold text-fg [font-stretch:88%] md:mt-8"
          >
            {article.title}
          </h1>

          {article.excerpt ? (
            <p className="mt-6 max-w-3xl text-lg/relaxed text-fg-soft md:mt-8 md:text-xl/relaxed">{article.excerpt}</p>
          ) : null}

          <div className="mt-10 flex flex-wrap items-center justify-between gap-6 border-t border-line pt-6 md:mt-12">
            <div className="flex items-center gap-4">
              <AuthorMark author={article.author} />
              <div className="flex flex-col gap-1">
                <p className="text-sm leading-tight text-fg-muted">
                  By <span className="font-semibold text-fg">{article.author || FALLBACK_AUTHOR}</span>
                </p>
                {published ? (
                  <p className={cn(META, "text-[0.6875rem] text-fg-subtle")}>
                    Published <time dateTime={article.publishedAt}>{published}</time>
                  </p>
                ) : null}
              </div>
            </div>

            {listen ? (
              <ButtonLink
                href={listen.href}
                variant="cobalt"
                size="sm"
                leadingIcon={<ListenIcon size={14} strokeWidth={2} aria-hidden="true" />}
              >
                {listen.label}
              </ButtonLink>
            ) : null}
          </div>
        </Container>
      </div>

      <Container>
        <SmartImage
          image={article.featuredImage}
          alt={article.title}
          sizes="(min-width: 1408px) 1328px, 100vw"
          preload
          quality={90}
          className="aspect-[4/3] rounded-lg shadow-lift sm:aspect-[16/10] lg:aspect-[2/1] lg:rounded-xl"
        />
      </Container>
    </header>
  );
}
