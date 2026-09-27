import { z } from "zod";
import {
  HOME_TESTIMONIALS_LIMIT,
  TESTIMONIALS_HOME_LIMIT_MAX,
  TRENDING_HOME_LIMIT_MAX,
  TRENDING_LIMIT,
  TRENDING_PAGE_LIMIT,
  TRENDING_PAGE_LIMIT_MAX,
} from "@/lib/constants";
import {
  booleanish,
  intField,
  optionalLinkSchema,
  optionalMediaRefSchema,
  optionalText,
  requiredText,
} from "./common";

/** Text that may be left empty on purpose ("" = hide it), stored as "" rather than unset. */
function clearableText(max: number, label: string) {
  return z.preprocess((v) => v ?? "", z.string().trim().max(max, `${label} must be at most ${max} characters`));
}

/** Fields shared by every managed page (PageSettings). */
const pageSettingsShape = {
  enabled: booleanish,
  showInNav: booleanish,
  navLabel: requiredText(24, "Menu label"),
  eyebrow: clearableText(60, "Eyebrow"),
  heading: requiredText(140, "Heading"),
  intro: clearableText(600, "Intro"),
  metaTitle: optionalText(70, "SEO title"),
  metaDescription: optionalText(200, "SEO description"),
  ogImage: optionalMediaRefSchema,
};

/** Optional page fields: cleared in the form → removed from the document. */
export const PAGE_SETTINGS_OPTIONAL_KEYS = ["metaTitle", "metaDescription", "ogImage"] as const;
export const TESTIMONIALS_PAGE_OPTIONAL_KEYS = [...PAGE_SETTINGS_OPTIONAL_KEYS, "ctaLabel", "ctaHref"] as const;

/** Admin payload for the /trending page settings. */
export const trendingPageSettingsSchema = z.object({
  ...pageSettingsShape,
  pageLimit: intField(1, TRENDING_PAGE_LIMIT_MAX, TRENDING_PAGE_LIMIT),
  homepageLimit: intField(1, TRENDING_HOME_LIMIT_MAX, TRENDING_LIMIT),
  showTypeFilter: booleanish,
});

/** Admin payload for the /testimonials page settings. The CTA needs a label and link while it is on. */
export const testimonialsPageSettingsSchema = z
  .object({
    ...pageSettingsShape,
    homepageLimit: intField(1, TESTIMONIALS_HOME_LIMIT_MAX, HOME_TESTIMONIALS_LIMIT),
    ctaEnabled: booleanish,
    ctaLabel: optionalText(40, "Button label"),
    ctaHref: optionalLinkSchema,
  })
  .superRefine((data, ctx) => {
    if (!data.ctaEnabled) return;
    if (!data.ctaLabel) ctx.addIssue({ code: "custom", path: ["ctaLabel"], message: "Add a button label, or turn the call to action off" });
    if (!data.ctaHref) ctx.addIssue({ code: "custom", path: ["ctaHref"], message: "Add a link, or turn the call to action off" });
  });

export type TrendingPageSettingsInput = z.infer<typeof trendingPageSettingsSchema>;
export type TestimonialsPageSettingsInput = z.infer<typeof testimonialsPageSettingsSchema>;
