import mongoose, { Schema, type Model } from "mongoose";
import { PAGE_SETTINGS_KEYS } from "@/lib/constants";
import type { PageKey } from "@/types/content";
import { MediaRefSchema, type Lean, type MediaRefDoc, type TimestampsDoc } from "./shared";

/**
 * Content and visibility of a managed public page (/trending, /testimonials): one document per
 * page, keyed by `page`. Every field is optional in storage — lib/serialize.ts merges a stored
 * document over DEFAULT_PAGE_SETTINGS, so a missing document (or a field added later) still
 * renders a complete page.
 */
export interface PageSettingsDoc extends TimestampsDoc {
  page: PageKey;
  enabled?: boolean;
  showInNav?: boolean;
  navLabel?: string;
  eyebrow?: string;
  heading?: string;
  intro?: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: MediaRefDoc;

  /* Trending */
  pageLimit?: number;
  homepageLimit?: number;
  showTypeFilter?: boolean;

  /* Testimonials (homepageLimit is shared) */
  ctaEnabled?: boolean;
  ctaLabel?: string;
  ctaHref?: string;
}

export type PageSettingsLean = Lean<PageSettingsDoc>;

const PageSettingsSchema = new Schema<PageSettingsDoc>(
  {
    page: { type: String, enum: PAGE_SETTINGS_KEYS, required: true, unique: true },
    enabled: { type: Boolean },
    showInNav: { type: Boolean },
    navLabel: { type: String, trim: true },
    eyebrow: { type: String, trim: true },
    heading: { type: String, trim: true },
    intro: { type: String, trim: true },
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
    ogImage: { type: MediaRefSchema },
    pageLimit: { type: Number, min: 1 },
    homepageLimit: { type: Number, min: 1 },
    showTypeFilter: { type: Boolean },
    ctaEnabled: { type: Boolean },
    ctaLabel: { type: String, trim: true },
    ctaHref: { type: String, trim: true },
  },
  { timestamps: true, collection: "pagesettings" },
);

export const PageSettings: Model<PageSettingsDoc> =
  (mongoose.models.PageSettings as Model<PageSettingsDoc> | undefined) ??
  mongoose.model<PageSettingsDoc>("PageSettings", PageSettingsSchema);

export default PageSettings;
