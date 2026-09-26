/**
 * Admin action result types. Client-safe (no server imports) so client forms can import them;
 * lib/admin/actions.ts re-exports them for server code.
 */

/** Field path (e.g. "title", "embeds.0.url", "featuredImage.url") → messages. */
export type ActionFieldErrors = Record<string, string[]>;

export interface ActionSuccess<T = undefined> {
  ok: true;
  data?: T;
  message?: string;
}

export interface ActionFailure {
  ok: false;
  error: string;
  fieldErrors?: ActionFieldErrors;
}

/** Return type of every admin server action. */
export type ActionResult<T = undefined> = ActionSuccess<T> | ActionFailure;

/** First message for a field path, if any. */
export function firstFieldError(errors: ActionFieldErrors | undefined, path: string): string | undefined {
  return errors?.[path]?.[0];
}

/** True when any error key equals `prefix` or starts with `prefix.` (e.g. a whole repeater row). */
export function hasFieldErrorUnder(errors: ActionFieldErrors | undefined, prefix: string): boolean {
  if (!errors) return false;
  return Object.keys(errors).some((key) => key === prefix || key.startsWith(`${prefix}.`));
}

/** JSON body of GET /api/imagekit/auth (200). Errors come back as { error: string }. */
export interface ImageKitAuthResponse {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
  urlEndpoint?: string;
}
