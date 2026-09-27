"use client";

import { ArrowUpRight, Info } from "lucide-react";
import {
  ButtonLink,
  FormSection,
  FormShell,
  ImageField,
  NumberInput,
  RefMultiSelect,
  Repeater,
  TextArea,
  TextInput,
  useAdminForm,
  type RefOption,
} from "@/components/admin";
import { withAccent } from "@/components/home/emphasis";
import { cn, formatDate } from "@/lib/utils";
import type { HeroCta, HomepageSettingsDTO, MediaRef } from "@/types/content";
import { saveHomepageSettings } from "./actions";

interface StatRow {
  label: string;
  value: number | undefined;
  suffix: string;
}

interface HomepageFormValues {
  heroHeadline: string;
  heroSubcopy: string;
  heroImage: MediaRef;
  heroCtas: HeroCta[];
  impactStats: StatRow[];
  featuredArticleIds: string[];
  featuredArtistIds: string[];
}

function toValues(s: HomepageSettingsDTO): HomepageFormValues {
  return {
    heroHeadline: s.heroHeadline,
    heroSubcopy: s.heroSubcopy,
    heroImage: s.heroImage ?? { url: "" },
    heroCtas: s.heroCtas.map((c) => ({ label: c.label, href: c.href })),
    impactStats: s.impactStats.map((stat) => ({ label: stat.label, value: stat.value, suffix: stat.suffix ?? "" })),
    featuredArticleIds: s.featuredArticleIds,
    featuredArtistIds: s.featuredArtistIds,
  };
}

const LINK_SUGGESTIONS = ["/news", "/artists", "/services", "/contact"];
const MAX_CTAS = 3;
const MAX_STATS = 6;
const MAX_PICKS = 12;

function formatStatValue(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
}

export interface HomepageFormProps {
  settings: HomepageSettingsDTO;
  /** False when nothing is stored yet (the form starts from the site defaults). */
  saved: boolean;
  articleOptions: RefOption[];
  artistOptions: RefOption[];
  /** How many articles / artists the homepage shows. */
  articleCount: number;
  artistCount: number;
  loadError?: string;
}

