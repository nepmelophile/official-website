import type { Metadata } from "next";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import {
  DataTable,
  DeleteButton,
  ListToolbar,
  PageHeader,
  Pagination,
  StatusBadge,
  iconButtonClass,
  type DataTableColumn,
} from "@/components/admin";
import { paramValue, parseListParams, type RawSearchParams } from "@/lib/admin/list";
import { getArticleFormMeta, listAdminArticles, parseArticleSort, type AdminArticleRow } from "@/lib/admin/queries/articles";
import { requireAdmin } from "@/lib/auth";
import { CONTENT_STATUSES } from "@/lib/constants";
import { isOptimizableImageUrl } from "@/lib/images";
import { formatDate } from "@/lib/utils";
import type { ContentStatus } from "@/types/content";
import { deleteArticle } from "./actions";

export const metadata: Metadata = { title: "Articles" };

const STATUS_OPTIONS = [
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
];

const SORT_OPTIONS = [
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
        <span aria-hidden className="flex size-full items-center justify-center font-display text-sm font-extrabold text-ink-600">
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

  const [result, meta] = await Promise.all([
    listAdminArticles({ q, status: status as ContentStatus | "", category, sort, page }),
    getArticleFormMeta(),
  ]);
  const renderedAt = new Date().toISOString();
  const isLive = (a: AdminArticleRow) => a.status === "published" && a.publishedAt <= renderedAt;
  const filtered = Boolean(q || status || category);

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
    { key: "category", header: "Category", hideBelow: "sm", cell: (a) => a.category || "—" },
    {
      key: "status",
      header: "Status",
      cell: (a) =>
        a.status === "published" && !isLive(a) ? (
          <StatusBadge status="featured">Scheduled</StatusBadge>
        ) : (
          <StatusBadge status={a.status} />
        ),
    },
    {
      key: "published",
      header: "Publish date",
      hideBelow: "md",
      className: "whitespace-nowrap tabular-nums",
      cell: (a) => <time dateTime={a.publishedAt}>{formatDate(a.publishedAt, "medium")}</time>,
    },
    {
      key: "updated",
      header: "Updated",
      hideBelow: "lg",
      className: "whitespace-nowrap tabular-nums",
      cell: (a) => <time dateTime={a.updatedAt}>{formatDate(a.updatedAt, "medium")}</time>,
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      interactive: true,
      cell: (a) => (
        <span className="inline-flex items-center justify-end gap-1">
          {isLive(a) ? (
            <a
              href={`/news/${a.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className={iconButtonClass}
              aria-label={`View “${a.title}” on the site (opens in a new tab)`}
              title="View on site"
            >
              <ExternalLink aria-hidden className="size-4" strokeWidth={1.75} />
            </a>
          ) : null}
          <DeleteButton
            action={deleteArticle}
            id={a.id}
            itemLabel={a.title}
            iconOnly
            size="sm"
            description="It disappears from the site straight away and is removed from related-article lists."
          />
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Articles"
        count={result.total}
        description="News, releases, interviews and features. Drafts stay private until published."
        action={{ href: "/admin/articles/new", label: "New article" }}
      />
      <ListToolbar
        searchPlaceholder="Search title, tag, author…"
        filters={[
          { param: "status", label: "Status", options: STATUS_OPTIONS },
          { param: "category", label: "Category", options: meta.categories.map((c) => ({ value: c, label: c })) },
          { param: "sort", label: "Sort", options: SORT_OPTIONS, allLabel: "Publish date" },
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
        params={{ q, status, category, sort: sortParam && sort !== "published" ? sort : undefined }}
        total={result.total}
      />
    </>
  );
}
