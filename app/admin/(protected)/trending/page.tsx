import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, SlidersHorizontal } from "lucide-react";
import { ButtonLink, DataTable, ListToolbar, PageHeader, StatusBadge, type DataTableColumn } from "@/components/admin";
import { TrendingCard } from "@/components/cards/TrendingCard";
import { Movement } from "@/components/trending/Movement";
import { SmartImage } from "@/components/ui/SmartImage";
import { paramValue, parseListParams, type RawSearchParams } from "@/lib/admin/list";
import { getAdminPageSettings } from "@/lib/admin/queries/page-settings";
import { listAdminTrending, type TrendingRefOptions } from "@/lib/admin/queries/trending";
import { requireAdmin } from "@/lib/auth";
import { PAGE_PATHS, TRENDING_TYPE_LABELS, TRENDING_TYPES } from "@/lib/constants";
import type { TrendingItemDTO } from "@/types/content";
import { buildRefLookup, HIDDEN_LABELS, resolveTrending, type TrendingResolution } from "./resolve";
import { TrendingRowActions } from "./TrendingRowActions";

export const metadata: Metadata = { title: "Trending" };

interface TrendingRow {
  item: TrendingItemDTO;
  resolution: TrendingResolution;
  /** Name for labels: resolved title, else the linked document, else a fallback. */
  label: string;
  /** Would show, but outside the homepage strip's first N showable items (the public query's cut-off). */
  beyondLimit: boolean;
  /** 1-based position among the showable items (the number /trending displays). */
  position?: number;
  /** Rendered in the public strip right now. */
  live: boolean;
}

function buildRows(items: readonly TrendingItemDTO[], options: TrendingRefOptions, stripLimit: number): TrendingRow[] {
  const lookup = buildRefLookup(options);
  // Mirrors getTrending: hidden items (off, unresolved) are skipped first, then the list is cut.
  let shownSeen = 0;
  return items.map((item) => {
    const resolution = resolveTrending(item, lookup);
    let beyondLimit = false;
    let position: number | undefined;
    if (resolution.visible) {
      beyondLimit = shownSeen >= stripLimit;
      shownSeen += 1;
      position = shownSeen;
    }
    return {
      item,
      resolution,
      label: resolution.display.title ?? resolution.linked?.label ?? `Untitled ${TRENDING_TYPE_LABELS[item.type].toLowerCase()}`,
      beyondLimit,
      position,
      live: resolution.visible && !beyondLimit,
    };
  });
}

const TYPE_FILTER_OPTIONS = TRENDING_TYPES.map((value) => ({ value, label: TRENDING_TYPE_LABELS[value] }));

/** Search (title / subtitle / linked item) + type + on/off filters; rank order is kept. */
function filterRows(rows: readonly TrendingRow[], q: string, type: string, status: string): TrendingRow[] {
  const needle = q.toLowerCase();
  return rows.filter((r) => {
    if (type && r.item.type !== type) return false;
    if (status === "active" && !r.item.active) return false;
    if (status === "inactive" && r.item.active) return false;
    if (!needle) return true;
    return [r.label, r.resolution.display.subtitle, r.resolution.linked?.label, r.item.title, r.item.subtitle].some(
      (text) => typeof text === "string" && text.toLowerCase().includes(needle),
    );
  });
}

interface Limits {
  /** Items in the homepage strip. */
  strip: number;
  /** Entries on /trending, or null while the page is off. */
  chart: number | null;
}

