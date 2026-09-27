import { z } from "zod";
import {
  booleanish,
  intField,
  optionalHttpUrlSchema,
  optionalMediaRefSchema,
  requiredText,
} from "./common";

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === "string" && value.trim() === "");
}

/**
 * Optional source ("Instagram post", "Interview in The Kathmandu Post") with an optional link.
 * A blank label and URL mean "no source"; a URL without a label is an error on `source.label`.
 */
export const testimonialSourceSchema = z.preprocess(
  (value) => {
    if (isBlank(value)) return undefined;
    if (typeof value !== "object" || value === null) return value;
    const { label, url } = value as { label?: unknown; url?: unknown };
    return isBlank(label) && isBlank(url) ? undefined : value;
  },
  z
    .object({
      label: requiredText(80, "Source label"),
      url: optionalHttpUrlSchema,
    })
    .optional(),
);

/** Admin create/update payload for a Testimonial. */
export const testimonialSchema = z.object({
  name: requiredText(120, "Name"),
  designation: requiredText(120, "Designation"),
  image: optionalMediaRefSchema,
  quote: requiredText(800, "Quote"),
  order: intField(0, 10_000),
  active: booleanish,
  featured: booleanish,
  source: testimonialSourceSchema,
});

export type TestimonialInput = z.infer<typeof testimonialSchema>;
export type TestimonialFormValues = z.input<typeof testimonialSchema>;

/** Inline list actions. */
export const testimonialMoveSchema = z.enum(["up", "down"], { error: "Invalid direction" });
export const testimonialFlagSchema = z.boolean({ error: "Invalid value" });
