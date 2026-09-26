import "server-only";
import { Resend } from "resend";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/constants";
import { absoluteUrl } from "@/lib/site";
import type { ContactMessageInput } from "@/lib/validators/contact-message";

export type ContactNotification = Omit<ContactMessageInput, "company"> & { id: string; createdAt: Date };

interface EmailConfig {
  apiKey: string;
  to: string[];
  from: string;
}

/** Resend settings, or null when any of RESEND_API_KEY / CONTACT_TO_EMAIL / CONTACT_FROM_EMAIL is missing. */
function emailConfig(): EmailConfig | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.CONTACT_FROM_EMAIL?.trim();
  const to = (process.env.CONTACT_TO_EMAIL ?? "")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);
  if (!apiKey || !from || to.length === 0) return null;
  return { apiKey, from, to };
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Escapes text for safe interpolation into HTML (element content and quoted attributes). */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}

/** Collapses whitespace/newlines so user text can't break the subject line. */
function singleLine(value: string, max = 180): string {
  return value.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, max);
}

function formatReceived(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kathmandu",
  }).format(date);
}

function buildSubject(message: ContactNotification): string {
  const topic = message.subject || message.service || "New enquiry";
  return singleLine(`[${SITE_NAME}] ${topic} — ${message.name}`);
}

function buildText(message: ContactNotification, inboxUrl: string): string {
  const lines = [
    `New message from the ${SITE_DOMAIN} contact form`,
    "",
    `Name:    ${message.name}`,
    `Email:   ${message.email}`,
    message.phone ? `Phone:   ${message.phone}` : null,
    message.service ? `Service: ${message.service}` : null,
    message.subject ? `Subject: ${message.subject}` : null,
    `Received: ${formatReceived(message.createdAt)} (NPT)`,
    "",
    message.message,
    "",
    "—",
    `Reply to this email to answer ${message.name} directly.`,
    `All messages: ${inboxUrl}`,
  ];
  return lines.filter((line): line is string => line !== null).join("\n");
}

function buildHtml(message: ContactNotification, inboxUrl: string): string {
  const rows: [string, string][] = [
    ["Name", escapeHtml(message.name)],
    [
      "Email",
      `<a href="mailto:${escapeHtml(message.email)}" style="color:#d4321a;text-decoration:underline;">${escapeHtml(message.email)}</a>`,
    ],
  ];
  if (message.phone) rows.push(["Phone", escapeHtml(message.phone)]);
  if (message.service) rows.push(["Service", escapeHtml(message.service)]);
  if (message.subject) rows.push(["Subject", escapeHtml(message.subject)]);
  rows.push(["Received", `${escapeHtml(formatReceived(message.createdAt))} (NPT)`]);

  const rowHtml = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 16px 6px 0;color:#857c73;font:12px/1.5 ui-monospace,Menlo,Consolas,monospace;text-transform:uppercase;letter-spacing:0.12em;vertical-align:top;white-space:nowrap;">${label}</td><td style="padding:6px 0;color:#131110;font:15px/1.5 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;">${value}</td></tr>`,
    )
    .join("");

  const body = escapeHtml(message.message).replace(/\r?\n/g, "<br />");

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f5eee3;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #eae2d6;border-radius:8px;">
      <tr>
        <td style="padding:24px 28px;border-bottom:3px solid #d4321a;font:800 20px/1.2 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#0b0a09;letter-spacing:-0.01em;">
          ${escapeHtml(SITE_NAME.toUpperCase())}<span style="color:#d4321a;">.</span>
          <div style="margin-top:6px;font:12px/1.5 ui-monospace,Menlo,Consolas,monospace;color:#857c73;text-transform:uppercase;letter-spacing:0.12em;">New contact form message</div>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 28px 8px;">
          <table role="presentation" cellpadding="0" cellspacing="0">${rowHtml}</table>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 28px 24px;">
          <div style="padding:16px 18px;background:#faf6ef;border-left:3px solid #d4321a;color:#131110;font:15px/1.65 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;white-space:normal;word-break:break-word;">${body}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 28px 24px;border-top:1px solid #eae2d6;color:#5e5750;font:13px/1.6 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;">
          Reply to this email to answer ${escapeHtml(message.name)} directly.<br />
          <a href="${escapeHtml(inboxUrl)}" style="color:#d4321a;">Open the inbox</a> to manage all messages.
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Emails the team about a new contact message via Resend. Silently does nothing when email is
 * not configured; never throws (the message is already saved in MongoDB and visible in /admin).
 */
export async function sendContactNotification(message: ContactNotification): Promise<void> {
  const config = emailConfig();
  if (!config) return;

  const inboxUrl = absoluteUrl("/admin/messages");
  try {
    const resend = new Resend(config.apiKey);
    const { error } = await resend.emails.send(
      {
        from: config.from,
        to: config.to,
        replyTo: message.email,
        subject: buildSubject(message),
        html: buildHtml(message, inboxUrl),
        text: buildText(message, inboxUrl),
        tags: [{ name: "category", value: "contact_form" }],
      },
      { idempotencyKey: `contact-message-${message.id}` },
    );
    if (error) {
      console.error(`[melophile] Contact notification email was rejected by Resend: ${error.name} — ${error.message}`);
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`[melophile] Contact notification email failed: ${detail}`);
  }
}
