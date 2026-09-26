import Image from "next/image";
import { isOptimizableImageUrl } from "@/lib/images";
import { cn } from "@/lib/utils";
import type { MediaRef } from "@/types/content";

export interface SmartImageProps {
  /** MediaRef (preferred) or a raw URL. Missing/empty renders the branded "M" placeholder. */
  image?: MediaRef | string | null;
  /** Fallback alt text when the MediaRef has none (usually the title or name). */
  alt: string;
  /** Required responsive `sizes`, e.g. "(min-width: 1024px) 33vw, 100vw". */
  sizes: string;
  /**
   * Wrapper classes. The image fills the wrapper (`fill` + object-cover), so give it a size:
   * an aspect ratio (`aspect-[4/3]`) or explicit width/height. Rounding goes here too.
   */
  className?: string;
  /** Classes for the <img> (e.g. hover zoom, grayscale). */
  imgClassName?: string;
  /** Preload (LCP/hero images only). Replaces the deprecated `priority`. */
  preload?: boolean;
  /** 75 (default) or 90 — the only qualities allowed by next.config. */
  quality?: 75 | 90;
  /** Treat as decorative (alt=""). */
  decorative?: boolean;
  /** Letter(s) shown in the placeholder (default "M"). */
  monogram?: string;
}

/**
 * next/image wrapper with a graceful placeholder. Non-allow-listed hosts render `unoptimized`
 * so an admin-pasted URL never crashes a page.
 */
export function SmartImage({
  image,
  alt,
  sizes,
  className,
  imgClassName,
  preload = false,
  quality = 75,
  decorative = false,
  monogram = "M",
}: SmartImageProps) {
  const src = (typeof image === "string" ? image : image?.url)?.trim();
  const altText = decorative ? "" : ((typeof image === "object" && image?.alt?.trim()) || alt);

  return (
    <div className={cn("@container relative overflow-hidden bg-surface", className)}>
      {src ? (
        <Image
          src={src}
          alt={altText}
          fill
          sizes={sizes}
          quality={quality}
          preload={preload}
          unoptimized={!isOptimizableImageUrl(src)}
          className={cn("object-cover", imgClassName)}
        />
      ) : (
        <div
          role={decorative ? undefined : "img"}
          aria-label={decorative ? undefined : altText}
          aria-hidden={decorative ? true : undefined}
          className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_30%_20%,var(--color-ink-800),var(--color-surface)_70%)]"
        >
          <span
            aria-hidden="true"
            className="select-none font-display text-[clamp(2.5rem,45cqw,12rem)] leading-none font-extrabold tracking-[-0.06em] text-ink-700 [font-stretch:85%]"
          >
            {monogram}
            <span className="text-vermilion-900">.</span>
          </span>
        </div>
      )}
    </div>
  );
}
