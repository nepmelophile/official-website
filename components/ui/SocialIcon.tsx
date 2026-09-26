import type { ReactNode, SVGProps } from "react";
import { SOCIAL_PLATFORM_LABELS } from "@/lib/constants";
import type { SocialPlatform } from "@/types/content";

/* Line icons drawn on lucide's 24px grid (stroke 1.75) — lucide ships no brand marks. */
const PATHS: Record<SocialPlatform, ReactNode> = {
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </>
  ),
  youtube: (
    <>
      <path d="M2.5 17a24 24 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.6 49.6 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24 24 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.6 49.6 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </>
  ),
  facebook: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />,
  tiktok: (
    <>
      <path d="M13 3v12a3.5 3.5 0 1 1-3.5-3.5" />
      <path d="M13 3c.4 2.7 2.3 4.6 5.5 4.9" />
    </>
  ),
  x: (
    <>
      <path d="M4 4h4.3L20 20h-4.3z" />
      <path d="M4 20l6.9-6.9M13.1 10.9 20 4" />
    </>
  ),
  spotify: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M7 9.4c3.5-1 7.4-.7 10.2 1" />
      <path d="M7.6 12.7c2.9-.8 5.8-.5 8.3.9" />
      <path d="M8.3 15.9c2.1-.5 4.2-.3 6 .7" />
    </>
  ),
  soundcloud: (
    <>
      <path d="M10.5 17V8.8a5 5 0 0 1 8.9 2.6A2.9 2.9 0 0 1 19 17z" />
      <path d="M7.5 17v-6.5M4.5 17v-4.5M1.75 17v-2" />
    </>
  ),
  "apple-music": (
    <>
      <path d="M9 18V6l11-2v12" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="17.5" cy="16" r="2.5" />
    </>
  ),
  website: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </>
  ),
};

export interface SocialIconProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  platform: SocialPlatform;
  /** Pixel size (default 20). */
  size?: number;
}

/** Decorative platform icon (aria-hidden). Label the surrounding link yourself. */
export function SocialIcon({ platform, size = 20, strokeWidth = 1.75, ...rest }: SocialIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-platform={platform}
      {...rest}
    >
      {PATHS[platform] ?? PATHS.website}
    </svg>
  );
}

export function socialPlatformLabel(platform: SocialPlatform): string {
  return SOCIAL_PLATFORM_LABELS[platform] ?? "Website";
}