function VisibilityBadge({ row, limits }: { row: TrendingRow; limits: Limits }) {
  const { resolution } = row;
  if (row.live) return <StatusBadge status="active">Live</StatusBadge>;
  const code = resolution.hiddenCode;
  const chartOnly = !code && row.position !== undefined && limits.chart !== null && row.position <= limits.chart;
  const badge =
    code === "inactive" ? (
      <StatusBadge status="inactive">Off</StatusBadge>
    ) : code === "missing-link" ? (
      <StatusBadge status="new">{HIDDEN_LABELS[code]}</StatusBadge>
    ) : code ? (
      <StatusBadge status="featured">{HIDDEN_LABELS[code]}</StatusBadge>
    ) : chartOnly ? (
      <StatusBadge status="read">Chart only</StatusBadge>
    ) : (
      <StatusBadge status="draft">Beyond top {Math.max(limits.strip, limits.chart ?? 0)}</StatusBadge>
    );
  const reason =
    code && code !== "inactive"
      ? resolution.hiddenReason
      : chartOnly
        ? `Listed on ${PAGE_PATHS.trending} (#${String(row.position).padStart(2, "0")}); the homepage strip shows the first ${limits.strip}.`
        : !code && row.beyondLimit
          ? `Only the first ${limits.strip} showable items are in the homepage strip${limits.chart !== null ? ` and ${limits.chart} on ${PAGE_PATHS.trending}` : ""}. Move it up or switch another item off.`
          : undefined;
  return (
    <span className="flex flex-col items-start gap-1">
      {badge}
      {reason ? <span className="max-w-[16rem] text-xs leading-snug text-fg-subtle">{reason}</span> : null}
    </span>
  );
}

function SourceCell({ row }: { row: TrendingRow }) {
  const { linked } = row.resolution;
  if (!linked) {
    return <StatusBadge status="override">Custom</StatusBadge>;
  }
  return (
    <span className="flex min-w-0 flex-col items-start gap-1">
      <span className="max-w-[14rem] truncate text-sm">
        <span className="text-fg-subtle">{linked.kind === "artist" ? "Artist" : "Article"}: </span>
        {linked.label}
      </span>
      {row.item.manualOverride ? <StatusBadge status="override">Override</StatusBadge> : null}
    </span>
  );
}

