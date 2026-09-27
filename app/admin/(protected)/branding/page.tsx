import type { Metadata } from "next";
import { getAdminBrandAssets } from "@/lib/admin/queries/brand";
import { requireAdmin } from "@/lib/auth";
import { BrandingForm } from "./BrandingForm";

export const metadata: Metadata = { title: "Branding" };

export default async function BrandingPage() {
  await requireAdmin();
  const brand = await getAdminBrandAssets();
  return (
    <BrandingForm
      key={brand.effective.updatedAt ?? "defaults"}
      stored={brand.stored}
      effective={brand.effective}
      saved={brand.saved}
      loadError={brand.error}
    />
  );
}
