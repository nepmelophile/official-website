import "server-only";
import { revalidatePath } from "next/cache";
import { PAGE_PATHS } from "@/lib/constants";
import type { PageKey } from "@/types/content";

/*
 * On-demand revalidation helpers. Call the matching helper from every admin mutation
 * (create / update / delete / publish) AFTER the write succeeds, so published content shows
 * up without waiting for the hourly ISR fallback (`export const revalidate = 3600`).
 *
 * Dynamic routes are revalidated with the route pattern + 'page' so every generated page of
 * that route (including an old slug after a rename) is refreshed lazily on its next visit.
 *
 * IMPORTANT: route-pattern paths must follow the FILE STRUCTURE, including route groups.
 * The public pages live under app/(site)/, so their cache tags are `_N_T_/(site)/news/[slug]/page`
 * etc. — `revalidatePath('/news/[slug]', 'page')` (without the group) silently matches nothing.
 * If a route is ever moved to another group, update the patterns below.
 */

const ARTICLE_PAGE_PATTERN = "/(site)/news/[slug]";
const ARTIST_PAGE_PATTERN = "/(site)/artists/[slug]";

/*
 * The managed pages (app/(site)/trending, app/(site)/testimonials) are static routes, so their
 * literal URL paths ("/trending", "/testimonials" from PAGE_PATHS) are enough — no route-group
 * pattern is needed for them. /trending reads ?type=, so it renders per request anyway; it is
 * still purged so a router-cached copy is refreshed.
 */
const TRENDING_PATH = PAGE_PATHS.trending;
const TESTIMONIALS_PATH = PAGE_PATHS.testimonials;

const SITEMAP = "/sitemap.xml";

function safeRevalidate(path: string, type?: "page" | "layout"): void {
  try {
    if (type) revalidatePath(path, type);
    else revalidatePath(path);
  } catch (error) {
    // Never let a cache purge failure break an otherwise successful admin write.
    console.error(`[melophile] revalidatePath(${path}) failed`, error);
  }
}

/** Articles: news listing, article pages, home (latest/featured/trending), artist pages (related news), the trending chart. */
export function revalidateArticles(slug?: string | null): void {
  safeRevalidate("/news");
  if (slug) safeRevalidate(`/news/${slug}`);
  safeRevalidate(ARTICLE_PAGE_PATTERN, "page");
  safeRevalidate(ARTIST_PAGE_PATTERN, "page");
  safeRevalidate("/");
  safeRevalidate(TRENDING_PATH);
  safeRevalidate(SITEMAP);
}

/** Artists: listing, artist pages, home (featured artists / trending), the trending chart. */
export function revalidateArtists(slug?: string | null): void {
  safeRevalidate("/artists");
  if (slug) safeRevalidate(`/artists/${slug}`);
  safeRevalidate(ARTIST_PAGE_PATTERN, "page");
  safeRevalidate("/");
  safeRevalidate(TRENDING_PATH);
  safeRevalidate(SITEMAP);
}

/** Services: services page, home teaser, contact page (service select). */
export function revalidateServices(): void {
  safeRevalidate("/services");
  safeRevalidate("/contact");
  safeRevalidate("/");
}

/** Testimonials: home, services and the /testimonials page. */
export function revalidateTestimonials(): void {
  safeRevalidate("/");
  safeRevalidate("/services");
  safeRevalidate(TESTIMONIALS_PATH);
}

/** Trending: the home page strip and the /trending chart. */
export function revalidateTrending(): void {
  safeRevalidate("/");
  safeRevalidate(TRENDING_PATH);
}

/**
 * Page settings (/trending, /testimonials): the page itself, the home page ("view all" links,
 * homepage limits), the sitemap, and — because the menu is data-driven — every page under the
 * root layout (header, mobile menu and footer links).
 */
export function revalidatePageSettings(page: PageKey): void {
  safeRevalidate(PAGE_PATHS[page]);
  safeRevalidate("/");
  safeRevalidate(SITEMAP);
  safeRevalidate("/", "layout");
}

/** Homepage settings (hero, stats, featured picks). */
export function revalidateHomepage(): void {
  safeRevalidate("/");
}

/**
 * Contact info is shown on /contact and in the site-wide footer (email, socials), so the
 * whole tree under the root layout is revalidated.
 */
export function revalidateContact(): void {
  safeRevalidate("/contact");
  safeRevalidate("/", "layout");
}

/** Everything (use sparingly, e.g. after a bulk import). */
export function revalidateAll(): void {
  safeRevalidate("/", "layout");
}

/** Branding (logos) shows in the header, footer and admin on every page. */
export function revalidateBranding(): void {
  safeRevalidate("/", "layout");
}
