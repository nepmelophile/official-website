import type { Metadata } from "next";
import Image from "next/image";
import { DataTable, ListToolbar, PageHeader, Pagination, StatusBadge, type DataTableColumn } from "@/components/admin";
import { ADMIN_PAGE_SIZE, paramValue, parseListParams, type RawSearchParams } from "@/lib/admin/list";
import { getArticleFormMeta, listAdminArticles, parseArticleSort, type AdminArticleRow } from "@/lib/admin/queries/articles";
import { getAdminHomepageSettings } from "@/lib/admin/queries/settings";
import { requireAdmin } from "@/lib/auth";
import { CONTENT_STATUSES, HOME_LATEST_NEWS_COUNT } from "@/lib/constants";
import { isOptimizableImageUrl } from "@/lib/images";
import { formatDate } from "@/lib/utils";
import type { ContentStatus } from "@/types/content";
import { ArticleRowActions } from "./ArticleRowActions";

export const metadata: Metadata = { title: "Articles" };

const STATUS_OPTIONS = [
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
];

const SORT_OPTIONS = [
  { value: "published", label: "Publish date" },
  { value: "updated", label: "Recently updated" },
  { value: "title", label: "Title A–Z" },
];

function Thumb({ src, alt }: { src?: string; alt?: string }) {
  return (
    <span className="relative block size-10 shrink-0 overflow-hidden rounded-xs border border-line bg-surface-raised">
      {src ? (
        <Image
          src={src}
          alt={alt ?? ""}
          fill
          sizes="40px"
          unoptimized={!isOptimizableImageUrl(src)}
          className="object-cover"
        />
      ) : (
        <span aria-hidden className="flex size-full items-center justify-center font-display text-sm font-extrabold text-line-strong">
          M
        </span>
      )}
    </span>
  );
}

export default async function ArticlesPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  await requireAdmin();
  const raw = await searchParams;
  const { q, status, page } = parseListParams(raw, CONTENT_STATUSES);
  const category = paramValue(raw, "category").slice(0, 60);
  const sortParam = paramValue(raw, "sort");
  const sort = parseArticleSort(sortParam);

  const [result, meta, homepage] = await Promise.all([
    listAdminArticles({ q, status: status as ContentStatus | "", category, sort, page }),
    getArticleFormMeta(),
    getAdminHomepageSettings(),
  ]);
  const renderedAt = new Date().toISOString();
  const isLive = (a: AdminArticleRow) => a.status === "published" && a.publishedAt <= renderedAt;
  const filtered = Boolean(q || status || category);
  // Homepage picks in their homepage order (1-based); only the first HOME_LATEST_NEWS_COUNT are shown there.
  const homepagePosition = new Map(homepage.value.featuredArticleIds.map((articleId, i) => [articleId, i + 1]));
  // Manual order: the arrows swap neighbours in the full list, so they only work in the unfiltered Position view.
  const reorderable = sort === "position" && !filtered;
  const offset = (result.page - 1) * ADMIN_PAGE_SIZE;
  const position = new Map(result.items.map((a, i) => [a.id, offset + i + 1]));

  const columns: DataTableColumn<AdminArticleRow>[] = [
    {
      key: "title",
      header: "Title",
      primary: true,
      cell: (a) => (
        <span className="flex min-w-0 items-center gap-3">
          <Thumb src={a.featuredImage?.url} alt={a.featuredImage?.alt} />
          <span className="min-w-0">
            <span className="line-clamp-2 max-w-md">{a.title}</span>
            <span className="block truncate font-mono text-[0.6875rem] font-normal text-fg-subtle">/news/{a.slug}</span>
          </span>
        </span>
      ),
    },
    ...(reorderable
      ? [
          {
            key: "order",
            header: "Order",
            align: "right",
            hideBelow: "sm",
            cell: (a) => <span className="font-mono tabular-nums">{position.get(a.id)}</span>,
          } satisfies DataTableColumn<AdminArticleRow>,
        ]
      : []),
    { key: "category", header: "Category", hideBelow: "xl", cell: (a) => a.category || "—" },
    {
      key: "status",
      header: "Status",
      cell: (a) => {
        const position = homepagePosition.get(a.id);
        return (
          <span className="flex flex-col items-start gap-1.5">
            {a.status === "published" && !isLive(a) ? (
              <StatusBadge status="featured">Scheduled</StatusBadge>
            ) : (
              <StatusBadge status={a.status} />
            )}
            {position ? (
              <StatusBadge status="featured" className="whitespace-nowrap">
                {position <= HOME_LATEST_NEWS_COUNT ? `★ Homepage #${position}` : "★ Homepage (overflow)"}
              </StatusBadge>
            ) : null}
          </span>
        );
      },
    },
    {
      key: "published",
      header: "Publish date",
      hideBelow: "lg",
      className: "whitespace-nowrap tabular-nums",
      cell: (a) => <time dateTime={a.publishedAt}>{formatDate(a.publishedAt, "medium")}</time>,
    },
    {
      key: "updated",
      header: "Updated",
      hideBelow: "2xl",
      className: "whitespace-nowrap tabular-nums",
      cell: (a) => <time dateTime={a.updatedAt}>{formatDate(a.updatedAt, "medium")}</time>,
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      interactive: true,
      cell: (a) => {
        const pos = position.get(a.id) ?? 0;
        return (
          <ArticleRowActions
            id={a.id}
            title={a.title}
            slug={a.slug}
            published={a.status === "published"}
            live={isLive(a)}
            featured={homepagePosition.has(a.id)}
            isFirst={pos === 1}
            isLast={pos === result.total}
            reorderable={reorderable}
          />
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Articles"
        count={result.total}
        description={`News, releases, interviews and features, in the order they appear on /news. The ★ features an article on the homepage, which shows the first ${HOME_LATEST_NEWS_COUNT} picks.`}
        action={{ href: "/admin/articles/new", label: "New article" }}
      />
      <ListToolbar
        searchPlaceholder="Search title, tag, author…"
        filters={[
          { param: "status", label: "Status", options: STATUS_OPTIONS },
          { param: "category", label: "Category", options: meta.categories.map((c) => ({ value: c, label: c })) },
          { param: "sort", label: "Sort", options: SORT_OPTIONS, allLabel: "Position" },
        ]}
      />
      {result.error ? (
        <p role="alert" className="mb-4 rounded-sm border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-fg">
          {result.error}
        </p>
      ) : null}
      <DataTable
        caption="Articles"
        rows={result.items}
        columns={columns}
        rowKey={(a) => a.id}
        rowHref={(a) => `/admin/articles/${a.id}`}
        empty={
          filtered
            ? { title: "No matching articles", description: "Try a different search or clear the filters." }
            : result.error
              ? { title: "Articles unavailable", description: "Connect the database to start publishing." }
              : {
                  title: "No articles yet",
                  description: "Write the first story — it stays a draft until you publish it.",
                  action: { href: "/admin/articles/new", label: "New article" },
                }
        }
      />
      <Pagination
        page={result.page}
        pageCount={result.pageCount}
        basePath="/admin/articles"
        params={{ q, status, category, sort: sortParam && sort !== "position" ? sort : undefined }}
        total={result.total}
      />
      {result.total > 1 ? (
        <p className="mt-3 text-xs text-fg-subtle">
          {reorderable
            ? `Use the arrows to reorder; this is the order on /news and in the homepage’s latest news. New articles start at the top.`
            : "Sort by Position and clear the search and filters to reorder."}{" "}
          The star puts an article on the homepage; the switch shows or hides it (hidden articles go back to drafts).
        </p>
      ) : null}
    </>
  );
}
