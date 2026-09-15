import { isPublishableArticleBody, isSafeContentUrl, isValidArticleBody, type Article } from '@tian-xin-ge/contracts';

export function validateArticleInput(value: Record<string, unknown>): string | null {
  const type = value.type;
  const status = value.status;
  const title = typeof value.title === 'string' ? value.title.trim() : '';
  const excerpt = typeof value.excerpt === 'string' ? value.excerpt.trim() : '';
  const category = typeof value.category === 'string' ? value.category.trim() : '';
  const body = value.body;
  if (type !== 'news' && type !== 'blog') return '文章類型不正確';
  if (status !== 'draft' && status !== 'published') return '文章狀態不正確';
  if (!title || title.length > 160 || excerpt.length > 500 || category.length > 120) return '標題、摘要或分類格式不正確';
  if (!isValidArticleBody(body)) return '正文只能使用合法的結構化區塊';
  if (status === 'published' && !isPublishableArticleBody(body)) return '文章必須先提供正文內容才能發布';
  if (value.coverUrl != null && value.coverUrl !== '' && !isSafeContentUrl(value.coverUrl, true)) return '封面圖片網址不安全';
  if (value.publishedAt != null && (typeof value.publishedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.publishedAt))) return '發布日期格式不正確';
  for (const key of ['seoTitle', 'seoDescription']) if (value[key] != null && (typeof value[key] !== 'string' || String(value[key]).length > 300)) return 'SEO 欄位格式不正確';
  return null;
}

export function articlePayload(value: Record<string, unknown>, slug: string) {
  return {
    slug,
    type: value.type as Article['type'],
    status: value.status as Article['status'],
    category: String(value.category ?? '').trim(),
    title: String(value.title).trim(),
    excerpt: String(value.excerpt ?? '').trim(),
    seoTitle: String(value.seoTitle ?? '').trim(),
    seoDescription: String(value.seoDescription ?? '').trim(),
    coverUrl: String(value.coverUrl ?? '').trim(),
    body: value.body,
    publishedAt: String(value.publishedAt ?? new Date().toISOString().slice(0, 10)),
    updatedAt: new Date(),
  };
}
