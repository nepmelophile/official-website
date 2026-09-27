import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { withAccent } from "@/components/home/emphasis";
import { CtaBand } from "@/components/services/CtaBand";
import { FeaturedTestimonial } from "@/components/testimonials/FeaturedTestimonial";
import { TestimonialWall } from "@/components/testimonials/TestimonialWall";
import { buildTestimonialsStructuredData } from "@/components/testimonials/testimonials-structured-data";
import { EmptyState } from "@/components/ui/EmptyState";
import { IntroText } from "@/components/ui/IntroText";
import { JsonLd } from "@/components/ui/JsonLd";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PAGE_PATHS } from "@/lib/constants";
import { pageMetaDescription, pageMetaTitle, plainHeading } from "@/lib/page-settings";
import { getPageSettings } from "@/lib/queries/page-settings";
import { requireLiveData } from "@/lib/queries/safe";
import { getActiveTestimonials } from "@/lib/queries/testimonials";
import { buildMetadata } from "@/lib/site";

/** Hourly ISR fallback; testimonial and page-settings edits revalidate /testimonials on demand. */
export const revalidate = 3600;

const PATH = PAGE_PATHS.testimonials;
const FALLBACK_DESCRIPTION =
  "What Nepali artists, bands and promoters say about working with Melophile on releases, videos, press and live shows.";

export async function generateMetadata(): Promise<Metadata> {
  // Cached (ISR) page: fail the regeneration rather than cache fallback metadata.
  await requireLiveData();
  const settings = await getPageSettings("testimonials");
  if (!settings.enabled) return { robots: { index: false, follow: false } };
  return buildMetadata({
    title: pageMetaTitle(settings),
    description: pageMetaDescription(settings, FALLBACK_DESCRIPTION),
    path: PATH,
    image: settings.ogImage,
  });
}

export default async function TestimonialsPage() {
  // Cached (ISR) page: never store a DB-failure fallback (an empty wall) as the fresh version.
  await requireLiveData();
  const [settings, testimonials] = await Promise.all([getPageSettings("testimonials"), getActiveTestimonials()]);
  if (!settings.enabled) notFound();

  // Featured quotes get the spotlight; the wall below holds the rest, still in `order`.
  const featured = testimonials.filter((t) => t.featured);
  const others = testimonials.filter((t) => !t.featured);
  const count = testimonials.length;
  const cta = settings.ctaEnabled && settings.ctaLabel && settings.ctaHref ? settings : null;

  return (
    <>
      {count > 0 ? (
        <JsonLd
          id="testimonials-jsonld"
          data={buildTestimonialsStructuredData({
            name: plainHeading(settings),
            description: pageMetaDescription(settings, FALLBACK_DESCRIPTION),
            path: PATH,
            testimonials: [...featured, ...others],
          })}
        />
      ) : null}

      <Section tone="glow" spacing="none" className="pt-14 pb-12 md:pt-24 md:pb-16" aria-labelledby="testimonials-title">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <SectionHeading
            as="h1"
            id="testimonials-title"
            size="xl"
            eyebrow={settings.eyebrow || undefined}
            hairline={false}
            className="lg:col-span-9"
            title={withAccent(settings.heading)}
            description={settings.intro ? <IntroText>{settings.intro}</IntroText> : undefined}
          />
          {count > 0 ? (
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle lg:col-span-3 lg:justify-self-end lg:text-right">
              <span className="block font-display text-display-lg leading-none font-extrabold tracking-tight normal-case tabular-nums text-fg">
                {String(count).padStart(2, "0")}
              </span>
              <span className="mt-2 block">{count === 1 ? "Voice" : "Voices"}</span>
            </p>
          ) : null}
        </div>
      </Section>

      {count === 0 ? (
        <Section spacing="none" className="pb-section" aria-label="Testimonials">
          <EmptyState
            title="Testimonials are on their way"
            description="We’re collecting words from the artists we work with. In the meantime, see what we can do for your music."
            action={{ label: "Explore our services", href: "/services" }}
          />
        </Section>
      ) : null}

      {featured.length > 0 ? (
        <Section spacing="none" className="pb-section" aria-labelledby="testimonials-featured-heading">
          <h2
            id="testimonials-featured-heading"
            className="mb-10 flex items-center gap-2 border-t border-line pt-6 font-mono text-xs font-normal uppercase tracking-[0.14em] text-fg-subtle md:mb-14"
          >
            <span aria-hidden="true" className="inline-block size-1.5 rounded-pill bg-accent" />
            01 — Featured
          </h2>
          <ul className="space-y-20 md:space-y-28">
            {featured.map((testimonial, i) => (
              <li key={testimonial.id}>
                <FeaturedTestimonial testimonial={testimonial} reverse={i % 2 === 1} preload={i === 0} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {others.length > 0 ? (
        <Section
          tone={featured.length > 0 ? "alt" : "default"}
          spacing={featured.length > 0 ? "default" : "none"}
          className={featured.length > 0 ? undefined : "pb-section"}
          aria-labelledby="testimonials-wall-heading"
        >
          {featured.length > 0 ? (
            <SectionHeading
              id="testimonials-wall-heading"
              index={2}
              eyebrow="More voices"
              size="md"
              title={
                <>
                  More from the <em>scene</em>
                </>
              }
            />
          ) : (
            <h2 id="testimonials-wall-heading" className="sr-only">
              All testimonials
            </h2>
          )}
          <TestimonialWall testimonials={others} className={featured.length > 0 ? "mt-12 md:mt-16" : undefined} />
        </Section>
      ) : null}

      {cta ? (
        <CtaBand
          id="testimonials-cta-title"
          eyebrow="Work with us"
          title={
            <>
              Your <em>story</em> could be next.
            </>
          }
          description="Tell us about your music and your plans. We’ll reply with honest advice, and a plan if we’re the right fit."
          primary={{ label: cta.ctaLabel, href: cta.ctaHref }}
          secondary={cta.ctaHref === "/services" ? undefined : { label: "Our services", href: "/services" }}
          tone={others.length > 0 && featured.length > 0 ? "glow" : "alt-glow"}
        />
      ) : null}
    </>
  );
}
