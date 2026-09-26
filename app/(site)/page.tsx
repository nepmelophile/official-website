import type { Metadata } from "next";
import { CtaBand } from "@/components/home/CtaBand";
import { FeaturedArtists } from "@/components/home/FeaturedArtists";
import { HomeHero } from "@/components/home/HomeHero";
import { ImpactSection, visibleStats } from "@/components/home/ImpactSection";
import { JsonLd } from "@/components/ui/JsonLd";
import { LatestNews } from "@/components/home/LatestNews";
import { ServicesTeaser } from "@/components/home/ServicesTeaser";
import { Testimonials } from "@/components/home/Testimonials";
import { TrendingStrip } from "@/components/home/TrendingStrip";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/constants";
import { getHomePageData } from "@/lib/queries/home";
import { requireLiveData } from "@/lib/queries/safe";
import { absoluteUrl, buildMetadata, siteUrl } from "@/lib/site";
import type { ContactInfoDTO } from "@/types/content";

/** Hourly ISR fallback; admin edits revalidate "/" on demand (lib/revalidate.ts). */
export const revalidate = 3600;

const HOME_TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`;

const baseMetadata = buildMetadata({
  path: "/",
  description: SITE_DESCRIPTION,
  image: { url: "/opengraph-image", alt: HOME_TITLE },
});

export const metadata: Metadata = {
  ...baseMetadata,
  title: { absolute: HOME_TITLE },
  openGraph: { ...baseMetadata.openGraph, title: HOME_TITLE },
  twitter: { ...baseMetadata.twitter, title: HOME_TITLE },
};

type SectionKey = "impact" | "news" | "artists" | "services" | "testimonials";

/** Numbers only the sections that render, so kickers read 01, 02, 03… with no gaps. */
function numberSections(visible: Record<SectionKey, boolean>): Partial<Record<SectionKey, number>> {
  const order: SectionKey[] = ["impact", "news", "artists", "services", "testimonials"];
  const numbers: Partial<Record<SectionKey, number>> = {};
  let n = 0;
  for (const key of order) if (visible[key]) numbers[key] = ++n;
  return numbers;
}

/** schema.org Organization + WebSite for the home page. */
function organizationJsonLd(contact: ContactInfoDTO): Record<string, unknown> {
  const sameAs = contact.socialLinks.map((link) => link.url).filter((url) => /^https?:\/\//i.test(url));
  const organization: Record<string, unknown> = {
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: SITE_NAME,
    url: siteUrl,
    slogan: SITE_TAGLINE,
    description: SITE_DESCRIPTION,
    logo: { "@type": "ImageObject", url: absoluteUrl("/apple-icon"), width: 180, height: 180 },
    areaServed: { "@type": "Country", name: "Nepal" },
  };
  if (contact.email) organization.email = contact.email;
  if (contact.phone) organization.telephone = contact.phone;
  if (contact.address) organization.address = contact.address;
  if (sameAs.length > 0) organization.sameAs = sameAs;
  if (contact.email || contact.phone) {
    organization.contactPoint = {
      "@type": "ContactPoint",
      contactType: "customer support",
      ...(contact.email ? { email: contact.email } : {}),
      ...(contact.phone ? { telephone: contact.phone } : {}),
      availableLanguage: ["en", "ne"],
    };
  }

  return {
    "@context": "https://schema.org",
    "@graph": [
      organization,
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: "en",
        publisher: { "@id": `${siteUrl}/#organization` },
      },
    ],
  };
}

export default async function HomePage() {
  // Cached (ISR) page: never store a DB-failure fallback (empty sections) as the fresh version.
  await requireLiveData();
  const { settings, contact, trending, articles, artists, services, testimonials } = await getHomePageData();
  const stats = visibleStats(settings.impactStats);

  const index = numberSections({
    impact: stats.length > 0,
    news: articles.length > 0,
    artists: artists.length > 0,
    services: services.length > 0,
    testimonials: testimonials.length > 0,
  });

  return (
    <>
      <JsonLd id="home-jsonld" data={organizationJsonLd(contact)} />
      <HomeHero settings={settings} />
      <TrendingStrip items={trending} />
      <ImpactSection stats={stats} index={index.impact} />
      <LatestNews articles={articles} index={index.news} />
      <FeaturedArtists artists={artists} index={index.artists} />
      <ServicesTeaser services={services} index={index.services} />
      <Testimonials testimonials={testimonials} index={index.testimonials} headingId="home-testimonials-title" />
      <CtaBand email={contact.email} headingId="home-cta-title" />
    </>
  );
}
