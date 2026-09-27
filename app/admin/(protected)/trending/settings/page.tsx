import type { Metadata } from "next";
import { getAdminPageSettings } from "@/lib/admin/queries/page-settings";
import { requireAdmin } from "@/lib/auth";
import { TrendingSettingsForm } from "./TrendingSettingsForm";

export const metadata: Metadata = { title: "Trending page" };

/** Settings for the public /trending page (upserts PageSettings { page: "trending" }). */
export default async function TrendingPageSettingsPage() {
  await requireAdmin();
  const { value, saved, error } = await getAdminPageSettings("trending");
  // key: remount with fresh server data after a save.
  return <TrendingSettingsForm key={value.updatedAt ?? "defaults"} settings={value} saved={saved} loadError={error} />;
}
