import mongoose, { Schema, type Model } from "mongoose";
import { MediaRefSchema, type Lean, type MediaRefDoc, type TimestampsDoc } from "./shared";

export interface TestimonialSourceDoc {
  label: string;
  url?: string;
}

export interface TestimonialDoc extends TimestampsDoc {
  name: string;
  designation: string;
  image?: MediaRefDoc;
  quote: string;
  order: number;
  active: boolean;
  /** Shown large at the top of /testimonials. Absent on older documents (= false). */
  featured?: boolean;
  /** Where the quote was first published. */
  source?: TestimonialSourceDoc;
}

export type TestimonialLean = Lean<TestimonialDoc>;

const TestimonialSourceSchema = new Schema<TestimonialSourceDoc>(
  {
    label: { type: String, required: true, trim: true },
    url: { type: String, trim: true },
  },
  { _id: false },
);

const TestimonialSchema = new Schema<TestimonialDoc>(
  {
    name: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    image: { type: MediaRefSchema },
    quote: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    source: { type: TestimonialSourceSchema },
  },
  { timestamps: true },
);

TestimonialSchema.index({ active: 1, order: 1 });

export const Testimonial: Model<TestimonialDoc> =
  (mongoose.models.Testimonial as Model<TestimonialDoc> | undefined) ??
  mongoose.model<TestimonialDoc>("Testimonial", TestimonialSchema);

export default Testimonial;
