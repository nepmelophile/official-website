import Link from "next/link";
import type { ReactNode } from "react";
import { Headphones } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { TRENDING_TYPE_LABELS } from "@/lib/constants";
import { cn, isExternalUrl } from "@/lib/utils";
import type { TrendingCard as TrendingCardData } from "@/types/content";
import { CARD_FOCUS, META, STRETCHED_LINK } from "./card-styles";

export type { TrendingCardData };

export interface TrendingCardProps {
  item: TrendingCardData;
  /** ticker = compact inline item for the Marquee (default); tile = grid card. */
  variant?: "ticker" | "tile";
  headingLevel?: "h3" | "h4" | "p";
  className?: string;
}

const rankLabel = (rank: number) => `#${String(rank).padStart(2, "0")}`;

/** Resolves where the item links: explicit href, else the embed/listen URL, else nothing. */
function linkTarget(item: TrendingCardData): string | null {
  return item.href || item.embedUrl || null;
}

function ItemLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  if (isExternalUrl(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

/** Trending artist / song / update, resolved by getTrending(). */
export function TrendingCard({ item, variant = "ticker", headingLevel: Heading = "p", className }: TrendingCardProps) {
  const href = linkTarget(item);
  const typeLabel = TRENDING_TYPE_LABELS[item.type];
  const listen = item.type === "song" && Boolean(item.embedUrl);
  const title = href ? (
    <ItemLink href={href} className={STRETCHED_LINK}>
      {item.title}
    </ItemLink>
  ) : (
    item.title
  );

  if (variant === "tile") {
    return (
      <article className={cn("group relative flex flex-col rounded-md", CARD_FOCUS, className)}>
        <div className="relative">
          <SmartImage
            image={item.image}
            alt={item.title}
            sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
            className="aspect-square rounded-md"
            imgClassName="transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]"
          />
          <span className="absolute top-2 left-2 rounded-xs bg-ink-950/85 px-2 py-1 font-mono text-sm font-semibold text-highlight">
            {rankLabel(item.rank)}
          </span>
        </div>
        <p className={cn(META, "mt-3 flex items-center gap-2 text-[0.6875rem] text-fg-subtle")}>
          {typeLabel}
          {listen ? (
            <span className="inline-flex items-center gap-1 text-highlight">
              <Headphones size={12} strokeWidth={1.75} aria-hidden="true" />
              Listen
            </span>
          ) : null}
        </p>
        <Heading className="mt-1.5 line-clamp-2 font-display text-lg leading-snug font-semibold text-fg">{title}</Heading>
        {item.subtitle ? <p className="mt-1 line-clamp-1 text-sm text-fg-muted">{item.subtitle}</p> : null}
      </article>
    );
  }

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 rounded-sm py-1 pr-2",
        CARD_FOCUS,
        "has-[a:focus-visible]:outline-offset-2",
        className,
      )}
    >
      <span className="font-mono text-sm font-medium text-highlight">
        <span className="sr-only">Rank </span>
        {rankLabel(item.rank)}
      </span>
      <SmartImage
        image={item.image}
        alt=""
        decorative
        sizes="40px"
        className="size-10 shrink-0 rounded-sm"
        imgClassName="transition-transform duration-500 ease-out-expo group-hover:scale-110"
      />
      <span className="flex min-w-0 flex-col leading-tight">
        <Heading className="max-w-[18rem] truncate font-display text-base font-semibold text-fg transition-colors group-hover:text-orchid-300">
          {title}
        </Heading>
        <span className="max-w-[18rem] truncate text-xs text-fg-subtle">
          <span className="sr-only">{typeLabel}: </span>
          {item.subtitle || typeLabel}
        </span>
      </span>
      {listen ? (
        <Headphones size={14} strokeWidth={1.75} aria-hidden="true" className="shrink-0 text-highlight" />
      ) : null}
    </div>
  );
}
