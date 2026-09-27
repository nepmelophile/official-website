import { NAV_LINKS, PAGE_PATHS } from "@/lib/constants";
import type { PageSettingsDTO, PageSettingsMap } from "@/types/content";

export interface NavItem {
  label: string;
  href: string;
}

/** Public navigation base list: Home + the shared NAV_LINKS (managed pages are added by buildNavLinks). */
export const SITE_NAV: readonly NavItem[] = [{ label: "Home", href: "/" }, ...NAV_LINKS];

/** A managed page belongs in the menu when it is live and set to show there. */
function menuItem(settings: PageSettingsDTO): NavItem | null {
  if (!settings.enabled || !settings.showInNav) return null;
  return { label: settings.navLabel, href: PAGE_PATHS[settings.page] };
}

/** Inserts `item` next to the link with `anchor` (after or before it), or at the end when it is missing. */
function insertAt(links: NavItem[], item: NavItem, anchor: string, where: "after" | "before"): void {
  const index = links.findIndex((link) => link.href === anchor);
  if (index === -1) links.push(item);
  else links.splice(where === "after" ? index + 1 : index, 0, item);
}

/**
 * Menu links for the given page settings: SITE_NAV plus Trending after Artists and Testimonials
 * before Contact, each only when live and shown in the menu, labelled with its navLabel.
 * Pure (used by the getNavLinks() server query).
 */
export function buildNavLinks(pages: PageSettingsMap, base: readonly NavItem[] = SITE_NAV): NavItem[] {
  const links = [...base];
  const trending = menuItem(pages.trending);
  if (trending) insertAt(links, trending, "/artists", "after");
  const testimonials = menuItem(pages.testimonials);
  if (testimonials) insertAt(links, testimonials, "/contact", "before");
  return links;
}

export const HEADER_CTA: NavItem = { label: "Work with us", href: "/contact" };

/** "page" for the exact route, "true" for a parent section (e.g. /news/x under /news). */
export function navCurrent(pathname: string | null, href: string): "page" | "true" | undefined {
  if (!pathname) return undefined;
  if (pathname === href) return "page";
  if (href !== "/" && pathname.startsWith(`${href}/`)) return "true";
  return undefined;
}
