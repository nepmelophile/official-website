"use client";

import { useId } from "react";
import Link from "next/link";
import { ArrowUpRight, Mic2, Music, Newspaper, Pencil } from "lucide-react";
import {
  EmbedUrlInput,
  Field,
  FormSection,
  FormShell,
  ImageField,
  NumberInput,
  RefMultiSelect,
  StatusBadge,
  TextInput,
  Toggle,
  useAdminForm,
  type RefOption,
} from "@/components/admin";
import type { TrendingRefOptions } from "@/lib/admin/queries/trending";
import { TRENDING_TYPE_LABELS, TRENDING_TYPES } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import type { MediaRef, TrendingItemDTO, TrendingType } from "@/types/content";
import { createTrendingItem, deleteTrendingItem, updateTrendingItem } from "./actions";
import {
  buildRefLookup,
  describeArticleOption,
  describeArtistOption,
  linkedDisplay,
  refKindFor,
  resolveTrending,
  type TrendingDraft,
} from "./resolve";
import { TrendingPreview } from "./TrendingPreview";

interface TrendingFormValues {
  type: TrendingType;
  refId: string;
  rank: number | undefined;
  manualOverride: boolean;
  active: boolean;
  title: string;
  subtitle: string;
  image: MediaRef;
  href: string;
  embedUrl: string;
}

export interface TrendingFormDefaults {
  type?: TrendingType;
  refId?: string;
  rank?: number;
}

function toValues(item: TrendingItemDTO | undefined, defaults: TrendingFormDefaults): TrendingFormValues {
  return {
    type: item?.type ?? defaults.type ?? "artist",
    refId: item?.refId ?? defaults.refId ?? "",
    rank: item?.rank ?? defaults.rank ?? 1,
    manualOverride: item?.manualOverride ?? false,
    active: item?.active ?? true,
    title: item?.title ?? "",
    subtitle: item?.subtitle ?? "",
    image: item?.image ?? { url: "" },
    href: item?.href ?? "",
    embedUrl: item?.embedUrl ?? "",
  };
}

/** Whether the manual fields are in play (not linked, or linked with an override). */
function usesManualFields(values: TrendingFormValues): boolean {
  return !values.refId || values.manualOverride;
}

/**
 * The payload actually saved: when linked without an override the manual fields are cleared
 * (the server does the same), so what you see in the preview is what gets stored.
 */
function toPayload(values: TrendingFormValues): TrendingFormValues {
  if (usesManualFields(values)) return values;
  return { ...values, title: "", subtitle: "", image: { url: "" }, href: "", embedUrl: "" };
}

function toDraft(values: TrendingFormValues): TrendingDraft {
  const payload = toPayload(values);
  return {
    type: payload.type,
    refId: payload.refId || undefined,
    manualOverride: payload.manualOverride,
    active: payload.active,
    title: payload.title,
    subtitle: payload.subtitle,
    image: payload.image,
    href: payload.href,
    embedUrl: payload.embedUrl,
  };
}

const TYPE_META: Record<TrendingType, { icon: typeof Mic2; description: string }> = {
  artist: { icon: Mic2, description: "An artist on the rise" },
  song: { icon: Music, description: "A track, with a Listen button" },
  update: { icon: Newspaper, description: "A news story or announcement" },
};

function TypePicker({ value, onChange, error }: { value: TrendingType; onChange: (type: TrendingType) => void; error?: string }) {
  const baseId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const fieldId = `type${baseId}`;
  return (
    <Field id={fieldId} as="group" label="Type" required error={error}>
      <div className="grid gap-2 sm:grid-cols-3">
        {TRENDING_TYPES.map((type) => {
          const { icon: Icon, description } = TYPE_META[type];
          const selected = value === type;
          return (
            <label
              key={type}
              className={cn(
                "flex min-h-11 cursor-pointer items-start gap-3 rounded-sm border px-3 py-2.5 transition-colors duration-150 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-highlight",
                selected ? "border-accent bg-vermilion-900/40 text-fg" : "border-line bg-surface-raised text-fg-muted hover:border-line-strong hover:text-fg",
              )}
            >
              <input
                type="radio"
                name={`${fieldId}-type`}
                value={type}
                checked={selected}
                onChange={() => onChange(type)}
                className="sr-only"
              />
              <Icon aria-hidden className={cn("mt-0.5 size-4 shrink-0", selected ? "text-vermilion-300" : "text-fg-subtle")} strokeWidth={1.75} />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{TRENDING_TYPE_LABELS[type]}</span>
                <span className="block text-xs text-fg-subtle">{description}</span>
              </span>
            </label>
          );
        })}
      </div>
    </Field>
  );
}

