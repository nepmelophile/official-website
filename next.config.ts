import type { NextConfig } from "next";

type RemotePattern = NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number];

/** Remote image hosts — keep in sync with IMAGE_REMOTE_HOSTS in lib/images.ts. */
const remotePatterns: RemotePattern[] = [
  { protocol: "https", hostname: "ik.imagekit.io" },
  { protocol: "https", hostname: "picsum.photos" },
  { protocol: "https", hostname: "fastly.picsum.photos" },
];

// Custom ImageKit URL endpoint (e.g. https://media.melophilenp.com) when not on ik.imagekit.io.
const imagekitEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT?.trim();
if (imagekitEndpoint) {
  try {
    const { hostname } = new URL(imagekitEndpoint);
    if (!remotePatterns.some((p) => p.hostname === hostname)) {
      remotePatterns.push({ protocol: "https", hostname });
    }
  } catch {
    console.warn("[next.config] NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT is not a valid URL; ignoring.");
  }
}

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  images: {
    remotePatterns,
    qualities: [75, 90],
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
