export type AdminReleaseLog = {
  id: string;
  publishedAt: string;
  source: 'automatic';
  mode: 'static' | 'sitemap';
  count: number;
  sequence: number;
  version: string;
};

type TimestampLike = { toDate?: () => Date };

function dateIso(value: unknown): string {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString();
  if (value && typeof value === 'object' && typeof (value as TimestampLike).toDate === 'function') {
    const date = (value as TimestampLike).toDate?.();
    return date && Number.isFinite(date.getTime()) ? date.toISOString() : '';
  }
  if (typeof value === 'string') {
    const date = new Date(value);
    if (Number.isFinite(date.getTime())) return date.toISOString();
  }
  return '';
}

function text(value: unknown, maximum = 240): string {
  return typeof value === 'string' ? value.trim().slice(0, maximum) : '';
}

export function adminReleaseLog(id: string, value: Record<string, unknown>): AdminReleaseLog | null {
  const publishedAt = dateIso(value.publishedAt);
  if (!publishedAt || value.status !== 'published' || value.source !== 'automatic') return null;
  return {
    id: text(id, 160),
    publishedAt,
    source: 'automatic',
    mode: value.mode === 'sitemap' ? 'sitemap' : 'static',
    count: Number.isSafeInteger(value.count) && Number(value.count) >= 0 ? Number(value.count) : 0,
    sequence: Number.isSafeInteger(value.sequence) && Number(value.sequence) >= 0 ? Number(value.sequence) : 0,
    version: text(value.version),
  };
}
