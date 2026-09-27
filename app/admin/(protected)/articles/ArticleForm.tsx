"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarClock, ExternalLink, TrendingUp } from "lucide-react";
import {
  DateInput,
  EmbedUrlInput,
  FormSection,
  FormShell,
  ImageField,
  MarkdownEditor,
  RefMultiSelect,
  Repeater,
  Select,
  SlugInput,
  StatusSelect,
  TagInput,
  TextArea,
  TextInput,
  buttonClass,
  useAdminForm,
  type RefOption,
} from "@/components/admin";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/constants";
import { EMBED_PROVIDER_LABELS, getEmbedProvider } from "@/lib/embeds";
import { formatDate } from "@/lib/utils";
import type { ArticleDTO, ContentStatus, EmbedRef, MediaRef } from "@/types/content";
import { createArticle, deleteArticle, updateArticle } from "./actions";

/** Form state (JSON-friendly: dates are ISO strings, optional text is ""). */
interface ArticleFormState {
  title: string;
  slug: string;
  featuredImage: MediaRef;
  excerpt: string;
  body: string;
  category: string;
  tags: string[];
  author: string;
  publishedAt: string;
  status: ContentStatus;
  embeds: EmbedRef[];
  relatedArticleIds: string[];
  metaTitle: string;
  metaDescription: string;
}

function toState(article: ArticleDTO | undefined, defaultPublishedAt: string): ArticleFormState {
  return {
    title: article?.title ?? "",
    slug: article?.slug ?? "",
    featuredImage: article?.featuredImage ?? { url: "" },
    excerpt: article?.excerpt ?? "",
    body: article?.body ?? "",
    category: article?.category ?? "",
    tags: article?.tags ?? [],
    author: article?.author ?? "",
    publishedAt: article?.publishedAt || defaultPublishedAt,
    status: article?.status ?? "draft",
    embeds: (article?.embeds ?? []).map((e) => ({ url: e.url, title: e.title ?? "" })),
    relatedArticleIds: article?.relatedArticleIds ?? [],
    metaTitle: article?.metaTitle ?? "",
    metaDescription: article?.metaDescription ?? "",
  };
}

/* ------------------------------------------------------------------ */
/* Category: suggested list + free text                                */
/* ------------------------------------------------------------------ */

const CUSTOM_CATEGORY = "__custom__";

