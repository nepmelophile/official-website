"use client";

import { useState } from "react";
import { EMBED_PROVIDER_LABELS, getEmbedProvider, toEmbed } from "@/lib/embeds";
import { cn } from "@/lib/utils";
import { TextInput, type TextInputProps } from "./inputs";

export type EmbedUrlInputProps = Omit<TextInputProps, "type" | "suggestions" | "labelAside">;

/**
 * URL input for Spotify / YouTube / SoundCloud links: shows the detected provider and an
 * optional live player preview (same iframe src the public site renders via lib/embeds.ts).
 */
export function EmbedUrlInput({ value, hint, placeholder, ...props }: EmbedUrlInputProps) {
  const [showPreview, setShowPreview] = useState(false);
  const url = (value ?? "").trim();
  const provider = url ? getEmbedProvider(url) : null;
  const embed = showPreview && provider ? toEmbed(url) : null;

  return (
    <div className="space-y-2">
      <TextInput
        {...props}
        type="url"
        value={value}
        placeholder={placeholder ?? "https://open.spotify.com/track/… or YouTube / SoundCloud link"}
        hint={hint ?? "Spotify, YouTube or SoundCloud link — it is turned into a player automatically."}
      />
      {url ? (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span
            className={cn(
              "inline-flex items-center rounded-xs border px-2 py-0.5 font-mono text-[0.6875rem] uppercase tracking-[0.12em]",
              provider ? "border-success/40 text-success" : "border-danger/40 text-danger",
            )}
          >
            {provider ? EMBED_PROVIDER_LABELS[provider] : "Not embeddable"}
          </span>
          {provider ? (
            <button
              type="button"
              onClick={() => setShowPreview((s) => !s)}
              aria-expanded={showPreview}
              className="rounded-xs px-1 text-vermilion-300 underline-offset-4 hover:underline"
            >
              {showPreview ? "Hide player" : "Preview player"}
            </button>
          ) : null}
        </div>
      ) : null}
      {embed ? (
        <div
          className={cn("overflow-hidden rounded-md border border-line bg-surface", embed.aspectRatio && "w-full")}
          style={embed.aspectRatio ? { aspectRatio: embed.aspectRatio } : { height: embed.height }}
        >
          <iframe
            src={embed.src}
            title={`${EMBED_PROVIDER_LABELS[embed.provider]} player preview`}
            loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            className="size-full border-0"
          />
        </div>
      ) : null}
    </div>
  );
}
