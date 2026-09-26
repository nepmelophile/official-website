import type { Metadata } from "next";
import Link from "next/link";
import { DataTable, ListToolbar, PageHeader, Pagination, StatusBadge, type DataTableColumn } from "@/components/admin";
import { buildListHref, parseListParams, type RawSearchParams } from "@/lib/admin/list";
import { listAdminMessages, INBOX_VIEWS, type InboxCounts, type InboxView } from "@/lib/admin/queries/messages";
import { requireAdmin } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { ContactMessageDTO } from "@/types/content";
import { formatDateTime, formatReceived, messageTitle, snippet } from "./format";
import { MarkAllReadButton, MessageStatusActions } from "./MessageStatusActions";

export const metadata: Metadata = { title: "Messages" };

interface InboxRow {
  message: ContactMessageDTO;
  /** "5h ago" etc., relative to the time of this render. */
  received: string;
}

/** Adds render-time "received" labels (computed once per request). */
function buildRows(messages: readonly ContactMessageDTO[]): InboxRow[] {
  const now = Date.now();
  return messages.map((message) => ({ message, received: formatReceived(message.createdAt, now) }));
}

const TABS: { view: InboxView; label: string; count: keyof InboxCounts }[] = [
  { view: "", label: "Inbox", count: "inbox" },
  { view: "new", label: "Unread", count: "new" },
  { view: "read", label: "Read", count: "read" },
  { view: "archived", label: "Archived", count: "archived" },
];

const EMPTY_TEXT: Record<InboxView, { title: string; description: string }> = {
  "": { title: "Inbox zero", description: "Messages sent through the contact form will show up here." },
  new: { title: "All caught up", description: "There are no unread messages." },
  read: { title: "No read messages", description: "Messages you’ve opened (and not archived) show up here." },
  archived: { title: "Nothing archived", description: "Archive handled messages to keep the inbox tidy." },
};

export default async function MessagesPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  await requireAdmin();
  const { q, status, page } = parseListParams(await searchParams, INBOX_VIEWS);
  const view = status as InboxView;
  const inbox = await listAdminMessages({ view, q, page });
  const rows = buildRows(inbox.items);
  const detailHref = (id: string) => (view ? `/admin/messages/${id}?view=${view}` : `/admin/messages/${id}`);

  const columns: DataTableColumn<InboxRow>[] = [
    {
      key: "from",
      header: "From",
      primary: true,
      cell: ({ message }) => {
        const unread = message.status === "new";
        return (
          <span className="flex items-start gap-2.5">
            <span
              aria-hidden
              className={cn("mt-1.5 size-2 shrink-0 rounded-pill", unread ? "bg-vermilion-500" : "bg-transparent")}
            />
            <span className="min-w-0">
              <span className={cn("block max-w-[14rem] truncate", unread ? "font-semibold text-fg" : "font-normal text-fg-muted")}>
                {unread ? <span className="sr-only">Unread: </span> : null}
                {message.name}
              </span>
              <span className="block max-w-[14rem] truncate text-xs font-normal text-fg-subtle">{message.email}</span>
            </span>
          </span>
        );
      },
    },
    {
      key: "message",
      header: "Message",
      hideBelow: "sm",
      cell: ({ message }) => (
        <span className="block max-w-md min-w-0">
          <span className="flex items-center gap-2">
            <span className={cn("truncate", message.status === "new" ? "font-semibold text-fg" : "text-fg")}>
              {messageTitle(message)}
            </span>
            {message.service ? (
              <span className="shrink-0 rounded-xs border border-line-strong px-1.5 py-px font-mono text-[0.625rem] uppercase tracking-[0.1em] text-fg-subtle">
                {message.service}
              </span>
            ) : null}
          </span>
          <span className="block truncate text-xs text-fg-subtle">{snippet(message.message)}</span>
        </span>
      ),
    },
    {
      key: "received",
      header: "Received",
      cell: ({ message, received }) => (
        <time dateTime={message.createdAt} title={formatDateTime(message.createdAt)} className="whitespace-nowrap tabular-nums">
          {received}
        </time>
      ),
    },
    {
      key: "status",
      header: "Status",
      hideBelow: "lg",
      cell: ({ message }) => <StatusBadge status={message.status} />,
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      interactive: true,
      cell: ({ message }) => <MessageStatusActions id={message.id} status={message.status} name={message.name} />,
    },
  ];

  return (
    <>
      <PageHeader
        title="Messages"
        count={inbox.counts.inbox}
        description="Sent through the contact form, newest first. Opening a message marks it as read; reply by email from the message."
      >
        {inbox.counts.new > 0 ? <MarkAllReadButton count={inbox.counts.new} /> : null}
      </PageHeader>

      <nav aria-label="Message folders" className="mb-4 overflow-x-auto border-b border-line">
        <ul className="flex min-w-max gap-1">
          {TABS.map((tab) => {
            const active = tab.view === view;
            const count = inbox.counts[tab.count];
            return (
              <li key={tab.label}>
                <Link
                  href={buildListHref("/admin/messages", { status: tab.view, q })}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "-mb-px inline-flex min-h-11 items-center gap-2 border-b-2 px-3 text-sm transition-colors duration-150",
                    active ? "border-accent font-semibold text-fg" : "border-transparent text-fg-muted hover:text-fg",
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      "inline-flex min-w-5 items-center justify-center rounded-pill px-1.5 py-0.5 font-mono text-[0.625rem] tabular-nums",
                      tab.view === "new" && count > 0 ? "bg-accent font-semibold text-accent-fg" : "bg-surface-raised text-fg-subtle",
                    )}
                  >
                    {count}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <ListToolbar searchPlaceholder="Search name, email, subject or message…" />

      {inbox.error ? (
        <p role="alert" className="mb-4 text-sm text-danger">
          {inbox.error}
        </p>
      ) : null}

      <DataTable
        caption={`Messages: ${TABS.find((t) => t.view === view)?.label ?? "Inbox"}`}
        rows={rows}
        columns={columns}
        rowKey={({ message }) => message.id}
        rowHref={({ message }) => detailHref(message.id)}
        rowClassName={({ message }) => (message.status === "new" ? "bg-vermilion-900/15" : undefined)}
        empty={q ? { title: "No matches", description: "Try a different search, or look in another folder." } : EMPTY_TEXT[view]}
      />

      <Pagination
        page={inbox.page}
        pageCount={inbox.pageCount}
        basePath="/admin/messages"
        params={{ q: q || undefined, status: view || undefined }}
        total={inbox.total}
      />
    </>
  );
}
