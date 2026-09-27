import type { CSSProperties } from "react";
import Image from "next/image";
import { DEFAULT_BRAND_ASSETS, LOGO_MARK_SIZE, LOGO_SIZE } from "@/lib/brand";
import { isOptimizableImageUrl } from "@/lib/images";
import { cn } from "@/lib/utils";
import type { BrandAssetsDTO, MediaRef } from "@/types/content";

export interface BrandLogoProps {
  /** Logo files (from getBrandAssets()); defaults to the bundled /public/brand files. */
  brand?: BrandAssetsDTO;
  /** "full" = mark + MELOPHILE lettering; "mark" = the note symbol only. */
  variant?: "full" | "mark";
  /** Rendered height in px (width follows the logo's aspect ratio). */
  height: number;
  /** Extra classes for each <img> (e.g. responsive height overrides like "md:h-20"). */
  className?: string;
  /** Empty alt when the logo sits inside a link/heading that already names it. */
  decorative?: boolean;
  /** Load eagerly (header / above the fold). */
  eager?: boolean;
}

function LogoImage({
  media,
  size,
  height,
  className,
  alt,
  eager,
}: {
  media: MediaRef;
  size: { width: number; height: number };
  height: number;
  className: string;
  alt: string;
  eager?: boolean;
}) {
  const width = Math.round((height * size.width) / size.height);
  return (
    <Image
      src={media.url}
      alt={alt}
      width={width}
      height={height}
      loading={eager ? "eager" : "lazy"}
      unoptimized={!isOptimizableImageUrl(media.url)}
      // Height via a CSS variable so callers can still override it responsively (e.g. "md:h-20").
      className={cn("h-(--logo-h) w-auto", className)}
      style={{ "--logo-h": `${height}px` } as CSSProperties}
    />
  );
}

/**
 * The Melophile logo, theme-aware: the light-lettering file shows in the dark theme and the
 * dark-lettering file in the light theme. Both are rendered and swapped with the `light:`
 * variant (CSS only), so the right one is visible on first paint with no hydration flash.
 * The mark alone reads on both backgrounds, so it is a single image.
 */
export function BrandLogo({ brand = DEFAULT_BRAND_ASSETS, variant = "full", height, className, decorative, eager }: BrandLogoProps) {
  const base = cn("shrink-0 object-contain object-left", className);
  if (variant === "mark") {
    return (
      <LogoImage
        media={brand.logoMark}
        size={LOGO_MARK_SIZE}
        height={height}
        className={cn(base, "block")}
        alt={decorative ? "" : brand.logoMark.alt || "Melophile"}
        eager={eager}
      />
    );
  }
  const alt = decorative ? "" : brand.logoOnDark.alt || "Melophile";
  return (
    <>
      <LogoImage media={brand.logoOnDark} size={LOGO_SIZE} height={height} className={cn(base, "block light:hidden")} alt={alt} eager={eager} />
      <LogoImage
        media={brand.logoOnLight}
        size={LOGO_SIZE}
        height={height}
        className={cn(base, "hidden light:block")}
        alt={decorative ? "" : brand.logoOnLight.alt || "Melophile"}
        eager={eager}
      />
    </>
  );
}
