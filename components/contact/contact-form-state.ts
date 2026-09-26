import type { FieldErrors } from "@/lib/validators/common";

/** Visible contact form fields (the honeypot `company` is handled separately). */
export const CONTACT_FIELDS = ["name", "email", "phone", "subject", "service", "message"] as const;
export type ContactField = (typeof CONTACT_FIELDS)[number];

/** Raw submitted values, echoed back on error so nothing the visitor typed is lost. */
export type ContactFormValues = Record<ContactField, string>;

/** Name of the hidden honeypot input (must stay empty). */
export const HONEYPOT_FIELD = "company";

/** Max lengths mirrored from lib/validators/contact-message.ts (used for `maxLength` + echo caps). */
export const CONTACT_MAX_LENGTH: Record<ContactField, number> = {
  name: 100,
  email: 200,
  phone: 40,
  subject: 150,
  service: 120,
  message: 5000,
};

export type ContactFormState =
  | { status: "idle" }
  | { status: "success"; firstName: string }
  | {
      status: "error";
      /** Form-level message (validation summary, rate limit, service unavailable). */
      message: string;
      fieldErrors: FieldErrors;
      values: ContactFormValues;
    };

export const INITIAL_CONTACT_FORM_STATE: ContactFormState = { status: "idle" };

export const EMPTY_CONTACT_VALUES: ContactFormValues = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  service: "",
  message: "",
};

function readString(formData: FormData, key: string, max: number): string {
  const value = formData.get(key);
  // Cap generously above the schema limit so oversized input still fails validation (and is
  // never echoed back in full).
  return typeof value === "string" ? value.slice(0, max + 50) : "";
}

/** Reads the visible fields from FormData as plain strings. */
export function readContactValues(formData: FormData): ContactFormValues {
  const values = { ...EMPTY_CONTACT_VALUES };
  for (const field of CONTACT_FIELDS) values[field] = readString(formData, field, CONTACT_MAX_LENGTH[field]);
  return values;
}

/** Reads the honeypot value. */
export function readHoneypot(formData: FormData): string {
  return readString(formData, HONEYPOT_FIELD, 450);
}

/** First word of a name, for a friendly confirmation ("Thanks, Asha!"). */
export function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0]?.slice(0, 40) ?? "";
}
