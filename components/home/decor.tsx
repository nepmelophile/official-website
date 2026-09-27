import { useId } from "react";
import { SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface RecordStickerProps {
  /** Text set around the rim (repeated to fill it). Rendered uppercase. */
  text?: string;
  className?: string;
}

/**
 * Orchid (highlight) record-label sticker with type set on a circle and a cobalt spindle. It is
 * decorative (aria-hidden) and spins only while the pointer is over it, so nothing on the
 * page moves unprompted.
 */
export function RecordSticker({ text = `${SITE_NAME} ✦ The sound of Nepal ✦ Amplified ✦`, className }: RecordStickerProps) {
  const pathId = `rim-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const circumference = 2 * Math.PI * 76;

  return (
    <div aria-hidden="true" className={cn("group/sticker select-none", className)}>
      <svg
        viewBox="0 0 200 200"
        className="size-full animate-spin drop-shadow-[0_18px_40px_rgb(0_0_0/0.55)] [animation-play-state:paused] group-hover/sticker:[animation-play-state:running]"
        style={{ animationDuration: "14s" }}
      >
        <defs>
          <path id={pathId} d="M100,100 m-76,0 a76,76 0 1,1 152,0 a76,76 0 1,1 -152,0" />
        </defs>
        <circle cx="100" cy="100" r="99" className="fill-highlight" />
        <circle cx="100" cy="100" r="92" fill="none" className="stroke-highlight-fg/25" strokeWidth="0.75" />
        <circle cx="100" cy="100" r="58" fill="none" className="stroke-highlight-fg/25" strokeWidth="0.75" />
        <text
          className="fill-highlight-fg font-mono font-semibold uppercase"
          fontSize="12.5"
          letterSpacing="1.5"
        >
          <textPath href={`#${pathId}`} textLength={circumference.toFixed(1)} lengthAdjust="spacing">
            {text}
          </textPath>
        </text>
        <circle cx="100" cy="100" r="30" className="fill-secondary" />
        <circle cx="100" cy="100" r="30" fill="none" className="stroke-ink-950/20" strokeWidth="6" />
        <circle cx="100" cy="100" r="5" className="fill-ink-950" />
      </svg>
    </div>
  );
}

export interface VinylGroovesProps {
  className?: string;
}

/** Huge, faint concentric grooves used as texture behind heroes and the CTA band. */
export function VinylGrooves({ className }: VinylGroovesProps) {
  const rings = Array.from({ length: 16 }, (_, i) => 480 - i * 26);
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1000 1000"
      fill="none"
      className={cn("pointer-events-none select-none", className)}
    >
      {rings.map((r, i) => (
        <circle
          key={r}
          cx="500"
          cy="500"
          r={r}
          stroke="currentColor"
          strokeWidth={i % 4 === 0 ? 1.5 : 0.75}
          strokeOpacity={i % 4 === 0 ? 0.9 : 0.55}
        />
      ))}
      <circle cx="500" cy="500" r="64" className="fill-orchid-900" />
      <circle cx="500" cy="500" r="10" className="fill-bg" />
    </svg>
  );
}
