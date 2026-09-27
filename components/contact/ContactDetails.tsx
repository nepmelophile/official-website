import type { ReactNode } from "react";
import { Clock, Mail, MapPin, Phone, type LucideIcon } from "lucide-react";
import { SocialLinks } from "@/components/ui/SocialLinks";
import { SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ContactInfoDTO } from "@/types/content";
import { mapsSearchUrl } from "./map-embed";

export interface ContactDetailsProps {
  info: ContactInfoDTO;
  className?: string;
}

const META = "font-mono text-xs uppercase tracking-[0.14em]";
const BIG_LINK =
  "font-display text-2xl leading-tight font-bold text-fg wrap-anywhere underline decoration-accent/70 decoration-2 underline-offset-[6px] transition-colors duration-150 hover:text-orchid-300 hover:decoration-orchid-300 md:text-[1.75rem]";

/** `tel:` href from a human-formatted number ("+977 1-5550123" → "tel:+97715550123"). */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

interface Row {
  key: string;
  label: string;
  icon: LucideIcon;
  content: ReactNode;
}

/** Email, phone, address and hours as a hairline definition list, plus social links. */
export function ContactDetails({ info, className }: ContactDetailsProps) {
  const rows: Row[] = [];
  if (info.email) {
    rows.push({
      key: "email",
      label: "Email",
      icon: Mail,
      content: (
        <a href={`mailto:${info.email}`} className={BIG_LINK}>
          {info.email}
        </a>
      ),
    });
  }
  if (info.phone) {
    rows.push({
      key: "phone",
      label: "Phone",
      icon: Phone,
      content: (
        <a href={telHref(info.phone)} className={BIG_LINK}>
          {info.phone}
        </a>
      ),
    });
  }
  if (info.address) {
    rows.push({
      key: "address",
      label: "Studio",
      icon: MapPin,
      content: (
        <>
          <span className="block text-lg/snug text-fg">{info.address}</span>
          <a
            href={mapsSearchUrl(info.address)}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(META, "mt-2 inline-flex min-h-11 items-center text-fg-muted underline-offset-4 transition-colors hover:text-orchid-300 hover:underline")}
          >
            Open in Google Maps<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </>
      ),
    });
  }
  if (info.officeHours) {
    rows.push({
      key: "hours",
      label: "Hours",
      icon: Clock,
      content: <span className="block text-lg/snug text-fg">{info.officeHours}</span>,
    });
  }

  return (
    <div className={className}>
      {rows.length > 0 ? (
        <address className="not-italic">
          <dl className="border-t border-line">
            {rows.map(({ key, label, icon: Icon, content }) => (
              <div key={key} className="grid gap-2 border-b border-line py-5 sm:grid-cols-[7.5rem_1fr] sm:gap-6">
                <dt className={cn(META, "flex items-center gap-2 pt-1 text-fg-subtle")}>
                  <Icon size={16} strokeWidth={1.75} aria-hidden="true" className="shrink-0 text-orchid-400" />
                  {label}
                </dt>
                <dd className="min-w-0">{content}</dd>
              </div>
            ))}
          </dl>
        </address>
      ) : null}

      {info.socialLinks.length > 0 ? (
        <div className="mt-10">
          <h2 className={cn(META, "text-fg-subtle")}>Follow {SITE_NAME}</h2>
          <SocialLinks
            links={info.socialLinks}
            owner={SITE_NAME}
            variant="label"
            size="sm"
            label={`${SITE_NAME} on social media`}
            className="mt-4"
          />
        </div>
      ) : null}
    </div>
  );
}
