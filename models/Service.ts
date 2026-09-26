import mongoose, { Schema, type Model } from "mongoose";
import { MediaRefSchema, type Lean, type MediaRefDoc, type TimestampsDoc } from "./shared";

export interface ServiceDoc extends TimestampsDoc {
  name: string;
  slug: string;
  image: MediaRefDoc;
  description: string;
  details: string;
  formLink: string;
  order: number;
  active: boolean;
}

export type ServiceLean = Lean<ServiceDoc>;

const ServiceSchema = new Schema<ServiceDoc>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    image: { type: MediaRefSchema, required: true },
    description: { type: String, required: true, trim: true },
    details: { type: String, default: "" },
    formLink: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

ServiceSchema.index({ active: 1, order: 1 });

export const Service: Model<ServiceDoc> =
  (mongoose.models.Service as Model<ServiceDoc> | undefined) ??
  mongoose.model<ServiceDoc>("Service", ServiceSchema);

export default Service;
