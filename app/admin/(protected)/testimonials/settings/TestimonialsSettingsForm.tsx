"use client";

import { ArrowUpRight } from "lucide-react";
import { ButtonLink, FormSection, FormShell, NumberInput, TextInput, Toggle, useAdminForm } from "@/components/admin";
import {
  PageHeaderSection,
  PageSeoSection,
  PageSettingsNotice,
  PageVisibilitySection,
  toPageCommonValues,
  type PageCommonSetter,
  type PageCommonValues,
} from "@/components/admin/PageSettingsSections";
import { PAGE_PATHS, TESTIMONIALS_HOME_LIMIT_MAX } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { TestimonialsPageSettingsDTO } from "@/types/content";
import { saveTestimonialsPageSettings } from "./actions";

interface TestimonialsSettingsValues extends PageCommonValues {
  homepageLimit: number | undefined;
  ctaEnabled: boolean;
  ctaLabel: string;
  ctaHref: string;
}

function toValues(settings: TestimonialsPageSettingsDTO): TestimonialsSettingsValues {
  return {
    ...toPageCommonValues(settings),
    homepageLimit: settings.homepageLimit,
    ctaEnabled: settings.ctaEnabled,
    ctaLabel: settings.ctaLabel,
    ctaHref: settings.ctaHref,
  };
}

const LINK_SUGGESTIONS = ["/contact", "/services", "/artists", "/news"];

export interface TestimonialsSettingsFormProps {
  settings: TestimonialsPageSettingsDTO;
  /** False when nothing is stored yet (the form starts from the defaults). */
  saved: boolean;
  loadError?: string;
}

export function TestimonialsSettingsForm({ settings, saved, loadError }: TestimonialsSettingsFormProps) {
  const form = useAdminForm({
    initial: toValues(settings),
    action: (values) => saveTestimonialsPageSettings(values),
  });
  const { values, setter, error } = form;
  const set = form.set as PageCommonSetter;
  const path = PAGE_PATHS.testimonials;

  return (
    <FormShell
      title="Testimonials page"
      description={`The public page at ${path}: its header, the closing call to action, the homepage carousel and whether the page is live.`}
      meta={saved && settings.updatedAt ? `Last updated ${formatDate(settings.updatedAt, "medium")}` : undefined}
      backHref="/admin/testimonials"
      backLabel="Testimonials"
      form={form}
      submitLabel="Save page settings"
      headerActions={
        settings.enabled ? (
          <ButtonLink
            href={path}
            target="_blank"
            rel="noopener noreferrer"
            variant="ghost"
            size="sm"
            icon={<ArrowUpRight aria-hidden className="size-4" strokeWidth={1.75} />}
          >
            View page
          </ButtonLink>
        ) : null
      }
      aside={<PageVisibilitySection values={values} set={set} error={error} path={path} />}
    >
      <PageSettingsNotice saved={saved} loadError={loadError} />

      <PageHeaderSection values={values} set={set} error={error} />

      <FormSection
        title="Call to action"
        description="A closing band at the bottom of the page with one button. Featured quotes (★ in the list) are shown large at the top."
      >
        <Toggle
          label="Show the call to action"
          description="“Your story could be next.” with your button."
          checked={values.ctaEnabled}
          onChange={setter("ctaEnabled")}
        />
        {values.ctaEnabled ? (
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <TextInput
              label="Button label"
              required
              value={values.ctaLabel}
              onChange={setter("ctaLabel")}
              error={error("ctaLabel")}
              maxLength={40}
              placeholder="Work with us"
            />
            <TextInput
              label="Button link"
              required
              hint="An internal path such as /contact, or a full https:// URL."
              value={values.ctaHref}
              onChange={(value) => form.set("ctaHref", value.trim())}
              error={error("ctaHref")}
              suggestions={LINK_SUGGESTIONS}
              placeholder="/contact"
            />
          </div>
        ) : null}
      </FormSection>

      <FormSection title="Homepage carousel" description="The testimonials section on the homepage.">
        <NumberInput
          label="Testimonials in the carousel"
          required
          compact
          min={1}
          max={TESTIMONIALS_HOME_LIMIT_MAX}
          hint={`1–${TESTIMONIALS_HOME_LIMIT_MAX}, lowest order first. While the page is live, the section links to “All testimonials →”.`}
          value={values.homepageLimit}
          onChange={setter("homepageLimit")}
          error={error("homepageLimit")}
        />
      </FormSection>

      <PageSeoSection values={values} set={set} error={error} folder="/melophile/pages" />
    </FormShell>
  );
}
