import { ArrowUpRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { mapsSearchUrl } from "./map-embed";

export interface ContactMapProps {
  /** A src already vetted by `toSafeMapEmbedUrl()`. */
  src: string;
  address?: string;
  className?: string;
}

const META = "font-mono text-xs uppercase tracking-[0.14em]";

/**
 * Lazy map iframe (allow-listed src only), tinted to sit in the dark theme (inverted + hue-rotated so the
 * pin stays red), with the address and a "Get directions" link underneath.
 */
export function ContactMap({ src, address, className }: ContactMapProps) {
  return (
    <figure className={cn("m-0", className)}>
      <div className="relative overflow-hidden rounded-xl border border-line bg-surface shadow-card">
        <iframe
          src={src}
          title={address ? `Map showing our office at ${address}` : "Map showing our office"}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          className="block h-80 w-full border-0 [filter:invert(0.9)_hue-rotate(180deg)_saturate(0.6)_brightness(0.95)] md:h-[28rem]"
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-line ring-inset" />
      </div>
      {address ? (
        <figcaption className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className={cn(META, "flex items-start gap-2 text-fg-muted")}>
            <MapPin size={16} strokeWidth={1.75} aria-hidden="true" className="mt-px shrink-0 text-vermilion-400" />
            {address}
          </span>
          <a
            href={mapsSearchUrl(address)}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              META,
              "group inline-flex min-h-11 items-center gap-2 self-start text-fg transition-colors hover:text-vermilion-300 sm:self-auto",
            )}
          >
            Get directions
            <ArrowUpRight
              size={16}
              strokeWidth={1.75}
              aria-hidden="true"
              className="transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
            <span className="sr-only"> (opens Google Maps in a new tab)</span>
          </a>
        </figcaption>
      ) : null}
    </figure>
  );
}
