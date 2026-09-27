import {
  isPublishableArticleBody,
  isSafeContentUrl,
  isValidArticleBody,
  isValidBenefits,
  type ArticleSource,
  type Service,
} from '@tian-xin-ge/contracts';
import type { PricingPlan } from '@tian-xin-ge/contracts';
import { adminApiRequest, adminApiUpload, isServerAdminApiEnabled } from './features/auth/infrastructure/adminApi';

/** The admin client talks to the web server only; browser credentials stay server-side. */
const resultOk = (id?: string, version?: number) => id
  ? { ok: true as const, mode: 'server' as const, id, version }
  : { ok: true as const, mode: 'server' as const, version };

export async function loadServices(): Promise<Service[] | null> {
  if (!isServerAdminApiEnabled()) return null;
  const result = await adminApiRequest<{ items: Service[] }>('/services');
  return result.ok ? result.data.items : null;
}

export async function saveService(service: Service) {
  if (!isSafeContentUrl(service.imageUrl, true)) return { ok: false as const, mode: 'server' as const, error: '圖片必須使用 HTTPS 或站內素材路徑' };
  if (!isServerAdminApiEnabled()) return resultOk(service.id);
  const isNew = service.id.startsWith('local-');
  const result = await adminApiRequest<{ id?: string; slug?: string; version?: number }>(isNew ? '/services' : `/services/${encodeURIComponent(service.id)}`, {
    method: isNew ? 'POST' : 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(service),
  });
  return result.ok ? { ...resultOk(result.data.id || service.id), version: result.data.version } : { ok: false as const, mode: 'server' as const, error: result.error };
}

