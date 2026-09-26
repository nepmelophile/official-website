import type { Metadata } from "next";
import { paramValue, type RawSearchParams } from "@/lib/admin/list";
import { getNextTrendingRank, getTrendingRefOptions } from "@/lib/admin/queries/trending";
import { requireAdmin } from "@/lib/auth";
import { TRENDING_TYPES } from "@/lib/constants";
import type { TrendingType } from "@/types/content";
import { TrendingForm, type TrendingFormDefaults } from "../TrendingForm";

export const metadata: Metadata = { title: "New trending item" };

function isTrendingType(value: string): value is TrendingType {
  return (TRENDING_TYPES as readonly string[]).includes(value);
}

/**
 * New trending item. Supports prefill links such as
 * /admin/trending/new?type=song&ref=<artistId> (e.g. an "Add to trending" button elsewhere).
 */
export default async function NewTrendingItemPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  await requireAdmin();
  const params = await searchParams;
  const [{ options, error }, rank] = await Promise.all([getTrendingRefOptions(), getNextTrendingRank()]);

  const typeParam = paramValue(params, "type");
  const refParam = paramValue(params, "ref");
  const defaults: TrendingFormDefaults = { rank };
  if (isTrendingType(typeParam)) defaults.type = typeParam;
  const type = defaults.type ?? "artist";
  const known = type === "update" ? options.articles.some((a) => a.id === refParam) : options.artists.some((a) => a.id === refParam);
  if (refParam && known) defaults.refId = refParam;

  return <TrendingForm options={options} defaults={defaults} loadError={error} />;
}
