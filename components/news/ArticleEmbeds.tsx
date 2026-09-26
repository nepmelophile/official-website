import { Embed } from "@/components/ui/Embed";
import { getEmbedProvider, isEmbeddableUrl } from "@/lib/embeds";
import { cn } from "@/lib/utils";
import type { EmbedRef } from "@/types/content";

export const LISTEN_SECTION_ID = "listen";

export type EmbedKind = "audio" | "video" | "mixed";

/** Only Spotify / YouTube / SoundCloud URLs that lib/embeds.ts can turn into players. */
export function playableEmbeds(embeds: readonly EmbedRef[]): EmbedRef[] {
  return embeds.filter((embed) => isEmbeddableUrl(embed.url));
}

/** Whether a set of embeds is all audio (Spotify/SoundCloud), all video (YouTube) or both. */
export function embedKind(embeds: readonly EmbedRef[]): EmbedKind {
  const video = embeds.filter((embed) => getEmbedProvider(embed.url) === "youtube").length;
  if (video === 0) return "audio";
  if (video === embeds.length) return "video";
  return "mixed";
}

const HEADINGS: Record<EmbedKind, { kicker: string; title: string }> = {
  audio: { kicker: "Press play", title: "Listen" },
  video: { kicker: "Press play", title: "Watch" },
  mixed: { kicker: "Press play", title: "Listen & watch" },
};

export interface ArticleEmbedsProps {
  /** Already filtered with `playableEmbeds`. */
  embeds: readonly EmbedRef[];
  /** Story title, used to give each player a descriptive iframe title. */
  articleTitle: string;
  className?: string;
}

/** "Listen / Watch" block with lazy Spotify, YouTube and SoundCloud players. */
export function ArticleEmbeds({ embeds, articleTitle, className }: ArticleEmbedsProps) {
  if (embeds.length === 0) return null;
  const heading = HEADINGS[embedKind(embeds)];

  return (
    <section
      id={LISTEN_SECTION_ID}
      aria-labelledby="listen-heading"
      className={cn("max-w-reading scroll-mt-28 border-t border-line pt-8", className)}
    >
      <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
        <span aria-hidden="true" className="size-1.5 animate-pulse-dot rounded-pill bg-vermilion-500" />
        {heading.kicker}
      </p>
      <h2 id="listen-heading" className="mt-3 font-display text-display-sm font-bold text-fg">
        {heading.title}
      </h2>
      <ul className="mt-8 flex flex-col gap-8">
        {embeds.map((embed, i) => (
          <li key={`${embed.url}-${i}`}>
            <Embed
              url={embed.url}
              title={embed.title || (embeds.length > 1 ? `${articleTitle} (${i + 1} of ${embeds.length})` : articleTitle)}
              caption={embed.title}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
