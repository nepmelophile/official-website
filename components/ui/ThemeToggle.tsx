"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { Check, Monitor, Moon, Sun, SunMoon, type LucideIcon } from "lucide-react";
import { isThemeMode, THEME_ATTRIBUTE, THEME_MODES, THEME_STORAGE_KEY, type ThemeMode } from "@/lib/theme";
import { cn } from "@/lib/utils";

const MODE_LABELS: Record<ThemeMode, string> = { light: "Light", dark: "Dark", system: "System" };
const MODE_ICONS: Record<ThemeMode, LucideIcon> = { light: Sun, dark: Moon, system: Monitor };

/* ------------------------------------------------------------------ */
/* Store: <html data-theme> is the source of truth                     */
/* ------------------------------------------------------------------ */

function readMode(): ThemeMode {
  const value = document.documentElement.getAttribute(THEME_ATTRIBUTE);
  return isThemeMode(value) ? value : "system";
}

function readStoredMode(): ThemeMode {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: [THEME_ATTRIBUTE] });
  return () => observer.disconnect();
}

/** Writes the mode to <html> without animating every colour transition on the page. */
function applyMode(mode: ThemeMode) {
  const root = document.documentElement;
  if (root.getAttribute(THEME_ATTRIBUTE) === mode) return;
  const freeze = document.createElement("style");
  freeze.textContent = "*,*::before,*::after{transition:none!important}";
  document.head.appendChild(freeze);
  root.setAttribute(THEME_ATTRIBUTE, mode);
  void window.getComputedStyle(document.body).color; // flush styles while transitions are off
  requestAnimationFrame(() => requestAnimationFrame(() => freeze.remove()));
}

