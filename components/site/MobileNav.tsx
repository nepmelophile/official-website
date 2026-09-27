"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { SocialLinks } from "@/components/ui/SocialLinks";
import { ThemeSwitch } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";
import type { SocialLink } from "@/types/content";
import { HEADER_CTA, navCurrent, SITE_NAV, type NavItem } from "./nav";

const noopSubscribe = () => () => {};

/** True after hydration (portals need document.body). */
function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Elements Tab can reach, in order. A radio group is one tab stop: its checked radio, or its
 * first radio while none is checked.
 */
function tabStops(panel: HTMLElement): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => {
    if (!(el instanceof HTMLInputElement) || el.type !== "radio") return true;
    if (el.checked) return true;
    const group = Array.from(panel.querySelectorAll<HTMLInputElement>("input[type=radio]")).filter((r) => r.name === el.name);
    return group[0] === el && !group.some((r) => r.checked);
  });
}

export interface MobileNavProps {
  /** Menu links (from getNavLinks); defaults to the static base list. */
  links?: readonly NavItem[];
  socialLinks?: SocialLink[];
  email?: string;
}

/**
 * Mobile menu: a ≥44px toggle (`aria-expanded`/`aria-controls`) opening a full-screen dialog
 * with display-size links. Focus is trapped inside, Esc closes, body scroll is locked and
 * focus returns to the toggle. Rendered in a portal because the sticky header's backdrop
 * filter would otherwise become the containing block of the fixed overlay.
 */
export function MobileNav({ links = SITE_NAV, socialLinks, email }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isClient = useIsClient();
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close when the route changes (e.g. browser back while open) — "adjust state during render".
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (open) setOpen(false);
  }

  const close = useCallback(() => {
    setOpen(false);
    toggleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    panel?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const focusable = tabStops(panel);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !panel.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !panel.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };
    const onResize = () => {
      if (window.matchMedia("(min-width: 64rem)").matches) setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [open, close]);

  const overlay = (
    <div
      ref={panelRef}
      id={panelId}
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      hidden={!open}
      className="bg-glow fixed inset-0 z-50 flex flex-col overflow-y-auto bg-bg lg:hidden"
    >
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-gutter">
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">Menu</span>
        <button
          type="button"
          onClick={close}
          className="inline-flex size-11 items-center justify-center rounded-pill border border-line-strong text-fg transition-colors hover:border-fg"
        >
          <X size={20} strokeWidth={1.75} aria-hidden="true" />
          <span className="sr-only">Close menu</span>
        </button>
      </div>

      <nav aria-label="Mobile" className="flex-1 px-gutter pt-8 pb-10">
        <ol className="flex flex-col">
          {links.map((item, i) => {
            const current = navCurrent(pathname, item.href);
            return (
              <li
                key={item.href}
                className="animate-fade-up border-b border-line"
                style={{ animationDelay: `${60 + i * 70}ms` }}
              >
                <Link
                  href={item.href}
                  aria-current={current}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-baseline gap-4 py-4 font-display text-display-md font-extrabold [font-stretch:88%]",
                    current ? "text-fg" : "text-fg-muted hover:text-fg",
                  )}
                >
                  <span className="w-8 shrink-0 font-mono text-xs font-normal tracking-[0.14em] text-fg-subtle">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={cn(current && "underline decoration-accent decoration-4 underline-offset-8")}>
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>

        <Link
          href={HEADER_CTA.href}
          onClick={() => setOpen(false)}
          className="mt-10 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-pill bg-accent px-8 py-4 text-base font-semibold text-accent-fg transition-colors hover:bg-accent-hover"
        >
          {HEADER_CTA.label}
          <ArrowUpRight size={18} strokeWidth={1.75} aria-hidden="true" />
        </Link>

        <div className="mt-10 flex flex-col gap-4">
          {email ? (
            <a href={`mailto:${email}`} className="font-mono text-sm tracking-[0.04em] text-fg-muted hover:text-fg">
              {email}
            </a>
          ) : null}
          <SocialLinks links={socialLinks} owner="Melophile" size="sm" />
        </div>

        <ThemeSwitch className="mt-10 max-w-sm" />
      </nav>
    </div>
  );

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(true)}
        className="inline-flex size-11 items-center justify-center rounded-pill border border-line-strong text-fg transition-colors hover:border-fg lg:hidden"
      >
        <Menu size={20} strokeWidth={1.75} aria-hidden="true" />
        <span className="sr-only">Open menu</span>
      </button>
      {isClient ? createPortal(overlay, document.body) : null}
    </>
  );
}
