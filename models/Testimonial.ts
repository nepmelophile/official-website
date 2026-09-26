import mongoose, { Schema, type Model } from "mongoose";
import { MediaRefSchema, type Lean, type MediaRefDoc, type TimestampsDoc } from "./shared";

export interface TestimonialDoc extends TimestampsDoc {
  name: string;
  designation: string;
  image?: MediaRefDoc;
  quote: string;
  order: number;
  active: boolean;
}

export type TestimonialLean = Lean<TestimonialDoc>;

const TestimonialSchema = new Schema<TestimonialDoc>(
  {
    name: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    image: { type: MediaRefSchema },
    quote: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

TestimonialSchema.index({ active: 1, order: 1 });

export const Testimonial: Model<TestimonialDoc> =
  (mongoose.models.Testimonial as Model<TestimonialDoc> | undefined) ??
  mongoose.model<TestimonialDoc>("Testimonial", TestimonialSchema);

export default Testimonial;