/** Persists and applies a theme mode ("system" clears the stored choice). */
export function setThemeMode(mode: ThemeMode) {
  try {
    if (mode === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // Storage blocked (private mode, policy): the choice still applies to this page view.
  }
  applyMode(mode);
}

/**
 * Current theme mode, read from <html data-theme>. Returns null during SSR and hydration, so
 * server and client markup match; controls render a neutral state until then.
 */
export function useThemeMode(): ThemeMode | null {
  return useSyncExternalStore<ThemeMode | null>(subscribe, readMode, () => null);
}

/**
 * Mounted once in the root layout. Re-applies the stored mode after React's development-only
 * remount resets <html> attributes (a no-op in production), and follows changes made in other
 * tabs. Renders nothing.
 */
export function ThemeSync() {
  useLayoutEffect(() => {
    applyMode(readStoredMode());
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY || event.key === null) applyMode(readStoredMode());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return null;
}

/* ------------------------------------------------------------------ */
/* ThemeMenu: icon button + Light / Dark / System menu (header)        */
/* ------------------------------------------------------------------ */

export interface ThemeMenuProps {
  className?: string;
}

/**
 * Compact menu button (WAI-ARIA menu button pattern with menuitemradio items). Enter, Space or
 * Arrow keys open it on the current mode; arrows/Home/End move, Enter/Space choose, Esc closes and
 * returns focus to the button, Tab or a click outside closes it.
 */
export function ThemeMenu({ className }: ThemeMenuProps) {
  const mode = useThemeMode();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const pendingFocus = useRef<number | null>(null);

  const focusItem = useCallback((index: number) => {
    const count = THEME_MODES.length;
    itemRefs.current[((index % count) + count) % count]?.focus();
  }, []);

  const openMenu = (focusIndex: number) => {
    pendingFocus.current = focusIndex;
    setOpen(true);
  };

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }, []);

  // Move focus into the menu once it is rendered.
  useEffect(() => {
    if (open && pendingFocus.current !== null) {
      focusItem(pendingFocus.current);
      pendingFocus.current = null;
    }
  }, [open, focusItem]);

  // Click/tap outside closes (without stealing focus from whatever was clicked).
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) close(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, close]);

  const currentIndex = Math.max(0, THEME_MODES.indexOf(mode ?? "system"));

  const onButtonKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openMenu(event.key === "ArrowDown" ? currentIndex : THEME_MODES.length - 1);
    }
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = itemRefs.current.findIndex((item) => item === document.activeElement);
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusItem(index + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusItem(index - 1);
        break;
      case "Home":
        event.preventDefault();
        focusItem(0);
        break;
      case "End":
        event.preventDefault();
        focusItem(THEME_MODES.length - 1);
        break;
      case "Escape":
        event.preventDefault();
        close(true);
        break;
      case "Tab":
        close(false);
        break;
    }
  };

  const choose = (next: ThemeMode) => {
    setThemeMode(next);
    close(true);
  };

  const TriggerIcon = mode ? MODE_ICONS[mode] : SunMoon;
  const label = mode ? `Theme: ${MODE_LABELS[mode]}` : "Theme";

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`${label}. Change theme`}
        title={label}
        onClick={() => (open ? close(false) : openMenu(currentIndex))}
        onKeyDown={onButtonKeyDown}
        className="inline-flex size-11 items-center justify-center rounded-pill border border-line-strong text-fg-muted transition-colors duration-150 hover:border-fg hover:text-fg aria-expanded:border-fg aria-expanded:text-fg"
      >
        <TriggerIcon size={18} strokeWidth={1.75} aria-hidden="true" />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Theme"
          onKeyDown={onMenuKeyDown}
          className="absolute top-full right-0 z-50 mt-2 w-44 rounded-md border border-line-strong bg-surface-raised p-1 shadow-lift"
        >
          {THEME_MODES.map((option, i) => {
            const Icon = MODE_ICONS[option];
            const checked = option === mode;
            return (
              <button
                key={option}
                ref={(node) => {
                  itemRefs.current[i] = node;
                }}
                type="button"
                role="menuitemradio"
                aria-checked={checked}
                tabIndex={-1}
                onClick={() => choose(option)}
                className={cn(
                  "flex min-h-10 w-full items-center gap-3 rounded-sm px-3 text-left text-sm transition-colors duration-150 hover:bg-line hover:text-fg focus-visible:bg-line focus-visible:text-fg focus-visible:outline-offset-[-2px]",
                  checked ? "font-semibold text-fg" : "text-fg-muted",
                )}
              >
                <Icon size={16} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />
                <span className="flex-1">{MODE_LABELS[option]}</span>
                {checked ? <Check size={16} strokeWidth={2} aria-hidden="true" className="shrink-0 text-highlight" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ThemeSwitch: 3-way segmented control (mobile menu, admin sidebar)   */
/* ------------------------------------------------------------------ */

export interface ThemeSwitchProps {
  /** Visible group label (default "Theme"). Pass `hideLabel` to keep it for screen readers only. */
  label?: string;
  hideLabel?: boolean;
  /** md = 44px targets (public site); sm = 36px (admin density). */
  size?: "sm" | "md";
  className?: string;
}

/**
 * Light / Dark / System as a native radio group (arrow keys move and select, Tab leaves the
 * group). Nothing is checked until hydration, so the server markup never guesses the theme.
 */
export function ThemeSwitch({ label = "Theme", hideLabel = false, size = "md", className }: ThemeSwitchProps) {
  const mode = useThemeMode();
  const name = useId();

  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend
        className={cn(
          hideLabel ? "sr-only" : "mb-2 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-subtle",
        )}
      >
        {label}
      </legend>
      <div className="grid grid-cols-3 gap-0.5 rounded-pill border border-line bg-bg-alt p-0.5">
        {THEME_MODES.map((option) => {
          const Icon = MODE_ICONS[option];
          const checked = option === mode;
          return (
            <label
              key={option}
              className={cn(
                "flex cursor-pointer items-center justify-center gap-1.5 rounded-pill px-2 font-sans font-medium transition-colors duration-150",
                "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-highlight",
                size === "md" ? "min-h-11 text-sm" : "min-h-9 text-xs",
                checked ? "bg-surface-raised text-fg shadow-card ring-1 ring-line-strong" : "text-fg-muted hover:text-fg",
              )}
            >
              <input
                type="radio"
                name={name}
                value={option}
                checked={checked}
                onChange={() => setThemeMode(option)}
                className="sr-only"
              />
              <Icon size={size === "md" ? 16 : 14} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />
              <span>{MODE_LABELS[option]}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
