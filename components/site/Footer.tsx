import Link from "next/link";
import { ArrowUpRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SocialLinks } from "@/components/ui/SocialLinks";
import { SITE_DESCRIPTION, SITE_DOMAIN, SITE_NAME } from "@/lib/constants";
import { getSiteChromeContactInfo } from "@/lib/queries/settings";
import { HEADER_CTA, SITE_NAV } from "./nav";
import { Wordmark } from "./Wordmark";

const HEADING = "font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle";
const LINK = "inline-flex min-h-11 items-center text-fg-muted transition-colors duration-150 hover:text-fg sm:min-h-9";

function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** Public footer: contact details and socials from ContactInfo, nav, copyright. */
export async function Footer() {
  const contact = await getSiteChromeContactInfo();
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-line bg-bg-alt">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -left-40 size-[36rem] rounded-full bg-[radial-gradient(circle,rgb(232_57_31/0.12),transparent_65%)]"
      />
      <Container className="relative pt-16 pb-10 md:pt-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <Wordmark size="lg" asLink={false} />
            <p className="mt-6 font-serif text-2xl text-fg italic md:text-3xl">
              The sound of <span className="text-highlight">Nepal</span>, amplified.
            </p>
            <p className="mt-4 max-w-md text-sm/relaxed text-fg-muted">{SITE_DESCRIPTION}</p>
            <Link
              href={HEADER_CTA.href}
              className="group mt-8 inline-flex min-h-11 items-center gap-2 font-display text-xl font-bold text-fg"
            >
              <span className="bg-[linear-gradient(var(--color-accent),var(--color-accent))] bg-size-[100%_2px] bg-left-bottom bg-no-repeat pb-1 transition-[background-size] duration-300 group-hover:bg-size-[100%_100%] group-hover:text-accent-fg">
                Work with Melophile
              </span>
              <ArrowUpRight
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
                className="transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
          </div>

          <nav aria-label="Footer" className="lg:col-span-2 lg:col-start-7">
            <h2 className={HEADING}>Explore</h2>
            <ul className="mt-4 flex flex-col">
              {SITE_NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={LINK}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-4">
            <h2 className={HEADING}>Get in touch</h2>
            <address className="mt-4 flex flex-col gap-1 not-italic">
              {contact.email ? (
                <a href={`mailto:${contact.email}`} className={`${LINK} gap-3`}>
                  <Mail size={16} strokeWidth={1.75} aria-hidden="true" className="shrink-0 text-fg-subtle" />
                  <span className="break-all">{contact.email}</span>
                </a>
              ) : null}
              {contact.phone ? (
                <a href={telHref(contact.phone)} className={`${LINK} gap-3`}>
                  <Phone size={16} strokeWidth={1.75} aria-hidden="true" className="shrink-0 text-fg-subtle" />
                  {contact.phone}
                </a>
              ) : null}
              {contact.address ? (
                <p className="flex items-start gap-3 py-2 text-fg-muted">
                  <MapPin size={16} strokeWidth={1.75} aria-hidden="true" className="mt-1 shrink-0 text-fg-subtle" />
                  {contact.address}
                </p>
              ) : null}
              {contact.officeHours ? (
                <p className="flex items-start gap-3 py-2 text-sm text-fg-subtle">
                  <Clock size={16} strokeWidth={1.75} aria-hidden="true" className="mt-0.5 shrink-0" />
                  {contact.officeHours}
                </p>
              ) : null}
            </address>
            {contact.socialLinks.length > 0 ? (
              <div className="mt-6">
                <h2 className="sr-only">Follow {SITE_NAME}</h2>
                <SocialLinks links={contact.socialLinks} owner={SITE_NAME} label={`${SITE_NAME} on social media`} />
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-line pt-6 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {SITE_NAME} · {SITE_DOMAIN}
          </p>
          <p className="flex items-center gap-2">
            <span aria-hidden="true" className="size-1.5 animate-pulse-dot rounded-pill bg-vermilion-500" />
            Made in Kathmandu, Nepal
          </p>
        </div>
      </Container>
    </footer>
  );
}
