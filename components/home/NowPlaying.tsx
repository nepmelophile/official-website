"use client";

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Play, Square, X } from "lucide-react";
import { Embed } from "@/components/ui/Embed";
import { EMBED_PROVIDER_LABELS, getEmbedProvider } from "@/lib/embeds";
import { cn } from "@/lib/utils";

export interface NowPlayingTrack {
  id: string;
  title: string;
  subtitle?: string;
  embedUrl: string;
}

interface NowPlayingContextValue {
  current: NowPlayingTrack | null;
  dockId: string;
  play: (track: NowPlayingTrack, trigger: HTMLElement | null) => void;
  stop: () => void;
}

const NowPlayingContext = createContext<NowPlayingContextValue | null>(null);

/**
 * Holds the one track currently open in the "Now playing" dock. Listen buttons (inside the
 * trending marquee) and the dock share it, so a single player is ever mounted.
 */
export function NowPlayingProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<NowPlayingTrack | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const dockId = useId();

  const play = useCallback((track: NowPlayingTrack, trigger: HTMLElement | null) => {
    triggerRef.current = trigger;
    setCurrent(track);
  }, []);

  const stop = useCallback(() => {
    setCurrent(null);
    const trigger = triggerRef.current;
    triggerRef.current = null;
    // Return focus to the button that opened the player (if it is still on the page).
    if (trigger?.isConnected) trigger.focus({ preventScroll: true });
  }, []);

  const value = useMemo(() => ({ current, dockId, play, stop }), [current, dockId, play, stop]);

  return (
    <NowPlayingContext value={value}>
      {children}
      <NowPlayingDock />
    </NowPlayingContext>
  );
}

function useNowPlaying(): NowPlayingContextValue {
  const ctx = use(NowPlayingContext);
  if (!ctx) throw new Error("ListenButton must be rendered inside <NowPlayingProvider>.");
  return ctx;
}

export interface ListenButtonProps {
  track: NowPlayingTrack;
  className?: string;
}

/** Round play/stop toggle that opens the track in the Now playing dock. */
export function ListenButton({ track, className }: ListenButtonProps) {
  const { current, dockId, play, stop } = useNowPlaying();
  const active = current?.id === track.id;
  const who = track.subtitle ? ` by ${track.subtitle}` : "";

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-controls={dockId}
      aria-label={active ? `Close player for ${track.title}` : `Listen to ${track.title}${who}`}
      onClick={(event) => (active ? stop() : play(track, event.currentTarget))}
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-pill border transition-[background-color,border-color,color,box-shadow] duration-150",
        active
          ? "border-highlight bg-highlight text-highlight-fg shadow-glow-marigold"
          : "border-line-strong text-highlight hover:border-highlight hover:bg-marigold-900",
        className,
      )}
    >
      {active ? (
        <Square size={12} strokeWidth={2} aria-hidden="true" className="fill-current" />
      ) : (
        <Play size={14} strokeWidth={2} aria-hidden="true" className="translate-x-px fill-current" />
      )}
    </button>
  );
}

/**
 * Floating player docked bottom-right (full width on phones). Non-modal: the page stays
 * usable. Focus moves into the dock when a track opens, Esc closes it and focus returns to
 * the Listen button.
 */
function NowPlayingDock() {
  const { current, dockId, stop } = useNowPlaying();
  const dockRef = useRef<HTMLDivElement>(null);
  const titleId = `${dockId}-title`;

  useEffect(() => {
    if (!current) return;
    dockRef.current?.focus({ preventScroll: true });
  }, [current]);

  const provider = current ? getEmbedProvider(current.embedUrl) : null;

  return (
    <div
      ref={dockRef}
      id={dockId}
      role="region"
      aria-labelledby={current ? titleId : undefined}
      aria-label={current ? undefined : "Now playing"}
      tabIndex={-1}
      hidden={!current}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          stop();
        }
      }}
      className="fixed inset-x-3 bottom-3 z-50 animate-fade-up rounded-lg border border-line-strong bg-surface p-3 shadow-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-highlight sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[26rem] sm:p-4"
    >
      {current ? (
        <>
          <div className="mb-3 flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-subtle">
                <span aria-hidden="true" className="size-1.5 animate-pulse-dot rounded-pill bg-vermilion-500" />
                Now playing{provider ? ` · ${EMBED_PROVIDER_LABELS[provider]}` : ""}
              </p>
              <p id={titleId} className="mt-1 truncate font-display text-lg leading-snug font-semibold text-fg">
                <span className="sr-only">Now playing: </span>
                {current.title}
              </p>
              {current.subtitle ? <p className="truncate text-sm text-fg-muted">{current.subtitle}</p> : null}
            </div>
            <button
              type="button"
              onClick={stop}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-pill border border-line text-fg-muted transition-colors hover:border-fg hover:text-fg"
            >
              <X size={18} strokeWidth={1.75} aria-hidden="true" />
              <span className="sr-only">Close player</span>
            </button>
          </div>
          <Embed key={current.id} url={current.embedUrl} title={current.subtitle ? `${current.title} — ${current.subtitle}` : current.title} />
        </>
      ) : null}
    </div>
  );
}
