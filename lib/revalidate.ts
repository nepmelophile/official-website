import "server-only";
import { revalidatePath } from "next/cache";

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

/** Articles: news listing, article pages, home (latest/featured/trending), artist pages (related news). */
export function revalidateArticles(slug?: string | null): void {
  safeRevalidate("/news");
  if (slug) safeRevalidate(`/news/${slug}`);
  safeRevalidate(ARTICLE_PAGE_PATTERN, "page");
  safeRevalidate(ARTIST_PAGE_PATTERN, "page");
  safeRevalidate("/");
  safeRevalidate(SITEMAP);
}

/** Artists: listing, artist pages, home (featured artists / trending). */
export function revalidateArtists(slug?: string | null): void {
  safeRevalidate("/artists");
  if (slug) safeRevalidate(`/artists/${slug}`);
  safeRevalidate(ARTIST_PAGE_PATTERN, "page");
  safeRevalidate("/");
  safeRevalidate(SITEMAP);
}

/** Services: services page, home teaser, contact page (service select). */
export function revalidateServices(): void {
  safeRevalidate("/services");
  safeRevalidate("/contact");
  safeRevalidate("/");
}

/** Testimonials: home and services pages. */
export function revalidateTestimonials(): void {
  safeRevalidate("/");
  safeRevalidate("/services");
}

/** Trending strip: home page. */
export function revalidateTrending(): void {
  safeRevalidate("/");
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
