import type { Metadata } from "next";
import { getAdminPageSettings } from "@/lib/admin/queries/page-settings";
import { requireAdmin } from "@/lib/auth";
import { TestimonialsSettingsForm } from "./TestimonialsSettingsForm";

export const metadata: Metadata = { title: "Testimonials page" };

/** Settings for the public /testimonials page (upserts PageSettings { page: "testimonials" }). */
export default async function TestimonialsPageSettingsPage() {
  await requireAdmin();
  const { value, saved, error } = await getAdminPageSettings("testimonials");
  // key: remount with fresh server data after a save.
  return <TestimonialsSettingsForm key={value.updatedAt ?? "defaults"} settings={value} saved={saved} loadError={error} />;
}
