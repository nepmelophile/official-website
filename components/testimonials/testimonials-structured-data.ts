import type { JsonLdData } from "@/components/ui/JsonLd";
import { absoluteUrl, siteUrl } from "@/lib/site";
import type { TestimonialDTO } from "@/types/content";

export interface TestimonialsJsonLdInput {
  name: string;
  description: string;
  path: string;
  testimonials: readonly Pick<TestimonialDTO, "name" | "designation" | "quote" | "source">[];
}

/**
 * schema.org CollectionPage listing each testimonial as a Quotation by a Person. Deliberately
 * not Review / AggregateRating: first-party testimonials about the site's own business are
 * "self-serving" reviews that search engines ignore (or penalise).
 */
export function buildTestimonialsStructuredData({ name, description, path, testimonials }: TestimonialsJsonLdInput): JsonLdData {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: absoluteUrl(path),
    about: { "@id": `${siteUrl}/#organization` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: testimonials.length,
      itemListElement: testimonials.map((t, i) => {
        const creator: Record<string, unknown> = { "@type": "Person", name: t.name };
        if (t.designation) creator.jobTitle = t.designation;
        const quotation: Record<string, unknown> = { "@type": "Quotation", text: t.quote, creator };
        if (t.source?.url) quotation.isBasedOn = t.source.url;
        return { "@type": "ListItem", position: i + 1, item: quotation };
      }),
    },
  };
}
