"use client";

import { useEffect, useId, useRef, useState, type DragEvent, type ReactNode } from "react";
import Image from "next/image";
import { ImageOff, ImagePlus, Trash2, Upload, X } from "lucide-react";
import { isOptimizableImageUrl } from "@/lib/images";
import { cn } from "@/lib/utils";
import type { MediaRef } from "@/types/content";
import { Button, buttonClass } from "./Button";
import { Field, fieldDescribedBy } from "./Field";
import {
  DEFAULT_MAX_UPLOAD_MB,
  IMAGEKIT_UPLOAD_ENABLED,
  uploadToImageKit,
  validateImageFile,
  type UploadedImage,
} from "./imagekit-upload";
import { inputClass } from "./styles";

/* ------------------------------------------------------------------ */
/* useImageUpload                                                      */
/* ------------------------------------------------------------------ */

export interface ImageUploadState {
  uploading: boolean;
  progress: number;
  error: string | undefined;
  /** Validate + upload; resolves with the uploaded image, or null on error/cancel. */
  start: (file: File) => Promise<UploadedImage | null>;
  cancel: () => void;
  clearError: () => void;
}

/** Upload state machine shared by ImageField and MediaListField. Aborts on unmount. */
export function useImageUpload({ folder, maxSizeMb = DEFAULT_MAX_UPLOAD_MB }: { folder?: string; maxSizeMb?: number } = {}): ImageUploadState {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>();
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  async function start(file: File): Promise<UploadedImage | null> {
    const invalid = validateImageFile(file, maxSizeMb);
    if (invalid) {
      setError(invalid);
      return null;
    }
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setError(undefined);
    setProgress(0);
    setUploading(true);
    try {
      return await uploadToImageKit(file, { folder, signal: controller.signal, onProgress: setProgress });
    } catch (err) {
      const e = err as { message?: string; aborted?: boolean };
      if (!e.aborted) setError(e.message ?? "Upload failed.");
      return null;
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setUploading(false);
      }
    }
  }

  return {
    uploading,
    progress,
    error,
    start,
    cancel: () => controllerRef.current?.abort(),
    clearError: () => setError(undefined),
  };
}

/* ------------------------------------------------------------------ */
/* ImagePreview                                                        */
/* ------------------------------------------------------------------ */

