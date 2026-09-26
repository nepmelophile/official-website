import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminTestimonial } from "@/lib/admin/queries/testimonials";
import { requireAdmin } from "@/lib/auth";
import { TestimonialForm } from "../TestimonialForm";

export const metadata: Metadata = { title: "Edit testimonial" };

export default async function EditTestimonialPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const testimonial = await getAdminTestimonial(id);
  if (!testimonial) notFound();
  return <TestimonialForm key={testimonial.updatedAt} testimonial={testimonial} />;
}
