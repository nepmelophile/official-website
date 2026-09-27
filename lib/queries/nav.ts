import "server-only";
import { cache } from "react";
import { buildNavLinks, SITE_NAV, type NavItem } from "@/components/site/nav";
import { getSiteChromePageSettings } from "./page-settings";

/**
 * Public menu links (header, mobile menu, footer): the static NAV_LINKS plus the managed pages
 * that are live and set to show in the menu. Never throws; without a database it uses the page
 * defaults (both pages shown), and on any unexpected error the static base list.
 */
export const getNavLinks = cache(async (): Promise<NavItem[]> => {
  try {
    return buildNavLinks(await getSiteChromePageSettings());
  } catch (error) {
    console.error("[melophile] getNavLinks failed; using the static menu", error);
    return [...SITE_NAV];
  }
});