export async function deleteService(id: string) {
  if (!isServerAdminApiEnabled() || id.startsWith('local-')) return resultOk(id);
  const result = await adminApiRequest(`/services/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return result.ok ? resultOk(id) : { ok: false as const, mode: 'server' as const, error: result.error };
}

export async function loadPricingPlans(): Promise<PricingPlan[] | null> {
  if (!isServerAdminApiEnabled()) return null;
  const result = await adminApiRequest<{ items: PricingPlan[] }>('/pricing');
  return result.ok ? result.data.items : null;
}

export async function savePricingPlan(plan: PricingPlan) {
  if (!isServerAdminApiEnabled()) return resultOk(plan.id);
  const isNew = plan.id.startsWith('local-');
  const result = await adminApiRequest<{ id?: string; version?: number }>(isNew ? '/pricing' : `/pricing/${encodeURIComponent(plan.id)}`, { method: isNew ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(plan) });
  return result.ok ? { ...resultOk(result.data.id || plan.id), version: result.data.version } : { ok: false as const, mode: 'server' as const, error: result.error };
}

export async function deletePricingPlan(id: string) {
  if (!isServerAdminApiEnabled() || id.startsWith('local-')) return resultOk(id);
  const result = await adminApiRequest(`/pricing/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return result.ok ? resultOk(id) : { ok: false as const, mode: 'server' as const, error: result.error };
}

export type AdminMessage = { id: string; name: string; phone: string; email?: string; message: string; status: 'unread' | 'handled'; note?: string; createdAt: string };
export type AdminMedia = { id: string; name: string; url: string; alt: string; mimeType: string; size: number; storagePath?: string; width?: number; height?: number };
export type MediaUploadProgress = { loaded: number; total: number; percent: number; phase: 'uploading' | 'processing' };

export async function loadMessages(): Promise<AdminMessage[] | null> {
  if (!isServerAdminApiEnabled()) return null;
  const result = await adminApiRequest<{ items: AdminMessage[] }>('/messages');
  return result.ok ? result.data.items : null;
}

export async function saveMessage(message: Pick<AdminMessage, 'id' | 'status' | 'note'>) {
  if (!isServerAdminApiEnabled() || message.id.startsWith('local-')) return resultOk(message.id);
  const result = await adminApiRequest(`/messages/${encodeURIComponent(message.id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: message.status, note: message.note || '' }),
  });
  return result.ok ? resultOk(message.id) : { ok: false as const, mode: 'server' as const, error: result.error };
}

export function markMessageHandled(id: string, note?: string) {
  return saveMessage({ id, status: 'handled', note });
}

export async function deleteMessage(id: string) {
  if (!isServerAdminApiEnabled() || id.startsWith('local-')) return resultOk(id);
  const result = await adminApiRequest(`/messages/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return result.ok ? resultOk(id) : { ok: false as const, mode: 'server' as const, error: result.error };
}

export async function loadMedia(): Promise<AdminMedia[] | null> {
  if (!isServerAdminApiEnabled()) return null;
  const result = await adminApiRequest<{ items: AdminMedia[] }>('/media');
  return result.ok ? result.data.items : null;
}

export async function saveMediaAlt(id: string, alt: string) {
  if (!isServerAdminApiEnabled() || id.startsWith('local-')) return resultOk(id);
  const result = await adminApiRequest(`/media/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alt: alt.trim().slice(0, 160) }),
  });
  return result.ok ? resultOk(id) : { ok: false as const, mode: 'server' as const, error: result.error };
}

export async function deleteMedia(media: Pick<AdminMedia, 'id' | 'url' | 'storagePath'>) {
  if (!isServerAdminApiEnabled() || media.id.startsWith('local-')) return resultOk(media.id);
  const result = await adminApiRequest(`/media/${encodeURIComponent(media.id)}`, { method: 'DELETE' });
  return result.ok ? resultOk(media.id) : { ok: false as const, mode: 'server' as const, error: result.error };
}

async function imageDimensions(file: File): Promise<{ width?: number; height?: number }> {
  if (typeof window === 'undefined') return {};
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error('無法讀取圖片尺寸'));
      image.src = url;
    });
    return dimensions;
  } catch {
    return {};
  } finally {
    URL.revokeObjectURL(url);
  }
}

function normalizedMediaFile(file: File): File {
  if (file.type) return file;
  const lowerName = file.name.toLowerCase();
  const inferred = lowerName.endsWith('.mov') ? 'video/quicktime' : lowerName.endsWith('.mp4') || lowerName.endsWith('.m4v') ? 'video/mp4' : lowerName.endsWith('.webm') ? 'video/webm' : '';
  return inferred ? new File([file], file.name, { type: inferred, lastModified: file.lastModified }) : file;
}

export async function uploadMedia(inputFile: File, alt = '', onProgress?: (progress: MediaUploadProgress) => void) {
  const file = normalizedMediaFile(inputFile);
  const image = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
  const video = ['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type);
  const limit = video ? 25 * 1024 * 1024 : 10 * 1024 * 1024;
  if ((!image && !video) || file.size > limit) {
    const error = !image && !video
      ? '不支援這個檔案格式。圖片請使用 JPEG／PNG／WebP；影片請使用 MP4／WebM／MOV'
      : `檔案大小為 ${(file.size / 1024 / 1024).toFixed(1)} MB，${video ? '影片上限為 25 MB' : '圖片上限為 10 MB'}`;
    return { ok: false as const, url: '', error };
  }
  const dimensions = image ? await imageDimensions(file) : {};
  if (!isServerAdminApiEnabled()) return { ok: true as const, mode: 'server' as const, url: URL.createObjectURL(file), name: file.name, mimeType: file.type, size: file.size, ...dimensions };
  const form = new FormData();
  form.append('file', file);
  form.append('alt', alt.trim().slice(0, 160));
  onProgress?.({ loaded: 0, total: file.size, percent: 0, phase: 'uploading' });
  const result = await adminApiUpload<{ id: string; name: string; url: string; storagePath: string; mimeType: string; size: number; width?: number; height?: number }>('/media', form, (progress) => {
    const ratio = progress.total > 0 ? progress.loaded / progress.total : 0;
    onProgress?.({ loaded: Math.min(file.size, Math.round(file.size * ratio)), total: file.size, percent: progress.percent, phase: progress.percent >= 100 ? 'processing' : 'uploading' });
  });
  return result.ok ? { ok: true as const, mode: 'server' as const, ...result.data } : { ok: false as const, url: '', error: result.error };
}

export type ManagedArticle = { id: string; slug: string; previousSlugs?: string[]; title: string; category: string; status: 'draft' | 'scheduled' | 'published'; excerpt: string; seoTitle?: string; seoDescription?: string; coverAlt?: string; authorName?: string; sources?: ArticleSource[]; contentUpdatedAt?: string; type: 'news' | 'blog'; body: string; coverUrl?: string; publishedAt?: string; scheduledAt?: string | null; version?: number };
export type AdminCategory = { id: string; name: string; type: 'news' | 'blog'; description?: string; seoTitle?: string; seoDescription?: string; updatedAt?: string };

function normalizeDate(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value;
  if (value && typeof value === 'object' && '_seconds' in value) {
    const seconds = Number((value as { _seconds?: unknown })._seconds);
    if (Number.isFinite(seconds)) return new Date(seconds * 1000).toISOString();
  }
  return undefined;
}

export async function loadCategories(): Promise<AdminCategory[] | null> {
  if (!isServerAdminApiEnabled()) return null;
  const result = await adminApiRequest<{ items: AdminCategory[] }>('/categories');
  return result.ok ? result.data.items : null;
}

export async function saveCategory(category: Omit<AdminCategory, 'id'> & { id?: string }) {
  if (!isServerAdminApiEnabled()) return resultOk(category.id);
  const isNew = !category.id || category.id.startsWith('local-');
  const result = await adminApiRequest<{ id?: string }>(isNew ? '/categories' : `/categories/${encodeURIComponent(category.id!)}`, {
    method: isNew ? 'POST' : 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: category.name, type: category.type, description: category.description || '', seoTitle: category.seoTitle || '', seoDescription: category.seoDescription || '' }),
  });
  return result.ok ? resultOk(result.data.id || category.id) : { ok: false as const, mode: 'server' as const, error: result.error };
}

export async function deleteCategory(category: string | Pick<AdminCategory, 'id' | 'name'>) {
  const id = typeof category === 'string' ? category : category.id;
  if (!isServerAdminApiEnabled() || id.startsWith('local-')) return resultOk(id);
  const result = await adminApiRequest(`/categories/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return result.ok ? resultOk(id) : { ok: false as const, mode: 'server' as const, error: result.error };
}

export async function loadArticles(): Promise<ManagedArticle[] | null> {
  if (!isServerAdminApiEnabled()) return null;
  const result = await adminApiRequest<{ items: ManagedArticle[] }>('/articles?limit=100');
  return result.ok ? result.data.items.map((item) => ({ ...item, body: typeof item.body === 'string' ? item.body : JSON.stringify(item.body ?? []), contentUpdatedAt: normalizeDate(item.contentUpdatedAt) })) : null;
}

export async function saveArticle(article: ManagedArticle) {
  let body: unknown;
  try {
    body = JSON.parse(article.body || '[]');
  } catch {
    return { ok: false as const, mode: 'server' as const, error: '正文必須是合法 JSON 陣列' };
  }
  if (!isValidArticleBody(body)) return { ok: false as const, mode: 'server' as const, error: '正文只能使用合法的結構化區塊' };
  if ((article.status === 'published' || article.status === 'scheduled') && !isPublishableArticleBody(body)) return { ok: false as const, mode: 'server' as const, error: '文章必須先提供正文內容才能發布或排程' };
  if (article.coverUrl && !isSafeContentUrl(article.coverUrl, true)) return { ok: false as const, mode: 'server' as const, error: '封面圖片網址不安全' };
  if (!isServerAdminApiEnabled()) return resultOk(article.id);
  const isNew = article.id.startsWith('local-');
  const result = await adminApiRequest<{ id?: string; slug?: string; version?: number }>(isNew ? '/articles' : `/articles/${encodeURIComponent(article.id)}`, {
    method: isNew ? 'POST' : 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...article, body }),
  });
  return result.ok ? { ...resultOk(result.data.id || article.id), version: result.data.version } : { ok: false as const, mode: 'server' as const, error: result.error };
}

export async function deleteArticle(id: string) {
  if (!isServerAdminApiEnabled() || id.startsWith('local-')) return resultOk(id);
  const result = await adminApiRequest(`/articles/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return result.ok ? resultOk(id) : { ok: false as const, mode: 'server' as const, error: result.error };
}

export async function loadSettings(): Promise<any> {
  if (!isServerAdminApiEnabled()) return null;
  const result = await adminApiRequest<Record<string, unknown>>('/settings');
  return result.ok ? result.data : null;
}

export async function saveSettings(value: Record<string, unknown>) {
  if (value.benefits && !isValidBenefits(value.benefits)) return { ok: false as const, mode: 'server' as const, error: '特色列格式不正確' };
  if (!isServerAdminApiEnabled()) return resultOk();
  const { version, ...payload } = value;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (Number.isInteger(version) && Number(version) > 0) headers['If-Match'] = String(version);
  const result = await adminApiRequest<{ version?: number }>('/settings', { method: 'PATCH', headers, body: JSON.stringify(payload) });
  return result.ok ? { ...resultOk(), version: result.data.version } : { ok: false as const, mode: 'server' as const, error: result.error };
}
