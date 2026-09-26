import type { Metadata } from "next";
import { JsonLd } from "@/components/ui/JsonLd";
import { ContactDetails } from "@/components/contact/ContactDetails";
import { ContactForm } from "@/components/contact/ContactForm";
import { ContactMap } from "@/components/contact/ContactMap";
import { buildContactStructuredData } from "@/components/contact/contact-structured-data";
import { toSafeMapEmbedUrl } from "@/components/contact/map-embed";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getActiveServices } from "@/lib/queries/services";
import { requireLiveData } from "@/lib/queries/safe";
import { getContactInfo } from "@/lib/queries/settings";
import { buildMetadata } from "@/lib/site";

/**
 * Static page with an hourly ISR fallback (contact info / service edits revalidate on demand).
 * ?service= and ?subject= prefills are read client-side, so the page stays static.
 */
export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description:
    "Planning a release, pitching a story or looking for a team? Get in touch with Melophile — email, phone, our Lalitpur studio or the contact form.",
  path: "/contact",
});

export default async function ContactPage() {
  // Cached (ISR) page: never store a DB-failure fallback as the fresh version.
  await requireLiveData();
  const [info, services] = await Promise.all([getContactInfo(), getActiveServices()]);
  const mapSrc = toSafeMapEmbedUrl(info.mapEmbedUrl);

  return (
    <>
      <JsonLd data={buildContactStructuredData(info)} />

      <Section tone="glow" spacing="none" className="pt-14 pb-section md:pt-24" aria-labelledby="contact-title">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-start lg:gap-x-10 lg:gap-y-14">
          <SectionHeading
            as="h1"
            id="contact-title"
            size="xl"
            eyebrow="Contact"
            hairline={false}
            className="lg:col-span-5 lg:row-start-1"
            title={
              <>
                Let&rsquo;s make some <em>noise</em>.
              </>
            }
            description="Planning a release, pitching a story or looking for a team to grow with? Send us a message — a real person reads every one."
          />

          <div className="lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1">
            <div className="rounded-xl border border-line bg-surface p-5 shadow-card sm:p-8 md:p-10">
              <p className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
                <span aria-hidden="true" className="inline-block size-1.5 animate-pulse-dot rounded-pill bg-vermilion-500" />
                Inbox open
              </p>
              <h2 id="contact-form-title" className="font-display text-display-sm font-bold text-fg">
                Send us a message
              </h2>
              <p className="mt-2 max-w-prose text-fg-muted">
                Tell us who you are and what you&rsquo;re working on. We&rsquo;ll reply by email.
              </p>
              <ContactForm
                services={services.map(({ name, slug }) => ({ name, slug }))}
                contactEmail={info.email}
                labelledBy="contact-form-title"
                className="mt-8"
              />
            </div>
          </div>

          <ContactDetails info={info} className="lg:col-span-5 lg:row-start-2" />
        </div>
      </Section>

      {mapSrc ? (
        <Section spacing="none" className="pb-section" aria-labelledby="contact-map-title">
          <h2
            id="contact-map-title"
            className="mb-6 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle"
          >
            <span aria-hidden="true" className="inline-block size-1.5 rounded-pill bg-vermilion-500" />
            Find the studio
          </h2>
          <ContactMap src={mapSrc} address={info.address} />
        </Section>
      ) : null}
    </>
  );
}
