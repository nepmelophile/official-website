"use client";

import Link from "next/link";
import { ArrowUpRight, Info, MapPin } from "lucide-react";
import {
  ButtonLink,
  FormSection,
  FormShell,
  SocialLinksField,
  TextArea,
  TextInput,
  useAdminForm,
} from "@/components/admin";
import { formatDate } from "@/lib/utils";
import type { ContactInfoDTO, SocialLink } from "@/types/content";
import { saveContactInfo } from "./actions";

interface ContactInfoFormValues {
  email: string;
  phone: string;
  address: string;
  mapEmbedUrl: string;
  officeHours: string;
  socialLinks: SocialLink[];
}

function toValues(info: ContactInfoDTO): ContactInfoFormValues {
  return {
    email: info.email,
    phone: info.phone,
    address: info.address,
    mapEmbedUrl: info.mapEmbedUrl ?? "",
    officeHours: info.officeHours ?? "",
    socialLinks: info.socialLinks.map((l) => ({ platform: l.platform, url: l.url })),
  };
}

/** Google's "Embed a map" gives an <iframe> snippet: keep just its src (the server does the same). */
function extractIframeSrc(value: string): string {
  const trimmed = value.trim();
  if (!/^<iframe[\s>]/i.test(trimmed)) return value;
  const match = /\ssrc\s*=\s*(["'])(.*?)\1/i.exec(trimmed);
  return match ? match[2].replace(/&amp;/g, "&").trim() : value;
}

/** Loose client-side check for the preview; lib/validators/contact-info.ts is authoritative. */
function isPreviewableMap(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    if (host === "www.google.com" || host === "google.com" || host === "maps.google.com") {
      return url.pathname.startsWith("/maps/embed") || url.searchParams.get("output") === "embed";
    }
    return (host === "www.openstreetmap.org" || host === "openstreetmap.org") && url.pathname === "/export/embed.html";
  } catch {
    return false;
  }
}

const PLACES = [
  { label: "Contact page", detail: "Email, phone, address, hours and the map", href: "/contact" },
  { label: "Site footer", detail: "Email and social links, on every page" },
  { label: "Search engines", detail: "Organisation details in the homepage’s structured data" },
];

export interface ContactInfoFormProps {
  info: ContactInfoDTO;
  saved: boolean;
  loadError?: string;
}

export function ContactInfoForm({ info, saved, loadError }: ContactInfoFormProps) {
  const form = useAdminForm({
    initial: toValues(info),
    action: (values) => saveContactInfo(values),
  });
  const { values, set, setter, error } = form;
  const mapUrl = values.mapEmbedUrl.trim();
  const showMap = mapUrl !== "" && isPreviewableMap(mapUrl);

  return (
    <FormShell
      title="Contact info"
      description="How people reach Melophile. Changes show on the contact page and in the footer on every page."
      meta={saved && info.updatedAt ? `Last updated ${formatDate(info.updatedAt, "medium")}` : undefined}
      backHref="/admin"
      backLabel="Dashboard"
      form={form}
      submitLabel="Save contact info"
      headerActions={
        <ButtonLink
          href="/contact"
          target="_blank"
          rel="noopener noreferrer"
          variant="ghost"
          size="sm"
          icon={<ArrowUpRight aria-hidden className="size-4" strokeWidth={1.75} />}
        >
          View contact page
        </ButtonLink>
      }
      aside={
        <FormSection title="Where this appears">
          <ul className="space-y-3 text-sm">
            {PLACES.map((place) => (
              <li key={place.label} className="flex gap-3">
                <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-pill bg-accent" />
                <span>
                  <span className="block font-medium text-fg">{place.label}</span>
                  <span className="block text-xs text-fg-subtle">{place.detail}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-fg-subtle">
            Messages sent through the contact form land in the{" "}
            <Link href="/admin/messages" className="text-link underline-offset-4 hover:underline">
              inbox
            </Link>
            .
          </p>
        </FormSection>
      }
    >
      {loadError ? (
        <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-fg">
          {loadError}
        </p>
      ) : !saved ? (
        <p role="status" className="flex items-start gap-3 rounded-md border border-info/40 bg-info/10 px-4 py-3 text-sm text-fg">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-info" strokeWidth={1.75} />
          Nothing has been saved yet, so the site shows the built-in defaults below. Check them and save.
        </p>
      ) : null}

      <FormSection title="Contact details">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput
            label="Email"
            type="email"
            required
            autoComplete="off"
            value={values.email}
            onChange={setter("email")}
            error={error("email")}
            placeholder="hello@melophilenp.com"
          />
          <TextInput
            label="Phone"
            type="tel"
            required
            value={values.phone}
            onChange={setter("phone")}
            error={error("phone")}
            maxLength={40}
            placeholder="+977 1-5550123"
          />
        </div>
        <TextArea
          label="Address"
          required
          rows={2}
          value={values.address}
          onChange={setter("address")}
          error={error("address")}
          maxLength={300}
          placeholder="Jhamsikhel Marg, Lalitpur 44600, Nepal"
        />
        <TextInput
          label="Office hours"
          optional
          value={values.officeHours}
          onChange={setter("officeHours")}
          error={error("officeHours")}
          maxLength={200}
          placeholder="Sun–Fri, 10:00–18:00 NPT"
        />
      </FormSection>

      <FormSection title="Map" description="Optional. Shown on the contact page.">
        <TextArea
          label="Map embed"
          optional
          mono
          rows={3}
          hint="In Google Maps: Share → Embed a map → Copy HTML, then paste it here. The whole <iframe> snippet or just its link both work."
          value={values.mapEmbedUrl}
          onChange={(value) => set("mapEmbedUrl", extractIframeSrc(value))}
          error={error("mapEmbedUrl")}
          placeholder="https://www.google.com/maps/embed?pb=…"
        />
        {showMap ? (
          <div className="overflow-hidden rounded-md border border-line bg-surface">
            <iframe
              key={mapUrl}
              src={mapUrl}
              title="Map preview"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="block h-60 w-full border-0"
            />
          </div>
        ) : mapUrl ? null : (
          <p className="flex items-center gap-2 text-xs text-fg-subtle">
            <MapPin aria-hidden className="size-3.5" strokeWidth={1.75} />
            No map: the contact page shows the address only.
          </p>
        )}
      </FormSection>

      <FormSection title="Social profiles" description="Shown in the footer and on the contact page, in this order.">
        <SocialLinksField value={values.socialLinks} onChange={setter("socialLinks")} errorFor={error} label="Links" />
      </FormSection>
    </FormShell>
  );
}
