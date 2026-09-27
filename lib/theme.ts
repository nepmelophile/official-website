/**
 * Colour theme (Light / Dark / System). Server-safe: no React, no DOM access at import time.
 *
 * How it works (see docs/visual-design.md, "Themes"):
 * - The chosen mode lives in localStorage under THEME_STORAGE_KEY ("light" | "dark"; no entry
 *   means "system").
 * - THEME_INIT_SCRIPT runs inline in <head> (app/layout.tsx) before the first paint and writes the
 *   mode to <html data-theme="…">. Without JS the attribute is absent, which CSS treats as System.
 * - globals.css keeps the dark token values as the default and overrides them through the
 *   `light` custom variant: `[data-theme="light"]`, or `prefers-color-scheme: light` unless
 *   `data-theme="dark"`. Components never branch on the theme; they use semantic tokens.
 */

export const THEME_MODES = ["light", "dark", "system"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

export const THEME_STORAGE_KEY = "melophile-theme";
export const THEME_ATTRIBUTE = "data-theme";

/** Page background per theme, for <meta name="theme-color"> (must match --color-bg). */
export const THEME_COLORS = { dark: "#0a090f", light: "#f6f5fa" } as const;

export function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === "string" && (THEME_MODES as readonly string[]).includes(value);
}

/**
 * Inline, render-blocking bootstrap. Kept tiny and dependency-free: it must run before the body
 * is parsed so the first paint already uses the stored theme (no flash of the wrong theme).
 */
export const THEME_INIT_SCRIPT = `(function(){var m="system";try{var s=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(s==="light"||s==="dark")m=s}catch(e){}document.documentElement.setAttribute(${JSON.stringify(THEME_ATTRIBUTE)},m)})()`;
