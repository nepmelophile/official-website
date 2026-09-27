import mongoose, { Schema, type Model } from "mongoose";
import { MediaRefSchema, SINGLETON_KEY, type Lean, type MediaRefDoc, type TimestampsDoc } from "./shared";

/**
 * Site-wide branding (singleton, key "default"). The logo files live on ImageKit; only their
 * MediaRefs are stored here. Every field is optional so the site falls back to the bundled
 * files in /public/brand when nothing is saved (see DEFAULT_BRAND_ASSETS in lib/brand.ts).
 */
export interface SiteSettingsDoc extends TimestampsDoc {
  /** Singleton key — always 'default'. */
  key: string;
  /** Full logo for dark backgrounds (light lettering). */
  logoOnDark?: MediaRefDoc;
  /** Full logo for light backgrounds (dark lettering). */
  logoOnLight?: MediaRefDoc;
  /** The note mark on its own — compact spots and icons. */
  logoMark?: MediaRefDoc;
}

export type SiteSettingsLean = Lean<SiteSettingsDoc>;

const SiteSettingsSchema = new Schema<SiteSettingsDoc>(
  {
    key: { type: String, required: true, unique: true, default: SINGLETON_KEY },
    logoOnDark: { type: MediaRefSchema },
    logoOnLight: { type: MediaRefSchema },
    logoMark: { type: MediaRefSchema },
  },
  { timestamps: true, collection: "sitesettings" },
);

export const SiteSettings: Model<SiteSettingsDoc> =
  (mongoose.models.SiteSettings as Model<SiteSettingsDoc> | undefined) ??
  mongoose.model<SiteSettingsDoc>("SiteSettings", SiteSettingsSchema);

export default SiteSettings;
