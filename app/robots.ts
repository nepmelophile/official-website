import type { MetadataRoute } from "next";
import { absoluteUrl, siteUrl } from "@/lib/site";

/**
 * robots.txt: crawl everything public, never the admin or API. Vercel preview deployments
 * are closed to crawlers entirely so previews never compete with production in search.
 */
export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV === "preview") {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteUrl,
  };
}
