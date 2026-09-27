import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, Mail, Phone, Reply } from "lucide-react";
import { buttonClass, FormSection, StatusBadge } from "@/components/admin";
import { paramValue, type RawSearchParams } from "@/lib/admin/list";
import { getAdminMessage, INBOX_VIEWS, type InboxView } from "@/lib/admin/queries/messages";
import { requireAdmin } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { formatDateTime, messageTitle, replyMailto, STATUS_LABELS } from "../format";
import { MessageStatusActions } from "../MessageStatusActions";
import { MarkAsRead } from "./MarkAsRead";

export const metadata: Metadata = { title: "Message" };

const navLinkClass =
  "inline-flex min-h-9 items-center gap-1 rounded-pill border border-line-strong px-3 text-xs font-semibold text-fg transition-colors duration-150 hover:border-fg";

export default async function MessagePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  await requireAdmin();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const viewParam = paramValue(query, "view");
  const view: InboxView = (INBOX_VIEWS as readonly string[]).includes(viewParam) ? (viewParam as InboxView) : "";

  const detail = await getAdminMessage(id, view);
  if (!detail) notFound();
  const { message, newerId, olderId } = detail;

  const listHref = view ? `/admin/messages?status=${view}` : "/admin/messages";
  const siblingHref = (siblingId: string) => (view ? `/admin/messages/${siblingId}?view=${view}` : `/admin/messages/${siblingId}`);
  const folderLabel = view ? STATUS_LABELS[view] : "Inbox";
  const title = messageTitle(message);

  return (
    <>
      {message.status === "new" ? <MarkAsRead key={message.id} id={message.id} /> : null}

      <header className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={listHref}
            className="inline-flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-fg-subtle hover:text-fg"
          >
            <ArrowLeft aria-hidden className="size-3.5" strokeWidth={1.75} />
            {folderLabel === "Inbox" ? "Inbox" : `${folderLabel} messages`}
          </Link>
          <nav aria-label="Other messages" className="flex gap-2">
            {newerId ? (
              <Link href={siblingHref(newerId)} className={navLinkClass} rel="prev">
                <ChevronLeft aria-hidden className="size-4" strokeWidth={1.75} /> Newer
              </Link>
            ) : (
              <span aria-disabled className={cn(navLinkClass, "pointer-events-none opacity-40")}>
                <ChevronLeft aria-hidden className="size-4" strokeWidth={1.75} /> Newer
              </span>
            )}
            {olderId ? (
              <Link href={siblingHref(olderId)} className={navLinkClass} rel="next">
                Older <ChevronRight aria-hidden className="size-4" strokeWidth={1.75} />
              </Link>
            ) : (
              <span aria-disabled className={cn(navLinkClass, "pointer-events-none opacity-40")}>
                Older <ChevronRight aria-hidden className="size-4" strokeWidth={1.75} />
              </span>
            )}
          </nav>
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold tracking-tight break-words text-fg">{title}</h1>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-muted">
            <StatusBadge status={message.status} />
            <span>
              From <span className="font-medium text-fg">{message.name}</span>
            </span>
            <span aria-hidden className="text-line-strong">
              /
            </span>
            <time dateTime={message.createdAt}>{formatDateTime(message.createdAt)}</time>
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)] lg:items-start">
        <article aria-labelledby="message-body-heading" className="min-w-0 space-y-4">
          <h2 id="message-body-heading" className="sr-only">
            Message
          </h2>
          <div className="rounded-md border border-line bg-surface p-5 sm:p-6">
            {message.service ? (
              <p className="mb-4 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-fg-subtle">
                About: <span className="text-highlight">{message.service}</span>
              </p>
            ) : null}
            <p className="text-[0.9375rem] leading-relaxed whitespace-pre-wrap break-words text-fg">{message.message}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={replyMailto(message)} className={buttonClass("primary", "md")}>
              <Reply aria-hidden className="size-4" strokeWidth={1.75} />
              Reply by email
            </a>
            {message.phone ? (
              <a href={`tel:${message.phone.replace(/[^\d+]/g, "")}`} className={buttonClass("secondary", "md")}>
                <Phone aria-hidden className="size-4" strokeWidth={1.75} />
                Call {message.phone}
              </a>
            ) : null}
          </div>
        </article>

        <aside className="min-w-0 space-y-6 lg:sticky lg:top-6">
          <FormSection title="Sender">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-fg-subtle">Name</dt>
                <dd className="mt-0.5 break-words text-fg">{message.name}</dd>
              </div>
              <div>
                <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-fg-subtle">Email</dt>
                <dd className="mt-0.5">
                  <a
                    href={`mailto:${message.email}`}
                    className="inline-flex items-center gap-1.5 break-all text-link underline-offset-4 hover:underline"
                  >
                    <Mail aria-hidden className="size-3.5 shrink-0" strokeWidth={1.75} />
                    {message.email}
                  </a>
                </dd>
              </div>
              {message.phone ? (
                <div>
                  <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-fg-subtle">Phone</dt>
                  <dd className="mt-0.5">
                    <a
                      href={`tel:${message.phone.replace(/[^\d+]/g, "")}`}
                      className="text-link underline-offset-4 hover:underline"
                    >
                      {message.phone}
                    </a>
                  </dd>
                </div>
              ) : null}
              {message.service ? (
                <div>
                  <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-fg-subtle">Service</dt>
                  <dd className="mt-0.5 text-fg">{message.service}</dd>
                </div>
              ) : null}
              <div>
                <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-fg-subtle">Received</dt>
                <dd className="mt-0.5 text-fg">
                  <time dateTime={message.createdAt}>{formatDateTime(message.createdAt)}</time>
                </dd>
              </div>
            </dl>
          </FormSection>
          <FormSection title="Actions">
            <MessageStatusActions id={message.id} status={message.status} name={message.name} variant="panel" returnTo={listHref} />
          </FormSection>
        </aside>
      </div>
    </>
  );
}
