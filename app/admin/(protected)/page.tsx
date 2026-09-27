import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Database, House, Plus } from "lucide-react";
import { ButtonLink } from "@/components/admin/Button";
import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { getDashboardData, type DashboardCount } from "@/lib/admin/queries/dashboard";
import { requireAdmin } from "@/lib/auth";
import { cn, formatDate, truncate } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

interface Tile {
  href: string;
  label: string;
  count: DashboardCount;
  liveLabel: string;
  hiddenLabel: string;
}

function StatTile({ tile }: { tile: Tile }) {
  const total = tile.count.live + tile.count.hidden;
  return (
    <li className="group relative flex flex-col justify-between gap-6 rounded-md border border-line bg-surface p-5 transition-colors duration-150 hover:border-line-strong">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-fg-subtle">
          <Link href={tile.href} className="after:absolute after:inset-0 hover:text-fg">
            {tile.label}
          </Link>
        </h2>
        <ArrowRight
          aria-hidden
          className="size-4 text-fg-subtle transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-fg"
          strokeWidth={1.75}
        />
      </div>
      <div>
        <p className="font-display text-4xl font-extrabold leading-none tracking-tight tabular-nums text-fg">{total}</p>
        <dl className="mt-3 flex gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span aria-hidden className="size-1.5 rounded-pill bg-success" />
            <dt className="text-fg-subtle">{tile.liveLabel}</dt>
            <dd className="font-mono tabular-nums text-fg">{tile.count.live}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <span aria-hidden className="size-1.5 rounded-pill bg-fg-subtle" />
            <dt className="text-fg-subtle">{tile.hiddenLabel}</dt>
            <dd className="font-mono tabular-nums text-fg">{tile.count.hidden}</dd>
          </div>
        </dl>
      </div>
    </li>
  );
}

export default async function AdminDashboardPage() {
  const session = await requireAdmin("/admin");
  const data = await getDashboardData();
  const { counts } = data;

  const tiles: Tile[] = [
    { href: "/admin/articles", label: "Articles", count: counts.articles, liveLabel: "Published", hiddenLabel: "Draft" },
    { href: "/admin/artists", label: "Artists", count: counts.artists, liveLabel: "Published", hiddenLabel: "Draft" },
    { href: "/admin/services", label: "Services", count: counts.services, liveLabel: "Active", hiddenLabel: "Hidden" },
    { href: "/admin/testimonials", label: "Testimonials", count: counts.testimonials, liveLabel: "Active", hiddenLabel: "Hidden" },
    { href: "/admin/trending", label: "Trending", count: counts.trending, liveLabel: "Active", hiddenLabel: "Hidden" },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Signed in as ${session.email}. Here’s what’s on Melophile right now.`}
      >
        <ButtonLink href="/admin/artists/new" variant="secondary" icon={<Plus aria-hidden className="size-4" strokeWidth={2} />}>
          New artist
        </ButtonLink>
        <ButtonLink href="/admin/articles/new" variant="primary" icon={<Plus aria-hidden className="size-4" strokeWidth={2} />}>
          New article
        </ButtonLink>
      </PageHeader>

      {data.dbError ? (
        <div role="status" className="mb-6 flex items-start gap-3 rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-fg">
          <Database aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" strokeWidth={1.75} />
          <p>
            {data.dbError} Check <code className="font-mono text-xs text-warning">MONGODB_URI</code> and that the
            database is running.
          </p>
        </div>
      ) : null}

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Content overview">
        {tiles.map((tile) => (
          <StatTile key={tile.href} tile={tile} />
        ))}
        <li className="group relative flex flex-col justify-between gap-6 rounded-md border border-accent/40 bg-accent-tint/30 p-5 transition-colors duration-150 hover:border-accent">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-link">
              <Link href="/admin/messages?status=new" className="after:absolute after:inset-0 hover:text-fg">
                New messages
              </Link>
            </h2>
            {counts.messages.new > 0 ? <span aria-hidden className="size-2 animate-pulse-dot rounded-pill bg-accent" /> : null}
          </div>
          <div>
            <p className="font-display text-4xl font-extrabold leading-none tracking-tight tabular-nums text-fg">
              {counts.messages.new}
            </p>
            <p className="mt-3 text-xs text-fg-subtle">
              of <span className="font-mono tabular-nums text-fg">{counts.messages.total}</span> total in the inbox
            </p>
          </div>
        </li>
      </ul>

      <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
        <section aria-labelledby="latest-messages">
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 id="latest-messages" className="font-display text-lg font-bold tracking-tight">
              Latest messages
            </h2>
            <Link
              href="/admin/messages"
              className="inline-flex items-center gap-1 text-sm text-fg-muted underline-offset-4 hover:text-fg hover:underline"
            >
              Open inbox <ArrowRight aria-hidden className="size-3.5" strokeWidth={1.75} />
            </Link>
          </div>
          {data.latestMessages.length === 0 ? (
            <EmptyState title="No messages yet" description="Messages sent through the contact form will show up here." />
          ) : (
            <ul className="divide-y divide-line rounded-md border border-line">
              {data.latestMessages.map((message) => (
                <li
                  key={message.id}
                  className={cn(
                    "relative flex items-start gap-4 px-4 py-3 transition-colors duration-150 hover:bg-surface",
                    message.status === "new" && "bg-accent-tint/15",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
                      <Link
                        href={`/admin/messages/${message.id}`}
                        className={cn(
                          "after:absolute after:inset-0 hover:text-link",
                          message.status === "new" ? "font-semibold text-fg" : "text-fg",
                        )}
                      >
                        {message.name}
                      </Link>
                      <span className="truncate text-xs text-fg-subtle">{message.email}</span>
                    </p>
                    <p className="mt-0.5 truncate text-sm text-fg-muted">
                      {message.subject || message.service ? (
                        <span className="text-fg">{message.subject || message.service} — </span>
                      ) : null}
                      {truncate(message.message, 140)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <StatusBadge status={message.status} />
                    <time dateTime={message.createdAt} className="font-mono text-[0.6875rem] text-fg-subtle">
                      {formatDate(message.createdAt, "medium")}
                    </time>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="quick-links" className="space-y-3">
          <h2 id="quick-links" className="font-display text-lg font-bold tracking-tight">
            Quick links
          </h2>
          <ul className="space-y-2 text-sm">
            {[
              { href: "/admin/articles/new", label: "Write a new article", icon: <Plus aria-hidden className="size-4" strokeWidth={1.75} /> },
              { href: "/admin/artists/new", label: "Add a new artist", icon: <Plus aria-hidden className="size-4" strokeWidth={1.75} /> },
              { href: "/admin/homepage", label: "Edit homepage hero & picks", icon: <House aria-hidden className="size-4" strokeWidth={1.75} /> },
              { href: "/admin/trending", label: "Update the trending strip", icon: <ArrowRight aria-hidden className="size-4" strokeWidth={1.75} /> },
            ].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex min-h-11 items-center gap-3 rounded-sm border border-line bg-surface px-4 text-fg-muted transition-colors duration-150 hover:border-line-strong hover:text-fg"
                >
                  {link.icon}
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
