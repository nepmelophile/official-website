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
  type ListFilter,
} from "@/components/admin";
import { paramValue, parseListParams, type RawSearchParams } from "@/lib/admin/list";
import {
  ADMIN_ARTIST_FEATURED_FILTERS,
  getArtistFormMeta,
  listAdminArtists,
  type AdminArtistFeaturedFilter,
  type AdminArtistRow,
} from "@/lib/admin/queries/artists";
import { requireAdmin } from "@/lib/auth";
import { CONTENT_STATUSES } from "@/lib/constants";
import { isOptimizableImageUrl } from "@/lib/images";
import { formatDate } from "@/lib/utils";
import type { ContentStatus } from "@/types/content";
import { deleteArtist } from "./actions";

export const metadata: Metadata = { title: "Artists" };

const STATUS_OPTIONS = [
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
];

const FEATURED_OPTIONS = [
  { value: "yes", label: "Featured" },
  { value: "no", label: "Not featured" },
];

function Avatar({ src, alt, name }: { src?: string; alt?: string; name: string }) {
  return (
    <span className="relative block size-10 shrink-0 overflow-hidden rounded-pill border border-line bg-surface-raised">
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
        <span aria-hidden className="flex size-full items-center justify-center font-display text-sm font-extrabold text-fg-faint">
          {name.trim().charAt(0).toUpperCase() || "M"}
        </span>
      )}
    </span>
  );
}

function GenreList({ genres }: { genres: string[] }) {
  if (genres.length === 0) return <span className="text-fg-subtle">—</span>;
  const shown = genres.slice(0, 3);
  const more = genres.length - shown.length;
  return (
    <span className="flex flex-wrap gap-1">
      {shown.map((g) => (
        <span key={g} className="rounded-xs border border-line px-1.5 py-0.5 text-xs whitespace-nowrap text-fg-muted">
          {g}
        </span>
      ))}
      {more > 0 ? <span className="px-1 py-0.5 font-mono text-[0.6875rem] text-fg-subtle">+{more}</span> : null}
    </span>
  );
}

export default async function ArtistsPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  await requireAdmin();
  const raw = await searchParams;
  const { q, status, page } = parseListParams(raw, CONTENT_STATUSES);
  const featuredParam = paramValue(raw, "featured");
  const featured = (ADMIN_ARTIST_FEATURED_FILTERS as readonly string[]).includes(featuredParam)
    ? (featuredParam as AdminArtistFeaturedFilter)
    : "";
  const genre = paramValue(raw, "genre").slice(0, 40);

  const [result, meta] = await Promise.all([
    listAdminArtists({ q, status: status as ContentStatus | "", featured, genre, page }),
    getArtistFormMeta(),
  ]);
  const filtered = Boolean(q || status || featured || genre);

  const filters: ListFilter[] = [
    { param: "status", label: "Status", options: STATUS_OPTIONS },
    { param: "featured", label: "Featured", options: FEATURED_OPTIONS },
  ];
  if (meta.genres.length > 0) {
    filters.push({ param: "genre", label: "Genre", options: meta.genres.map((g) => ({ value: g, label: g })) });
  }

  const columns: DataTableColumn<AdminArtistRow>[] = [
    {
      key: "name",
      header: "Artist",
      primary: true,
      cell: (a) => (
        <span className="flex min-w-0 items-center gap-3">
          <Avatar src={a.photo?.url} alt={a.photo?.alt} name={a.name} />
          <span className="min-w-0">
            <span className="block truncate">{a.name}</span>
            <span className="block truncate font-mono text-[0.6875rem] font-normal text-fg-subtle">
              {a.location ? `${a.location} · ` : ""}
              {a.releaseCount} {a.releaseCount === 1 ? "release" : "releases"}
            </span>
          </span>
        </span>
      ),
    },
    { key: "genres", header: "Genres", hideBelow: "md", cell: (a) => <GenreList genres={a.genres} /> },
    {
      key: "featured",
      header: "Featured",
      hideBelow: "sm",
      cell: (a) =>
        a.featured ? (
          <StatusBadge status="featured" />
        ) : (
          <span className="text-fg-subtle">
            <span aria-hidden>—</span>
            <span className="sr-only">No</span>
          </span>
        ),
    },
    { key: "status", header: "Status", cell: (a) => <StatusBadge status={a.status} /> },
    {
      key: "order",
      header: "Order",
      align: "right",
      hideBelow: "sm",
      className: "font-mono tabular-nums",
      cell: (a) => a.order,
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
          {a.status === "published" ? (
            <a
              href={`/artists/${a.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className={iconButtonClass}
              aria-label={`View ${a.name} on the site (opens in a new tab)`}
              title="View on site"
            >
              <ExternalLink aria-hidden className="size-4" strokeWidth={1.75} />
            </a>
          ) : null}
          <DeleteButton
            action={deleteArtist}
            id={a.id}
            itemLabel={a.name}
            iconOnly
            size="sm"
            description="The artist page goes offline straight away and the artist is removed from homepage picks."
          />
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Artists"
        count={result.total}
        description="Artist portfolios shown on /artists, ordered by the Order field, then name."
        action={{ href: "/admin/artists/new", label: "New artist" }}
      />
      <ListToolbar searchPlaceholder="Search name, genre, location…" filters={filters} />
      {result.error ? (
        <p role="alert" className="mb-4 rounded-sm border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-fg">
          {result.error}
        </p>
      ) : null}
      <DataTable
        caption="Artists"
        rows={result.items}
        columns={columns}
        rowKey={(a) => a.id}
        rowHref={(a) => `/admin/artists/${a.id}`}
        empty={
          filtered
            ? { title: "No matching artists", description: "Try a different search or clear the filters." }
            : result.error
              ? { title: "Artists unavailable", description: "Connect the database to start adding artists." }
              : {
                  title: "No artists yet",
                  description: "Add the first portfolio — it stays a draft until you publish it.",
                  action: { href: "/admin/artists/new", label: "New artist" },
                }
        }
      />
      <Pagination
        page={result.page}
        pageCount={result.pageCount}
        basePath="/admin/artists"
        params={{ q, status, featured: featured || undefined, genre }}
        total={result.total}
      />
    </>
  );
}
