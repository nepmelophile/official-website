import { ImageResponse } from "next/og";

/*
 * PNG app icons for the web manifest (/pwa-icon/192, /pwa-icon/512). Same "M." mark as
 * app/icon.svg on the ink-950 page colour, kept inside the central 60% so the icon is also
 * safe as a maskable icon (Android crops to a circle / squircle).
 */

const SIZES = [192, 512] as const;

export const dynamicParams = false;

export function generateStaticParams() {
  return SIZES.map((size) => ({ size: String(size) }));
}

export async function GET(_request: Request, { params }: RouteContext<"/pwa-icon/[size]">) {
  const { size: raw } = await params;
  const size = Number(raw);
  if (!SIZES.includes(size as (typeof SIZES)[number])) {
    return new Response("Not found", { status: 404 });
  }
  const mark = Math.round(size * 0.58);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a090f",
          backgroundImage:
            "radial-gradient(circle at 18% 12%, rgba(221,68,221,0.3), transparent 62%), radial-gradient(circle at 92% 96%, rgba(61,76,245,0.3), transparent 55%)",
        }}
      >
        <svg width={mark} height={mark} viewBox="6 10 52 44" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="brand" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#dd44dd" />
              <stop offset="1" stopColor="#3d4cf5" />
            </linearGradient>
          </defs>
          <path d="M11 48V16h7l10 16.5L38 16h7v32h-6.5V29L29.6 43.5h-3.2L17.5 29v19z" fill="#f0eff5" />
          <circle cx="52.5" cy="44.5" r="4.5" fill="url(#brand)" />
        </svg>
      </div>
    ),
    {
      width: size,
      height: size,
      headers: { "Cache-Control": "public, max-age=31536000, immutable" },
    },
  );
}
