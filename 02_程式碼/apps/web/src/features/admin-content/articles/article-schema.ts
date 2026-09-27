import { isPublicSlug, isPublishableArticleBody, isSafeContentUrl, isValidArticleBody, isValidArticleSources, type Article } from '@tian-xin-ge/contracts';

export function validateArticleInput(value: Record<string, unknown>): string | null {
  const type = value.type;
  const status = value.status;
  const title = typeof value.title === 'string' ? value.title.trim() : '';
  const excerpt = typeof value.excerpt === 'string' ? value.excerpt.trim() : '';
  const category = typeof value.category === 'string' ? value.category.trim() : '';
  const coverAlt = typeof value.coverAlt === 'string' ? value.coverAlt.trim() : '';
  const authorName = typeof value.authorName === 'string' ? value.authorName.trim() : '';
  const body = value.body;
  const sources = value.sources;
  if (value.slug != null && !isPublicSlug(typeof value.slug === 'string' ? value.slug.trim().toLowerCase() : value.slug)) return '文章網址只能使用英文小寫、數字與連字號，最多 80 字';
  if (type !== 'news' && type !== 'blog') return '文章類型不正確';
  if (status !== 'draft' && status !== 'scheduled' && status !== 'published') return '文章狀態不正確';
  if (!title || title.length > 160 || excerpt.length > 500 || category.length > 120 || coverAlt.length > 160 || authorName.length > 160) return '標題、摘要、分類、作者或封面替代文字格式不正確';
  if (!isValidArticleBody(body)) return '正文只能使用合法的結構化區塊';
  if (sources !== undefined && !isValidArticleSources(sources)) return '參考來源必須是 HTTPS 網址的 JSON 陣列';
  if ((status === 'published' || status === 'scheduled') && !isPublishableArticleBody(body)) return '文章必須先提供正文內容才能發布或排程';
  if (value.coverUrl != null && value.coverUrl !== '' && !isSafeContentUrl(value.coverUrl, true)) return '封面圖片網址不安全';
  if (value.publishedAt != null && (typeof value.publishedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.publishedAt))) return '發布日期格式不正確';
  if (status === 'scheduled') {
    if (typeof value.scheduledAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value.scheduledAt) || Number.isNaN(Date.parse(value.scheduledAt))) return '排程發布時間格式不正確';
    if (Date.parse(value.scheduledAt) <= Date.now()) return '排程發布時間必須晚於目前時間';
  }
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
    coverAlt: String(value.coverAlt ?? '').trim().slice(0, 160),
    authorName: String(value.authorName ?? '').trim().slice(0, 160),
    body: value.body,
    publishedAt: String(value.publishedAt ?? new Date().toISOString().slice(0, 10)),
    scheduledAt: value.status === 'scheduled' ? String(value.scheduledAt) : null,
    ...(Array.isArray(value.sources) ? { sources: value.sources } : {}),
    updatedAt: new Date(),
  };
}

/** Compare only fields that represent a substantive editorial change. */
export function articleContentChanged(current: Record<string, unknown>, next: Record<string, unknown>) {
  const normalize = (value: unknown) => JSON.stringify({
    title: typeof value === 'object' && value ? (value as Record<string, unknown>).title : undefined,
    excerpt: typeof value === 'object' && value ? (value as Record<string, unknown>).excerpt : undefined,
    body: typeof value === 'object' && value ? (value as Record<string, unknown>).body : undefined,
    coverUrl: typeof value === 'object' && value ? (value as Record<string, unknown>).coverUrl ?? (value as Record<string, unknown>).cover_url : undefined,
    coverAlt: typeof value === 'object' && value ? (value as Record<string, unknown>).coverAlt ?? (value as Record<string, unknown>).cover_alt : undefined,
    authorName: typeof value === 'object' && value ? (value as Record<string, unknown>).authorName ?? (value as Record<string, unknown>).author_name : undefined,
    sources: typeof value === 'object' && value ? (value as Record<string, unknown>).sources ?? [] : [],
  });
  return normalize(current) !== normalize(next);
}
