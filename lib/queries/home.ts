import "server-only";
import { cache } from "react";
import type {
  ArticleSummary,
  ArtistSummary,
  ContactInfoDTO,
  HomepageSettingsDTO,
  PageSettingsMap,
  ServiceDTO,
  TestimonialDTO,
  TrendingCard,
} from "@/types/content";
import { getFeaturedArticles, getLatestArticles } from "./articles";
import { getFeaturedArtists } from "./artists";
import { getAllPageSettings } from "./page-settings";
import { getActiveServices } from "./services";
import { getContactInfo, getHomepageSettings } from "./settings";
import { getActiveTestimonials } from "./testimonials";
import { getTrending } from "./trending";

/** Articles on the home page: 1 lead + up to 5 more (grid + "more headlines" rail). */
export const HOME_ARTICLE_COUNT = 6;
/** Featured artists on the home page (multiples of 4 fill the desktop grid). */
export const HOME_ARTIST_COUNT = 8;
/** Services shown in the home teaser. */
export const HOME_SERVICE_COUNT = 3;

export interface HomePageData {
  settings: HomepageSettingsDTO;
  /** /trending and /testimonials settings (homepage limits, "view all" links when live). */
  pages: PageSettingsMap;
  contact: ContactInfoDTO;
  trending: TrendingCard[];
  articles: ArticleSummary[];
  artists: ArtistSummary[];
  services: ServiceDTO[];
  testimonials: TestimonialDTO[];
}

/**
 * Home page picks (HomepageSettings.featuredArticleIds) first, topped up with the latest
 * published articles so the lead + grid is always full when content exists.
 */
async function getHomeArticles(limit: number): Promise<ArticleSummary[]> {
  const featured = await getFeaturedArticles(limit);
  if (featured.length >= limit) return featured;

  const latest = await getLatestArticles(limit + featured.length);
  const seen = new Set(featured.map((a) => a.id));
  const topUp = latest.filter((a) => !seen.has(a.id));
  return [...featured, ...topUp].slice(0, limit);
}

/**
 * Everything the landing page needs, fetched in parallel. Every underlying query already
 * degrades to empty lists / defaults without a database, so this never throws.
 */
export const getHomePageData = cache(async (): Promise<HomePageData> => {
  const pagesPromise = getAllPageSettings();
  const [settings, pages, contact, trending, articles, artists, services, testimonials] = await Promise.all([
    getHomepageSettings(),
    pagesPromise,
    getContactInfo(),
    // The strip length is set in the Trending page settings.
    pagesPromise.then((pages) => getTrending(pages.trending.homepageLimit)),
    getHomeArticles(HOME_ARTICLE_COUNT),
    getFeaturedArtists(HOME_ARTIST_COUNT),
    getActiveServices(),
    getActiveTestimonials(),
  ]);

  return {
    settings,
    pages,
    contact,
    trending,
    articles,
    artists,
    services: services.slice(0, HOME_SERVICE_COUNT),
    testimonials: testimonials.slice(0, pages.testimonials.homepageLimit),
  };
});
