import mongoose, { Schema, type Model, type Types } from "mongoose";
import { MediaRefSchema, SINGLETON_KEY, type Lean, type MediaRefDoc, type TimestampsDoc } from "./shared";

export interface HeroCtaDoc {
  label: string;
  href: string;
}

export interface ImpactStatDoc {
  label: string;
  value: number;
  suffix?: string;
}

export interface HomepageSettingsDoc extends TimestampsDoc {
  /** Singleton key — always 'default'. */
  key: string;
  heroHeadline: string;
  heroSubcopy: string;
  heroImage?: MediaRefDoc;
  heroCtas: HeroCtaDoc[];
  impactStats: ImpactStatDoc[];
  featuredArticleIds: Types.ObjectId[];
  featuredArtistIds: Types.ObjectId[];
}

export type HomepageSettingsLean = Lean<HomepageSettingsDoc>;


const HeroCtaSchema = new Schema<HeroCtaDoc>(
  {
    label: { type: String, required: true, trim: true },
    href: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const ImpactStatSchema = new Schema<ImpactStatDoc>(
  {
    label: { type: String, required: true, trim: true },
    value: { type: Number, required: true },
    suffix: { type: String, trim: true },
  },
  { _id: false },
);

const HomepageSettingsSchema = new Schema<HomepageSettingsDoc>(
  {
    key: { type: String, required: true, unique: true, default: SINGLETON_KEY },
    heroHeadline: { type: String, required: true, trim: true },
    heroSubcopy: { type: String, default: "", trim: true },
    heroImage: { type: MediaRefSchema },
    heroCtas: { type: [HeroCtaSchema], default: [] },
    impactStats: { type: [ImpactStatSchema], default: [] },
    featuredArticleIds: [{ type: Schema.Types.ObjectId, ref: "Article" }],
    featuredArtistIds: [{ type: Schema.Types.ObjectId, ref: "Artist" }],
  },
  { timestamps: true, collection: "homepagesettings" },
);

export const HomepageSettings: Model<HomepageSettingsDoc> =
  (mongoose.models.HomepageSettings as Model<HomepageSettingsDoc> | undefined) ??
  mongoose.model<HomepageSettingsDoc>("HomepageSettings", HomepageSettingsSchema);

export default HomepageSettings;
