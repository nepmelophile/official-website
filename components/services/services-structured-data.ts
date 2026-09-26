import type { JsonLdData } from "@/components/ui/JsonLd";
import { SITE_NAME } from "@/lib/constants";
import { absoluteUrl, siteUrl } from "@/lib/site";
import type { ServiceDTO } from "@/types/content";

/** schema.org ItemList of the services offered by Melophile. */
export function buildServicesStructuredData(services: ServiceDTO[]): JsonLdData {
  const provider = { "@type": "Organization", name: SITE_NAME, url: siteUrl };
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${SITE_NAME} services for artists`,
    itemListElement: services.map((service, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Service",
        name: service.name,
        description: service.description,
        url: absoluteUrl(`/services#${service.slug}`),
        image: service.image?.url ? absoluteUrl(service.image.url) : undefined,
        serviceType: service.name,
        areaServed: { "@type": "Country", name: "Nepal" },
        provider,
      },
    })),
  };
}
