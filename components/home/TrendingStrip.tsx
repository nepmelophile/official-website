import { TrendingCard } from "@/components/cards/TrendingCard";
import { Marquee } from "@/components/ui/Marquee";
import { isEmbeddableUrl } from "@/lib/embeds";
import type { TrendingCard as TrendingCardData } from "@/types/content";
import { ListenButton, NowPlayingProvider } from "./NowPlaying";

export interface TrendingStripProps {
  items: TrendingCardData[];
}

/** Seconds per loop so the ticker moves at a steady pace whatever the item count. */
function loopSeconds(count: number): number {
  return Math.min(120, Math.max(32, count * 7));
}

/**
 * Full-bleed "● TRENDING" ticker under the hero. Songs with a Spotify / YouTube / SoundCloud
 * link get a Listen button that opens the track in a docked player without leaving the page.
 * Renders nothing when there are no active trending items.
 */
export function TrendingStrip({ items }: TrendingStripProps) {
  if (items.length === 0) return null;

  const nodes = items.map((item) => {
    const listenable = item.type === "song" && isEmbeddableUrl(item.embedUrl);
    return (
      <div key={item.id} className="flex items-center gap-2">
        <TrendingCard item={item} variant="ticker" />
        {listenable && item.embedUrl ? (
          <ListenButton
            track={{ id: item.id, title: item.title, subtitle: item.subtitle, embedUrl: item.embedUrl }}
          />
        ) : null}
      </div>
    );
  });

  return (
    <NowPlayingProvider>
      <section aria-labelledby="home-trending-title" className="border-b border-line bg-bg-alt">
        <div className="mx-auto flex w-full max-w-[120rem] items-stretch">
          <div className="flex shrink-0 items-center gap-2.5 border-r border-line bg-bg-alt py-3 pr-4 pl-gutter md:pr-6">
            <span aria-hidden="true" className="size-2 animate-pulse-dot rounded-pill bg-vermilion-500" />
            <h2
              id="home-trending-title"
              className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-fg"
            >
              Trending
            </h2>
          </div>
          <Marquee
            items={nodes}
            label="Trending now"
            durationSeconds={loopSeconds(items.length)}
            className="min-w-0 flex-1 py-1.5 pr-gutter pl-2 md:pl-4"
          />
        </div>
      </section>
    </NowPlayingProvider>
  );
}
