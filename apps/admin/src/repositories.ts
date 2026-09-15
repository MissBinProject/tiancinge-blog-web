import {
  fixtureArticles,
  fixtureServices,
  isPublishableArticleBody,
  isSafeContentUrl,
  isValidArticleBody,
  isValidBenefits,
  type Service,
} from '@tian-xin-ge/contracts';
import { adminApiRequest, isServerAdminApiEnabled } from './features/auth/infrastructure/adminApi';

/** The admin client talks to the web server only; browser credentials stay server-side. */
const resultOk = (id?: string) => id
  ? { ok: true as const, mode: 'server' as const, id }
  : { ok: true as const, mode: 'server' as const };

const localStorageJson = <T,>(key: string): T | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
};

const localMediaIsInUse = (url: string) => {
  const services = localStorageJson<Array<{ imageUrl?: string }>>('txg-services') ?? fixtureServices;
  if (services.some((item) => item.imageUrl === url)) return true;
  const articles = localStorageJson<Array<{ coverUrl?: string; body?: string }>>('txg-articles') ?? fixtureArticles;
  return articles.some((item) => item.coverUrl === url || (typeof item.body === 'string' && item.body.includes(url)));
};

export async function loadServices(): Promise<Service[] | null> {
  if (!isServerAdminApiEnabled()) return null;
  const result = await adminApiRequest<{ items: Service[] }>('/services');
  return result.ok ? result.data.items : null;
}

export async function saveService(service: Service) {
  if (!isSafeContentUrl(service.imageUrl, true)) return { ok: false as const, mode: 'server' as const, error: '圖片必須使用 HTTPS 或站內素材路徑' };
  if (!isServerAdminApiEnabled()) return resultOk(service.id);
  const isNew = service.id.startsWith('local-');
  const result = await adminApiRequest<{ id?: string; slug?: string }>(isNew ? '/services' : `/services/${encodeURIComponent(service.id)}`, {
    method: isNew ? 'POST' : 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(service),
  });
  return result.ok ? resultOk(result.data.id || service.id) : { ok: false as const, mode: 'server' as const, error: result.error };
}

export async function deleteService(id: string) {
  if (!isServerAdminApiEnabled() || id.startsWith('local-')) return resultOk(id);
  const result = await adminApiRequest(`/services/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return result.ok ? resultOk(id) : { ok: false as const, mode: 'server' as const, error: result.error };
}

export type AdminMessage = { id: string; name: string; phone: string; email?: string; message: string; status: 'unread' | 'handled'; note?: string; createdAt: string };
export type AdminMedia = { id: string; name: string; url: string; alt: string; mimeType: string; size: number; storagePath?: string; width?: number; height?: number };

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
  if (!isServerAdminApiEnabled() || media.id.startsWith('local-')) {
    return localMediaIsInUse(media.url)
      ? { ok: false as const, mode: 'server' as const, error: '正在使用的素材無法刪除，請先替換所有引用。' }
      : resultOk(media.id);
  }
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

export async function uploadMedia(file: File, alt = '') {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
    return { ok: false as const, url: '', error: '僅支援 JPEG、PNG、WebP，單檔上限 10 MB' };
  }
  const dimensions = await imageDimensions(file);
  if (!isServerAdminApiEnabled()) return { ok: true as const, mode: 'server' as const, url: URL.createObjectURL(file), ...dimensions };
  const form = new FormData();
  form.append('file', file);
  form.append('alt', alt.trim().slice(0, 160));
  const result = await adminApiRequest<{ id: string; url: string; storagePath: string; width?: number; height?: number }>('/media', { method: 'POST', body: form });
  return result.ok ? { ok: true as const, mode: 'server' as const, ...result.data } : { ok: false as const, url: '', error: result.error };
}

export type ManagedArticle = { id: string; slug: string; title: string; category: string; status: string; excerpt: string; seoTitle?: string; seoDescription?: string; type: 'news' | 'blog'; body: string; coverUrl?: string; publishedAt?: string };
export type AdminCategory = { id: string; name: string; type: 'news' | 'blog' };

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
    body: JSON.stringify({ name: category.name, type: category.type }),
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
  return result.ok ? result.data.items.map((item) => ({ ...item, body: typeof item.body === 'string' ? item.body : JSON.stringify(item.body ?? []) })) : null;
}

export async function saveArticle(article: ManagedArticle) {
  let body: unknown;
  try {
    body = JSON.parse(article.body || '[]');
  } catch {
    return { ok: false as const, mode: 'server' as const, error: '正文必須是合法 JSON 陣列' };
  }
  if (!isValidArticleBody(body)) return { ok: false as const, mode: 'server' as const, error: '正文只能使用合法的結構化區塊' };
  if (article.status === 'published' && !isPublishableArticleBody(body)) return { ok: false as const, mode: 'server' as const, error: '文章必須先提供正文內容才能發布' };
  if (article.coverUrl && !isSafeContentUrl(article.coverUrl, true)) return { ok: false as const, mode: 'server' as const, error: '封面圖片網址不安全' };
  if (!isServerAdminApiEnabled()) return resultOk(article.id);
  const isNew = article.id.startsWith('local-');
  const result = await adminApiRequest<{ id?: string; slug?: string }>(isNew ? '/articles' : `/articles/${encodeURIComponent(article.id)}`, {
    method: isNew ? 'POST' : 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...article, body }),
  });
  return result.ok ? resultOk(result.data.id || article.id) : { ok: false as const, mode: 'server' as const, error: result.error };
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
  const result = await adminApiRequest('/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });
  return result.ok ? resultOk() : { ok: false as const, mode: 'server' as const, error: result.error };
}