const LINK_SUGGESTIONS = ["/news", "/artists", "/services", "/contact"];

export interface TrendingFormProps {
  item?: TrendingItemDTO;
  options: TrendingRefOptions;
  /** Prefill for new items (e.g. /admin/trending/new?type=song&ref=<artistId>). */
  defaults?: TrendingFormDefaults;
  /** Shown above the form when the pickers could not be loaded. */
  loadError?: string;
}

export function TrendingForm({ item, options, defaults = {}, loadError }: TrendingFormProps) {
  const isNew = !item;
  const form = useAdminForm({
    initial: toValues(item, defaults),
    action: (values) => {
      const payload = toPayload(values);
      return item ? updateTrendingItem(item.id, payload) : createTrendingItem(payload);
    },
    redirectTo: isNew ? (data) => (data ? `/admin/trending/${data.id}` : undefined) : undefined,
  });
  const { values, set, setter, error } = form;

  const lookup = buildRefLookup(options);
  const kind = refKindFor(values.type);
  const linked = Boolean(values.refId);
  const showManual = usesManualFields(values);
  const resolution = resolveTrending(toDraft(values), lookup);
  const linkedValues = linked ? linkedDisplay(values.type, values.refId, lookup) : undefined;
  const linkedPublicHref = linkedValues?.href;
  const inherited = values.manualOverride ? linkedValues : undefined;

  const refOptions: RefOption[] =
    kind === "article"
      ? options.articles.map((a) => ({ id: a.id, label: a.title, description: describeArticleOption(a) }))
      : options.artists.map((a) => ({ id: a.id, label: a.name, description: describeArtistOption(a, values.type) }));

  function changeType(next: TrendingType) {
    if (next === values.type) return;
    set("type", next);
    // Artist ↔ song keep the linked artist; switching to/from "update" needs a different collection.
    if (refKindFor(next) !== kind && values.refId) set("refId", "");
  }

  const linkedInfo = resolution.linked;
  const refHint =
    kind === "article"
      ? "Optional. The card uses the article’s headline, category and image."
      : values.type === "song"
        ? "Optional. The card plays the artist’s latest release."
        : "Optional. The card uses the artist’s name, genre and photo.";
  const itemName = item ? (resolution.display.title ?? linkedInfo?.label ?? "Trending item") : "";

  return (
    <FormShell
      title={isNew ? "New trending item" : itemName}
      description={
        isNew ? "Pick what’s hot right now: link an artist or article, or build a custom card." : undefined
      }
      meta={item ? `${TRENDING_TYPE_LABELS[item.type]} · last updated ${formatDate(item.updatedAt, "medium")}` : undefined}
      backHref="/admin/trending"
      backLabel="Trending"
      form={form}
      submitLabel={isNew ? "Add to trending" : "Save changes"}
      deleteProps={
        item
          ? {
              action: deleteTrendingItem,
              id: item.id,
              itemLabel: itemName,
              label: "Remove",
              description: "The linked artist or article is not affected.",
              redirectTo: "/admin/trending",
            }
          : undefined
      }
      aside={
        <>
          <FormSection title="Visibility">
            <Toggle
              label="Active"
              description="Show this item in the trending strip"
              checked={values.active}
              onChange={setter("active")}
            />
            <NumberInput
              label="Position"
              required
              hint="1 = first. Other items shift to make room."
              compact
              min={1}
              value={values.rank}
              onChange={setter("rank")}
              error={error("rank")}
            />
          </FormSection>
          <FormSection title="Live preview" description="What visitors will see, updated as you edit.">
            <TrendingPreview resolution={resolution} type={values.type} rank={values.rank ?? 1} />
          </FormSection>
        </>
      }
    >
      {loadError ? (
        <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-fg">
          {loadError}
        </p>
      ) : null}

      <FormSection title="What’s trending">
        <TypePicker value={values.type} onChange={changeType} error={error("type")} />

        <div className="space-y-2">
          <RefMultiSelect
            label={kind === "article" ? "Linked article" : "Linked artist"}
            hint={
              refOptions.length === 0
                ? kind === "article"
                  ? "No articles yet. Leave this empty for a custom update."
                  : "No artists yet. Leave this empty for a custom item."
                : refHint
            }
            placeholder={
              linked
                ? `Search to replace…`
                : kind === "article"
                  ? "Search articles by headline or category…"
                  : values.type === "song"
                    ? "Search artists or their latest release…"
                    : "Search artists by name, genre or city…"
            }
            options={refOptions}
            // Single selection: picking another option replaces the current one.
            value={values.refId ? [values.refId] : []}
            onChange={(ids) => set("refId", ids[ids.length - 1] ?? "")}
            reorderable={false}
            error={error("refId")}
          />
          {linkedInfo ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
              {linkedInfo.state === "published" ? (
                <StatusBadge status="published" />
              ) : linkedInfo.state === "scheduled" ? (
                <StatusBadge status="featured">Scheduled</StatusBadge>
              ) : linkedInfo.state === "draft" ? (
                <StatusBadge status="draft" />
              ) : (
                <StatusBadge status="new">Deleted</StatusBadge>
              )}
              {linkedInfo.state !== "missing" ? (
                <Link
                  href={linkedInfo.adminHref}
                  className="inline-flex items-center gap-1 text-vermilion-300 underline-offset-4 hover:underline"
                >
                  <Pencil aria-hidden className="size-3.5" strokeWidth={1.75} />
                  Edit {linkedInfo.kind}
                </Link>
              ) : null}
              {linkedInfo.state === "published" && linkedPublicHref ? (
                <a
                  href={linkedPublicHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-fg-muted underline-offset-4 hover:text-fg hover:underline"
                >
                  View on site
                  <ArrowUpRight aria-hidden className="size-3.5" strokeWidth={1.75} />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </FormSection>

      <FormSection
        title="Display"
        description={
          linked
            ? "By default the card mirrors the linked item, so edits there show up here automatically."
            : "Nothing is linked, so this is a custom card: fill in what it shows."
        }
      >
        {linked ? (
          <Toggle
            label="Override display"
            description="Use your own title, image or link. Fields left blank keep the linked values."
            checked={values.manualOverride}
            onChange={setter("manualOverride")}
          />
        ) : null}

        {showManual ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <TextInput
                label="Title"
                required={!linked}
                optional={linked}
                value={values.title}
                onChange={setter("title")}
                error={error("title")}
                maxLength={150}
                placeholder={inherited?.title ?? (values.type === "song" ? "Song title" : values.type === "update" ? "Headline" : "Artist name")}
              />
              <TextInput
                label="Subtitle"
                optional
                value={values.subtitle}
                onChange={setter("subtitle")}
                error={error("subtitle")}
                maxLength={150}
                placeholder={inherited?.subtitle ?? (values.type === "song" ? "Artist name" : values.type === "update" ? "Category" : "Genre")}
              />
            </div>
            <TextInput
              label="Link"
              optional
              hint="An internal path such as /artists/aakash-rai, or a full https:// URL (opens in a new tab)."
              value={values.href}
              onChange={setter("href")}
              error={error("href")}
              suggestions={LINK_SUGGESTIONS}
              placeholder={inherited?.href ?? "/news/… or https://…"}
            />
            {values.type === "song" || values.embedUrl ? (
              <EmbedUrlInput
                label="Player link"
                optional
                value={values.embedUrl}
                onChange={setter("embedUrl")}
                error={error("embedUrl")}
                placeholder={inherited?.embedUrl}
              />
            ) : null}
            <ImageField
              label="Image"
              hint={linked ? "Leave empty to use the linked image. Square images work best." : "Square images work best."}
              value={values.image}
              onChange={setter("image")}
              folder="/melophile/trending"
              aspect="aspect-square"
              error={error("image.url") ?? error("image")}
              altError={error("image.alt")}
            />
          </>
        ) : (
          <p className="rounded-sm border border-dashed border-line px-4 py-3 text-sm text-fg-muted">
            The card shows the linked {kind} as is. Turn on <strong className="font-semibold text-fg">Override display</strong>{" "}
            to change its title, image or link{values.type === "song" ? ", or to play a different track" : ""}.
          </p>
        )}
      </FormSection>
    </FormShell>
  );
}
