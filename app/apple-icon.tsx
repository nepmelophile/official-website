import { ImageResponse } from "next/og";

/* Apple touch icon (also the PNG logo in the home page JSON-LD and the web manifest). The
 * same "M." mark as app/icon.svg, drawn full-bleed because iOS applies its own mask. */

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0b0a09",
          backgroundImage: "radial-gradient(circle at 18% 12%, rgba(232,57,31,0.32), transparent 62%)",
        }}
      >
        <svg width="132" height="132" viewBox="6 10 52 44" xmlns="http://www.w3.org/2000/svg">
          <path d="M11 48V16h7l10 16.5L38 16h7v32h-6.5V29L29.6 43.5h-3.2L17.5 29v19z" fill="#f5eee3" />
          <circle cx="52.5" cy="44.5" r="4.5" fill="#e8391f" />
        </svg>
      </div>
    ),
    size,
  );
}
