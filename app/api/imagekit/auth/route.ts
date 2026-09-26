import { getUploadAuthParams } from "@imagekit/next/server";
import { NextResponse } from "next/server";
import type { ImageKitAuthResponse } from "@/lib/admin/types";
import { getSession } from "@/lib/auth";

/**
 * GET /api/imagekit/auth — short-lived upload signature for the admin ImageKit uploader.
 * Admin-only (checked here, not just in proxy.ts). Never cached.
 */

const NO_STORE = { "Cache-Control": "no-store, max-age=0" } as const;

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }

  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY?.trim();
  const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY?.trim();
  if (!privateKey || !publicKey) {
    return NextResponse.json(
      { error: "Image uploads are not configured. Paste an image URL instead." },
      { status: 503, headers: NO_STORE },
    );
  }

  try {
    const { token, expire, signature } = getUploadAuthParams({ privateKey, publicKey });
    const body: ImageKitAuthResponse = {
      token,
      expire,
      signature,
      publicKey,
      urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT?.trim() || undefined,
    };
    return NextResponse.json(body, { headers: NO_STORE });
  } catch (error) {
    console.error("[melophile] ImageKit auth params failed", error);
    return NextResponse.json({ error: "Could not authorise the upload." }, { status: 500, headers: NO_STORE });
  }
}
