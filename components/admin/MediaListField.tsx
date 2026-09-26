"use client";

import { useId, useRef, type ReactNode } from "react";
import { Upload } from "lucide-react";
import { ARTIST_MEDIA_TYPES } from "@/lib/constants";
import { getEmbedProvider, EMBED_PROVIDER_LABELS } from "@/lib/embeds";
import type { ArtistMedia, ArtistMediaType, MediaRef } from "@/types/content";
import { Button } from "./Button";
import { ImageField, ImagePreview, useImageUpload } from "./ImageField";
import { IMAGEKIT_UPLOAD_ENABLED } from "./imagekit-upload";
import { Select, TextInput } from "./inputs";
import { Repeater } from "./Repeater";

const MEDIA_TYPE_OPTIONS = ARTIST_MEDIA_TYPES.map((t) => ({
  value: t,
  label: t === "image" ? "Image" : "Video",
}));

/* ------------------------------------------------------------------ */
/* MediaListField — Artist.media: { type, url, caption?, fileId? }[]   */
/* ------------------------------------------------------------------ */

export interface MediaListFieldProps {
  /** Field name for error paths (default "media" → "media.0.url"). */
  name?: string;
  value: ArtistMedia[];
  onChange: (value: ArtistMedia[]) => void;
  /** Error lookup, usually `form.error`. */
  errorFor?: (path: string) => string | undefined;
  label?: ReactNode;
  hint?: ReactNode;
  folder?: string;
  maxItems?: number;
  disabled?: boolean;
}

function MediaRow({
  item,
  path,
  update,
  errorFor,
  folder,
  disabled,
}: {
  item: ArtistMedia;
  path: string;
  update: (patch: Partial<ArtistMedia>) => void;
  errorFor?: (path: string) => string | undefined;
  folder?: string;
  disabled?: boolean;
}) {
  const uploader = useImageUpload({ folder });
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();
  const provider = item.type === "video" && item.url ? getEmbedProvider(item.url) : null;
  const urlError = uploader.error ?? errorFor?.(`${path}.url`);

  return (
    <div className="grid gap-4 sm:grid-cols-[9rem_minmax(0,1fr)]">
      <div className="space-y-2">
        {item.type === "image" ? (
          <ImagePreview src={item.url} alt={item.caption} aspect="aspect-square" sizes="9rem" />
        ) : (
          <div className="flex aspect-square items-center justify-center rounded-sm border border-line bg-surface p-2 text-center font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-fg-subtle">
            {provider ? EMBED_PROVIDER_LABELS[provider] : "Video link"}
          </div>
        )}
        {item.type === "image" && IMAGEKIT_UPLOAD_ENABLED && !disabled ? (
          <>
            <input
              ref={inputRef}
              id={fileInputId}
              type="file"
              accept="image/*"
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                const uploaded = await uploader.start(file);
                if (uploaded) update({ url: uploaded.url, fileId: uploaded.fileId });
              }}
            />
            <Button
              size="sm"
              variant="secondary"
              className="w-full"
              loading={uploader.uploading}
              onClick={() => inputRef.current?.click()}
              icon={<Upload aria-hidden className="size-4" strokeWidth={1.75} />}
            >
              {uploader.uploading ? `${uploader.progress}%` : "Upload"}
            </Button>
            {uploader.uploading ? (
              <button type="button" onClick={uploader.cancel} className="w-full text-xs text-fg-subtle underline hover:text-fg">
                Cancel
              </button>
            ) : null}
          </>
        ) : null}
      </div>
      <div className="space-y-4">
        <Select<ArtistMediaType>
          label="Type"
          value={item.type}
          onChange={(type) => update({ type: type || "image", fileId: type === "video" ? undefined : item.fileId })}
          options={MEDIA_TYPE_OPTIONS}
          error={errorFor?.(`${path}.type`)}
          disabled={disabled}
        />
        <TextInput
          type="url"
          label={item.type === "image" ? "Image URL" : "Video URL"}
          hint={item.type === "video" ? "YouTube link (watch, youtu.be or shorts)." : undefined}
          value={item.url}
          onChange={(url) => {
            uploader.clearError();
            update({ url: url.trim(), fileId: undefined });
          }}
          placeholder={item.type === "image" ? "https://ik.imagekit.io/…" : "https://www.youtube.com/watch?v=…"}
          error={urlError}
          required
          disabled={disabled || uploader.uploading}
        />
        <TextInput
          label="Caption"
          optional
          value={item.caption ?? ""}
          onChange={(caption) => update({ caption })}
          maxLength={200}
          error={errorFor?.(`${path}.caption`)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

/** Artist photo/video gallery editor (Repeater of ArtistMedia rows with per-row upload). */
export function MediaListField({
  name = "media",
  value,
  onChange,
  errorFor,
  label = "Media gallery",
  hint = "Photos (upload or paste a URL) and YouTube videos, shown in this order.",
  folder = "/melophile/artists",
  maxItems = 30,
  disabled,
}: MediaListFieldProps) {
  return (
    <Repeater<ArtistMedia>
      label={label}
      name={name}
      hint={hint}
      error={errorFor?.(name)}
      items={value}
      onChange={onChange}
      createItem={() => ({ type: "image", url: "", caption: "" })}
      itemTitle={(item) => item.caption || (item.type === "video" ? "Video" : "Image")}
      addLabel="Add photo or video"
      emptyText="No photos or videos yet."
      maxItems={maxItems}
      disabled={disabled}
      renderItem={(item, row) => (
        <MediaRow
          item={item}
          path={row.path}
          update={(patch) => row.update(patch)}
          errorFor={errorFor}
          folder={folder}
          disabled={disabled}
        />
      )}
    />
  );
}

/* ------------------------------------------------------------------ */
/* MultiImageField — MediaRef[]                                        */
/* ------------------------------------------------------------------ */

export interface MultiImageFieldProps {
  name: string;
  value: MediaRef[];
  onChange: (value: MediaRef[]) => void;
  errorFor?: (path: string) => string | undefined;
  label?: ReactNode;
  hint?: ReactNode;
  folder?: string;
  maxItems?: number;
  disabled?: boolean;
}

/** A list of MediaRef images (each with upload / URL / alt), reorderable. */
export function MultiImageField({
  name,
  value,
  onChange,
  errorFor,
  label = "Images",
  hint,
  folder = "/melophile",
  maxItems = 20,
  disabled,
}: MultiImageFieldProps) {
  return (
    <Repeater<MediaRef>
      label={label}
      name={name}
      hint={hint}
      error={errorFor?.(name)}
      items={value}
      onChange={onChange}
      createItem={() => ({ url: "" })}
      itemTitle={(item, i) => item.alt || `Image ${i + 1}`}
      addLabel="Add image"
      emptyText="No images yet."
      maxItems={maxItems}
      disabled={disabled}
      renderItem={(item, row) => (
        <ImageField
          label={`Image ${row.index + 1}`}
          value={item}
          onChange={(next) => row.update(() => next)}
          error={errorFor?.(`${row.path}.url`) ?? errorFor?.(row.path)}
          altError={errorFor?.(`${row.path}.alt`)}
          folder={folder}
          disabled={disabled}
        />
      )}
    />
  );
}
