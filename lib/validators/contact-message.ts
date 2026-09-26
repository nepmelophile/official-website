import { z } from "zod";
import { CONTACT_MESSAGE_STATUSES } from "@/lib/constants";
import { optionalText } from "./common";

/**
 * Public contact form payload.
 * `company` is a honeypot: the field is visually hidden, so humans leave it empty. The
 * server action should check `isHoneypotTripped()` and pretend success without saving.
 */
export const contactMessageSchema = z.object({
  name: z
    .string({ error: "Please tell us your name" })
    .trim()
    .min(2, "Please tell us your name")
    .max(100, "Name must be at most 100 characters"),
  email: z
    .string({ error: "Please enter your email" })
    .trim()
    .toLowerCase()
    .pipe(z.email("Please enter a valid email address").max(200)),
  phone: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z
      .string()
      .trim()
      .max(40, "Phone number is too long")
      .regex(/^[+\d][\d\s()./-]{5,}$/, "Please enter a valid phone number")
      .optional(),
  ),
  subject: optionalText(150, "Subject"),
  service: optionalText(120, "Service"),
  message: z
    .string({ error: "Please write a message" })
    .trim()
    .min(10, "Your message should be at least 10 characters")
    .max(5000, "Your message must be at most 5000 characters"),
  /** Honeypot — must be empty. */
  company: z.preprocess((v) => (typeof v === "string" ? v : ""), z.string().max(500)),
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
export type ContactMessageFormValues = z.input<typeof contactMessageSchema>;

/** True when the hidden honeypot field was filled (likely a bot). */
export function isHoneypotTripped(input: Pick<ContactMessageInput, "company">): boolean {
  return input.company.trim().length > 0;
}

/** Admin: change an inbox message's status. */
export const contactMessageStatusSchema = z.enum(CONTACT_MESSAGE_STATUSES, { error: "Invalid status" });
export type ContactMessageStatusInput = z.infer<typeof contactMessageStatusSchema>;
