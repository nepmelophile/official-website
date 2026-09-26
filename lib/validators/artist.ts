import { z } from "zod";
import { ARTIST_MEDIA_TYPES, RELEASE_TYPES } from "@/lib/constants";
import { isEmbeddableUrl } from "@/lib/embeds";
import {
  booleanish,
  embedUrlSchema,
  httpUrlSchema,
  intField,
  mediaRefSchema,
  objectIdList,
  objectList,
  optionalDate,
  optionalIntField,
  optionalMediaRefSchema,
  optionalText,
  requiredText,
  slugSchema,
  socialLinksSchema,
  statusSchema,
  stringList,
} from "./common";

const blankToUndefined = (value: unknown) => (typeof value === "string" && value.trim() === "" ? undefined : value);

export const releaseSchema = z.object({
  title: requiredText(150, "Release title"),
  embedUrl: embedUrlSchema,
  type: z.preprocess(blankToUndefined, z.enum(RELEASE_TYPES).optional()),
  releaseDate: optionalDate,
  coverImage: optionalMediaRefSchema,
});

export const artistMediaSchema = z
  .object({
    type: z.enum(ARTIST_MEDIA_TYPES, { error: "Choose image or video" }),
    url: httpUrlSchema,
    caption: optionalText(200, "Caption"),
    fileId: optionalText(200),
  })
  .superRefine((item, ctx) => {
    // Videos are rendered as players via lib/embeds.ts, so the link must be embeddable.
    if (item.type === "video" && !isEmbeddableUrl(item.url)) {
      ctx.addIssue({ code: "custom", path: ["url"], message: "Use a YouTube link (Spotify and SoundCloud links also work)" });
    }
  })
  // An ImageKit file id only makes sense for uploaded images.
  .transform((item) => (item.type === "video" ? { ...item, fileId: undefined } : item));

export const achievementSchema = z.object({
  title: requiredText(150, "Achievement title"),
  year: optionalIntField(1900, 2100),
  description: optionalText(500, "Description"),
});

/** Admin create/update payload for an Artist. */
export const artistSchema = z.object({
  name: requiredText(120, "Name"),
  slug: slugSchema,
  photo: mediaRefSchema,
  coverImage: optionalMediaRefSchema,
  shortBio: requiredText(300, "Short bio"),
  bio: z.preprocess((v) => v ?? "", z.string().max(20_000, "Bio must be at most 20000 characters")),
  genres: stringList(10, 40),
  location: z.preprocess((v) => v ?? "", z.string().trim().max(120, "Location must be at most 120 characters")),
  socialLinks: socialLinksSchema,
  releases: objectList(releaseSchema, 50),
  media: objectList(artistMediaSchema, 60),
  achievements: objectList(achievementSchema, 50),
  relatedArticleIds: objectIdList(12),
  featured: booleanish,
  order: intField(0, 10_000),
  status: statusSchema,
});

export type ArtistInput = z.infer<typeof artistSchema>;
export type ArtistFormValues = z.input<typeof artistSchema>;
export type ReleaseInput = z.infer<typeof releaseSchema>;
export type ArtistMediaInput = z.infer<typeof artistMediaSchema>;
export type AchievementInput = z.infer<typeof achievementSchema>;
