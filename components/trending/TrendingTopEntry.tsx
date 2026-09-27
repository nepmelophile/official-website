import { META } from "@/components/cards/card-styles";
import { ButtonLink } from "@/components/ui/Button";
import { Embed } from "@/components/ui/Embed";
import { SmartImage } from "@/components/ui/SmartImage";
import { TRENDING_TYPE_LABELS } from "@/lib/constants";
import { cn, isExternalUrl } from "@/lib/utils";
import type { TrendingChartEntry } from "@/types/content";
import { entryHref, entryLinkLabel, isListenable, padPosition } from "./entry";
import { Movement } from "./Movement";

export interface TrendingTopEntryProps {
  entry: TrendingChartEntry;
  /** id for the entry title (the surrounding section is labelled by the kicker, not this). */
  titleId: string;
  className?: string;
}

/**
 * The chart's top entry: a large image with a poster-size position numeral, the title in display
 * type, and either the inline player (songs) or a link to the artist / story.
 */
export function TrendingTopEntry({ entry, titleId, className }: TrendingTopEntryProps) {
  const href = entryHref(entry);
  const listen = isListenable(entry);
  // A song whose only link is its player URL doesn't need a second "open" button.
  const showLink = Boolean(href) && !(listen && href === entry.embedUrl);
  const byline = entry.subtitle ? `${entry.title} by ${entry.subtitle}` : entry.title;

  return (
    <article aria-labelledby={titleId} className={cn("grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-12", className)}>
      <div className="relative lg:col-span-7">
        <SmartImage
          image={entry.image}
          alt={entry.title}
          sizes="(min-width: 1024px) 55vw, 100vw"
          preload
          quality={90}
          monogram={entry.title.trim().charAt(0).toUpperCase() || "M"}
          className="aspect-[4/3] rounded-xl border border-line"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 rounded-b-xl bg-linear-to-t from-bg/90 via-bg/40 to-transparent"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-2 left-4 font-display text-[clamp(6.5rem,3rem+14vw,15rem)] leading-[0.78] font-extrabold tracking-[-0.06em] tabular-nums text-brand-gradient select-none [font-stretch:80%] md:bottom-4 md:left-7"
        >
          {padPosition(entry.position)}
        </span>
      </div>

      <div className="lg:col-span-5">
        <p className={cn(META, "flex flex-wrap items-center gap-x-3 gap-y-2 text-fg-subtle")}>
          <span className="text-highlight">{TRENDING_TYPE_LABELS[entry.type]}</span>
          <Movement movement={entry.movement} size="lg" />
        </p>
        <h3
          id={titleId}
          className="mt-4 font-display text-display-lg font-extrabold break-words text-fg [font-stretch:88%]"
        >
          <span className="sr-only">Number {entry.position}: </span>
          {entry.title}
        </h3>
        {entry.subtitle ? <p className="mt-4 text-lg text-fg-muted md:text-xl">{entry.subtitle}</p> : null}

        {listen ? <Embed url={entry.embedUrl} title={byline} className="mt-8" /> : null}

        {showLink && href ? (
          <ButtonLink
            href={href}
            size="lg"
            variant={listen ? "secondary" : "primary"}
            icon={isExternalUrl(href) ? "arrow-up-right" : "arrow-right"}
            className="mt-8"
          >
            {entryLinkLabel(href)}
            <span className="sr-only">: {entry.title}</span>
          </ButtonLink>
        ) : null}
      </div>
    </article>
  );
}