export default async function TrendingPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  await requireAdmin();
  const params = await searchParams;
  const { q, status } = parseListParams(params, ["active", "inactive"]);
  const typeRaw = paramValue(params, "type");
  const type = (TRENDING_TYPES as readonly string[]).includes(typeRaw) ? typeRaw : "";
  const filtering = Boolean(q || status || type);

  const [{ items, options, error }, { value: page }] = await Promise.all([
    listAdminTrending(),
    getAdminPageSettings("trending"),
  ]);
  const limits: Limits = { strip: page.homepageLimit, chart: page.enabled ? page.pageLimit : null };
  // Live/limit status is computed on the full ranked list, then the table is filtered.
  const rows = buildRows(items, options, limits.strip);
  const visibleRows = filtering ? filterRows(rows, q, type, status) : rows;
  const liveRows = rows.filter((r) => r.live);
  const activeCount = items.filter((i) => i.active).length;

  const columns: DataTableColumn<TrendingRow>[] = [
    {
      key: "rank",
      header: "#",
      className: "w-20",
      cell: (r) => (
        <span className="flex items-center gap-2">
          <span className={r.live ? "font-mono text-sm font-medium text-highlight" : "font-mono text-sm text-fg-subtle"}>
            #{String(r.item.rank).padStart(2, "0")}
          </span>
          <Movement movement={r.item.movement} />
        </span>
      ),
    },
    {
      key: "item",
      header: "Item",
      primary: true,
      cell: (r) => (
        <span className="flex items-center gap-3">
          <SmartImage
            image={r.resolution.display.image}
            alt=""
            decorative
            sizes="40px"
            className={r.live ? "size-10 shrink-0 rounded-sm" : "size-10 shrink-0 rounded-sm opacity-60 grayscale"}
          />
          <span className="min-w-0">
            <span className="block max-w-[18rem] truncate">{r.label}</span>
            <span className="block max-w-[18rem] truncate text-xs font-normal text-fg-subtle">
              {TRENDING_TYPE_LABELS[r.item.type]}
              {r.resolution.display.subtitle ? ` · ${r.resolution.display.subtitle}` : ""}
            </span>
          </span>
        </span>
      ),
    },
    { key: "source", header: "Source", hideBelow: "md", cell: (r) => <SourceCell row={r} /> },
    { key: "visibility", header: "On site", cell: (r) => <VisibilityBadge row={r} limits={limits} /> },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      interactive: true,
      cell: (r) => (
        <TrendingRowActions
          id={r.item.id}
          label={r.label}
          active={r.item.active}
          isFirst={r === rows[0]}
          isLast={r === rows[rows.length - 1]}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Trending"
        count={items.length}
        description={`The ● TRENDING strip under the homepage hero and the ${PAGE_PATHS.trending} chart. Active items that resolve are shown in this order: the first ${limits.strip} in the strip${limits.chart !== null ? `, the first ${limits.chart} on the chart` : ""}. Links to drafts or scheduled articles stay hidden until they go live.`}
        action={{ href: "/admin/trending/new", label: "New trending item" }}
      >
        <StatusBadge status={page.enabled ? "active" : "inactive"}>
          {page.enabled ? `${PAGE_PATHS.trending} live` : `${PAGE_PATHS.trending} off`}
        </StatusBadge>
        <ButtonLink
          href="/admin/trending/settings"
          variant="secondary"
          icon={<SlidersHorizontal aria-hidden className="size-4" strokeWidth={1.75} />}
        >
          Page settings
        </ButtonLink>
        <ButtonLink
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          variant="ghost"
          icon={<ArrowUpRight aria-hidden className="size-4" strokeWidth={1.75} />}
        >
          View homepage
        </ButtonLink>
      </PageHeader>

      {error ? (
        <p role="alert" className="mb-4 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {items.length > 0 ? (
        <section aria-labelledby="trending-now-heading" className="mb-6 overflow-hidden rounded-md border border-line bg-bg-alt">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
            <h2 id="trending-now-heading" className="flex items-center gap-2 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-fg">
              <span aria-hidden className="size-2 animate-pulse-dot rounded-pill bg-accent" />
              On the homepage now
            </h2>
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-fg-subtle tabular-nums">
              {liveRows.length} live · {activeCount} active · {items.length} total
            </p>
          </div>
          {liveRows.length > 0 ? (
            <>
              <div
                role="region"
                aria-label="Trending strip preview (scrollable)"
                tabIndex={0}
                className="relative flex gap-6 overflow-x-auto px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight focus-visible:ring-inset focus-ring-custom"
              >
                {liveRows.map((r) => (
                  <div key={r.item.id} inert className="shrink-0">
                    <TrendingCard
                      item={{
                        id: r.item.id,
                        type: r.item.type,
                        rank: r.item.rank,
                        title: r.resolution.display.title ?? r.label,
                        subtitle: r.resolution.display.subtitle,
                        image: r.resolution.display.image,
                        href: r.resolution.display.href,
                        embedUrl: r.resolution.display.embedUrl,
                      }}
                    />
                  </div>
                ))}
              </div>
              <ol className="sr-only">
                {liveRows.map((r) => (
                  <li key={r.item.id}>
                    #{r.item.rank} {r.resolution.display.title}
                    {r.resolution.display.subtitle ? `, ${r.resolution.display.subtitle}` : ""}
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <p className="px-4 py-4 text-sm text-fg-muted">
              Nothing is showing — the strip is hidden until at least one active item resolves.
            </p>
          )}
        </section>
      ) : null}

      {items.length > 0 ? (
        <ListToolbar
          searchPlaceholder="Search trending items…"
          filters={[
            { param: "type", label: "Type", options: TYPE_FILTER_OPTIONS },
            {
              param: "status",
              label: "Switch",
              options: [
                { value: "active", label: "On" },
                { value: "inactive", label: "Off" },
              ],
            },
          ]}
        />
      ) : null}

      <DataTable
        caption="Trending items in display order"
        rows={visibleRows}
        columns={columns}
        rowKey={(r) => r.item.id}
        rowHref={(r) => `/admin/trending/${r.item.id}`}
        rowClassName={(r) => (r.live ? undefined : "[&_td]:text-fg-subtle")}
        empty={
          filtering && items.length > 0
            ? { title: "No matches", description: "Try a different search or filter." }
            : {
                title: "Nothing trending yet",
                description: "Pick artists, songs and news updates for the homepage’s trending strip.",
                action: { href: "/admin/trending/new", label: "New trending item" },
              }
        }
      />

      {rows.length > 1 ? (
        <p className="mt-3 text-xs text-fg-subtle">
          Use the arrows to reorder; positions are renumbered 1…{rows.length} automatically. The switch shows or hides an
          item without deleting it.{" "}
          <Link href="/admin/trending/new" className="text-link underline-offset-4 hover:underline">
            Add another item
          </Link>
          .
        </p>
      ) : null}
    </>
  );
}
