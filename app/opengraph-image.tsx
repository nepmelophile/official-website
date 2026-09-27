import { ImageResponse } from "next/og";
import { SITE_DOMAIN, SITE_NAME, SITE_TAGLINE } from "@/lib/constants";

/*
 * Default social card (1200×630), generated with next/og in the brand colours and — when
 * Google Fonts is reachable at build time — the brand typefaces (Bricolage Grotesque,
 * Instrument Serif, JetBrains Mono), subset to the exact glyphs used. If a font cannot be
 * fetched the card still renders with the bundled fallback font. Pages with their own share
 * image (articles, artists) override it.
 */

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK_950 = "#0a090f";
const PAPER = "#f0eff5";
const INK_100 = "#e3e2eb";
const INK_300 = "#a8a5b5";
const INK_400 = "#8e8c9c";
const INK_600 = "#3b3946";
const INK_800 = "#201e28";
const ORCHID = "#dd44dd";
const ORCHID_900 = "#431242";
const BRAND_GRADIENT = "linear-gradient(120deg, #dd44dd 0%, #3d4cf5 100%)";

const WORDMARK = SITE_NAME.toUpperCase();
const KICKER = "Live from Kathmandu";
const SECTIONS = "News / Artists / Services";
const FOOT_LEFT = SITE_DOMAIN;
const FOOT_RIGHT = "Kathmandu, Nepal";
const TAGLINE = { before: "The sound of ", accent: "Nepal", after: ", amplified." };

type FontWeight = 400 | 500 | 800;
type FontSpec = { name: string; data: ArrayBuffer; weight: FontWeight; style: "normal" | "italic" };

/** Fetches a static TrueType instance of a Google font, subset to `text`. Null on any failure. */
async function loadGoogleFont(family: string, axes: string, text: string): Promise<ArrayBuffer | null> {
  try {
    const query = `family=${family}${axes}&text=${encodeURIComponent(text)}`;
    const cssResponse = await fetch(`https://fonts.googleapis.com/css2?${query}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!cssResponse.ok) return null;
    const css = await cssResponse.text();
    const src = css.match(/src:\s*url\((.+?)\)\s*format\('(?:opentype|truetype)'\)/)?.[1];
    if (!src) return null;
    const fontResponse = await fetch(src, { signal: AbortSignal.timeout(5000) });
    return fontResponse.ok ? await fontResponse.arrayBuffer() : null;
  } catch {
    return null;
  }
}

async function loadFonts(): Promise<FontSpec[] | null> {
  const unique = (s: string) => Array.from(new Set(s)).join("");
  const monoText = unique(`${KICKER}${SECTIONS}${FOOT_LEFT}${FOOT_RIGHT}`.toUpperCase() + FOOT_LEFT);
  const serifText = unique(TAGLINE.before + TAGLINE.after);

  const [display, serif, serifItalic, mono] = await Promise.all([
    loadGoogleFont("Bricolage+Grotesque", ":opsz,wdth,wght@96,75,800", WORDMARK),
    loadGoogleFont("Instrument+Serif", "", serifText),
    loadGoogleFont("Instrument+Serif", ":ital@1", TAGLINE.accent),
    loadGoogleFont("JetBrains+Mono", ":wght@500", monoText),
  ]);

  // All or nothing: the fonts are glyph subsets, so mixing them with the fallback would
  // leave gaps. Returning null makes ImageResponse use its bundled default font instead.
  if (!display || !serif || !serifItalic || !mono) return null;
  return [
    { name: "Bricolage", data: display, weight: 800, style: "normal" },
    { name: "Instrument", data: serif, weight: 400, style: "normal" },
    { name: "Instrument", data: serifItalic, weight: 400, style: "italic" },
    { name: "JetBrains", data: mono, weight: 500, style: "normal" },
  ];
}

/** `fontFamily` only when a brand font loaded (satori rejects an undefined family). */
function family(name: string | undefined): { fontFamily?: string } {
  return name ? { fontFamily: name } : {};
}

function Grooves() {
  const rings = Array.from({ length: 14 }, (_, i) => 380 - i * 24);
  return (
    <svg
      width="820"
      height="820"
      viewBox="0 0 820 820"
      style={{ position: "absolute", right: -300, top: -150 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {rings.map((r, i) => (
        <circle
          key={r}
          cx="410"
          cy="410"
          r={r}
          fill="none"
          stroke={INK_800}
          strokeWidth={i % 4 === 0 ? 2 : 1.25}
        />
      ))}
      <circle cx="410" cy="410" r="56" fill={ORCHID_900} />
      <circle cx="410" cy="410" r="9" fill={INK_950} />
    </svg>
  );
}

export default async function OpenGraphImage() {
  const fonts = await loadFonts();
  const displayFont = fonts ? "Bricolage" : undefined;
  const serifFont = fonts ? "Instrument" : undefined;
  const monoFont = fonts ? "JetBrains" : undefined;

  const mono = {
    ...family(monoFont),
    fontWeight: 500,
    fontSize: 20,
    letterSpacing: 3,
    textTransform: "uppercase" as const,
  };

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 72px 56px",
          backgroundColor: INK_950,
          backgroundImage:
            "radial-gradient(circle at 8% 0%, rgba(221,68,221,0.3), transparent 52%), radial-gradient(circle at 96% 100%, rgba(61,76,245,0.28), transparent 46%)",
          color: PAPER,
        }}
      >
        <Grooves />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", ...mono, color: INK_300 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 12, height: 12, borderRadius: 9999, backgroundColor: ORCHID }} />
            {KICKER}
          </div>
          <div style={{ display: "flex" }}>{SECTIONS}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              ...family(displayFont),
              fontWeight: 800,
              fontSize: displayFont ? 212 : 150,
              letterSpacing: displayFont ? -2 : -5,
              lineHeight: 0.82,
            }}
          >
            {WORDMARK}
            <div
              style={{
                width: 36,
                height: 36,
                marginLeft: 10,
                marginBottom: 16,
                borderRadius: 9999,
                backgroundImage: BRAND_GRADIENT,
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              marginTop: 34,
              ...family(serifFont),
              fontSize: serifFont ? 64 : 54,
              lineHeight: 1,
              color: INK_100,
            }}
          >
            <span style={{ whiteSpace: "pre" }}>{TAGLINE.before}</span>
            <span
              style={{
                fontStyle: "italic",
                color: "transparent",
                backgroundImage: BRAND_GRADIENT,
                backgroundClip: "text",
                paddingRight: 6,
                marginRight: -6,
              }}
            >
              {TAGLINE.accent}
            </span>
            <span>{TAGLINE.after}</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: `1px solid ${INK_600}`,
            paddingTop: 22,
            ...mono,
            fontSize: 18,
            color: INK_400,
          }}
        >
          <span style={{ textTransform: "none", letterSpacing: 1 }}>{FOOT_LEFT}</span>
          <span>{FOOT_RIGHT}</span>
        </div>
      </div>
    ),
    { ...size, ...(fonts ? { fonts } : {}) },
  );
}
