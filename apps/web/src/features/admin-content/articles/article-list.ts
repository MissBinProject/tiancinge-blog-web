import type { ArticleType, ContentStatus } from '@tian-xin-ge/contracts';

export type ArticleCursor = { publishedAt: string; id: string };

export function encodeArticleCursor(cursor: ArticleCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}

export function decodeArticleCursor(value: string | null): ArticleCursor | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as Partial<ArticleCursor>;
    return typeof parsed.publishedAt === 'string' && typeof parsed.id === 'string' ? { publishedAt: parsed.publishedAt, id: parsed.id } : null;
  } catch { return null; }
}

export function articleMatches(row: Record<string, unknown>, type: ArticleType | null, status: ContentStatus | null, queryText: string): boolean {
  if (type && row.type !== type) return false;
  if (status && row.status !== status) return false;
  if (!queryText) return true;
  const needle = queryText.toLocaleLowerCase('zh-TW');
  return `${String(row.title ?? '')} ${String(row.excerpt ?? '')}`.toLocaleLowerCase('zh-TW').includes(needle);
}
