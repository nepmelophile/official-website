import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminService } from "@/lib/admin/queries/services";
import { requireAdmin } from "@/lib/auth";
import { ServiceForm } from "../ServiceForm";

export const metadata: Metadata = { title: "Edit service" };

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const service = await getAdminService(id);
  if (!service) notFound();
  // key: remount with fresh server data after a save (the server may normalise values).
  return <ServiceForm key={service.updatedAt} service={service} />;
}
