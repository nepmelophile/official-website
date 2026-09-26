"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Check, Link2, Share } from "lucide-react";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { cn } from "@/lib/utils";

export interface ShareLinksProps {
  /** Absolute canonical URL of the story. */
  url: string;
  /** Story title (used in share text). */
  title: string;
  /**
   * `rail` = vertical icon buttons with hover/focus labels (sticky desktop sidebar);
   * `bar` = heading + labelled pill buttons (end of article, mobile).
   */
  variant?: "rail" | "bar";
  className?: string;
}

type CopyStatus = "idle" | "copied" | "error";

/** Simplified WhatsApp line mark on lucide's 24px grid (lucide ships no brand icons). */
function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4.64 15.75A8.5 8.5 0 1 1 8.41 19.2L3.5 20.5z" />
      <path d="M9.3 8.4c.3-.3.8-.3 1 .1l.7 1.4c.2.3.1.7-.2 1l-.5.5c.5 1.1 1.4 2 2.5 2.5l.5-.5c.3-.3.7-.4 1-.2l1.4.7c.4.2.4.7.1 1l-.6.6c-.6.6-1.5.8-2.3.5a8 8 0 0 1-4.2-4.2c-.3-.8-.1-1.7.5-2.3z" />
    </svg>
  );
}

const noopSubscribe = () => () => {};

/** Web Share API support, read after hydration (server snapshot = false, no mismatch). */
function useCanNativeShare(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => typeof navigator !== "undefined" && typeof navigator.share === "function",
    () => false,
  );
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (window.isSecureContext && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission denied or unsupported: fall back to a temporary textarea below.
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    textarea.remove();
    return ok;
  } catch {
    return false;
  }
}

interface ShareTarget {
  key: string;
  label: string;
  href: string;
  icon: ReactNode;
}

function shareTargets(url: string, title: string): ShareTarget[] {
  const u = encodeURIComponent(url);
  return [
    {
      key: "x",
      label: "X",
      href: `https://x.com/intent/post?text=${encodeURIComponent(title)}&url=${u}`,
      icon: <SocialIcon platform="x" size={18} />,
    },
    {
      key: "facebook",
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      icon: <SocialIcon platform="facebook" size={18} />,
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`,
      icon: <WhatsAppIcon size={18} />,
    },
  ];
}

const RAIL_BUTTON =
  "peer/btn inline-flex size-11 items-center justify-center rounded-pill border border-line-strong text-fg-muted transition-colors duration-150 hover:border-fg hover:text-fg cursor-pointer";
const RAIL_TIP =
  "pointer-events-none absolute top-1/2 left-full z-10 ml-3 -translate-y-1/2 rounded-xs bg-surface-raised px-2 py-1 font-mono text-[0.6875rem] uppercase tracking-[0.14em] whitespace-nowrap text-fg opacity-0 shadow-card transition-opacity duration-150 peer-hover/btn:opacity-100 peer-focus-visible/btn:opacity-100";
const BAR_BUTTON =
  "inline-flex min-h-11 items-center gap-2 rounded-pill border border-line-strong px-4 text-sm font-medium text-fg transition-colors duration-150 hover:border-fg hover:bg-surface cursor-pointer";

/**
 * Share controls: native share sheet (when the browser supports it), copy link with an
 * announced confirmation, and plain X / Facebook / WhatsApp share URLs (work without JS).
 */
export function ShareLinks({ url, title, variant = "bar", className }: ShareLinksProps) {
  const headingId = useId();
  const canNativeShare = useCanNativeShare();
  const [status, setStatus] = useState<CopyStatus>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  async function handleCopy() {
    const ok = await copyToClipboard(url);
    setStatus(ok ? "copied" : "error");
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setStatus("idle"), ok ? 2400 : 6000);
  }

  async function handleNativeShare() {
    try {
      await navigator.share({ title, url });
    } catch {
      // The user dismissed the share sheet (AbortError) or sharing failed — nothing to do.
    }
  }

  const targets = shareTargets(url, title);
  const copied = status === "copied";
  const copyLabel = copied ? "Link copied" : "Copy link";
  const announcement = copied
    ? "Link copied to clipboard."
    : status === "error"
      ? "Couldn't copy the link. Copy it from your browser's address bar instead."
      : "";

  const liveRegion = (
    <p role="status" className="sr-only">
      {announcement}
    </p>
  );
  const errorNote =
    status === "error" ? (
      <p aria-hidden="true" className="text-xs text-danger">
        Couldn&apos;t copy — use the address bar.
      </p>
    ) : null;

  if (variant === "rail") {
    return (
      <div role="group" aria-labelledby={headingId} className={cn("flex flex-col gap-4", className)}>
        <p id={headingId} className="font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
          Share
        </p>
        <ul className="flex flex-col gap-2">
          {canNativeShare ? (
            <li className="relative">
              <button type="button" onClick={handleNativeShare} aria-label="Share via…" className={RAIL_BUTTON}>
                <Share size={18} strokeWidth={1.75} aria-hidden="true" />
              </button>
              <span aria-hidden="true" className={RAIL_TIP}>
                Share via…
              </span>
            </li>
          ) : null}
          <li className="relative">
            <button
              type="button"
              onClick={handleCopy}
              aria-label={copyLabel}
              className={cn(RAIL_BUTTON, copied && "border-success/60 text-success hover:border-success hover:text-success")}
            >
              {copied ? (
                <Check size={18} strokeWidth={1.75} aria-hidden="true" />
              ) : (
                <Link2 size={18} strokeWidth={1.75} aria-hidden="true" />
              )}
            </button>
            <span aria-hidden="true" className={cn(RAIL_TIP, copied && "opacity-100")}>
              {copied ? "Copied!" : "Copy link"}
            </span>
          </li>
          {targets.map((target) => (
            <li key={target.key} className="relative">
              <a
                href={target.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Share on ${target.label} (opens in a new tab)`}
                className={RAIL_BUTTON}
              >
                {target.icon}
              </a>
              <span aria-hidden="true" className={RAIL_TIP}>
                {target.label}
              </span>
            </li>
          ))}
        </ul>
        {errorNote}
        {liveRegion}
      </div>
    );
  }

  return (
    <div role="group" aria-labelledby={headingId} className={cn("flex flex-col gap-4", className)}>
      <p id={headingId} className="font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
        Share this story
      </p>
      <ul className="flex flex-wrap gap-2">
        {canNativeShare ? (
          <li>
            <button type="button" onClick={handleNativeShare} className={BAR_BUTTON}>
              <Share size={16} strokeWidth={1.75} aria-hidden="true" />
              Share via…
            </button>
          </li>
        ) : null}
        <li>
          <button
            type="button"
            onClick={handleCopy}
            className={cn(BAR_BUTTON, copied && "border-success/60 text-success hover:border-success")}
          >
            {copied ? (
              <Check size={16} strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <Link2 size={16} strokeWidth={1.75} aria-hidden="true" />
            )}
            {copyLabel}
          </button>
        </li>
        {targets.map((target) => (
          <li key={target.key}>
            <a href={target.href} target="_blank" rel="noopener noreferrer" className={BAR_BUTTON}>
              {target.icon}
              <span className="sr-only">Share on </span>
              {target.label}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
      {errorNote}
      {liveRegion}
    </div>
  );
}
