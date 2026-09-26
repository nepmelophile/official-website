"use client";

import {
  ImageKitAbortError,
  ImageKitInvalidRequestError,
  ImageKitServerError,
  ImageKitUploadNetworkError,
  upload,
} from "@imagekit/next";
import type { ImageKitAuthResponse } from "@/lib/admin/types";

/** True when the public ImageKit key is configured (inlined at build time). */
export const IMAGEKIT_UPLOAD_ENABLED = Boolean(process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY?.trim());

export const DEFAULT_MAX_UPLOAD_MB = 10;

export interface UploadedImage {
  url: string;
  fileId?: string;
  width?: number;
  height?: number;
}

export class UploadError extends Error {
  readonly aborted: boolean;
  constructor(message: string, aborted = false) {
    super(message);
    this.name = "UploadError";
    this.aborted = aborted;
  }
}

async function fetchAuthParams(signal?: AbortSignal): Promise<ImageKitAuthResponse> {
  let response: Response;
  try {
    response = await fetch("/api/imagekit/auth", { cache: "no-store", signal });
  } catch (error) {
    if (signal?.aborted) throw new UploadError("Upload cancelled.", true);
    throw new UploadError(error instanceof Error ? `Could not reach the server: ${error.message}` : "Could not reach the server.");
  }
  if (response.status === 401) throw new UploadError("Your session has expired. Sign in again to upload.");
  const body = (await response.json().catch(() => null)) as Partial<ImageKitAuthResponse> & { error?: string } | null;
  if (!response.ok || !body?.signature || !body.token || !body.expire || !body.publicKey) {
    throw new UploadError(body?.error ?? "Uploads are unavailable right now. Paste an image URL instead.");
  }
  return body as ImageKitAuthResponse;
}

/** Keeps ImageKit-safe characters; ImageKit adds a unique suffix (useUniqueFileName). */
function safeFileName(name: string): string {
  const dot = name.lastIndexOf(".");
  const base = (dot > 0 ? name.slice(0, dot) : name).normalize("NFKD").replace(/[^a-zA-Z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  return `${(base || "image").slice(0, 60)}${ext ? `.${ext}` : ""}`;
}

/** Client-side validation. Returns an error message or null. */
export function validateImageFile(file: File, maxMb = DEFAULT_MAX_UPLOAD_MB): string | null {
  if (!file.type.startsWith("image/")) return "Choose an image file (JPG, PNG, WebP, AVIF or GIF).";
  if (file.size > maxMb * 1024 * 1024) return `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is ${maxMb} MB.`;
  return null;
}

/**
 * Uploads a file to ImageKit with short-lived auth params from /api/imagekit/auth.
 * Throws UploadError with a user-facing message (aborted === true when cancelled).
 */
export async function uploadToImageKit(
  file: File,
  options: { folder?: string; onProgress?: (percent: number) => void; signal?: AbortSignal } = {},
): Promise<UploadedImage> {
  const auth = await fetchAuthParams(options.signal);
  try {
    const result = await upload({
      file,
      fileName: safeFileName(file.name),
      token: auth.token,
      expire: auth.expire,
      signature: auth.signature,
      publicKey: auth.publicKey,
      folder: options.folder,
      useUniqueFileName: true,
      abortSignal: options.signal,
      onProgress: (event) => {
        if (event.lengthComputable && options.onProgress) {
          options.onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
        }
      },
    });
    if (!result.url) throw new UploadError("ImageKit did not return a URL for the upload.");
    return { url: result.url, fileId: result.fileId, width: result.width, height: result.height };
  } catch (error) {
    if (error instanceof UploadError) throw error;
    if (error instanceof ImageKitAbortError) throw new UploadError("Upload cancelled.", true);
    if (error instanceof ImageKitInvalidRequestError) throw new UploadError(`ImageKit rejected the upload: ${error.message}`);
    if (error instanceof ImageKitUploadNetworkError) throw new UploadError("Network error while uploading. Check your connection.");
    if (error instanceof ImageKitServerError) throw new UploadError("ImageKit had a server error. Try again shortly.");
    throw new UploadError("Upload failed. Try again or paste an image URL.");
  }
}
