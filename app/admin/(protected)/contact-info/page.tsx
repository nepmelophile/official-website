import type { Metadata } from "next";
import { getAdminContactInfo } from "@/lib/admin/queries/settings";
import { requireAdmin } from "@/lib/auth";
import { ContactInfoForm } from "./ContactInfoForm";

export const metadata: Metadata = { title: "Contact info" };

export default async function ContactInfoPage() {
  await requireAdmin();
  const { value: info, saved, error } = await getAdminContactInfo();
  return <ContactInfoForm key={info.updatedAt ?? "defaults"} info={info} saved={saved} loadError={error} />;
}
