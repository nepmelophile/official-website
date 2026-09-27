"use client";

import Image from "next/image";
import { Info } from "lucide-react";
import { FormSection, FormShell, ImageField, useAdminForm } from "@/components/admin";
import { DEFAULT_BRAND_ASSETS, LOGO_MARK_SIZE, LOGO_SIZE } from "@/lib/brand";
import { isOptimizableImageUrl } from "@/lib/images";
import { cn, formatDate } from "@/lib/utils";
import type { BrandAssetsDTO, MediaRef } from "@/types/content";
import { saveBranding } from "./actions";

type LogoKey = "logoOnDark" | "logoOnLight" | "logoMark";
type BrandingFormValues = Record<LogoKey, MediaRef>;

const EMPTY: MediaRef = { url: "", alt: "" };

/** Always-dark / always-light swatches (raw scale steps, so they don't flip with the admin theme). */
const SWATCH = { dark: "bg-ink-950 border-ink-800", light: "bg-ink-100 border-ink-200" } as const;

function LogoPreview({ media, fallback, tone, mark = false }: { media: MediaRef; fallback: MediaRef; tone: "dark" | "light"; mark?: boolean }) {
  const src = media.url.trim() || fallback.url;
  const size = mark ? LOGO_MARK_SIZE : LOGO_SIZE;
  return (
    <div className={cn("flex h-20 items-center justify-center rounded-md border px-4", SWATCH[tone])}>
      <Image
        src={src}
        alt={media.alt || fallback.alt || "Melophile"}
        width={size.width}
        height={size.height}
        unoptimized={!isOptimizableImageUrl(src)}
        className="h-10 w-auto max-w-full object-contain"
      />
    </div>
  );
}

export interface BrandingFormProps {
  stored: Partial<Record<LogoKey, MediaRef>>;
  effective: BrandAssetsDTO;
  saved: boolean;
  loadError?: string;
}

export function BrandingForm({ stored, effective, saved, loadError }: BrandingFormProps) {
  const form = useAdminForm<BrandingFormValues>({
    initial: {
      logoOnDark: stored.logoOnDark ?? EMPTY,
      logoOnLight: stored.logoOnLight ?? EMPTY,
      logoMark: stored.logoMark ?? EMPTY,
    },
    action: (values) => saveBranding(values),
  });
  const { values, setter, error } = form;

  return (
    <FormShell
      title="Branding"
      description="The Melophile logo in the site header and footer, the admin and the sign-in page. Upload to ImageKit or paste a URL; clear a field to go back to the bundled file."
      meta={saved && effective.updatedAt ? `Last updated ${formatDate(effective.updatedAt, "medium")}` : undefined}
      backHref="/admin"
      backLabel="Dashboard"
      form={form}
      submitLabel="Save logos"
      aside={
        <FormSection title="Preview" description="How each file looks where it’s used.">
          <div className="space-y-3">
            <p className="text-xs text-fg-subtle">Dark theme</p>
            <LogoPreview media={values.logoOnDark} fallback={DEFAULT_BRAND_ASSETS.logoOnDark} tone="dark" />
            <p className="text-xs text-fg-subtle">Light theme</p>
            <LogoPreview media={values.logoOnLight} fallback={DEFAULT_BRAND_ASSETS.logoOnLight} tone="light" />
            <p className="text-xs text-fg-subtle">Mark</p>
            <div className="grid grid-cols-2 gap-3">
              <LogoPreview media={values.logoMark} fallback={DEFAULT_BRAND_ASSETS.logoMark} tone="dark" mark />
              <LogoPreview media={values.logoMark} fallback={DEFAULT_BRAND_ASSETS.logoMark} tone="light" mark />
            </div>
          </div>
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
          Nothing saved yet — the site uses the bundled logo files. Upload replacements here and save.
        </p>
      ) : null}

      <FormSection title="Full logo" description="Transparent PNG or SVG, cropped tight to the artwork (no empty margins).">
        <ImageField
          label="For dark backgrounds"
          hint="Light lettering. Used in the dark theme. Check the Preview panel for the real look."
          value={values.logoOnDark}
          onChange={setter("logoOnDark")}
          folder="/melophile/brand"
          aspect="aspect-[4/1]"
          error={error("logoOnDark.url") ?? error("logoOnDark")}
          altError={error("logoOnDark.alt")}
        />
        <ImageField
          label="For light backgrounds"
          hint="Dark lettering. Used in the light theme. The field’s thumbnail uses the admin’s own background, so check the Preview panel for the real look."
          value={values.logoOnLight}
          onChange={setter("logoOnLight")}
          folder="/melophile/brand"
          aspect="aspect-[4/1]"
          error={error("logoOnLight.url") ?? error("logoOnLight")}
          altError={error("logoOnLight.alt")}
        />
      </FormSection>

      <FormSection title="Mark" description="The note symbol on its own, for compact spots such as the collapsed admin menu.">
        <ImageField
          label="Logo mark"
          value={values.logoMark}
          onChange={setter("logoMark")}
          folder="/melophile/brand"
          aspect="aspect-[4/3]"
          error={error("logoMark.url") ?? error("logoMark")}
          altError={error("logoMark.alt")}
        />
      </FormSection>
    </FormShell>
  );
}
