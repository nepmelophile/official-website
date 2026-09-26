import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminTrendingItem, getTrendingRefOptions } from "@/lib/admin/queries/trending";
import { requireAdmin } from "@/lib/auth";
import { TrendingForm } from "../TrendingForm";

export const metadata: Metadata = { title: "Edit trending item" };

export default async function EditTrendingItemPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [item, { options, error }] = await Promise.all([getAdminTrendingItem(id), getTrendingRefOptions()]);
  if (!item) notFound();
  return <TrendingForm key={item.updatedAt} item={item} options={options} loadError={error} />;
}
