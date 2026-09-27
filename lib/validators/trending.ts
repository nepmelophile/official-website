import { z } from "zod";
import { TRENDING_MOVEMENTS, TRENDING_TYPES } from "@/lib/constants";
import {
  booleanish,
  intField,
  optionalEmbedUrlSchema,
  optionalLinkSchema,
  optionalMediaRefSchema,
  optionalObjectIdSchema,
  optionalText,
} from "./common";

/** Highest rank (position) an item can have. */
export const TRENDING_MAX_RANK = 1000;

/** Optional chart arrow; blank ("" from the select) means none. */
export const trendingMovementSchema = z.preprocess(
  (value) => (value === undefined || value === null || (typeof value === "string" && value.trim() === "") ? undefined : value),
  z.enum(TRENDING_MOVEMENTS, { error: "Choose new, up, down or steady" }).optional(),
);

/**
 * Admin create/update payload for a TrendingItem.
 * refId points at an Artist (type artist | song) or an Article (type update).
 *
 * Display rules (mirrored by lib/queries/trending.ts):
 *   - linked, no override → everything comes from the linked artist/article;
 *   - linked + manualOverride → the manual fields win, blank ones inherit from the link;
 *   - not linked → only the manual fields exist, so a title is required.
 */
export const trendingItemSchema = z
  .object({
    type: z.enum(TRENDING_TYPES, { error: "Choose artist, song or update" }),
    refId: optionalObjectIdSchema,
    rank: intField(1, TRENDING_MAX_RANK, 1),
    manualOverride: booleanish,
    active: booleanish,
    title: optionalText(150, "Title"),
    subtitle: optionalText(150, "Subtitle"),
    image: optionalMediaRefSchema,
    href: optionalLinkSchema,
    embedUrl: optionalEmbedUrlSchema,
    movement: trendingMovementSchema,
  })
  .superRefine((data, ctx) => {
    if (!data.refId && !data.title) {
      ctx.addIssue({
        code: "custom",
        path: ["title"],
        message: "Link an artist/article or enter a title",
      });
    }
  });

export type TrendingItemInput = z.infer<typeof trendingItemSchema>;
export type TrendingItemFormValues = z.input<typeof trendingItemSchema>;

/** Inline list actions. */
export const trendingMoveSchema = z.enum(["up", "down"], { error: "Invalid direction" });
export const trendingActiveSchema = z.boolean({ error: "Invalid value" });
