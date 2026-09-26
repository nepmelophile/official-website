import { ArrowUpRight, AudioLines } from "lucide-react";
import { EMBED_PROVIDER_LABELS, toEmbed, type EmbedProvider } from "@/lib/embeds";
import { cn } from "@/lib/utils";

export interface EmbedProps {
  /** Spotify / YouTube / SoundCloud page URL. */
  url: string;
  /** Descriptive title (used for the iframe `title` and the fallback link). */
  title?: string;
  /** Optional caption under the player. */
  caption?: string;
  className?: string;
}

const ALLOW: Record<EmbedProvider, string> = {
  spotify: "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture",
  youtube: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
  soundcloud: "autoplay; encrypted-media",
};

function hostLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "link";
  }
}

/**
 * Responsive, lazy-loaded Spotify/YouTube/SoundCloud player. URLs that `toEmbed` rejects fall
 * back to a plain outbound link (only http(s) URLs; anything else renders nothing).
 */
export function Embed({ url, title, caption, className }: EmbedProps) {
  const embed = toEmbed(url);

  if (!embed) {
    if (!/^https?:\/\//i.test(url)) return null;
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "group flex min-h-16 items-center gap-4 rounded-md border border-line bg-surface px-5 py-4 transition-colors duration-150 hover:border-line-strong",
          className,
        )}
      >
        <AudioLines size={20} strokeWidth={1.75} aria-hidden="true" className="shrink-0 text-highlight" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-fg">{title || "Listen"}</span>
          <span className="block font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">{hostLabel(url)}</span>
        </span>
        <ArrowUpRight
          size={18}
          strokeWidth={1.75}
          aria-hidden="true"
          className="shrink-0 text-fg-muted transition-transform duration-300 ease-out-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        />
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }

  const label = EMBED_PROVIDER_LABELS[embed.provider];
  const frameTitle = title ? `${title} — ${label} player` : `${label} player`;
  const isVideo = Boolean(embed.aspectRatio);

  return (
    <figure className={cn("m-0", className)}>
      <div
        className={cn(
          "overflow-hidden border border-line bg-surface",
          embed.provider === "spotify" ? "rounded-[12px]" : "rounded-md",
        )}
        style={isVideo ? { aspectRatio: embed.aspectRatio } : { height: embed.height }}
      >
        <iframe
          src={embed.src}
          title={frameTitle}
          loading="lazy"
          allow={ALLOW[embed.provider]}
          allowFullScreen={embed.provider !== "soundcloud"}
          referrerPolicy="strict-origin-when-cross-origin"
          className="block size-full border-0"
          width="100%"
          height={isVideo ? "100%" : embed.height}
        />
      </div>
      {caption ? (
        <figcaption className="mt-3 font-mono text-xs uppercase tracking-[0.12em] text-fg-subtle">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
