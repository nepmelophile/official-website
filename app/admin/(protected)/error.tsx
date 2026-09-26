"use client";

import { useEffect } from "react";
import { House, RotateCcw } from "lucide-react";
import { Button, ButtonLink } from "@/components/admin/Button";

/**
 * Error boundary for admin pages (e.g. an edit page whose database read failed). Keeps the
 * sidebar usable and offers a retry. Details stay in the server logs; only the digest is shown.
 */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="flex flex-col items-start gap-4 rounded-md border border-danger/40 bg-surface px-6 py-12 sm:px-10">
      <p className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-danger">Something went wrong</p>
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-fg">This page couldn&rsquo;t load</h1>
      <p className="max-w-prose text-sm text-fg-muted">
        The database may be unreachable or the request timed out. Your saved content is safe — try again in a moment.
        If it keeps happening, check the MongoDB connection (MONGODB_URI and Atlas network access).
      </p>
      {error.digest ? <p className="font-mono text-xs text-fg-subtle">Reference: {error.digest}</p> : null}
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" onClick={reset} icon={<RotateCcw aria-hidden className="size-4" strokeWidth={2} />}>
          Try again
        </Button>
        <ButtonLink href="/admin" variant="secondary" icon={<House aria-hidden className="size-4" strokeWidth={2} />}>
          Dashboard
        </ButtonLink>
      </div>
    </div>
  );
}
