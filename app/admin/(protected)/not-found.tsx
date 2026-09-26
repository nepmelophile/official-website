import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { ButtonLink } from "@/components/admin/Button";

export const metadata: Metadata = { title: "Not found" };

/** 404 inside the admin shell: unknown admin URLs and notFound() from edit pages (deleted items). */
export default function AdminNotFound() {
  return (
    <div className="flex flex-col items-start gap-4 rounded-md border border-dashed border-line-strong px-6 py-14 sm:px-10">
      <p className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-fg-subtle">Error 404</p>
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-fg">Nothing here</h1>
      <p className="max-w-prose text-sm text-fg-muted">
        This admin page doesn&rsquo;t exist, or the item you opened has been deleted. Check the link, or head back to
        the dashboard.
      </p>
      <ButtonLink href="/admin" variant="primary" size="md" icon={<ArrowLeft aria-hidden className="size-4" strokeWidth={2} />}>
        Back to dashboard
      </ButtonLink>
    </div>
  );
}
