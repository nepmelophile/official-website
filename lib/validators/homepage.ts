import { z } from "zod";
import {
  linkSchema,
  objectIdList,
  objectList,
  optionalMediaRefSchema,
  optionalText,
  requiredText,
} from "./common";

export const heroCtaSchema = z.object({
  label: requiredText(40, "Button label"),
  href: linkSchema,
});

export const impactStatSchema = z.object({
  label: requiredText(60, "Stat label"),
  value: z.coerce.number({ error: "Enter a number" }).min(0, "Must be 0 or more").max(1_000_000_000),
  suffix: optionalText(8, "Suffix"),
});

/** Admin payload for the HomepageSettings singleton. */
export const homepageSettingsSchema = z.object({
  heroHeadline: requiredText(160, "Hero headline"),
  heroSubcopy: z.preprocess((v) => v ?? "", z.string().trim().max(400, "Hero subcopy must be at most 400 characters")),
  heroImage: optionalMediaRefSchema,
  heroCtas: objectList(heroCtaSchema, 3),
  impactStats: objectList(impactStatSchema, 6),
  featuredArticleIds: objectIdList(12),
  featuredArtistIds: objectIdList(12),
});

export type HomepageSettingsInput = z.infer<typeof homepageSettingsSchema>;
export type HomepageSettingsFormValues = z.input<typeof homepageSettingsSchema>;
