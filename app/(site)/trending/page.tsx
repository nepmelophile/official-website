import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { withAccent } from "@/components/home/emphasis";
import { TrendingChartList } from "@/components/trending/TrendingChartList";
import { TrendingTopEntry } from "@/components/trending/TrendingTopEntry";
import { padPosition } from "@/components/trending/entry";
import { buildTrendingStructuredData } from "@/components/trending/trending-structured-data";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChips } from "@/components/ui/FilterChips";
import { IntroText } from "@/components/ui/IntroText";
import { JsonLd } from "@/components/ui/JsonLd";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PAGE_PATHS, TRENDING_TYPE_LABELS, TRENDING_TYPE_PLURALS, TRENDING_TYPES } from "@/lib/constants";
import { pageMetaDescription, pageMetaTitle, plainHeading } from "@/lib/page-settings";
import { getPageSettings } from "@/lib/queries/page-settings";
import { getTrendingChart } from "@/lib/queries/trending";
import { buildMetadata } from "@/lib/site";
import { formatDate, toDateInputValue } from "@/lib/utils";
import type { TrendingType } from "@/types/content";

/**
 * Hourly ISR fallback; trending, artist, article and page-settings edits also revalidate
 * /trending on demand (lib/revalidate.ts). Reading ?type= makes the page render per request,
 * like the /artists and /news listings, so it degrades to an empty chart without a database.
 */
export const revalidate = 3600;

const PATH = PAGE_PATHS.trending;
const FALLBACK_DESCRIPTION =
  "The Melophile Trending chart: the Nepali artists, songs and stories everyone is talking about right now.";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

interface TrendingPageProps {
  searchParams: SearchParams;
}

function parseType(value: string | string[] | undefined): TrendingType | null {
  const raw = (Array.isArray(value) ? value[0] : value)?.trim().toLowerCase();
  return raw && (TRENDING_TYPES as readonly string[]).includes(raw) ? (raw as TrendingType) : null;
}

/** Settings + the active type filter (?type= is ignored while the filter is switched off). */
async function loadPage(searchParams: SearchParams) {
  const [settings, params] = await Promise.all([getPageSettings("trending"), searchParams]);
  const type = settings.showTypeFilter ? parseType(params.type) : null;
  return { settings, type };
}

export async function generateMetadata({ searchParams }: TrendingPageProps): Promise<Metadata> {
  const { settings, type } = await loadPage(searchParams);
  if (!settings.enabled) return { robots: { index: false, follow: false } };

  const title = pageMetaTitle(settings);
  const metadata = buildMetadata({
    title: type ? `${title}: ${TRENDING_TYPE_PLURALS[type]}` : title,
    description: pageMetaDescription(settings, FALLBACK_DESCRIPTION),
    path: PATH,
    image: settings.ogImage,
  });
  // Filtered views point their canonical at /trending and stay out of the index.
  return type ? { ...metadata, robots: { index: false, follow: true } } : metadata;
}

export default async function TrendingPage({ searchParams }: TrendingPageProps) {
  const { settings, type } = await loadPage(searchParams);
  if (!settings.enabled) notFound();

  const chart = await getTrendingChart(settings.pageLimit);
  const presentTypes = TRENDING_TYPES.filter((t) => chart.entries.some((entry) => entry.type === t));
  // Chips only help when the chart mixes types; keep them while a filter is active so it can be cleared.
  const showFilter = settings.showTypeFilter && (presentTypes.length > 1 || type !== null);
  const chipTypes = TRENDING_TYPES.filter((t) => presentTypes.includes(t) || t === type);

  const entries = type ? chart.entries.filter((entry) => entry.type === type) : chart.entries;
  const [top, ...rest] = entries;
  const count = entries.length;
  const typeLabel = type ? TRENDING_TYPE_LABELS[type] : null;
  const typePlural = type ? TRENDING_TYPE_PLURALS[type] : null;

  return (
    <>
      {count > 0 ? (
        <JsonLd
          id="trending-jsonld"
          data={buildTrendingStructuredData({
            name: plainHeading(settings),
            description: pageMetaDescription(settings, FALLBACK_DESCRIPTION),
            path: PATH,
            entries,
          })}
        />
      ) : null}

      <Section tone="glow" spacing="none" className="pt-14 pb-12 md:pt-24 md:pb-16" aria-labelledby="trending-title">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <SectionHeading
            as="h1"
            id="trending-title"
            size="xl"
            eyebrow={settings.eyebrow || undefined}
            hairline={false}
            className="lg:col-span-9"
            title={withAccent(settings.heading)}
            description={settings.intro ? <IntroText>{settings.intro}</IntroText> : undefined}
          />
          {count > 0 ? (
            <div className="font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle lg:col-span-3 lg:justify-self-end lg:text-right">
              <p>
                <span className="block font-display text-display-lg leading-none font-extrabold tracking-tight normal-case tabular-nums text-fg">
                  {padPosition(count)}
                </span>
                <span className="mt-2 block">
                  {count === 1 ? "Entry" : "Entries"}
                  {typePlural ? ` · ${typePlural}` : ""}
                </span>
              </p>
              {chart.updatedAt ? (
                <p className="mt-1">
                  Updated <time dateTime={toDateInputValue(chart.updatedAt)}>{formatDate(chart.updatedAt, "medium")}</time>
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        {showFilter ? (
          <FilterChips
            options={chipTypes.map((t) => ({ label: TRENDING_TYPE_PLURALS[t], value: t }))}
            active={type}
            basePath={PATH}
            param="type"
            label="Filter the chart by type"
            className="mt-10 border-t border-line pt-6 md:mt-14"
          />
        ) : null}
      </Section>

      <Container className="pb-section">
        {top ? (
          <>
            <section aria-labelledby="chart-top-heading">
              <h2
                id="chart-top-heading"
                className="mb-8 flex items-center gap-2 font-mono text-xs font-normal uppercase tracking-[0.14em] text-fg-subtle md:mb-10"
              >
                <span aria-hidden="true" className="inline-block size-1.5 animate-pulse-dot rounded-pill bg-accent" />
                01 — {typeLabel ? `Top ${typeLabel.toLowerCase()}` : "Number one"}
              </h2>
              <TrendingTopEntry entry={top} titleId="chart-top-title" />
            </section>

            {rest.length > 0 ? (
              <section aria-labelledby="chart-list-heading" className="mt-20 md:mt-28">
                <SectionHeading
                  id="chart-list-heading"
                  index={2}
                  eyebrow={typePlural ? `More ${typePlural.toLowerCase()}` : "The chart"}
                  size="md"
                  title={
                    typePlural ? (
                      <>
                        More <em>{typePlural.toLowerCase()}</em> on the chart
                      </>
                    ) : (
                      <>
                        The rest of the <em>chart</em>
                      </>
                    )
                  }
                />
                <TrendingChartList entries={rest} className="mt-10 md:mt-14" />
              </section>
            ) : null}
          </>
        ) : type ? (
          <EmptyState
            title={`No ${typePlural?.toLowerCase()} on the chart right now`}
            description="The chart changes every week. Browse everything that’s trending in the meantime."
            action={{ label: "See the full chart", href: PATH }}
          />
        ) : (
          <EmptyState
            title="The chart is being compiled"
            description="Nothing is trending just yet. Check back soon, or catch up on the latest from the Nepali music scene."
            action={{ label: "Read the latest news", href: "/news" }}
          />
        )}
      </Container>
    </>
  );
}
