import type { Metadata } from "next";
import { getAdminHomepageSettings, getFeaturedPickerOptions } from "@/lib/admin/queries/settings";
import { requireAdmin } from "@/lib/auth";
import { HOME_ARTICLE_COUNT, HOME_ARTIST_COUNT } from "@/lib/queries/home";
import { HomepageForm } from "./HomepageForm";

export const metadata: Metadata = { title: "Homepage" };

export default async function HomepageSettingsPage() {
  await requireAdmin();
  const [{ value: settings, saved, error }, { articles, artists }] = await Promise.all([
    getAdminHomepageSettings(),
    getFeaturedPickerOptions(),
  ]);

  return (
    <HomepageForm
      // Remount with fresh server data after a save.
      key={settings.updatedAt ?? "defaults"}
      settings={settings}
      saved={saved}
      articleOptions={articles}
      artistOptions={artists}
      articleCount={HOME_ARTICLE_COUNT}
      artistCount={HOME_ARTIST_COUNT}
      loadError={error}
    />
  );
}
