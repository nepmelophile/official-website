import type { JsonLdData } from "@/components/ui/JsonLd";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/constants";
import { absoluteUrl, siteUrl } from "@/lib/site";
import type { ContactInfoDTO } from "@/types/content";

/** schema.org ContactPage describing the Melophile organisation and how to reach it. */
export function buildContactStructuredData(info: ContactInfoDTO): JsonLdData {
  const telephone = info.phone ? info.phone.replace(/[^\d+]/g, "") : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: `Contact ${SITE_NAME}`,
    url: absoluteUrl("/contact"),
    mainEntity: {
      "@type": "Organization",
      name: SITE_NAME,
      url: siteUrl,
      description: SITE_DESCRIPTION,
      email: info.email || undefined,
      telephone,
      address: info.address
        ? { "@type": "PostalAddress", streetAddress: info.address, addressCountry: "NP" }
        : undefined,
      sameAs: info.socialLinks.length > 0 ? info.socialLinks.map((l) => l.url) : undefined,
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: info.email || undefined,
        telephone,
        areaServed: "NP",
        availableLanguage: ["en", "ne"],
      },
    },
  };
}
