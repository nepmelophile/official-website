import type { Metadata } from "next";
import { getNextTestimonialOrder } from "@/lib/admin/queries/testimonials";
import { requireAdmin } from "@/lib/auth";
import { TestimonialForm } from "../TestimonialForm";

export const metadata: Metadata = { title: "New testimonial" };

export default async function NewTestimonialPage() {
  await requireAdmin();
  const nextOrder = await getNextTestimonialOrder();
  return <TestimonialForm nextOrder={nextOrder} />;
}
