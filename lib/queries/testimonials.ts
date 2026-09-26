import "server-only";
import { cache } from "react";
import { serializeTestimonial } from "@/lib/serialize";
import { Testimonial, type TestimonialLean } from "@/models/Testimonial";
import type { TestimonialDTO } from "@/types/content";
import { safeQuery } from "./safe";

/** Active testimonials ordered by `order`, newest first as a tiebreaker. */
export const getActiveTestimonials = cache(async (): Promise<TestimonialDTO[]> => {
  return safeQuery("getActiveTestimonials", [], async () => {
    const docs = await Testimonial.find({ active: true })
      .sort({ order: 1, createdAt: -1 })
      .lean<TestimonialLean[]>();
    return docs.map(serializeTestimonial);
  });
});
