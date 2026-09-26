/**
 * Pure formatting helpers for the inbox (server + client safe). All times are Nepal time.
 */
import { SITE_NAME } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { ContactMessageDTO, ContactMessageStatus } from "@/types/content";

const TIME_FORMAT = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Asia/Kathmandu",
});

/** "12 Sep 2026, 14:05 NPT" */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${formatDate(date, "medium")}, ${TIME_FORMAT.format(date)} NPT`;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Compact "received" label relative to `now`: "just now", "12m ago", "5h ago", "3d ago", else a date. */
export function formatReceived(iso: string, now: number): string {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return "";
  const diff = now - time;
  if (diff < MINUTE) return "just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d ago`;
  return formatDate(iso, "medium");
}

/** One-line preview of the message body. */
export function snippet(text: string, max = 110): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

/** Heading for a message: its subject, else "Message from <name>". */
export function messageTitle(message: Pick<ContactMessageDTO, "subject" | "name">): string {
  return message.subject?.trim() || `Message from ${message.name}`;
}

/** Keeps mailto URLs well under the ~2000-character limit some mail clients have. */
const MAX_QUOTE = 1200;

/** mailto: link that opens a reply with the subject and the original message quoted. */
export function replyMailto(message: ContactMessageDTO): string {
  const baseSubject = message.subject?.trim() || `Your message to ${SITE_NAME}`;
  const subject = /^re:/i.test(baseSubject) ? baseSubject : `Re: ${baseSubject}`;
  const firstName = message.name.trim().split(/\s+/)[0] || message.name;
  const original = message.message.length > MAX_QUOTE ? `${message.message.slice(0, MAX_QUOTE).trimEnd()}…` : message.message;
  const quoted = original
    .split(/\r?\n/)
    .map((line) => `> ${line}`)
    .join("\n");
  const body = `Hi ${firstName},\n\n\n\n— ${SITE_NAME}\n\nOn ${formatDateTime(message.createdAt)}, ${message.name} wrote:\n${quoted}`;
  // Validated addresses only use URI-safe characters; encode anything unexpected defensively.
  const mailbox = message.email.replace(/[^A-Za-z0-9._'+@-]/g, (char) => encodeURIComponent(char));
  return `mailto:${mailbox}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export const STATUS_LABELS: Record<ContactMessageStatus, string> = {
  new: "New",
  read: "Read",
  archived: "Archived",
};
