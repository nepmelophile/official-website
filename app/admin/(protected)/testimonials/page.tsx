import type { Metadata } from "next";
import {
  ActiveBadge,
  DataTable,
  DeleteButton,
  ListToolbar,
  PageHeader,
  type DataTableColumn,
} from "@/components/admin";
import { SmartImage } from "@/components/ui/SmartImage";
import { parseListParams, type RawSearchParams } from "@/lib/admin/list";
import { listAdminTestimonials, type TestimonialActiveFilter } from "@/lib/admin/queries/testimonials";
import { requireAdmin } from "@/lib/auth";
import { formatDate, truncate } from "@/lib/utils";
import type { TestimonialDTO } from "@/types/content";
import { deleteTestimonial } from "./actions";

export const metadata: Metadata = { title: "Testimonials" };

export default async function TestimonialsPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  await requireAdmin();
  const { q, status } = parseListParams(await searchParams, ["active", "inactive"]);
  const { items: testimonials, error } = await listAdminTestimonials({ q, status: status as TestimonialActiveFilter });

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
      cell: (t) => <span className="line-clamp-2 max-w-md font-serif italic">“{truncate(t.quote, 140)}”</span>,
    },
    { key: "order", header: "Order", align: "right", hideBelow: "sm", cell: (t) => <span className="font-mono tabular-nums">{t.order}</span> },
    { key: "active", header: "Status", cell: (t) => <ActiveBadge active={t.active} /> },
    { key: "updated", header: "Updated", hideBelow: "lg", cell: (t) => formatDate(t.updatedAt, "medium") },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      interactive: true,
      cell: (t) => (
        <DeleteButton action={deleteTestimonial} id={t.id} itemLabel={`${t.name}’s testimonial`} iconOnly size="sm" />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Testimonials"
        count={testimonials.length}
        description="Quotes from artists and partners. Active ones rotate on the homepage and the Services page, lowest order first."
        action={{ href: "/admin/testimonials/new", label: "New testimonial" }}
      />
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
    </>
  );
}
