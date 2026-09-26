import { toFieldErrors, type FieldErrors } from "@/lib/validators/common";
import { contactMessageSchema } from "@/lib/validators/contact-message";

/*
 * Browser-side validation with the SAME zod schema the server action uses. Loaded lazily by
 * ContactForm (dynamic import on first focus / submit) so zod stays out of /contact's initial JS.
 */
export function validateContactPayload(payload: FormData): FieldErrors {
  const result = contactMessageSchema.safeParse(Object.fromEntries(payload));
  return result.success ? {} : toFieldErrors(result.error);
}
