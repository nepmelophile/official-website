"use client";

import { ArrowUpRight, MessageSquareText } from "lucide-react";
import {
  Button,
  ButtonLink,
  FormSection,
  FormShell,
  ImageField,
  MarkdownEditor,
  NumberInput,
  SlugInput,
  TextArea,
  TextInput,
  Toggle,
  useAdminForm,
} from "@/components/admin";
import { ServiceCard } from "@/components/cards/ServiceCard";
import { formatDate } from "@/lib/utils";
import type { MediaRef, ServiceDTO } from "@/types/content";
import { createService, deleteService, updateService } from "./actions";

interface ServiceFormValues {
  name: string;
  slug: string;
  image: MediaRef;
  description: string;
  details: string;
  formLink: string;
  order: number | undefined;
  active: boolean;
}

function toValues(s: ServiceDTO | undefined, nextOrder: number): ServiceFormValues {
  return {
    name: s?.name ?? "",
    slug: s?.slug ?? "",
    image: s?.image ?? { url: "" },
    description: s?.description ?? "",
    details: s?.details ?? "",
    formLink: s?.formLink ?? "",
    order: s?.order ?? nextOrder,
    active: s?.active ?? true,
  };
}

function isHttpImage(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export interface ServiceFormProps {
  service?: ServiceDTO;
  /** Suggested order for a new service (after the current last one). */
  nextOrder?: number;
}

export function ServiceForm({ service, nextOrder = 0 }: ServiceFormProps) {
  const isNew = !service;
  const form = useAdminForm({
    initial: toValues(service, nextOrder),
    action: (values) => (service ? updateService(service.id, values) : createService(values)),
    // After create, continue on the edit page; after an update, stay (router.refresh()).
    redirectTo: isNew ? (data) => (data ? `/admin/services/${data.id}` : undefined) : undefined,
  });
  const { values, setter, set, error } = form;
  const contactLink = values.slug ? `/contact?service=${values.slug}` : "/contact";
  const previewImage = isHttpImage(values.image.url) ? values.image : undefined;

  return (
    <FormShell
      title={isNew ? "New service" : values.name || "Untitled service"}
      description={isNew ? "Services appear on /services and as options in the contact form." : undefined}
      meta={service ? `Last updated ${formatDate(service.updatedAt, "medium")}` : undefined}
      backHref="/admin/services"
      backLabel="Services"
      form={form}
      submitLabel={isNew ? "Create service" : "Save changes"}
      headerActions={
        service?.active ? (
          <ButtonLink
            href={`/services#${service.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            variant="ghost"
            size="sm"
            icon={<ArrowUpRight aria-hidden className="size-4" strokeWidth={1.75} />}
          >
            View on site
          </ButtonLink>
        ) : null
      }
      deleteProps={
        service
          ? {
              action: deleteService,
              id: service.id,
              itemLabel: service.name,
              redirectTo: "/admin/services",
              description: "It disappears from the Services page and the contact form’s service list.",
            }
          : undefined
      }
      aside={
        <>
          <FormSection title="Visibility">
            <Toggle
              label="Active"
              description="Shown on /services and in the contact form"
              checked={values.active}
              onChange={setter("active")}
            />
            <NumberInput
              label="Order"
              hint="Lower numbers come first"
              compact
              min={0}
              max={10000}
              value={values.order}
              onChange={setter("order")}
              error={error("order")}
            />
          </FormSection>
          <FormSection title="Image">
            <ImageField
              value={values.image}
              onChange={setter("image")}
              folder="/melophile/services"
              error={error("image.url") ?? error("image")}
              altError={error("image.alt")}
              required
            />
          </FormSection>
          <FormSection title="Card preview" description="How the service card reads on the site.">
            <div inert className="select-none">
              <ServiceCard
                service={{
                  name: values.name || "Service name",
                  slug: values.slug || "service",
                  description: values.description || "A short description of the service.",
                  image: previewImage ?? { url: "" },
                }}
                index={Math.max(1, values.order ?? 1)}
                href={values.formLink || undefined}
                headingLevel="h4"
                className="hover:translate-y-0"
              />
            </div>
          </FormSection>
        </>
      }
    >
      <FormSection title="Details">
        <TextInput
          label="Name"
          required
          value={values.name}
          onChange={setter("name")}
          error={error("name")}
          maxLength={120}
          showCount
          placeholder="Artist management & promotion"
        />
        <SlugInput source={values.name} prefix="/services#" value={values.slug} onChange={setter("slug")} error={error("slug")} />
        <TextArea
          label="Short description"
          required
          rows={3}
          hint="One or two sentences for the service card."
          value={values.description}
          onChange={setter("description")}
          error={error("description")}
          maxLength={400}
          showCount
        />
        <div className="space-y-2">
          <TextInput
            label="Enquiry link"
            required
            hint="Where “Get started” goes: a Google Form URL, or an internal path such as /contact?service=mixing."
            value={values.formLink}
            onChange={setter("formLink")}
            error={error("formLink")}
            suggestions={[contactLink]}
            placeholder="https://forms.gle/… or /contact?service=…"
          />
          {values.formLink !== contactLink ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => set("formLink", contactLink)}
              icon={<MessageSquareText aria-hidden className="size-4" strokeWidth={1.75} />}
            >
              Use Melophile’s contact form
            </Button>
          ) : null}
        </div>
        <MarkdownEditor
          label="Full description"
          hint="Shown on the Services page: what’s included, who it’s for, pricing notes. Markdown supported."
          value={values.details}
          onChange={setter("details")}
          error={error("details")}
          rows={14}
        />
      </FormSection>
    </FormShell>
  );
}
