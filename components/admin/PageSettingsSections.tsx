"use client";

import { Info } from "lucide-react";
import { withAccent } from "@/components/home/emphasis";
import { stripMarkdown } from "@/lib/utils";
import type { MediaRef, PageSettingsDTO } from "@/types/content";
import { FormSection } from "./FormSection";
import { ImageField } from "./ImageField";
import { TextArea, TextInput, Toggle } from "./inputs";

/*
 * Form sections shared by the managed-page editors (/admin/trending/settings and
 * /admin/testimonials/settings). Each editor keeps its own useAdminForm state (common values +
 * page-specific ones) and passes `values`, `setter` and `error` down.
 */

/** Form state for the fields every managed page has (JSON-friendly: no undefined media). */
export interface PageCommonValues {
  enabled: boolean;
  showInNav: boolean;
  navLabel: string;
  eyebrow: string;
  heading: string;
  intro: string;
  metaTitle: string;
  metaDescription: string;
  ogImage: MediaRef;
}

export function toPageCommonValues(settings: PageSettingsDTO): PageCommonValues {
  return {
    enabled: settings.enabled,
    showInNav: settings.showInNav,
    navLabel: settings.navLabel,
    eyebrow: settings.eyebrow,
    heading: settings.heading,
    intro: settings.intro,
    metaTitle: settings.metaTitle ?? "",
    metaDescription: settings.metaDescription ?? "",
    ogImage: settings.ogImage ?? { url: "" },
  };
}

/**
 * Setter for the common fields. An editor whose values extend PageCommonValues passes its
 * `form.set` cast to this type (`form.set as PageCommonSetter`): safe, since the common keys
 * have the same types in both.
 */
export type PageCommonSetter = <K extends keyof PageCommonValues>(key: K, value: PageCommonValues[K]) => void;

interface SectionProps {
  values: PageCommonValues;
  set: PageCommonSetter;
  error: (path: string) => string | undefined;
}

/** "Nothing saved yet" / "database problem" banner at the top of the editor. */
export function PageSettingsNotice({ saved, loadError }: { saved: boolean; loadError?: string }) {
  if (loadError) {
    return (
      <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-fg">
        {loadError}
      </p>
    );
  }
  if (saved) return null;
  return (
    <p role="status" className="flex items-start gap-3 rounded-md border border-info/40 bg-info/10 px-4 py-3 text-sm text-fg">
      <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-info" strokeWidth={1.75} />
      Nothing has been saved yet, so the page uses the built-in defaults shown here (live and in the menu). Save once
      to take control.
    </p>
  );
}

/** Live / menu switches and the menu label (sidebar column). */
export function PageVisibilitySection({ values, set, error, path }: SectionProps & { path: string }) {
  return (
    <FormSection title="Visibility">
      <Toggle
        label="Page is live"
        description={`Off: ${path} shows “Page not found” and disappears from the menu, the sitemap and the homepage links.`}
        checked={values.enabled}
        onChange={(value) => set("enabled", value)}
      />
      <Toggle
        label="Show in the menu"
        description={values.enabled ? "Header, mobile menu and footer." : "Only applies while the page is live."}
        checked={values.showInNav}
        onChange={(value) => set("showInNav", value)}
        disabled={!values.enabled}
      />
      <TextInput
        label="Menu label"
        required
        value={values.navLabel}
        onChange={(value) => set("navLabel", value)}
        error={error("navLabel")}
        maxLength={24}
        hint="Keep it to one or two words."
      />
    </FormSection>
  );
}

/** Eyebrow, heading and intro, with a small preview of the page header. */
export function PageHeaderSection({ values, set, error }: SectionProps) {
  const intro = stripMarkdown(values.intro);
  return (
    <FormSection title="Page header" description="The top of the page: a small label, the big heading and a short intro.">
      <TextInput
        label="Eyebrow"
        optional
        hint="Small label above the heading. Leave empty to hide it."
        value={values.eyebrow}
        onChange={(value) => set("eyebrow", value)}
        error={error("eyebrow")}
        maxLength={60}
      />
      <TextInput
        label="Heading"
        required
        hint={
          <>
            Wrap one word in asterisks to accent it, e.g. <code className="font-mono text-fg-muted">What Nepal is *playing*</code>.
          </>
        }
        value={values.heading}
        onChange={(value) => set("heading", value)}
        error={error("heading")}
        maxLength={140}
        showCount
      />
      <TextArea
        label="Intro"
        optional
        rows={4}
        hint="Plain text or simple markdown: **bold**, *italic*, [a link](https://…). Leave empty to hide it."
        value={values.intro}
        onChange={(value) => set("intro", value)}
        error={error("intro")}
        maxLength={600}
        showCount
      />
      <figure className="space-y-2">
        <figcaption className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-fg-subtle">Preview</figcaption>
        <div className="space-y-3 rounded-sm border border-line bg-bg px-5 py-6">
          {values.eyebrow.trim() ? (
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-subtle">{values.eyebrow}</p>
          ) : null}
          <p className="font-display text-2xl leading-[1.05] font-extrabold tracking-tight text-balance text-fg sm:text-3xl [&_em]:font-serif [&_em]:font-normal [&_em]:text-highlight">
            {values.heading.trim() ? withAccent(values.heading) : <span className="text-fg-subtle">Your heading</span>}
          </p>
          {intro ? <p className="max-w-prose text-sm text-fg-muted">{intro}</p> : null}
        </div>
      </figure>
    </FormSection>
  );
}

/** SEO title / description and the share image. */
export function PageSeoSection({
  values,
  set,
  error,
  folder,
}: SectionProps & { /** ImageKit folder for the share image. */ folder: string }) {
  const fallbackTitle = values.navLabel.trim() || "the menu label";
  return (
    <FormSection title="Search & sharing" description="How the page looks in Google results and when a link is shared.">
      <TextInput
        label="SEO title"
        optional
        hint={`Leave empty to use “${fallbackTitle}”. “ · Melophile” is added automatically.`}
        placeholder={values.navLabel}
        value={values.metaTitle}
        onChange={(value) => set("metaTitle", value)}
        error={error("metaTitle")}
        maxLength={70}
        showCount
      />
      <TextArea
        label="SEO description"
        optional
        rows={3}
        hint="Leave empty to use the start of the intro. Around 150 characters reads best in search results."
        value={values.metaDescription}
        onChange={(value) => set("metaDescription", value)}
        error={error("metaDescription")}
        maxLength={200}
        showCount
      />
      <ImageField
        label="Share image"
        hint="Optional. 1200×630 works best. Without one, the Melophile share card is used."
        value={values.ogImage}
        onChange={(value) => set("ogImage", value)}
        folder={folder}
        aspect="aspect-[1200/630]"
        error={error("ogImage.url") ?? error("ogImage")}
        altError={error("ogImage.alt")}
      />
    </FormSection>
  );
}
