import { ArrowRight, ArrowUpRight } from "lucide-react";
import { CARD_FOCUS, IMAGE_ZOOM, META, STRETCHED_LINK } from "@/components/cards/card-styles";
import { SmartImage } from "@/components/ui/SmartImage";
import { TRENDING_MOVEMENT_LABELS, TRENDING_TYPE_LABELS } from "@/lib/constants";
import { cn, isExternalUrl } from "@/lib/utils";
import type { TrendingChartEntry } from "@/types/content";
import { EntryLink, entryHref, isListenable, padPosition } from "./entry";
import { Movement } from "./Movement";
import { PlayToggle } from "./PlayToggle";

export interface TrendingChartListProps {
  entries: TrendingChartEntry[];
  className?: string;
}

function ChartRow({ entry }: { entry: TrendingChartEntry }) {
  const href = entryHref(entry);
  const listen = isListenable(entry);
  const titleId = `chart-entry-${entry.id}`;
  const external = href ? isExternalUrl(href) : false;

  return (
    <li value={entry.position} className="border-b border-line">
      <article
        aria-labelledby={titleId}
        className={cn(
          "group relative grid grid-cols-[2.75rem_3.5rem_minmax(0,1fr)_auto] items-center gap-x-3 py-4",
          "sm:grid-cols-[4.5rem_4.5rem_minmax(0,1fr)_auto] sm:gap-x-5 md:grid-cols-[6rem_5rem_minmax(0,1fr)_auto] md:gap-x-6 md:py-5",
          CARD_FOCUS,
        )}
      >
        {/* Position + movement are visual; the heading and the sr-only line below carry them. */}
        <div aria-hidden="true" className="flex flex-col items-start gap-2">
          <span className="font-display text-3xl leading-none font-extrabold tracking-tight tabular-nums text-fg transition-colors duration-150 [font-stretch:85%] sm:text-display-md">
            {padPosition(entry.position)}
          </span>
          <Movement movement={entry.movement} />
        </div>

        <SmartImage
          image={entry.image}
          alt=""
          decorative
          sizes="80px"
          monogram={entry.title.trim().charAt(0).toUpperCase() || "M"}
          className="aspect-square w-full rounded-md border border-line"
          imgClassName={IMAGE_ZOOM}
        />

        <div className="min-w-0">
          <p className={cn(META, "text-[0.6875rem] text-highlight")}>{TRENDING_TYPE_LABELS[entry.type]}</p>
          <h3 id={titleId} className="mt-1 line-clamp-2 font-display text-lg leading-snug font-bold break-words text-fg sm:text-display-sm">
            <span className="sr-only">Number {entry.position}: </span>
            {href ? (
              <EntryLink href={href} className={STRETCHED_LINK}>
                {entry.title}
              </EntryLink>
            ) : (
              entry.title
            )}
          </h3>
          {entry.subtitle ? <p className="mt-1 truncate text-sm text-fg-muted">{entry.subtitle}</p> : null}
          {entry.movement ? <p className="sr-only">{TRENDING_MOVEMENT_LABELS[entry.movement]}</p> : null}
        </div>

        {listen ? (
          <PlayToggle
            title={entry.title}
            subtitle={entry.subtitle}
            embedUrl={entry.embedUrl}
            panelClassName="col-span-full pt-4"
          />
        ) : href ? (
          <span
            aria-hidden="true"
            className="inline-flex size-11 items-center justify-center rounded-pill border border-line text-fg-subtle transition-colors duration-150 group-hover:border-fg group-hover:text-fg"
          >
            {external ? <ArrowUpRight size={18} strokeWidth={1.75} /> : <ArrowRight size={18} strokeWidth={1.75} />}
          </span>
        ) : (
          <span aria-hidden="true" />
        )}
      </article>
    </li>
  );
}

/**
 * Ranked chart rows: big position numeral with a movement arrow / NEW badge, cover, type, title
 * and subtitle. Each row links to its artist or story (the whole row is the hit area); songs
 * get a Play button that opens the player inline under the row.
 */
export function TrendingChartList({ entries, className }: TrendingChartListProps) {
  if (entries.length === 0) return null;
  return (
    <ol className={cn("border-t border-line", className)}>
      {entries.map((entry) => (
        <ChartRow key={entry.id} entry={entry} />
      ))}
    </ol>
  );
}
