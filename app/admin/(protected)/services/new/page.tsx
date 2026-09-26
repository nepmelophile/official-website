import type { Metadata } from "next";
import { getNextServiceOrder } from "@/lib/admin/queries/services";
import { requireAdmin } from "@/lib/auth";
import { ServiceForm } from "../ServiceForm";

export const metadata: Metadata = { title: "New service" };

export default async function NewServicePage() {
  await requireAdmin();
  const nextOrder = await getNextServiceOrder();
  return <ServiceForm nextOrder={nextOrder} />;
}
