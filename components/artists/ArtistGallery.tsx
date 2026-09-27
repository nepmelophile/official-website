"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type KeyboardEvent, type TouchEvent } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { isOptimizableImageUrl } from "@/lib/images";
import { cn } from "@/lib/utils";
import { ICON_BUTTON, IMAGE_ZOOM, META, pad2 } from "./styles";

export interface GalleryImage {
  url: string;
  /** Meaningful alt text (caption or "<artist> — photo n"). */
  alt: string;
  caption?: string;
}

export interface ArtistGalleryProps {
  images: GalleryImage[];
  /** Used for the dialog's accessible name, e.g. the artist name. */
  label: string;
}

const SWIPE_THRESHOLD_PX = 50;

/** Inline overflow value to restore, or null when the page isn't locked. */
let lockedOverflow: string | null = null;

/** Locks page scroll behind the modal (native dialogs don't). */
function lockPageScroll(): void {
  if (lockedOverflow !== null) return;
  const root = document.documentElement;
  lockedOverflow = root.style.overflow;
  root.style.overflow = "hidden";
}

function unlockPageScroll(): void {
  if (lockedOverflow === null) return;
  document.documentElement.style.overflow = lockedOverflow;
  lockedOverflow = null;
}

/**
 * Image grid with a keyboard-accessible lightbox built on the native modal `<dialog>`
 * (focus is contained and the page behind is inert). ←/→ (and swipe) navigate, Esc closes,
 * page scroll is locked while open, and focus returns to the thumbnail of the image last shown.
 */
export function ArtistGallery({ images, label }: ArtistGalleryProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const touchStartX = useRef<number | null>(null);
  const [current, setCurrent] = useState(0);
  const [open, setOpen] = useState(false);

  // Never leave the page locked if we unmount mid-view (e.g. browser Back while open).
  useEffect(() => unlockPageScroll, []);

  const count = images.length;
  if (count === 0) return null;
  const active = images[Math.min(current, count - 1)];

  function openAt(index: number) {
    setCurrent(index);
    setOpen(true);
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    lockPageScroll();
    dialog.showModal();
    closeButtonRef.current?.focus();
  }

  function close() {
    dialogRef.current?.close();
  }

  /** Runs for every close path (button, Esc, form method=dialog). */
  function handleClose() {
    setOpen(false);
    unlockPageScroll();
    triggerRefs.current[current]?.focus();
  }

  function go(delta: number) {
    setCurrent((index) => (index + delta + count) % count);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (count < 2) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      setCurrent(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setCurrent(count - 1);
    }
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const start = touchStartX.current;
    touchStartX.current = null;
    const end = event.changedTouches[0]?.clientX;
    if (start === null || end === undefined || count < 2) return;
    const delta = end - start;
    if (Math.abs(delta) >= SWIPE_THRESHOLD_PX) go(delta < 0 ? 1 : -1);
  }

  const mosaic = count >= 3;

  return (
    <>
      <ul
        className={cn(
          "grid gap-3 md:gap-4",
          count === 1 && "grid-cols-1",
          count === 2 && "grid-cols-1 sm:grid-cols-2",
          mosaic && "grid-cols-2 md:grid-cols-3",
        )}
      >
        {images.map((image, i) => {
          const lead = mosaic && i === 0;
          return (
            <li key={`${image.url}-${i}`} className={cn(lead && "col-span-2 md:row-span-2")}>
              <button
                ref={(node) => {
                  triggerRefs.current[i] = node;
                }}
                type="button"
                onClick={() => openAt(i)}
                aria-haspopup="dialog"
                aria-label={`Open image ${i + 1} of ${count}: ${image.caption || image.alt}`}
                className={cn(
                  "group relative block w-full cursor-zoom-in overflow-hidden rounded-md border border-line bg-surface text-left",
                  count === 1 ? "aspect-[16/9]" : "aspect-[4/3]",
                  lead && "md:aspect-auto md:h-full md:min-h-[18rem]",
                )}
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  sizes={
                    lead || count === 1
                      ? "(min-width: 1024px) 60vw, 100vw"
                      : "(min-width: 768px) 30vw, (min-width: 640px) 50vw, 50vw"
                  }
                  unoptimized={!isOptimizableImageUrl(image.url)}
                  className={cn("object-cover", IMAGE_ZOOM)}
                />
                {image.caption ? (
                  <span
                    aria-hidden="true"
                    className={cn(
                      META,
                      "absolute inset-x-0 bottom-0 bg-linear-to-t from-ink-950/90 via-ink-950/50 to-transparent px-3 pt-10 pb-3 text-[0.6875rem] text-ink-100 md:px-4 md:pb-4",
                    )}
                  >
                    {image.caption}
                  </span>
                ) : null}
                <span
                  aria-hidden="true"
                  className="absolute top-3 right-3 inline-flex size-9 items-center justify-center rounded-pill bg-ink-950/70 text-paper opacity-0 backdrop-blur-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                >
                  <Maximize2 size={16} strokeWidth={1.75} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* A photo viewer stays dark in both themes: data-theme="dark" makes it a fixed-dark island. */}
      <dialog
        ref={dialogRef}
        data-theme="dark"
        aria-label={`${label} — photo viewer`}
        onClose={handleClose}
        onKeyDown={handleKeyDown}
        className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 bg-ink-950/95 p-0 text-fg backdrop:bg-ink-950/80 open:flex open:flex-col"
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-line px-gutter">
          <p className={cn(META, "text-fg-subtle")} aria-hidden="true">
            <span className="text-highlight">{pad2(current + 1)}</span> / {pad2(count)}
          </p>
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            {open ? `Image ${current + 1} of ${count}: ${active.caption || active.alt}` : ""}
          </p>
          <button ref={closeButtonRef} type="button" onClick={close} className={ICON_BUTTON}>
            <X size={20} strokeWidth={1.75} aria-hidden="true" />
            <span className="sr-only">Close photo viewer</span>
          </button>
        </div>

        <div className="relative min-h-0 flex-1" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          {open ? (
            <Image
              key={active.url}
              src={active.url}
              alt={active.alt}
              fill
              sizes="100vw"
              quality={90}
              unoptimized={!isOptimizableImageUrl(active.url)}
              className="object-contain p-4 md:p-10"
            />
          ) : null}
        </div>

        <div className="flex min-h-20 shrink-0 items-center gap-4 border-t border-line px-gutter py-3">
          {count > 1 ? (
            <button type="button" onClick={() => go(-1)} className={ICON_BUTTON}>
              <ChevronLeft size={20} strokeWidth={1.75} aria-hidden="true" />
              <span className="sr-only">Previous image</span>
            </button>
          ) : null}
          <p className="min-w-0 flex-1 text-center text-sm text-fg-muted">{active.caption ?? ""}</p>
          {count > 1 ? (
            <button type="button" onClick={() => go(1)} className={ICON_BUTTON}>
              <ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" />
              <span className="sr-only">Next image</span>
            </button>
          ) : null}
        </div>
      </dialog>
    </>
  );
}
