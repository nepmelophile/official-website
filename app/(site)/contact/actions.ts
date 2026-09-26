"use server";

import { after } from "next/server";
import {
  EMPTY_CONTACT_VALUES,
  firstNameOf,
  readContactValues,
  readHoneypot,
  type ContactFormState,
  type ContactFormValues,
} from "@/components/contact/contact-form-state";
import { sendContactNotification } from "@/components/contact/notify";
import { isRateLimited } from "@/components/contact/rate-limit";
import { getClientIp } from "@/lib/client-ip";
import { connectToDatabase, isDbConfigured } from "@/lib/db";
import { toFieldErrors } from "@/lib/validators/common";
import { contactMessageSchema, isHoneypotTripped } from "@/lib/validators/contact-message";
import { ContactMessage } from "@/models/ContactMessage";

/** Identical submissions (same email + message) inside this window are treated as a resend. */
const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;

const MESSAGES = {
  invalid: "Please check the highlighted fields and try again.",
  rateLimited: "You’ve sent a few messages in a short time. Please wait a few minutes and try again.",
  unavailable: "We couldn’t send your message just now. Please try again in a few minutes.",
} as const;

function failure(message: string, values: ContactFormValues, fieldErrors: Record<string, string> = {}): ContactFormState {
  return { status: "error", message, fieldErrors, values };
}

/**
 * Public contact form action (used with useActionState). Validates with the shared zod schema,
 * silently "succeeds" for honeypot hits, saves the message (status "new") and — after the
 * response — emails the team via Resend when it is configured. Internal errors are logged and
 * never shown to the visitor.
 */
export async function submitContactMessage(
  _previous: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  // Server actions are public endpoints: never trust the argument shape.
  if (!(formData instanceof FormData)) {
    return failure(MESSAGES.invalid, EMPTY_CONTACT_VALUES);
  }

  const values = readContactValues(formData);

  // Bots fill the hidden field: pretend it worked, but don't save or email anything.
  if (isHoneypotTripped({ company: readHoneypot(formData) })) {
    return { status: "success", firstName: firstNameOf(values.name) };
  }

  const parsed = contactMessageSchema.safeParse({ ...values, company: "" });
  if (!parsed.success) {
    return failure(MESSAGES.invalid, values, toFieldErrors(parsed.error));
  }
  const data = parsed.data;
  const input = {
    name: data.name,
    email: data.email,
    phone: data.phone,
    subject: data.subject,
    service: data.service,
    message: data.message,
  };

  if (isRateLimited(await getClientIp())) {
    return failure(MESSAGES.rateLimited, values);
  }

  if (!isDbConfigured()) {
    console.error("[melophile] Contact form: MONGODB_URI is not set, so the message could not be saved.");
    return failure(MESSAGES.unavailable, values);
  }

  let saved: { id: string; createdAt: Date };
  try {
    await connectToDatabase();

    // A double submit (or a retry after a flaky response) shouldn't create a second message.
    const duplicate = await ContactMessage.exists({
      email: input.email,
      message: input.message,
      createdAt: { $gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
    });
    if (duplicate) return { status: "success", firstName: firstNameOf(input.name) };

    const doc = await ContactMessage.create({ ...input, status: "new" });
    saved = { id: doc._id.toString(), createdAt: doc.createdAt ?? new Date() };
  } catch (error) {
    const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    console.error(`[melophile] Contact form: failed to save message — ${detail}`);
    return failure(MESSAGES.unavailable, values);
  }

  // Notify the team without delaying the visitor's confirmation; no-op when Resend isn't set up.
  const notification = { ...input, ...saved };
  try {
    after(() => sendContactNotification(notification));
  } catch {
    // Outside a request scope `after` is unavailable — send inline instead (never throws).
    await sendContactNotification(notification);
  }

  return { status: "success", firstName: firstNameOf(input.name) };
}
