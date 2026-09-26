"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { markMessageRead } from "../actions";

/**
 * Marks a new message as read once it has actually been opened (an effect, so link prefetching
 * never marks anything), then refreshes so the status and the sidebar's unread badge update.
 */
export function MarkAsRead({ id }: { id: string }) {
  const router = useRouter();
  const done = useRef<string | null>(null);

  useEffect(() => {
    if (done.current === id) return;
    done.current = id;
    markMessageRead(id).then(
      (result) => {
        if (result.ok && result.data?.changed) router.refresh();
      },
      () => {
        // Offline or signed out: the message simply stays "new".
      },
    );
  }, [id, router]);

  return null;
}
