export type QueryInput = Record<string, string | number | null | undefined>;

/**
 * Builds `basePath?query` from a params object, dropping empty values. Keys listed in
 * `overrides` replace those in `query` (set to null/undefined/"" to remove them).
 */
export function hrefWithQuery(basePath: string, query: QueryInput = {}, overrides: QueryInput = {}): string {
  const merged: QueryInput = { ...query, ...overrides };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value === null || value === undefined || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
