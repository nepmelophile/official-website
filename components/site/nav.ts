import { NAV_LINKS } from "@/lib/constants";

export interface NavItem {
  label: string;
  href: string;
}

/** Public navigation: Home + the shared NAV_LINKS. */
export const SITE_NAV: readonly NavItem[] = [{ label: "Home", href: "/" }, ...NAV_LINKS];

export const HEADER_CTA: NavItem = { label: "Work with us", href: "/contact" };

/** "page" for the exact route, "true" for a parent section (e.g. /news/x under /news). */
export function navCurrent(pathname: string | null, href: string): "page" | "true" | undefined {
  if (!pathname) return undefined;
  if (pathname === href) return "page";
  if (href !== "/" && pathname.startsWith(`${href}/`)) return "true";
  return undefined;
}
