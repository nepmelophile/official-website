"use client";

import Link from "next/link";
import { ExternalLink, TrendingUp } from "lucide-react";
import {
  DateInput,
  EmbedUrlInput,
  FormSection,
  FormShell,
  ImageField,
  MarkdownEditor,
  MediaListField,
  NumberInput,
  RefMultiSelect,
  Repeater,
  Select,
  SlugInput,
  SocialLinksField,
  StatusSelect,
  TagInput,
  TextArea,
  TextInput,
  Toggle,
  buttonClass,
  useAdminForm,
  type RefOption,
} from "@/components/admin";
import { RELEASE_TYPE_LABELS, RELEASE_TYPES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { ArtistDTO, ArtistMedia, ContentStatus, MediaRef, ReleaseType, SocialLink } from "@/types/content";
import { createArtist, deleteArtist, updateArtist } from "./actions";

/* Form state (JSON-friendly: dates are ISO strings, blank optional values are ""). */

interface ReleaseRow {
  title: string;
  embedUrl: string;
  type: ReleaseType | "";
  releaseDate: string;
  coverImage: MediaRef;
}

interface AchievementRow {
  title: string;
  year: number | undefined;
  description: string;
}

interface ArtistFormState {
  name: string;
  slug: string;
  photo: MediaRef;
  coverImage: MediaRef;
  shortBio: string;
  bio: string;
  genres: string[];
  location: string;
  socialLinks: SocialLink[];
  releases: ReleaseRow[];
  media: ArtistMedia[];
  achievements: AchievementRow[];
  relatedArticleIds: string[];
  featured: boolean;
  order: number | undefined;
  status: ContentStatus;
}

function toState(artist?: ArtistDTO): ArtistFormState {
  return {
    name: artist?.name ?? "",
    slug: artist?.slug ?? "",
    photo: artist?.photo ?? { url: "" },
    coverImage: artist?.coverImage ?? { url: "" },
    shortBio: artist?.shortBio ?? "",
    bio: artist?.bio ?? "",
    genres: artist?.genres ?? [],
    location: artist?.location ?? "",
    socialLinks: artist?.socialLinks ?? [],
    releases: (artist?.releases ?? []).map((r) => ({
      title: r.title,
      embedUrl: r.embedUrl,
      type: r.type ?? "",
      releaseDate: r.releaseDate ?? "",
      coverImage: r.coverImage ?? { url: "" },
    })),
    media: (artist?.media ?? []).map((m) => ({ type: m.type, url: m.url, caption: m.caption ?? "", fileId: m.fileId })),
    achievements: (artist?.achievements ?? []).map((a) => ({
      title: a.title,
      year: a.year,
      description: a.description ?? "",
    })),
    relatedArticleIds: artist?.relatedArticleIds ?? [],
    featured: artist?.featured ?? false,
    order: artist?.order ?? 0,
    status: artist?.status ?? "draft",
  };
}

const RELEASE_TYPE_OPTIONS = RELEASE_TYPES.map((t) => ({ value: t, label: RELEASE_TYPE_LABELS[t] }));

const CURRENT_YEAR_HINT = "e.g. 2024";

export interface ArtistFormProps {
  /** Omit for "new artist". */
  artist?: ArtistDTO;
  /** Articles for the related-news picker. */
  articleOptions: RefOption[];
  genreSuggestions: string[];
  locationSuggestions: string[];
}

export function ArtistForm({ artist, articleOptions, genreSuggestions, locationSuggestions }: ArtistFormProps) {
  const isNew = !artist;
  const form = useAdminForm({
    initial: toState(artist),
    action: async (values: ArtistFormState) =>
      artist ? updateArtist(artist.id, values) : createArtist(values),
    redirectTo: isNew ? (data) => (data ? `/admin/artists/${data.id}` : undefined) : undefined,
  });
  const { values, setter, error } = form;

  return (
    <FormShell
      title={isNew ? "New artist" : values.name || "Untitled artist"}
      description={isNew ? "Build the portfolio: profile, releases, gallery and milestones." : undefined}
      meta={
        artist
          ? `${artist.status === "published" ? "Published" : "Draft"} · Last updated ${formatDate(artist.updatedAt, "medium")}`
          : undefined
      }
      backHref="/admin/artists"
      backLabel="Artists"
      form={form}
      submitLabel={isNew ? (values.status === "published" ? "Publish artist" : "Save draft") : "Save changes"}
      deleteProps={
        artist
          ? {
              action: deleteArtist,
              id: artist.id,
              itemLabel: artist.name,
              redirectTo: "/admin/artists",
              description: "The artist page goes offline straight away and the artist is removed from homepage picks.",
            }
          : undefined
      }
      headerActions={
        artist ? (
          <>
            <Link href={`/admin/trending/new?type=artist&ref=${artist.id}`} className={buttonClass("ghost", "sm")}>
              <TrendingUp aria-hidden className="size-3.5" strokeWidth={1.75} />
              Add to trending
            </Link>
            {artist?.status === "published" ? (
              <a
                href={`/artists/${artist.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass("secondary", "sm")}
              >
                View on site
                <ExternalLink aria-hidden className="size-3.5" strokeWidth={1.75} />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            ) : null}
          </>
        ) : undefined
      }
      aside={
        <>
          <FormSection title="Visibility">
            <StatusSelect value={values.status} onChange={setter("status")} error={error("status")} />
            <Toggle
              label="Featured"
              description="Eligible for the homepage “Featured artists” row when no picks are set in Homepage settings."
              checked={values.featured}
              onChange={setter("featured")}
              error={error("featured")}
            />
            <NumberInput
              label="Order"
              hint="Lower numbers come first on /artists."
              compact
              min={0}
              max={10000}
              value={values.order}
              onChange={setter("order")}
              error={error("order")}
            />
          </FormSection>

          <FormSection
            title="Images"
            description="Photo: a 4:5 portrait for cards and the profile. Cover: a wide 16:9 banner behind the header."
          >
            <ImageField
              label="Photo"
              required
              aspect="aspect-[4/5]"
              value={values.photo}
              onChange={setter("photo")}
              folder="/melophile/artists"
              error={error("photo.url") ?? error("photo")}
              altError={error("photo.alt")}
            />
            <ImageField
              label={
                <>
                  Cover image <span className="font-normal text-fg-subtle">(optional)</span>
                </>
              }
              aspect="aspect-[16/9]"
              value={values.coverImage}
              onChange={setter("coverImage")}
              folder="/melophile/artists"
              error={error("coverImage.url") ?? error("coverImage")}
              altError={error("coverImage.alt")}
            />
          </FormSection>
        </>
      }
    >
      <FormSection title="Profile">
        <TextInput
          label="Name"
          required
          value={values.name}
          onChange={setter("name")}
          error={error("name")}
          maxLength={120}
          showCount
          placeholder="e.g. Sajjan Raj Vaidya"
        />
        <SlugInput source={values.name} prefix="/artists/" value={values.slug} onChange={setter("slug")} error={error("slug")} />
        <TextArea
          label="Short bio"
          required
          rows={3}
          value={values.shortBio}
          onChange={setter("shortBio")}
          error={error("shortBio")}
          maxLength={300}
          showCount
          hint="One or two lines for cards and search results."
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TagInput
            label="Genres"
            value={values.genres}
            onChange={setter("genres")}
            suggestions={genreSuggestions}
            maxItems={10}
            maxLength={40}
            error={error("genres")}
            placeholder="e.g. Folk Pop"
            hint="Used for the genre filter on /artists. Up to 10."
          />
          <TextInput
            label="Location"
            optional
            value={values.location}
            onChange={setter("location")}
            error={error("location")}
            maxLength={120}
            suggestions={locationSuggestions}
            placeholder="e.g. Kathmandu"
          />
        </div>
        <MarkdownEditor label="Biography" value={values.bio} onChange={setter("bio")} error={error("bio")} rows={14} />
      </FormSection>

      <FormSection title="Around the web">
        <SocialLinksField value={values.socialLinks} onChange={setter("socialLinks")} errorFor={error} />
      </FormSection>

      <FormSection title="Releases" description="Singles, EPs and albums with a Spotify, YouTube or SoundCloud player.">
        <Repeater<ReleaseRow>
          label="Discography"
          name="releases"
          items={values.releases}
          onChange={setter("releases")}
          createItem={() => ({ title: "", embedUrl: "", type: "", releaseDate: "", coverImage: { url: "" } })}
          itemTitle={(item) => {
            const meta = [item.type ? RELEASE_TYPE_LABELS[item.type] : null, formatDate(item.releaseDate, "month-year") || null]
              .filter(Boolean)
              .join(" · ");
            return `${item.title || "Untitled release"}${meta ? ` — ${meta}` : ""}`;
          }}
          addLabel="Add release"
          emptyText="No releases yet."
          maxItems={50}
          error={error("releases")}
          hint="Newest first reads best; use the arrows to reorder."
          renderItem={(item, row) => (
            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_13rem]">
              <div className="min-w-0 space-y-4">
                <TextInput
                  label="Title"
                  required
                  value={item.title}
                  onChange={(title) => row.update({ title })}
                  error={error(`${row.path}.title`)}
                  maxLength={150}
                />
                <EmbedUrlInput
                  label="Player link"
                  required
                  value={item.embedUrl}
                  onChange={(embedUrl) => row.update({ embedUrl: embedUrl.trim() })}
                  error={error(`${row.path}.embedUrl`)}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Select<ReleaseType>
                    label="Type"
                    optional
                    value={item.type}
                    onChange={(type) => row.update({ type })}
                    options={RELEASE_TYPE_OPTIONS}
                    placeholder="—"
                    error={error(`${row.path}.type`)}
                  />
                  <DateInput
                    label="Release date"
                    optional
                    mode="date"
                    value={item.releaseDate}
                    onChange={(releaseDate) => row.update({ releaseDate })}
                    error={error(`${row.path}.releaseDate`)}
                  />
                </div>
              </div>
              <ImageField
                label={
                  <>
                    Cover art <span className="font-normal text-fg-subtle">(optional)</span>
                  </>
                }
                aspect="aspect-square"
                showAlt={false}
                value={item.coverImage}
                onChange={(coverImage) => row.update({ coverImage })}
                folder="/melophile/releases"
                error={error(`${row.path}.coverImage.url`) ?? error(`${row.path}.coverImage`)}
              />
            </div>
          )}
        />
      </FormSection>

      <FormSection title="Photos & videos" description="A gallery of press shots and YouTube videos on the artist page.">
        <MediaListField value={values.media} onChange={setter("media")} errorFor={error} folder="/melophile/artists" />
      </FormSection>

      <FormSection title="Achievements" description="Awards, milestones and notable shows, shown as a timeline.">
        <Repeater<AchievementRow>
          label="Milestones"
          name="achievements"
          items={values.achievements}
          onChange={setter("achievements")}
          createItem={() => ({ title: "", year: undefined, description: "" })}
          itemTitle={(item) => [item.year, item.title || "New achievement"].filter(Boolean).join(" — ")}
          addLabel="Add achievement"
          emptyText="No achievements yet."
          maxItems={50}
          error={error("achievements")}
          renderItem={(item, row) => (
            <>
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
                <TextInput
                  label="Title"
                  required
                  value={item.title}
                  onChange={(title) => row.update({ title })}
                  error={error(`${row.path}.title`)}
                  maxLength={150}
                  placeholder="e.g. Best Pop Song — Hits FM Music Awards"
                />
                <NumberInput
                  label="Year"
                  optional
                  min={1900}
                  max={2100}
                  placeholder={CURRENT_YEAR_HINT}
                  value={item.year}
                  onChange={(year) => row.update({ year })}
                  error={error(`${row.path}.year`)}
                />
              </div>
              <TextArea
                label="Description"
                optional
                rows={2}
                value={item.description}
                onChange={(description) => row.update({ description })}
                error={error(`${row.path}.description`)}
                maxLength={500}
              />
            </>
          )}
        />
      </FormSection>

      <FormSection title="In the news" description="Melophile stories about this artist.">
        <RefMultiSelect
          label="Related articles"
          options={articleOptions}
          value={values.relatedArticleIds}
          onChange={setter("relatedArticleIds")}
          maxItems={12}
          error={error("relatedArticleIds")}
          placeholder="Search articles to add…"
          hint="Shown on the artist page in this order. Only published articles appear publicly."
        />
      </FormSection>
    </FormShell>
  );
}
