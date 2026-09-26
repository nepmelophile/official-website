import "server-only";
import { toObjectId } from "@/lib/admin/actions";
import { ADMIN_PAGE_SIZE, pageWindow, searchRegex } from "@/lib/admin/list";
import { CONTACT_MESSAGE_STATUSES } from "@/lib/constants";
import { connectToDatabase, isDbConfigured } from "@/lib/db";
import { serializeContactMessage } from "@/lib/serialize";
import { ContactMessage, type ContactMessageLean } from "@/models/ContactMessage";
import type { ContactMessageDTO, ContactMessageStatus } from "@/types/content";

/*
 * Admin read helpers for the contact inbox. Call only after requireAdmin().
 *
 * Views: "" = Inbox (new + read, i.e. everything not archived), or one exact status.
 */

export type InboxView = "" | ContactMessageStatus;

export const INBOX_VIEWS: readonly ContactMessageStatus[] = CONTACT_MESSAGE_STATUSES;

export interface InboxCounts {
  /** new + read */
  inbox: number;
  new: number;
  read: number;
  archived: number;
}

export interface AdminInbox {
  items: ContactMessageDTO[];
  total: number;
  page: number;
  pageCount: number;
  counts: InboxCounts;
  error?: string;
}

const EMPTY_COUNTS: InboxCounts = { inbox: 0, new: 0, read: 0, archived: 0 };

async function countByStatus(): Promise<InboxCounts> {
  const rows = await ContactMessage.aggregate<{ _id: ContactMessageStatus; count: number }>([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const counts = { ...EMPTY_COUNTS };
  for (const row of rows) {
    if (row._id === "new" || row._id === "read" || row._id === "archived") counts[row._id] = row.count;
  }
  counts.inbox = counts.new + counts.read;
  return counts;
}

/** A page of messages (newest first) for a view, optionally searched across sender and text. */
export async function listAdminMessages({
  view = "",
  q = "",
  page = 1,
}: {
  view?: InboxView;
  q?: string;
  page?: number;
} = {}): Promise<AdminInbox> {
  const empty: AdminInbox = { items: [], total: 0, page: 1, pageCount: 1, counts: EMPTY_COUNTS };
  if (!isDbConfigured()) return { ...empty, error: "The database is not configured (MONGODB_URI is missing)." };

  try {
    await connectToDatabase();
    const filter: Record<string, unknown> = { status: view || { $ne: "archived" } };
    if (q) {
      const rx = searchRegex(q);
      filter.$or = [{ name: rx }, { email: rx }, { subject: rx }, { service: rx }, { message: rx }];
    }

    const [total, counts] = await Promise.all([ContactMessage.countDocuments(filter), countByStatus()]);
    const pageCount = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
    const current = Math.min(Math.max(1, page), pageCount);
    const { skip, limit } = pageWindow(current);
    const docs = await ContactMessage.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean<ContactMessageLean[]>();

    return { items: docs.map(serializeContactMessage), total, page: current, pageCount, counts };
  } catch (error) {
    console.error("[melophile admin] listAdminMessages failed", error);
    return { ...empty, error: "Could not load messages — is the database reachable?" };
  }
}

export interface AdminMessageDetail {
  message: ContactMessageDTO;
  /** Next newer / older message in the same view (for keyboard-free triage). */
  newerId?: string;
  olderId?: string;
}

/**
 * One message by id with its newer/older neighbours in the same view
 * (null for a malformed or unknown id). Throws when the DB is unavailable.
 */
export async function getAdminMessage(id: string, view: InboxView = ""): Promise<AdminMessageDetail | null> {
  const oid = toObjectId(id);
  if (!oid) return null;
  await connectToDatabase();
  const doc = await ContactMessage.findById(oid).lean<ContactMessageLean>();
  if (!doc) return null;

  const scope: Record<string, unknown> = { status: view || { $ne: "archived" } };
  const createdAt = doc.createdAt;
  const [newer, older] = await Promise.all([
    ContactMessage.findOne({
      ...scope,
      $or: [{ createdAt: { $gt: createdAt } }, { createdAt, _id: { $gt: doc._id } }],
    })
      .sort({ createdAt: 1, _id: 1 })
      .select("_id")
      .lean<Pick<ContactMessageLean, "_id">>(),
    ContactMessage.findOne({
      ...scope,
      $or: [{ createdAt: { $lt: createdAt } }, { createdAt, _id: { $lt: doc._id } }],
    })
      .sort({ createdAt: -1, _id: -1 })
      .select("_id")
      .lean<Pick<ContactMessageLean, "_id">>(),
  ]);

  return {
    message: serializeContactMessage(doc),
    newerId: newer ? newer._id.toString() : undefined,
    olderId: older ? older._id.toString() : undefined,
  };
}
