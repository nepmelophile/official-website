"use client";

import { useId, useState } from "react";
import { Play, X } from "lucide-react";
import { Embed } from "@/components/ui/Embed";
import { cn } from "@/lib/utils";

export interface PlayToggleProps {
  /** Song title (accessible name of the button and the player). */
  title: string;
  /** Usually the artist (used in the player title). */
  subtitle?: string;
  embedUrl: string;
  /** Classes for the button (placed in the row's action column). */
  className?: string;
  /** Classes for the player panel (e.g. `col-span-full` to span the row grid). */
  panelClassName?: string;
}

/**
 * "Play" disclosure for a chart row: a button (`aria-expanded` / `aria-controls`) that mounts the
 * Spotify / YouTube / SoundCloud player inline, right below the row. Renders a fragment so the
 * button and the panel can sit in different cells of the parent grid. The iframe only loads once
 * opened, so a long chart doesn't load a dozen players up front.
 */
export function PlayToggle({ title, subtitle, embedUrl, className, panelClassName }: PlayToggleProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const playerTitle = subtitle ? `${title} by ${subtitle}` : title;

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "relative z-20 inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-pill border px-3 font-mono text-xs uppercase tracking-[0.14em] transition-colors duration-150 sm:px-4",
          open
            ? "border-accent bg-accent text-accent-fg hover:bg-accent-hover"
            : "border-line-strong text-fg hover:border-fg hover:bg-surface",
          className,
        )}
      >
        {open ? (
          <X size={16} strokeWidth={1.75} aria-hidden="true" />
        ) : (
          <Play size={16} strokeWidth={1.75} aria-hidden="true" className="fill-current" />
        )}
        <span className="max-sm:sr-only">{open ? "Close" : "Play"}</span>
        <span className="sr-only"> {playerTitle}</span>
      </button>
      <div id={panelId} hidden={!open} className={cn("relative z-20", panelClassName)}>
        {open ? <Embed url={embedUrl} title={playerTitle} /> : null}
      </div>
    </>
  );
}
