"use client";

import { CircleAlert, Eye, EyeOff, Info } from "lucide-react";
import { TrendingCard } from "@/components/cards/TrendingCard";
import { SmartImage } from "@/components/ui/SmartImage";
import { EMBED_PROVIDER_LABELS, getEmbedProvider } from "@/lib/embeds";
import { cn } from "@/lib/utils";
import type { TrendingType } from "@/types/content";
import type { DisplayField, TrendingResolution } from "./resolve";

export interface TrendingPreviewProps {
  resolution: TrendingResolution;
  type: TrendingType;
  rank: number;
}

const FIELD_LABELS: Record<DisplayField, string> = {
  title: "Title",
  subtitle: "Subtitle",
  image: "Image",
  href: "Link",
  embedUrl: "Player",
};

/**
 * "Resolved preview" of a trending item: the public card (ticker + tile) rendered with the
 * values the site will actually use, whether the item will show, and where every value
 * comes from (the linked artist/article or the manual fields).
 */
export function TrendingPreview({ resolution, type, rank }: TrendingPreviewProps) {
  const { display, sources, linked, visible, hiddenReason, notes } = resolution;
  const card = display.title
    ? {
        id: "preview",
        type,
        rank: Math.max(1, rank),
        title: display.title,
        subtitle: display.subtitle,
        image: display.image,
        href: display.href,
        embedUrl: display.embedUrl,
      }
    : null;

  function sourceLabel(field: DisplayField): { text: string; manual: boolean } | null {
    const source = sources[field];
    if (!source) return null;
    if (source === "linked") return { text: linked?.kind === "article" ? "From article" : "From artist", manual: false };
    return { text: linked ? "Override" : "Custom", manual: true };
  }

  function valueFor(field: DisplayField) {
    switch (field) {
      case "image":
        return display.image ? (
          <span className="flex items-center gap-2">
            <SmartImage image={display.image} alt="" decorative sizes="28px" className="size-7 shrink-0 rounded-xs" />
            <span className="truncate text-fg-muted">{display.image.alt || "Image"}</span>
          </span>
        ) : (
          <span className="text-fg-subtle">Monogram placeholder</span>
        );
      case "embedUrl": {
        const provider = getEmbedProvider(display.embedUrl);
        return display.embedUrl ? (
          <span className="text-fg-muted">{provider ? EMBED_PROVIDER_LABELS[provider] : "Unsupported link"}</span>
        ) : (
          <span className="text-fg-subtle">None</span>
        );
      }
      case "href":
        return display.href ? (
          <span className="block truncate font-mono text-xs text-fg-muted">{display.href}</span>
        ) : (
          <span className="text-fg-subtle">None</span>
        );
      default: {
        const text = display[field];
        return text ? <span className="block truncate text-fg">{text}</span> : <span className="text-fg-subtle">None</span>;
      }
    }
  }

  return (
    <div className="space-y-4">
      <p
        aria-live="polite"
        className={cn(
          "flex items-start gap-2 rounded-sm border px-3 py-2 text-sm",
          visible ? "border-success/40 bg-success/10 text-fg" : "border-highlight/40 bg-marigold-900/40 text-fg",
        )}
      >
        {visible ? (
          <Eye aria-hidden className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={1.75} />
        ) : (
          <EyeOff aria-hidden className="mt-0.5 size-4 shrink-0 text-highlight" strokeWidth={1.75} />
        )}
        <span>{visible ? "Will show in the trending strip." : (hiddenReason ?? "Hidden.")}</span>
      </p>

      {card ? (
        <div className="space-y-3">
          <div inert className="overflow-hidden rounded-sm border border-line bg-bg-alt px-3 py-2">
            <TrendingCard item={card} variant="ticker" />
          </div>
          <div inert className="w-40">
            <TrendingCard item={card} variant="tile" />
          </div>
        </div>
      ) : (
        <div className="flex aspect-[3/1] items-center justify-center rounded-sm border border-dashed border-line-strong px-4 text-center text-xs text-fg-subtle">
          The card appears here once it has a title.
        </div>
      )}

      <dl className="divide-y divide-line rounded-sm border border-line text-sm">
        {(Object.keys(FIELD_LABELS) as DisplayField[]).map((field) => {
          const source = sourceLabel(field);
          return (
            <div key={field} className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-1 px-3 py-2">
              <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-fg-subtle">{FIELD_LABELS[field]}</dt>
              <dd className="flex min-w-0 items-center justify-between gap-2">
                <span className="min-w-0 flex-1">{valueFor(field)}</span>
                {source ? (
                  <span
                    className={cn(
                      "shrink-0 rounded-xs border px-1.5 py-px font-mono text-[0.625rem] uppercase tracking-[0.1em]",
                      source.manual ? "border-info/40 text-info" : "border-line-strong text-fg-subtle",
                    )}
                  >
                    {source.text}
                  </span>
                ) : null}
              </dd>
            </div>
          );
        })}
      </dl>

      {notes.length > 0 ? (
        <ul className="space-y-1.5 text-xs text-fg-muted">
          {notes.map((note) => (
            <li key={note.text} className="flex items-start gap-2">
              {note.tone === "warning" ? (
                <CircleAlert aria-hidden className="mt-px size-3.5 shrink-0 text-danger" strokeWidth={1.75} />
              ) : (
                <Info aria-hidden className="mt-px size-3.5 shrink-0 text-fg-subtle" strokeWidth={1.75} />
              )}
              <span>{note.text}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
