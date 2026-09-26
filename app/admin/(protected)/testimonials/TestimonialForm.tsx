"use client";

import {
  FormSection,
  FormShell,
  ImageField,
  NumberInput,
  TextArea,
  TextInput,
  Toggle,
  useAdminForm,
} from "@/components/admin";
import { TestimonialCard } from "@/components/cards/TestimonialCard";
import { formatDate } from "@/lib/utils";
import type { MediaRef, TestimonialDTO } from "@/types/content";
import { createTestimonial, deleteTestimonial, updateTestimonial } from "./actions";

interface TestimonialFormValues {
  name: string;
  designation: string;
  image: MediaRef;
  quote: string;
  order: number | undefined;
  active: boolean;
}

function toValues(t: TestimonialDTO | undefined, nextOrder: number): TestimonialFormValues {
  return {
    name: t?.name ?? "",
    designation: t?.designation ?? "",
    image: t?.image ?? { url: "" },
    quote: t?.quote ?? "",
    order: t?.order ?? nextOrder,
    active: t?.active ?? true,
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

export interface TestimonialFormProps {
  testimonial?: TestimonialDTO;
  nextOrder?: number;
}

export function TestimonialForm({ testimonial, nextOrder = 0 }: TestimonialFormProps) {
  const isNew = !testimonial;
  const form = useAdminForm({
    initial: toValues(testimonial, nextOrder),
    action: (values) => (testimonial ? updateTestimonial(testimonial.id, values) : createTestimonial(values)),
    redirectTo: isNew ? (data) => (data ? `/admin/testimonials/${data.id}` : undefined) : undefined,
  });
  const { values, setter, error } = form;
  const label = testimonial ? `${testimonial.name}’s testimonial` : "";

  return (
    <FormShell
      title={isNew ? "New testimonial" : values.name || "Untitled testimonial"}
      description={isNew ? "A short quote from an artist or partner, shown on the homepage and Services page." : undefined}
      meta={testimonial ? `Last updated ${formatDate(testimonial.updatedAt, "medium")}` : undefined}
      backHref="/admin/testimonials"
      backLabel="Testimonials"
      form={form}
      submitLabel={isNew ? "Create testimonial" : "Save changes"}
      deleteProps={
        testimonial
          ? { action: deleteTestimonial, id: testimonial.id, itemLabel: label, redirectTo: "/admin/testimonials" }
          : undefined
      }
      aside={
        <>
          <FormSection title="Visibility">
            <Toggle
              label="Active"
              description="Shown on the homepage and Services page"
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
          <FormSection title="Photo" description="Optional. A square headshot works best; initials are shown otherwise.">
            <ImageField
              label="Photo"
              value={values.image}
              onChange={setter("image")}
              folder="/melophile/testimonials"
              aspect="aspect-square"
              error={error("image.url") ?? error("image")}
              altError={error("image.alt")}
            />
          </FormSection>
        </>
      }
    >
      <FormSection title="Testimonial">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput
            label="Name"
            required
            value={values.name}
            onChange={setter("name")}
            error={error("name")}
            maxLength={120}
            placeholder="Aakash Rai"
          />
          <TextInput
            label="Designation"
            required
            hint="Role or artist/band name"
            value={values.designation}
            onChange={setter("designation")}
            error={error("designation")}
            maxLength={120}
            placeholder="Singer-songwriter, Pokhara"
          />
        </div>
        <TextArea
          label="Quote"
          required
          rows={5}
          hint="Without quotation marks — they’re added on the site. Two or three sentences read best."
          value={values.quote}
          onChange={setter("quote")}
          error={error("quote")}
          maxLength={800}
          showCount
        />
      </FormSection>
      <FormSection title="Preview" description="As it appears on the site.">
        <div inert className="select-none">
          <TestimonialCard
            testimonial={{
              name: values.name || "Name",
              designation: values.designation,
              quote: values.quote || "Your quote will appear here.",
              image: isHttpImage(values.image.url) ? values.image : undefined,
            }}
          />
        </div>
      </FormSection>
    </FormShell>
  );
}