function CategoryField({
  value,
  onChange,
  options,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  error?: string;
}) {
  const known = options.includes(value);
  const [custom, setCustom] = useState(() => Boolean(value) && !known);

  return (
    <div className="space-y-3">
      <Select
        label="Category"
        required
        value={custom ? CUSTOM_CATEGORY : value}
        onChange={(next) => {
          if (next === CUSTOM_CATEGORY) {
            setCustom(true);
            onChange("");
          } else {
            setCustom(false);
            onChange(next);
          }
        }}
        placeholder="Choose a category…"
        options={[
          ...options.map((c) => ({ value: c, label: c })),
          { value: CUSTOM_CATEGORY, label: "Other (type a new one)…" },
        ]}
        hint={custom ? undefined : "Shown as a filter chip on /news."}
        error={custom ? undefined : error}
      />
      {custom ? (
        <TextInput
          label="New category"
          required
          value={value}
          onChange={onChange}
          maxLength={60}
          placeholder="e.g. Live Review"
          hint="Use Title Case. Matching an existing category merges them."
          inputProps={{
            onBlur: (e) => {
              // Snap to an existing category when only the casing differs ("news" → "News").
              const typed = e.target.value.trim();
              const match = options.find((c) => c.toLowerCase() === typed.toLowerCase());
              if (match) {
                setCustom(false);
                onChange(match);
              } else if (typed !== e.target.value) {
                onChange(typed);
              }
            },
          }}
          error={error}
        />
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Search / share preview                                              */
/* ------------------------------------------------------------------ */

function SearchPreview({ title, description, slug }: { title: string; description: string; slug: string }) {
  return (
    <figure className="space-y-1.5">
      <figcaption className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-fg-subtle">
        Search result preview
      </figcaption>
      <div className="rounded-sm border border-line bg-bg-alt p-4">
        <p className="truncate font-mono text-xs text-fg-subtle">
          {SITE_DOMAIN} › news › {slug || "…"}
        </p>
        <p className="mt-1 line-clamp-1 text-base font-semibold text-link">
          {title ? `${title} | ${SITE_NAME}` : "Add a title"}
        </p>
        <p className="mt-1 line-clamp-2 text-sm text-fg-muted">{description || "Add an excerpt or meta description."}</p>
      </div>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Form                                                                */
/* ------------------------------------------------------------------ */

export interface ArticleFormProps {
  /** Omit for "new article". */
  article?: ArticleDTO;
  /** Other articles for the related picker (RefMultiSelect). */
  articleOptions: RefOption[];
  categories: string[];
  tagSuggestions: string[];
  authorSuggestions: string[];
  /** Default publish date for new articles (ISO, computed on the server so SSR and hydration agree). */
  defaultPublishedAt: string;
  /** Server time when the page rendered (ISO) — used to flag scheduled posts. */
  renderedAt: string;
}

export function ArticleForm({
  article,
  articleOptions,
  categories,
  tagSuggestions,
  authorSuggestions,
  defaultPublishedAt,
  renderedAt,
}: ArticleFormProps) {
  const isNew = !article;
  const form = useAdminForm({
    initial: toState(article, defaultPublishedAt),
    action: async (values: ArticleFormState) =>
      article ? updateArticle(article.id, values) : createArticle(values),
    redirectTo: isNew ? (data) => (data ? `/admin/articles/${data.id}` : undefined) : undefined,
  });
  const { values, setter, error } = form;

  const scheduled =
    values.status === "published" && Boolean(values.publishedAt) && Date.parse(values.publishedAt) > Date.parse(renderedAt);
  const live =
    article?.status === "published" && Boolean(article.publishedAt) && Date.parse(article.publishedAt) <= Date.parse(renderedAt);

  return (
    <FormShell
      title={isNew ? "New article" : values.title || "Untitled article"}
      description={isNew ? "Write it, preview it, then publish when it’s ready." : undefined}
      meta={
        article
          ? `${article.status === "published" ? "Published" : "Draft"} · Last updated ${formatDate(article.updatedAt, "medium")}`
          : undefined
      }
      backHref="/admin/articles"
      backLabel="Articles"
      form={form}
      submitLabel={isNew ? (values.status === "published" ? "Publish article" : "Save draft") : "Save changes"}
      deleteProps={
        article
          ? {
              action: deleteArticle,
              id: article.id,
              itemLabel: article.title,
              redirectTo: "/admin/articles",
              description: "It disappears from the site straight away and is removed from related-article lists.",
            }
          : undefined
      }
      headerActions={
        article ? (
          <>
            <Link href={`/admin/trending/new?type=update&ref=${article.id}`} className={buttonClass("ghost", "sm")}>
              <TrendingUp aria-hidden className="size-3.5" strokeWidth={1.75} />
              Add to trending
            </Link>
            {live && article ? (
              <a
                href={`/news/${article.slug}`}
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
          <FormSection title="Publishing">
            <StatusSelect value={values.status} onChange={setter("status")} error={error("status")} />
            <DateInput
              label="Publish date"
              required
              value={values.publishedAt}
              onChange={setter("publishedAt")}
              error={error("publishedAt")}
              hint="Nepal time. Articles are listed newest first by this date."
            />
            {scheduled ? (
              <p
                role="status"
                className="flex items-start gap-2 rounded-sm border border-secondary/50 bg-secondary-tint/50 px-3 py-2 text-xs text-fg"
              >
                <CalendarClock aria-hidden className="mt-0.5 size-4 shrink-0 text-secondary-soft" strokeWidth={1.75} />
                <span>
                  Scheduled — it goes live on {formatDate(values.publishedAt, "medium")} (within an hour of that time).
                </span>
              </p>
            ) : null}
            <TextInput
              label="Author"
              optional
              value={values.author}
              onChange={setter("author")}
              error={error("author")}
              maxLength={100}
              suggestions={authorSuggestions}
              placeholder="e.g. Melophile Desk"
            />
          </FormSection>

          <FormSection title="Image" description="Used on cards, at the top of the story and for social shares.">
            <ImageField
              label="Featured image"
              required
              value={values.featuredImage}
              onChange={setter("featuredImage")}
              folder="/melophile/articles"
              error={error("featuredImage.url") ?? error("featuredImage")}
              altError={error("featuredImage.alt")}
            />
          </FormSection>

          <FormSection title="Classification">
            <CategoryField value={values.category} onChange={setter("category")} options={categories} error={error("category")} />
            <TagInput
              label="Tags"
              value={values.tags}
              onChange={setter("tags")}
              suggestions={tagSuggestions}
              maxItems={20}
              maxLength={40}
              error={error("tags")}
              hint="Artists, genres, places. Press Enter or comma to add. Used to find related stories."
            />
          </FormSection>
        </>
      }
    >
      <FormSection title="Story">
        <TextInput
          label="Title"
          required
          value={values.title}
          onChange={setter("title")}
          error={error("title")}
          maxLength={200}
          showCount
          placeholder="e.g. Sajjan Raj Vaidya announces a Kathmandu homecoming show"
        />
        <SlugInput source={values.title} prefix="/news/" value={values.slug} onChange={setter("slug")} error={error("slug")} />
        <TextArea
          label="Excerpt"
          required
          rows={3}
          value={values.excerpt}
          onChange={setter("excerpt")}
          error={error("excerpt")}
          maxLength={400}
          showCount
          hint="One or two sentences shown on cards and used as the default search description."
        />
        <MarkdownEditor label="Body" required value={values.body} onChange={setter("body")} error={error("body")} />
      </FormSection>

      <FormSection title="Embeds" description="Spotify, YouTube or SoundCloud players shown after the story, in this order.">
        <Repeater<EmbedRef>
          label="Players"
          name="embeds"
          items={values.embeds}
          onChange={setter("embeds")}
          createItem={() => ({ url: "", title: "" })}
          itemTitle={(item) => {
            const provider = item.url ? getEmbedProvider(item.url) : null;
            return item.title || (provider ? `${EMBED_PROVIDER_LABELS[provider]} player` : "New embed");
          }}
          addLabel="Add player"
          emptyText="No players yet. Add a link to a track, album, playlist or video."
          maxItems={10}
          error={error("embeds")}
          renderItem={(item, row) => (
            <>
              <EmbedUrlInput
                label="Link"
                required
                value={item.url}
                onChange={(url) => row.update({ url: url.trim() })}
                error={error(`${row.path}.url`)}
                hint="Only open.spotify.com, youtube.com / youtu.be and soundcloud.com links can be embedded."
              />
              <TextInput
                label="Title"
                optional
                value={item.title ?? ""}
                onChange={(title) => row.update({ title })}
                error={error(`${row.path}.title`)}
                maxLength={150}
                placeholder="e.g. Listen to “Aaudai Jaadai” on Spotify"
                hint="Names the player for screen readers."
              />
            </>
          )}
        />
      </FormSection>

      <FormSection title="Keep reading" description="Stories suggested at the end of this one.">
        <RefMultiSelect
          label="Related articles"
          options={articleOptions}
          value={values.relatedArticleIds}
          onChange={setter("relatedArticleIds")}
          excludeIds={article ? [article.id] : undefined}
          maxItems={12}
          error={error("relatedArticleIds")}
          placeholder="Search articles to add…"
          hint="Shown under the story in this order. Leave empty to pick automatically by category and tags."
        />
      </FormSection>

      <FormSection title="Search & sharing" description="Optional overrides for search engines and social cards.">
        <TextInput
          label="Meta title"
          optional
          value={values.metaTitle}
          onChange={setter("metaTitle")}
          error={error("metaTitle")}
          maxLength={120}
          showCount
          placeholder={values.title || undefined}
          hint="Defaults to the title. Aim for under 60 characters."
        />
        <TextArea
          label="Meta description"
          optional
          rows={3}
          value={values.metaDescription}
          onChange={setter("metaDescription")}
          error={error("metaDescription")}
          maxLength={320}
          showCount
          placeholder={values.excerpt || undefined}
          hint="Defaults to the excerpt. Aim for 120–160 characters."
        />
        <SearchPreview
          title={values.metaTitle.trim() || values.title.trim()}
          description={values.metaDescription.trim() || values.excerpt.trim()}
          slug={values.slug}
        />
      </FormSection>
    </FormShell>
  );
}
