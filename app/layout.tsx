import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { SITE_DESCRIPTION, SITE_DOMAIN, SITE_NAME, SITE_TAGLINE } from "@/lib/constants";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const display = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin", "latin-ext"],
  axes: ["opsz", "wdth"],
  display: "swap",
});

const sans = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const serif = Instrument_Serif({
  variable: "--font-instrument",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

const DEFAULT_TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`;

/**
 * Site-wide metadata defaults. Pages override via `buildMetadata()` from lib/site.ts.
 * No canonical here on purpose: a root canonical would leak "/" onto every child route.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: DEFAULT_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Nepali music",
    "Nepal music news",
    "Nepali artists",
    "Kathmandu music scene",
    "music promotion Nepal",
    "artist services",
    SITE_DOMAIN,
  ],
  category: "music",
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: { email: false, address: false, telephone: false },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    url: "/",
    title: DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0a09",
  colorScheme: "dark",
};

/**
 * Bare html/body shell shared by the public site and /admin. Public chrome (header, footer,
 * skip link) lives in app/(site)/layout.tsx so it never renders on /admin routes.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${serif.variable} ${mono.variable}`}
    >
      <body className="bg-bg font-sans text-fg antialiased">{children}</body>
    </html>
  );
}