export function ImagePreview({
  src,
  alt,
  aspect = "aspect-[16/10]",
  sizes = "(min-width: 1024px) 24rem, 100vw",
  className,
}: {
  src: string;
  alt?: string;
  aspect?: string;
  sizes?: string;
  className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = failedSrc === src;
  return (
    <div className={cn("relative overflow-hidden rounded-sm border border-line bg-surface", aspect, className)}>
      {src && !failed ? (
        <Image
          src={src}
          alt={alt || "Image preview"}
          fill
          sizes={sizes}
          unoptimized={!isOptimizableImageUrl(src)}
          onError={() => setFailedSrc(src)}
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-fg-subtle">
          {failed ? (
            <>
              <ImageOff aria-hidden className="size-5" strokeWidth={1.75} />
              <span className="px-2 text-center text-xs">Preview unavailable — check the URL</span>
            </>
          ) : (
            <span aria-hidden className="font-display text-4xl font-extrabold text-line">
              M
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ImageField                                                          */
/* ------------------------------------------------------------------ */

export interface ImageFieldProps {
  /** Current image; a blank url means "no image". */
  value: MediaRef | undefined | null;
  /** Always emits a MediaRef (url "" when removed). Optional-image schemas treat a blank url as undefined. */
  onChange: (value: MediaRef) => void;
  label?: ReactNode;
  hint?: ReactNode;
  /** Error for the image/url (e.g. form.error("featuredImage.url") ?? form.error("featuredImage")). */
  error?: string;
  /** Error for the alt text (form.error("featuredImage.alt")). */
  altError?: string;
  required?: boolean;
  /** ImageKit folder, e.g. "/melophile/articles". */
  folder?: string;
  /** Show the alt text input (default true). */
  showAlt?: boolean;
  /** Preview aspect class (default "aspect-[16/10]"; portraits: "aspect-[4/5]"). */
  aspect?: string;
  maxSizeMb?: number;
  disabled?: boolean;
  id?: string;
  className?: string;
}

/**
 * MediaRef editor: preview, alt text, a "paste image URL" input (always available) and an
 * ImageKit Upload button (hidden when NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY is unset) with progress,
 * cancel and drag-and-drop.
 */
export function ImageField({
  value,
  onChange,
  label = "Image",
  hint,
  error,
  altError,
  required,
  folder = "/melophile",
  showAlt = true,
  aspect,
  maxSizeMb = DEFAULT_MAX_UPLOAD_MB,
  disabled,
  id,
  className,
}: ImageFieldProps) {
  const generatedId = useId();
  const baseId = id ?? `img${generatedId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const urlId = `${baseId}-url`;
  const altId = `${baseId}-alt`;
  const fileId = `${baseId}-file`;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const uploader = useImageUpload({ folder, maxSizeMb });

  const current: MediaRef = { url: value?.url ?? "", alt: value?.alt ?? "", fileId: value?.fileId };
  const hasImage = Boolean(current.url.trim());
  const canUpload = IMAGEKIT_UPLOAD_ENABLED && !disabled;
  const shownError = uploader.error ?? error;
  const fullHint =
    hint ??
    (IMAGEKIT_UPLOAD_ENABLED
      ? `Upload (max ${maxSizeMb} MB) or paste an image URL.`
      : "Paste a full image URL (https://…). Uploads are off until ImageKit is configured.");

  function emit(patch: Partial<MediaRef>) {
    const next: MediaRef = { ...current, ...patch };
    const out: MediaRef = { url: next.url };
    if (next.alt) out.alt = next.alt;
    if (next.fileId) out.fileId = next.fileId;
    onChange(out);
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const uploaded = await uploader.start(file);
    if (uploaded) emit({ url: uploaded.url, fileId: uploaded.fileId });
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (!canUpload || uploader.uploading) return;
    void handleFile(event.dataTransfer.files?.[0]);
  }

  return (
    <Field id={urlId} as="group" label={label} hint={fullHint} error={shownError} required={required} className={className}>
      <div
        onDragOver={(e) => {
          if (!canUpload) return;
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "space-y-3 rounded-sm border bg-bg-alt p-3 transition-colors duration-150",
          dragging ? "border-accent bg-accent-tint/40" : shownError ? "border-danger/60" : "border-line",
        )}
      >
        <div className="relative">
          <ImagePreview src={current.url} alt={current.alt} aspect={aspect} />
          {uploader.uploading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-sm bg-bg/80 p-4">
              <div
                role="progressbar"
                aria-label="Upload progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={uploader.progress}
                className="h-1.5 w-full max-w-56 overflow-hidden rounded-pill bg-line"
              >
                <div className="h-full bg-accent transition-[width] duration-150" style={{ width: `${uploader.progress}%` }} />
              </div>
              <p className="font-mono text-xs tabular-nums text-fg-muted">Uploading… {uploader.progress}%</p>
              <Button size="sm" variant="secondary" onClick={uploader.cancel} icon={<X aria-hidden className="size-4" />}>
                Cancel upload
              </Button>
            </div>
          ) : !hasImage && canUpload ? (
            <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-xs text-fg-subtle">
              Drop an image here
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canUpload ? (
            <>
              <input
                ref={fileInputRef}
                id={fileId}
                type="file"
                accept="image/*"
                className="sr-only"
                tabIndex={-1}
                aria-hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  void handleFile(file);
                }}
              />
              <Button
                size="sm"
                variant="secondary"
                disabled={uploader.uploading}
                onClick={() => fileInputRef.current?.click()}
                icon={hasImage ? <Upload aria-hidden className="size-4" strokeWidth={1.75} /> : <ImagePlus aria-hidden className="size-4" strokeWidth={1.75} />}
              >
                {hasImage ? "Replace" : "Upload image"}
              </Button>
            </>
          ) : null}
          {hasImage && !disabled ? (
            <button
              type="button"
              onClick={() => {
                uploader.clearError();
                onChange({ url: "" });
              }}
              className={buttonClass("ghost", "sm", "text-danger hover:bg-danger/10 hover:text-danger")}
            >
              <Trash2 aria-hidden className="size-4" strokeWidth={1.75} />
              Remove
            </button>
          ) : null}
          {current.fileId ? (
            <span className="ml-auto truncate font-mono text-[0.6875rem] text-fg-subtle" title={current.fileId}>
              ImageKit · {current.fileId.slice(0, 10)}…
            </span>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label htmlFor={urlId} className="text-xs font-medium text-fg-muted">
            Image URL
          </label>
          <input
            id={urlId}
            type="url"
            inputMode="url"
            value={current.url}
            onChange={(e) => {
              uploader.clearError();
              emit({ url: e.target.value.trim(), fileId: undefined });
            }}
            placeholder="https://ik.imagekit.io/…"
            disabled={disabled || uploader.uploading}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={shownError ? true : undefined}
            aria-describedby={fieldDescribedBy(urlId, fullHint, shownError)}
            className={cn(inputClass, "font-mono text-xs")}
          />
        </div>

        {showAlt ? (
          <div className="space-y-1.5">
            <label htmlFor={altId} className="text-xs font-medium text-fg-muted">
              Alt text <span className="font-normal text-fg-subtle">— describe the image for screen readers</span>
            </label>
            <input
              id={altId}
              type="text"
              value={current.alt ?? ""}
              onChange={(e) => emit({ alt: e.target.value })}
              placeholder="e.g. Bipul Chettri performing at Tundikhel"
              maxLength={250}
              disabled={disabled || uploader.uploading}
              autoComplete="off"
              aria-invalid={altError ? true : undefined}
              aria-describedby={altError ? `${altId}-error` : undefined}
              className={inputClass}
            />
            {altError ? (
              <p id={`${altId}-error`} className="text-xs font-medium text-danger">
                {altError}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </Field>
  );
}
