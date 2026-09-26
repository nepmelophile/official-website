import { z } from "zod";
import { CONTENT_STATUSES, SOCIAL_PLATFORMS } from "@/lib/constants";
import { isEmbeddableUrl } from "@/lib/embeds";

/* ------------------------------------------------------------------ */
/* Primitive helpers (FormData-friendly: blank strings → undefined)    */
/* ------------------------------------------------------------------ */

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const OBJECT_ID_REGEX = /^[a-f0-9]{24}$/i;

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === "string" && value.trim() === "");
}

function blankToUndefined(value: unknown): unknown {
  return isBlank(value) ? undefined : value;
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && Boolean(url.hostname);
  } catch {
    return false;
  }
}

/** Absolute http(s) URL or an internal path such as "/contact?service=mixing". */
export function isLink(value: string): boolean {
  if (/^\/(?!\/)[^\s]*$/.test(value)) return true;
  return isHttpUrl(value);
}

/** Required trimmed string with a max length. */
export function requiredText(max: number, label = "This field") {
  return z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`);
}

/** Optional trimmed string; blank → undefined. */
export function optionalText(max: number, label = "This field") {
  return z.preprocess(
    blankToUndefined,
    z.string().trim().max(max, `${label} must be at most ${max} characters`).optional(),
  );
}

export const slugSchema = z
  .string({ error: "Slug is required" })
  .trim()
  .toLowerCase()
  .min(1, "Slug is required")
  .max(120, "Slug must be at most 120 characters")
  .regex(SLUG_REGEX, "Use lowercase letters, numbers and single hyphens (e.g. my-new-single)");

export const objectIdSchema = z.string().trim().regex(OBJECT_ID_REGEX, "Invalid id");

export const optionalObjectIdSchema = z.preprocess(blankToUndefined, objectIdSchema.optional());

/** List of ObjectId strings (accepts a single value or array; blanks dropped; de-duplicated). */
export function objectIdList(max: number) {
  return z.preprocess(
    (value) => {
      if (isBlank(value)) return [];
      const list = Array.isArray(value) ? value : [value];
      return [...new Set(list.filter((v) => !isBlank(v)).map((v) => String(v).trim()))];
    },
    z.array(objectIdSchema).max(max, `At most ${max} items`),
  );
}

export const httpUrlSchema = z
  .string({ error: "URL is required" })
  .trim()
  .min(1, "URL is required")
  .max(2048, "URL is too long")
  .refine(isHttpUrl, "Enter a full URL starting with https://");

export const optionalHttpUrlSchema = z.preprocess(blankToUndefined, httpUrlSchema.optional());

export const linkSchema = z
  .string({ error: "Link is required" })
  .trim()
  .min(1, "Link is required")
  .max(2048, "Link is too long")
  .refine(isLink, "Enter a full URL (https://…) or an internal path starting with /");

export const optionalLinkSchema = z.preprocess(blankToUndefined, linkSchema.optional());

export const embedUrlSchema = z
  .string({ error: "Embed URL is required" })
  .trim()
  .min(1, "Embed URL is required")
  .max(2048, "URL is too long")
  .refine(isEmbeddableUrl, "Use a Spotify, YouTube or SoundCloud link");

export const optionalEmbedUrlSchema = z.preprocess(blankToUndefined, embedUrlSchema.optional());

export const statusSchema = z.enum(CONTENT_STATUSES, { error: "Choose draft or published" });

/** Checkbox-friendly boolean: true / "true" / "on" / "1" → true, everything else → false. */
export const booleanish = z.preprocess(
  (value) => value === true || value === "true" || value === "on" || value === "1" || value === 1,
  z.boolean(),
);

/** Integer field (coerces numeric strings; blank → `fallback`). */
export function intField(min: number, max: number, fallback = 0) {
  return z.preprocess(
    (value) => (isBlank(value) ? fallback : value),
    z.coerce.number({ error: "Enter a number" }).int("Enter a whole number").min(min).max(max),
  );
}

export function optionalIntField(min: number, max: number) {
  return z.preprocess(
    blankToUndefined,
    z.coerce.number({ error: "Enter a number" }).int("Enter a whole number").min(min).max(max).optional(),
  );
}

/** Date field; blank → now. */
export const dateDefaultNow = z.preprocess(
  (value) => (isBlank(value) ? new Date() : value),
  z.coerce.date({ error: "Enter a valid date" }),
);

export const optionalDate = z.preprocess(blankToUndefined, z.coerce.date({ error: "Enter a valid date" }).optional());

/**
 * List of short strings. Accepts an array or a comma/newline separated string; trims,
 * drops blanks and de-duplicates case-insensitively.
 */
export function stringList(maxItems: number, maxLength: number) {
  return z.preprocess(
    (value) => {
      if (isBlank(value)) return [];
      const raw = Array.isArray(value) ? value : String(value).split(/[,\n]/);
      const seen = new Set<string>();
      const out: string[] = [];
      for (const item of raw) {
        const text = String(item ?? "").trim();
        if (!text || seen.has(text.toLowerCase())) continue;
        seen.add(text.toLowerCase());
        out.push(text);
      }
      return out;
    },
    z.array(z.string().max(maxLength, `Each item must be at most ${maxLength} characters`)).max(maxItems, `At most ${maxItems} items`),
  );
}

/**
 * Array of objects; `undefined` → [], and rows whose fields are all blank are dropped
 * (so empty repeater rows from the admin UI are ignored). Error paths use the row's index in
 * the submitted array (blank rows included), so they line up with the rows in the form.
 */
export function objectList<T extends z.ZodType>(item: T, max: number) {
  return z
    .preprocess(
      (value) => {
        if (isBlank(value)) return [];
        if (!Array.isArray(value)) return value;
        // Blank rows become null placeholders (instead of being removed) so zod issue paths such
        // as "embeds.2.url" keep pointing at the row index the editor sees in the form.
        return value.map((row) => (isBlankListRow(row) ? null : row));
      },
      z.array(item.nullable()),
    )
    .transform((rows) => rows.filter((row): row is NonNullable<typeof row> => row !== null) as z.output<T>[])
    .refine((rows) => rows.length <= max, `At most ${max} items`);
}

/** A repeater row with every field (and every nested field) empty — dropped by objectList(). */
export function isBlankListRow(row: unknown): boolean {
  if (row === null || typeof row !== "object") return isBlank(row);
  return !Object.values(row as Record<string, unknown>).some((v) =>
    typeof v === "object" && v !== null ? Object.values(v).some((x) => !isBlank(x)) : !isBlank(v) && v !== false,
  );
}

/* ------------------------------------------------------------------ */
/* Shared object schemas                                               */
/* ------------------------------------------------------------------ */

export const mediaRefSchema = z.object(
  {
    url: z
      .string({ error: "Image is required" })
      .trim()
      .min(1, "Image is required")
      .max(2048, "URL is too long")
      .refine(isHttpUrl, "Image must be a full https:// URL"),
    alt: optionalText(250, "Alt text"),
    fileId: optionalText(200),
  },
  { error: "Image is required" },
);

/** Optional image: an object with a blank url (or nothing) becomes undefined. */
export const optionalMediaRefSchema = z.preprocess((value) => {
  if (isBlank(value)) return undefined;
  if (typeof value === "object" && value !== null && isBlank((value as { url?: unknown }).url)) return undefined;
  return value;
}, mediaRefSchema.optional());

export const socialPlatformSchema = z.enum(SOCIAL_PLATFORMS, { error: "Choose a platform" });

export const socialLinkSchema = z.object({
  platform: socialPlatformSchema,
  url: httpUrlSchema,
});

export const socialLinksSchema = objectList(socialLinkSchema, 12);

/* ------------------------------------------------------------------ */
/* Error formatting                                                    */
/* ------------------------------------------------------------------ */

/** Field path → first error message, e.g. { "title": "Title is required", "embeds.0.url": "…" }. */
export type FieldErrors = Record<string, string>;

export function toFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_form";
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