export function HomepageForm({
  settings,
  saved,
  articleOptions,
  artistOptions,
  articleCount,
  artistCount,
  loadError,
}: HomepageFormProps) {
  const form = useAdminForm({
    initial: toValues(settings),
    action: (values) => saveHomepageSettings(values),
  });
  const { values, setter, error } = form;
  const ctas = values.heroCtas.filter((c) => c.label.trim());
  const stats = values.impactStats.filter((s) => s.label.trim());

  return (
    <FormShell
      title="Homepage"
      description="The hero, the impact numbers and the articles and artists featured on the landing page."
      meta={saved && settings.updatedAt ? `Last updated ${formatDate(settings.updatedAt, "medium")}` : undefined}
      backHref="/admin"
      backLabel="Dashboard"
      form={form}
      submitLabel="Save homepage"
      headerActions={
        <ButtonLink
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          variant="ghost"
          size="sm"
          icon={<ArrowUpRight aria-hidden className="size-4" strokeWidth={1.75} />}
        >
          View homepage
        </ButtonLink>
      }
      aside={
        <FormSection title="Hero image" description="Optional. Without one, the hero shows the Melophile record graphic.">
          <ImageField
            value={values.heroImage}
            onChange={setter("heroImage")}
            folder="/melophile/home"
            aspect="aspect-[4/5]"
            error={error("heroImage.url") ?? error("heroImage")}
            altError={error("heroImage.alt")}
          />
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
          Nothing has been saved yet, so the homepage uses the built-in defaults shown here. Save once to take control.
        </p>
      ) : null}

      <FormSection title="Hero" description="The first thing visitors see.">
        <TextInput
          label="Headline"
          required
          hint={
            <>
              Wrap one word in asterisks to accent it, e.g. <code className="font-mono text-fg-muted">The sound of *Nepal*</code>.
              Without asterisks, “Nepal” / “Nepali” is accented automatically.
            </>
          }
          value={values.heroHeadline}
          onChange={setter("heroHeadline")}
          error={error("heroHeadline")}
          maxLength={160}
          showCount
        />
        <TextArea
          label="Subcopy"
          optional
          rows={3}
          value={values.heroSubcopy}
          onChange={setter("heroSubcopy")}
          error={error("heroSubcopy")}
          maxLength={400}
          showCount
        />
        <Repeater<HeroCta>
          label="Buttons"
          name="heroCtas"
          hint="The first button is the primary (magenta) one."
          items={values.heroCtas}
          onChange={setter("heroCtas")}
          createItem={() => ({ label: "", href: "" })}
          addLabel="Add button"
          emptyText="No buttons — the hero shows only the headline and subcopy."
          maxItems={MAX_CTAS}
          error={error("heroCtas")}
          compact
          renderItem={(cta, row) => (
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
              <TextInput
                label="Label"
                required
                value={cta.label}
                onChange={(label) => row.update({ label })}
                error={error(`${row.path}.label`)}
                maxLength={40}
                placeholder="Read the latest"
              />
              <TextInput
                label="Link"
                required
                value={cta.href}
                onChange={(href) => row.update({ href: href.trim() })}
                error={error(`${row.path}.href`)}
                suggestions={LINK_SUGGESTIONS}
                placeholder="/news or https://…"
              />
            </div>
          )}
        />

        <figure className="space-y-2">
          <figcaption className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-fg-subtle">Preview</figcaption>
          <div className="space-y-3 rounded-sm border border-line bg-bg px-5 py-6">
            <p className="font-display text-2xl leading-[1.05] font-extrabold tracking-tight text-balance text-fg sm:text-3xl [&_em]:font-serif [&_em]:font-normal [&_em]:text-highlight">
              {values.heroHeadline.trim() ? withAccent(values.heroHeadline) : <span className="text-fg-subtle">Your headline</span>}
            </p>
            {values.heroSubcopy.trim() ? <p className="max-w-prose text-sm text-fg-muted">{values.heroSubcopy}</p> : null}
            {ctas.length > 0 ? (
              <p className="flex flex-wrap gap-2 pt-1">
                {ctas.map((cta, i) => (
                  <span
                    key={`${cta.label}-${i}`}
                    className={cn(
                      "inline-flex items-center rounded-pill px-4 py-2 text-xs font-semibold",
                      i === 0 ? "bg-accent text-accent-fg" : "border border-line-strong text-fg",
                    )}
                  >
                    {cta.label}
                  </span>
                ))}
              </p>
            ) : null}
          </div>
        </figure>
      </FormSection>

      <FormSection title="Impact numbers" description="The “By the numbers” band. Leave it empty to hide the section.">
        <Repeater<StatRow>
          label="Stats"
          name="impactStats"
          items={values.impactStats}
          onChange={setter("impactStats")}
          createItem={() => ({ label: "", value: undefined, suffix: "" })}
          addLabel="Add stat"
          emptyText="No stats — the section is hidden."
          maxItems={MAX_STATS}
          error={error("impactStats")}
          compact
          renderItem={(stat, row) => (
            <div className="grid grid-cols-[minmax(0,1fr)_5rem] gap-3 sm:grid-cols-[8rem_5rem_minmax(0,1fr)]">
              <NumberInput
                label="Value"
                required
                min={0}
                value={stat.value}
                onChange={(value) => row.update({ value })}
                error={error(`${row.path}.value`)}
                placeholder="120"
              />
              <TextInput
                label="Suffix"
                optional
                value={stat.suffix}
                onChange={(suffix) => row.update({ suffix })}
                error={error(`${row.path}.suffix`)}
                maxLength={8}
                placeholder="+"
              />
              <TextInput
                label="Label"
                required
                className="col-span-2 sm:col-span-1"
                value={stat.label}
                onChange={(label) => row.update({ label })}
                error={error(`${row.path}.label`)}
                maxLength={60}
                placeholder="Artists supported"
              />
            </div>
          )}
        />
        {stats.length > 0 ? (
          <figure className="space-y-2">
            <figcaption className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-fg-subtle">Preview</figcaption>
            <dl className="flex flex-wrap gap-px overflow-hidden rounded-sm border border-line bg-line">
              {stats.map((stat, i) => (
                <div key={`${stat.label}-${i}`} className="flex flex-1 basis-36 flex-col-reverse gap-1 bg-bg px-4 py-4">
                  <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-fg-subtle">{stat.label}</dt>
                  <dd className="font-display text-3xl leading-none font-extrabold tracking-tight tabular-nums text-fg">
                    {formatStatValue(stat.value)}
                    {stat.suffix ? <span className="text-accent">{stat.suffix}</span> : null}
                  </dd>
                </div>
              ))}
            </dl>
          </figure>
        ) : null}
      </FormSection>

      <FormSection title="Featured on the homepage" description="Search to add, then use the arrows to set the order.">
        <RefMultiSelect
          label="Featured articles"
          hint={`Shown first in the news section, in this order; the rest of the ${articleCount} slots fill with the latest articles. Drafts and scheduled articles are skipped until they go live.`}
          placeholder="Search articles…"
          options={articleOptions}
          value={values.featuredArticleIds}
          onChange={setter("featuredArticleIds")}
          maxItems={MAX_PICKS}
          error={error("featuredArticleIds")}
        />
        <RefMultiSelect
          label="Featured artists"
          hint={`When set, only these artists are shown (up to ${artistCount}), in this order. Leave empty to show artists marked “Featured”, topped up with others. Drafts are skipped.`}
          placeholder="Search artists…"
          options={artistOptions}
          value={values.featuredArtistIds}
          onChange={setter("featuredArtistIds")}
          maxItems={MAX_PICKS}
          error={error("featuredArtistIds")}
        />
      </FormSection>
    </FormShell>
  );
}
