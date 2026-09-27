import { z } from "zod";
import { optionalMediaRefSchema } from "./common";

/** Admin input for the branding singleton. A cleared logo falls back to the bundled file. */
export const siteSettingsSchema = z.object({
  logoOnDark: optionalMediaRefSchema,
  logoOnLight: optionalMediaRefSchema,
  logoMark: optionalMediaRefSchema,
});

export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;
