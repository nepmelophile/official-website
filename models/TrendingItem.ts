import mongoose, { Schema, type Model, type Types } from "mongoose";
import { TRENDING_TYPES } from "@/lib/constants";
import type { TrendingType } from "@/types/content";
import { MediaRefSchema, type Lean, type MediaRefDoc, type TimestampsDoc } from "./shared";

export interface TrendingItemDoc extends TimestampsDoc {
  type: TrendingType;
  /** Artist for 'artist' | 'song'; Article for 'update'. Not a Mongoose ref (polymorphic). */
  refId?: Types.ObjectId;
  rank: number;
  manualOverride: boolean;
  active: boolean;
  /* Manual display fields (used when manualOverride is true or refId is absent). */
  title?: string;
  subtitle?: string;
  image?: MediaRefDoc;
  href?: string;
  embedUrl?: string;
}

export type TrendingItemLean = Lean<TrendingItemDoc>;

const TrendingItemSchema = new Schema<TrendingItemDoc>(
  {
    type: { type: String, enum: TRENDING_TYPES, required: true },
    refId: { type: Schema.Types.ObjectId },
    rank: { type: Number, required: true, default: 1, min: 1 },
    manualOverride: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    title: { type: String, trim: true },
    subtitle: { type: String, trim: true },
    image: { type: MediaRefSchema },
    href: { type: String, trim: true },
    embedUrl: { type: String, trim: true },
  },
  { timestamps: true },
);

TrendingItemSchema.index({ active: 1, rank: 1 });
TrendingItemSchema.index({ type: 1, rank: 1 });

export const TrendingItem: Model<TrendingItemDoc> =
  (mongoose.models.TrendingItem as Model<TrendingItemDoc> | undefined) ??
  mongoose.model<TrendingItemDoc>("TrendingItem", TrendingItemSchema);

export default TrendingItem;
