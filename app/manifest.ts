import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/constants";

/** Web app manifest (install / home-screen metadata). Colours match the ink-950 page. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: `${SITE_NAME} — ${SITE_TAGLINE}`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0b0a09",
    theme_color: "#0b0a09",
    lang: "en",
    dir: "ltr",
    categories: ["music", "news", "entertainment"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Latest news", short_name: "News", url: "/news" },
      { name: "Artists", url: "/artists" },
      { name: "Work with us", short_name: "Contact", url: "/contact" },
    ],
  };
}
