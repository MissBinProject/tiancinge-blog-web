import { readFileSync } from 'node:fs';

export type StaticSnapshot = {
  schemaVersion: number;
  digest: string;
  generatedAt?: string;
  services: Record<string, unknown>[];
  pricingPlans?: Record<string, unknown>[];
  articles: Record<string, unknown>[];
  categories: Record<string, unknown>[];
  settings: Record<string, unknown>;
};

let cached: StaticSnapshot | null | undefined;

/**
 * A static release receives this path from the release coordinator. Failing
 * closed here prevents Firebase credentials or fixture content from being
 * accidentally used while rendering production HTML.
 */
export function staticSnapshot(): StaticSnapshot | null {
  if (cached !== undefined) return cached;
  if (process.env.STATIC_EXPORT !== '1') return cached = null;
  const path = process.env.PUBLIC_SNAPSHOT_PATH;
  if (!path) throw new Error('STATIC_EXPORT requires PUBLIC_SNAPSHOT_PATH');
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as StaticSnapshot;
    if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.services) || (parsed.pricingPlans != null && !Array.isArray(parsed.pricingPlans)) || !Array.isArray(parsed.articles)
      || !Array.isArray(parsed.categories) || !parsed.settings || typeof parsed.settings !== 'object') throw new Error('invalid snapshot shape');
    return cached = parsed;
  } catch (error) {
    throw new Error(`Unable to load public snapshot: ${error instanceof Error ? error.message : 'unknown error'}`);
  }
}
