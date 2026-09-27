import type { Metadata } from "next";
import { SlidersHorizontal } from "lucide-react";
import {
  ActiveBadge,
  ButtonLink,
  DataTable,
  ListToolbar,
  PageHeader,
  StatusBadge,
  type DataTableColumn,
} from "@/components/admin";
import { SmartImage } from "@/components/ui/SmartImage";
import { parseListParams, type RawSearchParams } from "@/lib/admin/list";
import { getAdminPageSettings } from "@/lib/admin/queries/page-settings";
import { listAdminTestimonials, type TestimonialActiveFilter } from "@/lib/admin/queries/testimonials";
import { requireAdmin } from "@/lib/auth";
import { PAGE_PATHS } from "@/lib/constants";
import { formatDate, truncate } from "@/lib/utils";
import type { TestimonialDTO } from "@/types/content";
import { TestimonialRowActions } from "./TestimonialRowActions";

export const metadata: Metadata = { title: "Testimonials" };

export default async function TestimonialsPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  await requireAdmin();
  const { q, status } = parseListParams(await searchParams, ["active", "inactive"]);
  const [{ items: testimonials, error }, { value: page }] = await Promise.all([
    listAdminTestimonials({ q, status: status as TestimonialActiveFilter }),
    getAdminPageSettings("testimonials"),
  ]);
  // Reordering swaps neighbours in the full list, so it is only offered on the unfiltered list.
  const reorderable = !q && !status;
  const featuredCount = testimonials.filter((t) => t.featured).length;

  const columns: DataTableColumn<TestimonialDTO>[] = [
    {
      key: "name",
      header: "From",
      primary: true,
      cell: (t) => (
        <span className="flex items-center gap-3">
          <SmartImage
            image={t.image}
            alt=""
            decorative
            monogram={t.name.trim().charAt(0).toUpperCase() || "M"}
            sizes="36px"
            className="size-9 shrink-0 rounded-pill border border-line"
          />
          <span className="min-w-0">
            <span className="block truncate">{t.name}</span>
            <span className="block truncate text-xs font-normal text-fg-subtle">{t.designation}</span>
          </span>
        </span>
      ),
    },
    {
      key: "quote",
      header: "Quote",
      hideBelow: "md",
      cell: (t) => (
        <span className="block max-w-md">
          <span className="line-clamp-2 font-serif italic">“{truncate(t.quote, 140)}”</span>
          {t.source ? (
            <span className="mt-1 block truncate text-xs text-fg-subtle">
              Via {t.source.label}
              {t.source.url ? " ↗" : ""}
            </span>
          ) : null}
        </span>
      ),
    },
    { key: "order", header: "Order", align: "right", hideBelow: "sm", cell: (t) => <span className="font-mono tabular-nums">{t.order}</span> },
    {
      key: "active",
      header: "Status",
      cell: (t) => (
        <span className="flex flex-col items-start gap-1">
          <ActiveBadge active={t.active} />
          {t.featured ? <StatusBadge status="featured">★ Featured</StatusBadge> : null}
        </span>
      ),
    },
    { key: "updated", header: "Updated", hideBelow: "lg", cell: (t) => formatDate(t.updatedAt, "medium") },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      interactive: true,
      cell: (t) => (
        <TestimonialRowActions
          id={t.id}
          name={t.name}
          active={t.active}
          featured={t.featured}
          isFirst={t === testimonials[0]}
          isLast={t === testimonials[testimonials.length - 1]}
          reorderable={reorderable}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Testimonials"
        count={testimonials.length}
        description={`Quotes from artists and partners. Active ones appear on the homepage, the Services page and ${PAGE_PATHS.testimonials}, in this order; ★ featured ones are shown large at the top of ${PAGE_PATHS.testimonials}.`}
        action={{ href: "/admin/testimonials/new", label: "New testimonial" }}
      >
        <StatusBadge status={page.enabled ? "active" : "inactive"}>
          {page.enabled ? `${PAGE_PATHS.testimonials} live` : `${PAGE_PATHS.testimonials} off`}
        </StatusBadge>
        <ButtonLink
          href="/admin/testimonials/settings"
          variant="secondary"
          icon={<SlidersHorizontal aria-hidden className="size-4" strokeWidth={1.75} />}
        >
          Page settings
        </ButtonLink>
      </PageHeader>
      <ListToolbar
        searchPlaceholder="Search name, role or quote…"
        filters={[
          {
            param: "status",
            label: "Status",
            options: [
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ],
          },
        ]}
      />
      {error ? (
        <p role="alert" className="mb-4 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <DataTable
        caption="Testimonials"
        rows={testimonials}
        columns={columns}
        rowKey={(t) => t.id}
        rowHref={(t) => `/admin/testimonials/${t.id}`}
        empty={
          q || status
            ? { title: "No matches", description: "Try a different search or filter." }
            : {
                title: "No testimonials yet",
                description: "Collect a few words from artists you’ve worked with.",
                action: { href: "/admin/testimonials/new", label: "New testimonial" },
              }
        }
      />
      {testimonials.length > 1 ? (
        <p className="mt-3 text-xs text-fg-subtle">
          {reorderable
            ? `Use the arrows to reorder; positions are renumbered 1…${testimonials.length} automatically.`
            : "Clear the search and filters to reorder."}{" "}
          The star features a quote ({featuredCount} featured); the switch shows or hides it without deleting it.
        </p>
      ) : null}
    </>
  );
}
