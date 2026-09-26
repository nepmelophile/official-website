"use client";

import type { ReactNode } from "react";
import { SOCIAL_PLATFORM_LABELS, SOCIAL_PLATFORMS } from "@/lib/constants";
import type { SocialLink, SocialPlatform } from "@/types/content";
import { Select, TextInput } from "./inputs";
import { Repeater } from "./Repeater";

const PLATFORM_OPTIONS = SOCIAL_PLATFORMS.map((p) => ({ value: p, label: SOCIAL_PLATFORM_LABELS[p] }));

const PLACEHOLDERS: Record<SocialPlatform, string> = {
  spotify: "https://open.spotify.com/artist/…",
  youtube: "https://www.youtube.com/@…",
  instagram: "https://www.instagram.com/…",
  facebook: "https://www.facebook.com/…",
  tiktok: "https://www.tiktok.com/@…",
  x: "https://x.com/…",
  "apple-music": "https://music.apple.com/…",
  soundcloud: "https://soundcloud.com/…",
  website: "https://…",
};

/** Guess the platform from a pasted URL (keeps the current choice when unknown). */
function detectPlatform(url: string): SocialPlatform | null {
  let host: string;
  try {
    host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
  if (host.endsWith("spotify.com")) return "spotify";
  if (host.endsWith("youtube.com") || host === "youtu.be") return "youtube";
  if (host.endsWith("instagram.com")) return "instagram";
  if (host.endsWith("facebook.com") || host === "fb.com") return "facebook";
  if (host.endsWith("tiktok.com")) return "tiktok";
  if (host === "x.com" || host.endsWith("twitter.com")) return "x";
  if (host === "music.apple.com") return "apple-music";
  if (host.endsWith("soundcloud.com")) return "soundcloud";
  return null;
}

export interface SocialLinksFieldProps {
  /** Field name for error paths (default "socialLinks" → "socialLinks.0.url"). */
  name?: string;
  value: SocialLink[];
  onChange: (links: SocialLink[]) => void;
  /** Error lookup, usually `form.error`. */
  errorFor?: (path: string) => string | undefined;
  label?: ReactNode;
  hint?: ReactNode;
  maxItems?: number;
  disabled?: boolean;
}

/** Social links editor (platform + URL rows). Pasting a known URL auto-selects the platform. */
export function SocialLinksField({
  name = "socialLinks",
  value,
  onChange,
  errorFor,
  label = "Social links",
  hint = "Paste a profile URL — the platform is detected automatically.",
  maxItems = 12,
  disabled,
}: SocialLinksFieldProps) {
  return (
    <Repeater<SocialLink>
      label={label}
      name={name}
      hint={hint}
      error={errorFor?.(name)}
      items={value}
      onChange={onChange}
      createItem={() => ({ platform: "instagram", url: "" })}
      addLabel="Add link"
      emptyText="No social links yet."
      maxItems={maxItems}
      compact
      disabled={disabled}
      renderItem={(item, row) => (
        <div className="grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
          <Select<SocialPlatform>
            label="Platform"
            value={item.platform}
            onChange={(platform) => row.update({ platform: platform || "website" })}
            options={PLATFORM_OPTIONS}
            error={errorFor?.(`${row.path}.platform`)}
            disabled={disabled}
          />
          <TextInput
            type="url"
            label="URL"
            value={item.url}
            onChange={(url) => {
              const trimmed = url.trim();
              const detected = detectPlatform(trimmed);
              row.update({ url: trimmed, ...(detected ? { platform: detected } : {}) });
            }}
            placeholder={PLACEHOLDERS[item.platform]}
            error={errorFor?.(`${row.path}.url`)}
            disabled={disabled}
            required
          />
        </div>
      )}
    />
  );
}
