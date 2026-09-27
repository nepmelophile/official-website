"use client";

import { ArrowUpRight } from "lucide-react";
import { ButtonLink, FormSection, FormShell, NumberInput, Toggle, useAdminForm } from "@/components/admin";
import {
  PageHeaderSection,
  PageSeoSection,
  PageSettingsNotice,
  PageVisibilitySection,
  toPageCommonValues,
  type PageCommonSetter,
  type PageCommonValues,
} from "@/components/admin/PageSettingsSections";
import { PAGE_PATHS, TRENDING_HOME_LIMIT_MAX, TRENDING_PAGE_LIMIT_MAX } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { TrendingPageSettingsDTO } from "@/types/content";
import { saveTrendingPageSettings } from "./actions";

interface TrendingSettingsValues extends PageCommonValues {
  pageLimit: number | undefined;
  homepageLimit: number | undefined;
  showTypeFilter: boolean;
}

function toValues(settings: TrendingPageSettingsDTO): TrendingSettingsValues {
  return {
    ...toPageCommonValues(settings),
    pageLimit: settings.pageLimit,
    homepageLimit: settings.homepageLimit,
    showTypeFilter: settings.showTypeFilter,
  };
}

export interface TrendingSettingsFormProps {
  settings: TrendingPageSettingsDTO;
  /** False when nothing is stored yet (the form starts from the defaults). */
  saved: boolean;
  loadError?: string;
}

export function TrendingSettingsForm({ settings, saved, loadError }: TrendingSettingsFormProps) {
  const form = useAdminForm({
    initial: toValues(settings),
    action: (values) => saveTrendingPageSettings(values),
  });
  const { values, setter, error } = form;
  const set = form.set as PageCommonSetter;
  const path = PAGE_PATHS.trending;

  return (
    <FormShell
      title="Trending page"
      description={`The public chart at ${path}: its header, how many entries it lists, the homepage strip and whether the page is live.`}
      meta={saved && settings.updatedAt ? `Last updated ${formatDate(settings.updatedAt, "medium")}` : undefined}
      backHref="/admin/trending"
      backLabel="Trending"
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

      <FormSection title="Chart" description="Items come from the Trending list, in its order. Switched-off items and links to drafts are skipped.">
        <NumberInput
          label="Entries on the page"
          required
          compact
          min={1}
          max={TRENDING_PAGE_LIMIT_MAX}
          hint={`How many items ${path} lists (1–${TRENDING_PAGE_LIMIT_MAX}). The first one gets the big feature.`}
          value={values.pageLimit}
          onChange={setter("pageLimit")}
          error={error("pageLimit")}
        />
        <Toggle
          label="Type filter"
          description="All / Artists / Songs / Updates chips above the chart (shown when the chart mixes types)."
          checked={values.showTypeFilter}
          onChange={setter("showTypeFilter")}
        />
      </FormSection>

      <FormSection title="Homepage strip" description="The ● TRENDING ticker under the homepage hero.">
        <NumberInput
          label="Items in the strip"
          required
          compact
          min={1}
          max={TRENDING_HOME_LIMIT_MAX}
          hint={`1–${TRENDING_HOME_LIMIT_MAX}. While the page is live, the strip ends with a “Full chart →” link.`}
          value={values.homepageLimit}
          onChange={setter("homepageLimit")}
          error={error("homepageLimit")}
        />
      </FormSection>

      <PageSeoSection values={values} set={set} error={error} folder="/melophile/pages" />
    </FormShell>
  );
}
