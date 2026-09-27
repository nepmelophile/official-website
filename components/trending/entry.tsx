import Link from "next/link";
import type { ReactNode } from "react";
import { isEmbeddableUrl } from "@/lib/embeds";
import { isExternalUrl } from "@/lib/utils";
import type { TrendingCard } from "@/types/content";

/** "07" — chart positions are always two digits. */
export function padPosition(position: number): string {
  return String(position).padStart(2, "0");
}

/**
 * Where an entry links: the resolved href (/artists/…, /news/… or a manual link), else the
 * player URL, else nothing — the same rule as the homepage ticker (TrendingCard).
 */
export function entryHref(entry: Pick<TrendingCard, "href" | "embedUrl">): string | null {
  return entry.href || entry.embedUrl || null;
}

/** Songs with a Spotify / YouTube / SoundCloud link play inline on /trending. */
export function isListenable(entry: Pick<TrendingCard, "type" | "embedUrl">): entry is TrendingCard & { embedUrl: string } {
  return entry.type === "song" && isEmbeddableUrl(entry.embedUrl);
}

/** Button label for an entry's link, based on where it goes. */
export function entryLinkLabel(href: string): string {
  if (isExternalUrl(href)) return "Open link";
  if (href.startsWith("/artists/")) return "View artist";
  if (href.startsWith("/news/")) return "Read the story";
  return "Open";
}

/** Internal paths use next/link; absolute URLs open in a new tab (announced to screen readers). */
export function EntryLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
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
