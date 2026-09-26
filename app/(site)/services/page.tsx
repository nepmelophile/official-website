import type { Metadata } from "next";
import { JsonLd } from "@/components/ui/JsonLd";
import { TestimonialCard } from "@/components/cards/TestimonialCard";
import { CtaBand } from "@/components/services/CtaBand";
import { ServiceFeature } from "@/components/services/ServiceFeature";
import { ServicesIndex } from "@/components/services/ServicesIndex";
import { buildServicesStructuredData } from "@/components/services/services-structured-data";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { requireLiveData } from "@/lib/queries/safe";
import { getActiveServices } from "@/lib/queries/services";
import { getActiveTestimonials } from "@/lib/queries/testimonials";
import { buildMetadata } from "@/lib/site";

/** Hourly ISR fallback; admin edits revalidate on demand (lib/revalidate.ts). */
export const revalidate = 3600;

const DESCRIPTION =
  "Artist management, distribution, music videos and PR for independent Nepali musicians — practical help to release better and reach further.";

export const metadata: Metadata = buildMetadata({
  title: "Services for artists",
  description: DESCRIPTION,
  path: "/services",
});

export default async function ServicesPage() {
  // Cached (ISR) page: never store a DB-failure fallback as the fresh version.
  await requireLiveData();
  const [services, testimonials] = await Promise.all([getActiveServices(), getActiveTestimonials()]);
  const featuredTestimonials = testimonials.slice(0, 6);

  return (
    <>
      {services.length > 0 ? <JsonLd data={buildServicesStructuredData(services)} /> : null}

      <Section tone="glow" spacing="none" className="pt-14 pb-14 md:pt-24 md:pb-20" aria-labelledby="services-title">
        <div className="grid gap-14 lg:grid-cols-12 lg:items-end lg:gap-10">
          <SectionHeading
            as="h1"
            id="services-title"
            size="xl"
            eyebrow="Services"
            hairline={false}
            className="lg:col-span-7"
            title={
              <>
                Everything an artist needs to be <em>heard</em>
              </>
            }
            description="We’re a small team of music people in Kathmandu. Pick one service or build a plan around your next release — either way, you keep your music and your voice."
          />
          <ServicesIndex services={services} className="lg:col-span-4 lg:col-start-9" />
        </div>
      </Section>

      <Container className="pb-section">
        {services.length > 0 ? (
          services.map((service, i) => (
            <ServiceFeature
              key={service.id}
              service={service}
              index={i + 1}
              total={services.length}
              reverse={i % 2 === 1}
              preload={i === 0}
            />
          ))
        ) : (
          <EmptyState
            title="Our services are being updated"
            description="We’re refreshing this page. Tell us what you’re working on and we’ll point you to the right people."
            action={{ label: "Get in touch", href: "/contact" }}
          />
        )}
      </Container>

      {featuredTestimonials.length > 0 ? (
        <Section tone="alt" aria-labelledby="services-testimonials-title">
          <SectionHeading
            id="services-testimonials-title"
            eyebrow="Testimonials"
            title={
              <>
                In their <em>words</em>
              </>
            }
            description="Artists on what it’s like to work with Melophile."
          />
          {featuredTestimonials.length === 1 ? (
            <TestimonialCard testimonial={featuredTestimonials[0]} size="lg" framed={false} className="mt-12 max-w-4xl md:mt-16" />
          ) : (
            <ul className="mt-12 grid gap-6 md:mt-16 md:grid-cols-2 lg:grid-cols-3">
              {featuredTestimonials.map((testimonial) => (
                <li key={testimonial.id}>
                  <TestimonialCard testimonial={testimonial} />
                </li>
              ))}
            </ul>
          )}
        </Section>
      ) : null}

      <CtaBand
        id="services-cta-title"
        eyebrow="Let’s work together"
        title={
          <>
            Have a release coming up? <em>Let&rsquo;s talk.</em>
          </>
        }
        description="Tell us about your music and your plans. We’ll reply with honest advice — and a plan if we’re the right fit."
        primary={{ label: "Start a conversation", href: "/contact" }}
        secondary={{ label: "Meet our artists", href: "/artists" }}
        tone={featuredTestimonials.length > 0 ? "glow" : "alt-glow"}
      />
    </>
  );
}
