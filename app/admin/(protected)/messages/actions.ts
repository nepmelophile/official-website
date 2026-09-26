"use server";

import { fail, ok, parseInput, toObjectIdOrThrow, withAdmin, type ActionResult } from "@/lib/admin/actions";
import { contactMessageStatusSchema } from "@/lib/validators/contact-message";
import { ContactMessage } from "@/models/ContactMessage";
import type { ContactMessageStatus } from "@/types/content";

/*
 * Inbox actions. Messages are private, so nothing public needs revalidating; the client calls
 * router.refresh() afterwards so the sidebar's unread badge updates.
 */

/** Set a message's status: new (unread) | read | archived. */
export async function setMessageStatus(
  id: string,
  status: unknown,
): Promise<ActionResult<{ status: ContactMessageStatus }>> {
  return withAdmin(async () => {
    const oid = toObjectIdOrThrow(id);
    const parsed = parseInput(contactMessageStatusSchema, status);
    if (!parsed.ok) return parsed;
    const next = parsed.data;
    // Returns the document as it was before the update (to word the confirmation).
    const before = await ContactMessage.findByIdAndUpdate(oid, { $set: { status: next } }, { returnDocument: "before" });
    if (!before) return fail("This message no longer exists.");
    const message =
      next === "archived"
        ? "Archived"
        : before.status === "archived"
          ? "Moved back to the inbox"
          : next === "new"
            ? "Marked as unread"
            : "Marked as read";
    return ok({ status: next }, message);
  });
}

/** Called when a message is opened: new → read (no-op for any other status). */
export async function markMessageRead(id: string): Promise<ActionResult<{ changed: boolean }>> {
  return withAdmin(async () => {
    const result = await ContactMessage.updateOne({ _id: toObjectIdOrThrow(id), status: "new" }, { $set: { status: "read" } });
    return ok({ changed: result.modifiedCount > 0 });
  });
}

/** Marks every new message as read. */
export async function markAllMessagesRead(): Promise<ActionResult<{ count: number }>> {
  return withAdmin(async () => {
    const result = await ContactMessage.updateMany({ status: "new" }, { $set: { status: "read" } });
    const count = result.modifiedCount;
    return ok({ count }, count === 1 ? "Marked 1 message as read" : `Marked ${count} messages as read`);
  });
}

export async function deleteMessage(id: string): Promise<ActionResult> {
  return withAdmin(async () => {
    const doc = await ContactMessage.findByIdAndDelete(toObjectIdOrThrow(id));
    if (!doc) return fail("This message was already deleted.");
    return ok(undefined, `Deleted the message from ${doc.name}`);
  });
}
