import Link from "next/link";
import { X } from "lucide-react";
import { FilterChips } from "@/components/ui/FilterChips";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { hrefWithQuery } from "@/components/ui/href";
import type { HeadingParts, ListingCopy } from "./news-copy";

export interface NewsHeroProps {
  copy: ListingCopy;
  /** Categories with published articles (chip options). */
  categories: readonly string[];
  categorySlug: string | null;
  tagSlug: string | null;
  tagLabel: string | null;
  /** Published stories matching the current filters (shown in the hero meta line). */
  total: number;
}

function HeadingText({ parts }: { parts: HeadingParts }) {
  return (
    <>
      {parts.before}
      {parts.em ? <em>{parts.em}</em> : null}
      {parts.after}
    </>
  );
}

/** /news hero: editorial heading, intro, category chips and the active tag (removable). */
export function NewsHero({ copy, categories, categorySlug, tagSlug, tagLabel, total }: NewsHeroProps) {
  const showChips = categories.length > 0 || Boolean(categorySlug);

  return (
    <Section tone="glow" spacing="none" aria-labelledby="news-heading" className="pt-12 pb-10 md:pt-20 md:pb-14">
      <SectionHeading
        as="h1"
        id="news-heading"
        size="xl"
        hairline={false}
        eyebrow={copy.eyebrow}
        title={<HeadingText parts={copy.heading} />}
        description={copy.blurb}
      />

      <div className="mt-10 flex flex-col gap-5 border-t border-line pt-6 md:mt-14 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
        {showChips ? (
          <FilterChips
            options={categories}
            active={categorySlug}
            basePath="/news"
            param="category"
            query={{ tag: tagSlug }}
            label="Filter news by category"
            className="min-w-0"
          />
        ) : null}

        <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-3 lg:min-h-11">
          {tagSlug && tagLabel ? (
            <Link
              href={hrefWithQuery("/news", { category: categorySlug })}
              className="group inline-flex min-h-11 items-center gap-2 rounded-pill border border-accent bg-vermilion-900 pr-3 pl-4 font-mono text-xs uppercase tracking-[0.14em] text-vermilion-300 transition-colors duration-150 hover:border-vermilion-400"
            >
              <span aria-hidden="true" className="text-vermilion-400">
                #
              </span>
              {tagLabel}
              <X size={14} strokeWidth={1.75} aria-hidden="true" className="transition-transform duration-150 group-hover:rotate-90" />
              <span className="sr-only">(remove tag filter)</span>
            </Link>
          ) : null}
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
            <span className="text-fg">{total.toLocaleString("en-US")}</span> {total === 1 ? "story" : "stories"}
          </p>
        </div>
      </div>
    </Section>
  );
}
