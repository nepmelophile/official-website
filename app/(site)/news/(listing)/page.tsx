import type { Metadata } from "next";
import { NewsGrid } from "@/components/news/NewsGrid";
import { NewsHero } from "@/components/news/NewsHero";
import { loadNewsListing, type NewsListing, type NewsSearchParams } from "@/components/news/news-listing";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { hrefWithQuery } from "@/components/ui/href";
import { NEWS_PAGE_SIZE, SITE_NAME } from "@/lib/constants";
import { buildMetadata } from "@/lib/site";

/** Hourly ISR fallback; admin publishes also revalidate /news on demand (lib/revalidate.ts). */
export const revalidate = 3600;

interface NewsPageProps {
  searchParams: Promise<NewsSearchParams>;
}

export async function generateMetadata({ searchParams }: NewsPageProps): Promise<Metadata> {
  const listing = await loadNewsListing(await searchParams);
  const title = listing.page > 1 ? `${listing.copy.title} — Page ${listing.page}` : listing.copy.title;

  const metadata = buildMetadata({
    title,
    description: listing.copy.blurb,
    path: listing.path,
    image: { url: "/opengraph-image", alt: `${SITE_NAME} — ${listing.copy.title}` },
  });

  // Category landing pages are indexable (canonical to themselves). Deeper pages, tag views and
  // filters that match nothing stay crawlable but out of the index.
  const noIndex = listing.page > 1 || Boolean(listing.tagSlug) || listing.unknownFilter || listing.outOfRange;
  return noIndex ? { ...metadata, robots: { index: false, follow: true } } : metadata;
}

function ResultsBar({ listing }: { listing: NewsListing }) {
  const { total, page, pageCount, items } = listing.result;
  const from = (page - 1) * NEWS_PAGE_SIZE + 1;
  const to = from + items.length - 1;

  return (
    <div className="mb-10 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle md:mb-14">
      <p>
        Showing{" "}
        <span className="text-fg">
          {from}–{to}
        </span>{" "}
        of {total.toLocaleString("en-US")} {total === 1 ? "story" : "stories"}
      </p>
      {pageCount > 1 ? (
        <p aria-hidden="true">
          Page <span className="text-fg">{String(page).padStart(2, "0")}</span> / {String(pageCount).padStart(2, "0")}
        </p>
      ) : null}
    </div>
  );
}

function ListingEmptyState({ listing }: { listing: NewsListing }) {
  const filtersOnly = hrefWithQuery("/news", { category: listing.categorySlug, tag: listing.tagSlug });

  if (listing.outOfRange) {
    const { pageCount } = listing.result;
    return (
      <EmptyState
        title="This page is off the record"
        description={
          <p>
            {pageCount === 1 ? "There is only one page" : `There are only ${pageCount} pages`} of stories here — page{" "}
            {listing.page} doesn&apos;t exist (yet).
          </p>
        }
        action={{ label: "Back to page 1", href: filtersOnly }}
      />
    );
  }

  if (listing.hasFilters) {
    const what = listing.tagLabel ? `tagged “${listing.tagLabel}”` : `filed under “${listing.categoryLabel}”`;
    return (
      <EmptyState
        title="Nothing here yet"
        description={
          <p>
            We haven&apos;t published any stories {what} so far. Try another category, or catch up on everything
            we&apos;ve covered.
          </p>
        }
        action={{ label: "See all news", href: "/news" }}
      />
    );
  }

  return (
    <EmptyState
      title="The presses are warming up"
      description={
        <p>
          No stories have been published yet. Check back soon — in the meantime, meet the artists shaping the Nepali
          scene.
        </p>
      }
      action={{ label: "Explore artists", href: "/artists" }}
    />
  );
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const listing = await loadNewsListing(await searchParams);
  const { items, pageCount, total } = listing.result;
  const hasItems = items.length > 0;

  return (
    <>
      <NewsHero
        copy={listing.copy}
        categories={listing.categories}
        categorySlug={listing.categorySlug}
        tagSlug={listing.tagSlug}
        tagLabel={listing.tagLabel}
        total={total}
      />

      <Container className="pt-10 pb-section md:pt-14">
        {hasItems ? (
          <>
            <ResultsBar listing={listing} />
            <NewsGrid articles={items} withLead={listing.page === 1} />
            <Pagination
              page={listing.page}
              pageCount={pageCount}
              basePath="/news"
              query={{ category: listing.categorySlug, tag: listing.tagSlug }}
              label="News pages"
              className="mt-20 md:mt-24"
            />
          </>
        ) : (
          <ListingEmptyState listing={listing} />
        )}
      </Container>
    </>
  );
}
