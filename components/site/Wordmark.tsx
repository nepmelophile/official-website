import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { BrandAssetsDTO } from "@/types/content";
import { BrandLogo } from "./BrandLogo";

export interface WordmarkProps {
  className?: string;
  /** Visual size: sm (header) or lg (footer). */
  size?: "sm" | "lg";
  /** Render as a link to "/" (default true). */
  asLink?: boolean;
  /** Logo files from getBrandAssets(); falls back to the bundled /public/brand files. */
  brand?: BrandAssetsDTO;
}

/** The Melophile logo (theme-aware image), optionally linking home. */
export function Wordmark({ className, size = "sm", asLink = true, brand }: WordmarkProps) {
  const mark =
    size === "sm" ? (
      <BrandLogo brand={brand} height={30} className="lg:h-9" decorative={asLink} eager />
    ) : (
      <BrandLogo brand={brand} height={56} className="md:h-[4.5rem]" decorative={asLink} />
    );
  if (!asLink) return <span className={cn("inline-flex", className)}>{mark}</span>;
  return (
    <Link href="/" className={cn("inline-flex min-h-11 items-center", className)} aria-label={`${SITE_NAME} — home`}>
      {mark}
    </Link>
  );
}
