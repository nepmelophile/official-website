import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import {
  ActiveBadge,
  ButtonLink,
  DataTable,
  DeleteButton,
  ListToolbar,
  PageHeader,
  type DataTableColumn,
} from "@/components/admin";
import { SmartImage } from "@/components/ui/SmartImage";
import { parseListParams, type RawSearchParams } from "@/lib/admin/list";
import { listAdminServices, type ServiceActiveFilter } from "@/lib/admin/queries/services";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import type { ServiceDTO } from "@/types/content";
import { deleteService } from "./actions";

export const metadata: Metadata = { title: "Services" };

function linkLabel(formLink: string): string {
  if (formLink.startsWith("/")) return formLink;
  try {
    return new URL(formLink).hostname.replace(/^www\./, "");
  } catch {
    return formLink;
  }
}

export default async function ServicesPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  await requireAdmin();
  const { q, status } = parseListParams(await searchParams, ["active", "inactive"]);
  const { items: services, error } = await listAdminServices({ q, status: status as ServiceActiveFilter });

  const columns: DataTableColumn<ServiceDTO>[] = [
    {
      key: "name",
      header: "Service",
      primary: true,
      cell: (s) => (
        <span className="flex items-center gap-3">
          <SmartImage image={s.image} alt="" decorative sizes="40px" className="size-10 shrink-0 rounded-sm border border-line" />
          <span className="min-w-0">
            <span className="block truncate">{s.name}</span>
            <span className="block truncate font-mono text-[0.6875rem] font-normal text-fg-subtle">/services#{s.slug}</span>
          </span>
        </span>
      ),
    },
    {
      key: "link",
      header: "Enquiry link",
      hideBelow: "md",
      cell: (s) => (
        <span className="flex max-w-[14rem] items-center gap-1 font-mono text-xs">
          <span className="truncate">{linkLabel(s.formLink)}</span>
          {s.formLink.startsWith("/") ? null : (
            <>
              <ArrowUpRight aria-hidden className="size-3.5 shrink-0" strokeWidth={1.75} />
              <span className="sr-only">(external)</span>
            </>
          )}
        </span>
      ),
    },
    { key: "order", header: "Order", align: "right", hideBelow: "sm", cell: (s) => <span className="font-mono tabular-nums">{s.order}</span> },
    { key: "active", header: "Status", cell: (s) => <ActiveBadge active={s.active} /> },
    { key: "updated", header: "Updated", hideBelow: "lg", cell: (s) => formatDate(s.updatedAt, "medium") },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      interactive: true,
      cell: (s) => (
        <DeleteButton
          action={deleteService}
          id={s.id}
          itemLabel={s.name}
          description="It disappears from the Services page and the contact form’s service list."
          iconOnly
          size="sm"
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Services"
        count={services.length}
        description="What Melophile offers artists. Active services appear on /services (lowest order first) and in the contact form."
        action={{ href: "/admin/services/new", label: "New service" }}
      >
        <ButtonLink
          href="/services"
          target="_blank"
          rel="noopener noreferrer"
          variant="ghost"
          icon={<ArrowUpRight aria-hidden className="size-4" strokeWidth={1.75} />}
        >
          View page
        </ButtonLink>
      </PageHeader>
      <ListToolbar
        searchPlaceholder="Search services…"
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
        caption="Services"
        rows={services}
        columns={columns}
        rowKey={(s) => s.id}
        rowHref={(s) => `/admin/services/${s.id}`}
        empty={
          q || status
            ? { title: "No matches", description: "Try a different search or filter." }
            : {
                title: "No services yet",
                description: "Add the services Melophile offers — management, distribution, video production…",
                action: { href: "/admin/services/new", label: "New service" },
              }
        }
      />
    </>
  );
}
