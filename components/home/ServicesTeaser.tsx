import { ServiceCard } from "@/components/cards/ServiceCard";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { ServiceDTO } from "@/types/content";

export interface ServicesTeaserProps {
  services: Pick<ServiceDTO, "id" | "name" | "slug" | "description" | "image">[];
  index?: number;
}

/** First few active services as numbered cards linking to /services#<slug>. */
export function ServicesTeaser({ services, index }: ServicesTeaserProps) {
  if (services.length === 0) return null;

  return (
    <Section tone="alt" aria-labelledby="home-services-title">
      <SectionHeading
        id="home-services-title"
        index={index}
        eyebrow="Services"
        title={
          <>
            Built for <em>independent</em> artists
          </>
        }
        description="Release strategy, distribution, PR and video — the support that helps Nepali musicians get heard at home and abroad."
        action={{ label: "All services", href: "/services" }}
      />

      <ul className="mt-12 grid gap-6 md:mt-16 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service, i) => (
          <li key={service.id} className={services.length === 3 && i === 2 ? "md:col-span-2 lg:col-span-1" : undefined}>
            <ServiceCard service={service} index={i + 1} />
          </li>
        ))}
      </ul>
    </Section>
  );
}
