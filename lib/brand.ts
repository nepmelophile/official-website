import type { BrandAssetsDTO } from "@/types/content";

/** Intrinsic size of the bundled full logo (public/brand/logo-on-*.png) — used for next/image's aspect ratio. */
export const LOGO_SIZE = { width: 779, height: 196 } as const;
/** Intrinsic size of the bundled mark (public/brand/logo-mark.png). */
export const LOGO_MARK_SIZE = { width: 264, height: 196 } as const;

/** Bundled logo files, used until branding is saved in the admin (or when the DB is unreachable). */
export const DEFAULT_BRAND_ASSETS: BrandAssetsDTO = {
  logoOnDark: { url: "/brand/logo-on-dark.png", alt: "Melophile" },
  logoOnLight: { url: "/brand/logo-on-light.png", alt: "Melophile" },
  logoMark: { url: "/brand/logo-mark.png", alt: "Melophile" },
};
