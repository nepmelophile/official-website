import { z } from "zod";
import { booleanish, intField, optionalMediaRefSchema, requiredText } from "./common";

/** Admin create/update payload for a Testimonial. */
export const testimonialSchema = z.object({
  name: requiredText(120, "Name"),
  designation: requiredText(120, "Designation"),
  image: optionalMediaRefSchema,
  quote: requiredText(800, "Quote"),
  order: intField(0, 10_000),
  active: booleanish,
});

export type TestimonialInput = z.infer<typeof testimonialSchema>;
export type TestimonialFormValues = z.input<typeof testimonialSchema>;
