import { z } from "zod";
import { booleanish, intField, linkSchema, mediaRefSchema, requiredText, slugSchema } from "./common";

/** Admin create/update payload for a Service. */
export const serviceSchema = z.object({
  name: requiredText(120, "Name"),
  slug: slugSchema,
  image: mediaRefSchema,
  description: requiredText(400, "Description"),
  details: z.preprocess((v) => v ?? "", z.string().max(20_000, "Details must be at most 20000 characters")),
  /** Absolute URL (e.g. Google Form) or internal path such as /contact?service=slug. */
  formLink: linkSchema,
  order: intField(0, 10_000),
  active: booleanish,
});

export type ServiceInput = z.infer<typeof serviceSchema>;
export type ServiceFormValues = z.input<typeof serviceSchema>;
