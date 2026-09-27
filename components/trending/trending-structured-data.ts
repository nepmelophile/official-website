import type { JsonLdData } from "@/components/ui/JsonLd";
import { absoluteUrl } from "@/lib/site";
import type { TrendingChartEntry } from "@/types/content";
import { entryHref } from "./entry";

export interface TrendingJsonLdInput {
  name: string;
  description: string;
  path: string;
  entries: readonly TrendingChartEntry[];
}

/** schema.org ItemList for the chart (ascending positions; links and images made absolute). */
export function buildTrendingStructuredData({ name, description, path, entries }: TrendingJsonLdInput): JsonLdData {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    description,
    url: absoluteUrl(path),
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    numberOfItems: entries.length,
    itemListElement: entries.map((entry) => {
      const href = entryHref(entry);
      const item: Record<string, unknown> = { "@type": "ListItem", position: entry.position, name: entry.title };
      if (href) item.url = absoluteUrl(href);
      if (entry.image?.url) item.image = absoluteUrl(entry.image.url);
      return item;
    }),
  };
}
