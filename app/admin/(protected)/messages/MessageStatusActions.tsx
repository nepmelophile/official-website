"use client";

import { useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, CheckCheck, Mail, MailOpen } from "lucide-react";
import { Button, DeleteButton, iconButtonClass, useToast } from "@/components/admin";
import type { ActionResult } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import type { ContactMessageStatus } from "@/types/content";
import { deleteMessage, markAllMessagesRead, setMessageStatus } from "./actions";

function useRunAction() {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  function run<T>(action: () => Promise<ActionResult<T>>, then?: string) {
    startTransition(async () => {
      let result: ActionResult<T>;
      try {
        result = await action();
      } catch {
        toast.error("Could not reach the server. Check your connection and try again.");
        return;
      }
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (result.message) toast.success(result.message);
      if (then) router.push(then);
      else router.refresh();
    });
  }

  return { pending, run };
}

interface StatusChange {
  status: ContactMessageStatus;
  label: string;
  icon: ReactNode;
  /** Leave the detail page afterwards (the message moved out of view or should stay unread). */
  leave: boolean;
}

const iconProps = { "aria-hidden": true, className: "size-4", strokeWidth: 1.75 } as const;

/** The status changes that make sense from a given status. */
function changesFor(status: ContactMessageStatus): StatusChange[] {
  if (status === "archived") {
    return [{ status: "read", label: "Move to inbox", icon: <ArchiveRestore {...iconProps} />, leave: false }];
  }
  return [
    status === "new"
      ? { status: "read", label: "Mark as read", icon: <MailOpen {...iconProps} />, leave: false }
      : { status: "new", label: "Mark as unread", icon: <Mail {...iconProps} />, leave: true },
    { status: "archived", label: "Archive", icon: <Archive {...iconProps} />, leave: true },
  ];
}

export interface MessageStatusActionsProps {
  id: string;
  status: ContactMessageStatus;
  /** Sender name, used in labels and the delete dialog. */
  name: string;
  /** "row" = icon buttons for the inbox table; "panel" = labelled buttons for the detail page. */
  variant?: "row" | "panel";
  /**
   * Detail page only: where to go after archiving, marking unread or deleting (the inbox).
   * Without it the current page is refreshed.
   */
  returnTo?: string;
}

/** Read / unread, archive / restore and delete controls for one message. */
export function MessageStatusActions({ id, status, name, variant = "row", returnTo }: MessageStatusActionsProps) {
  const { pending, run } = useRunAction();
  const changes = changesFor(status);
  const itemLabel = `the message from ${name}`;

  if (variant === "panel") {
    return (
      <div className="flex flex-col gap-2" aria-busy={pending || undefined}>
        {changes.map((change) => (
          <Button
            key={change.label}
            variant="secondary"
            disabled={pending}
            icon={change.icon}
            onClick={() => run(() => setMessageStatus(id, change.status), change.leave ? returnTo : undefined)}
            className="w-full"
          >
            {change.label}
          </Button>
        ))}
        <DeleteButton
          action={deleteMessage}
          id={id}
          itemLabel={itemLabel}
          label="Delete message"
          redirectTo={returnTo}
          className="w-full"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1.5" aria-busy={pending || undefined}>
      {changes.map((change) => (
        <button
          key={change.label}
          type="button"
          className={iconButtonClass}
          disabled={pending}
          onClick={() => run(() => setMessageStatus(id, change.status))}
          aria-label={`${change.label}: ${itemLabel}`}
          title={change.label}
        >
          {change.icon}
        </button>
      ))}
      <DeleteButton action={deleteMessage} id={id} itemLabel={itemLabel} iconOnly size="sm" />
    </div>
  );
}

/** Header button: mark every new message as read. */
export function MarkAllReadButton({ count, className }: { count: number; className?: string }) {
  const { pending, run } = useRunAction();
  return (
    <Button
      variant="secondary"
      loading={pending}
      icon={<CheckCheck {...iconProps} />}
      onClick={() => run(() => markAllMessagesRead())}
      className={cn(className)}
    >
      Mark all read
      <span className="font-mono text-xs tabular-nums text-fg-subtle">{count}</span>
    </Button>
  );
}
