import { fixtureArticles, fixtureServices, fixtureSettings, isSafeContentUrl, isValidArticleBody, isValidBenefits, type Service } from '@tian-xin-ge/contracts';
import { adminSupabase } from './supabase';

const serviceIcons: Service['icon'][] = ['lotus', 'oil', 'stone', 'foot', 'flower'];
const toService = (row: Record<string, unknown>): Service => ({ id: String(row.id), slug: String(row.slug), name: String(row.name), summary: String(row.summary ?? ''), description: String(row.description ?? ''), imageUrl: String(row.image_url ?? ''), icon: serviceIcons.includes(row.icon as Service['icon']) ? row.icon as Service['icon'] : 'lotus', durationMinutes: row.duration_minutes == null ? undefined : Number(row.duration_minutes), price: row.price == null ? undefined : Number(row.price), priceLabel: row.price_label ? String(row.price_label) : undefined, sortOrder: Number(row.sort_order ?? 0), isVisible: Boolean(row.is_visible) });

/** Supabase adapter used by the admin when VITE_SUPABASE_* is configured. */
export async function saveService(service: Service) {
  if (!isSafeContentUrl(service.imageUrl, true)) return { ok: false, mode: 'local' as const, error: '圖片網址必須是 https:// 或網站內部路徑' };
  if (!adminSupabase) return { ok: true, mode: 'local' as const };
  const payload = { slug: service.slug, name: service.name, summary: service.summary, description: service.description, image_url: service.imageUrl, icon: service.icon, duration_minutes: service.durationMinutes ?? null, price: service.price ?? null, price_label: service.priceLabel ?? null, sort_order: service.sortOrder, is_visible: service.isVisible };
  if (/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(service.id)) {
    const { error } = await adminSupabase.from('services').update(payload).eq('id', service.id);
    return error ? { ok: false, error: error.message, mode: 'supabase' as const } : { ok: true, mode: 'supabase' as const, id: service.id };
  }
  const { data, error } = await adminSupabase.from('services').insert(payload).select('id').single();
  return error || !data ? { ok: false, error: error?.message || '新增服務失敗', mode: 'supabase' as const } : { ok: true, mode: 'supabase' as const, id: String(data.id) };
}

export async function deleteService(id: string) {
  if (!adminSupabase || id.startsWith('local-') || id.length < 30) return { ok: true, mode: 'local' as const };
  const { error } = await adminSupabase.from('services').delete().eq('id', id);
  return error ? { ok: false, mode: 'supabase' as const, error: error.message } : { ok: true, mode: 'supabase' as const };
}

export async function loadServices() {
  if (!adminSupabase) return null;
  const { data, error } = await adminSupabase.from('services').select('*').order('sort_order');
  return error || !data ? null : data.map((row) => toService(row as Record<string, unknown>));
}

export async function loadMessages() {
  if (!adminSupabase) return null;
  const { data, error } = await adminSupabase.from('contact_messages').select('*').order('created_at', { ascending: false });
  return error || !data ? null : data.map((row) => ({ id: String(row.id), name: String(row.name), phone: String(row.phone), email: row.email ? String(row.email) : undefined, message: String(row.message), status: row.status as 'unread' | 'handled', note: row.note ? String(row.note) : undefined, createdAt: String(row.created_at) }));
}

export type AdminMessage = { id: string; name: string; phone: string; email?: string; message: string; status: 'unread' | 'handled'; note?: string; createdAt: string };

export type AdminMedia = { id: string; name: string; url: string; alt: string; mimeType: string; size: number; storagePath?: string; width?: number; height?: number };

export async function loadMedia(): Promise<AdminMedia[] | null> {
  if (!adminSupabase) return null;
  const client = adminSupabase;
  const { data, error } = await client.from('media_assets').select('id,name,storage_path,alt,mime_type,size_bytes,width,height').order('created_at', { ascending: false });
  if (error || !data) return null;
  return data.map((row) => {
    const { data: publicData } = client.storage.from('site-media').getPublicUrl(String(row.storage_path));
    return { id: String(row.id), name: String(row.name), url: publicData.publicUrl, storagePath: String(row.storage_path), alt: String(row.alt ?? ''), mimeType: String(row.mime_type), size: Number(row.size_bytes ?? 0), width: row.width == null ? undefined : Number(row.width), height: row.height == null ? undefined : Number(row.height) };
  });
}

export async function saveMediaAlt(id: string, alt: string) {
  if (!adminSupabase) return { ok: true, mode: 'local' as const };
  const { error } = await adminSupabase.from('media_assets').update({ alt: alt.trim().slice(0, 160) }).eq('id', id);
  return error ? { ok: false, mode: 'supabase' as const, error: error.message } : { ok: true, mode: 'supabase' as const };
}

function localStorageJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}

function localMediaIsInUse(url: string): boolean {
  // Before the first persistence effect runs there may be no localStorage
  // snapshot yet. In that case use the same fixture references shown in the
  // editor so a just-opened media screen cannot delete an in-use asset.
  const services = localStorageJson<Array<{ imageUrl?: unknown }>>('txg-services') ?? fixtureServices;
  if (services.some((service) => service.imageUrl === url)) return true;
  const articles = localStorageJson<Array<{ coverUrl?: unknown; body?: unknown }>>('txg-articles') ?? fixtureArticles;
  for (const article of articles) {
    if (article.coverUrl === url) return true;
    const bodyValue = typeof article.body === 'string' ? article.body : JSON.stringify(article.body ?? []);
    try {
      const blocks = JSON.parse(bodyValue) as unknown;
      if (Array.isArray(blocks) && blocks.some((block) => Boolean(block && typeof block === 'object' && (block as Record<string, unknown>).type === 'image' && (block as Record<string, unknown>).url === url))) return true;
    } catch {
      // Invalid local drafts are handled by the editor validator and are not references.
    }
  }
  const settings = localStorageJson<Record<string, unknown>>('txg-settings') ?? {
    logoUrl: fixtureSettings.logoUrl,
    heroBackgroundUrl: fixtureSettings.heroBackgroundUrl,
    servicesBackgroundUrl: fixtureSettings.servicesBackgroundUrl,
    pricingBackgroundUrl: fixtureSettings.pricingBackgroundUrl,
    newsBackgroundUrl: fixtureSettings.newsBackgroundUrl,
    blogBackgroundUrl: fixtureSettings.blogBackgroundUrl,
    contactBackgroundUrl: fixtureSettings.contactBackgroundUrl,
    ogImageUrl: fixtureSettings.ogImageUrl,
  };
  return ['logoUrl', 'heroBackgroundUrl', 'servicesBackgroundUrl', 'pricingBackgroundUrl', 'newsBackgroundUrl', 'blogBackgroundUrl', 'contactBackgroundUrl', 'ogImageUrl'].some((key) => settings[key] === url);
}

/** Remove an asset only when the database confirms that no content references it. */
export async function deleteMedia(media: Pick<AdminMedia, 'id' | 'url' | 'storagePath'>) {
  if (!adminSupabase || media.id.startsWith('local-')) {
    if (media.url && localMediaIsInUse(media.url)) return { ok: false, mode: 'local' as const, error: '正在使用的素材無法刪除，請先替換所有引用。' };
    return { ok: true, mode: 'local' as const };
  }
  const { error } = await adminSupabase.from('media_assets').delete().eq('id', media.id);
  if (error) return { ok: false, mode: 'supabase' as const, error: error.message };
  if (media.storagePath) {
    const { error: storageError } = await adminSupabase.storage.from('site-media').remove([media.storagePath]);
    if (storageError) return { ok: true, mode: 'supabase' as const, warning: `資料已刪除，但儲存物件清理失敗：${storageError.message}` };
  }
  return { ok: true, mode: 'supabase' as const };
}

export async function loadSettings() {
  if (!adminSupabase) return null;
  const { data, error } = await adminSupabase.from('site_settings').select('brand_name,logo_url,phone,line_id,line_url,address,business_hours,map_embed_url,social,hero_title,hero_subtitle,tagline,hero_description,hero_background_url,services_title,services_subtitle,services_note,services_background_url,pricing_title,pricing_subtitle,pricing_background_url,news_title,news_subtitle,news_background_url,blog_title,blog_subtitle,blog_background_url,contact_title,contact_lead,contact_background_url,benefits,pricing_benefits,privacy_text,terms_text,seo_title,seo_description,og_image_url').eq('id', '00000000-0000-0000-0000-000000000001').maybeSingle();
  if (error || !data) return null;
  const social = data.social && typeof data.social === 'object' ? data.social as Record<string, unknown> : {};
  const benefits = Array.isArray(data.benefits) ? data.benefits.filter((item): item is { title: string; caption: string } => Boolean(item && typeof item === 'object' && typeof (item as Record<string, unknown>).title === 'string' && typeof (item as Record<string, unknown>).caption === 'string')).map((item) => ({ title: item.title, caption: item.caption })) : [];
  const pricingBenefits = Array.isArray(data.pricing_benefits) ? data.pricing_benefits.filter((item): item is { title: string; caption: string } => Boolean(item && typeof item === 'object' && typeof (item as Record<string, unknown>).title === 'string' && typeof (item as Record<string, unknown>).caption === 'string')).map((item) => ({ title: item.title, caption: item.caption })) : [];
  return { brandName: String(data.brand_name ?? ''), logoUrl: String(data.logo_url ?? ''), phone: String(data.phone ?? ''), line: String(data.line_id ?? data.line_url ?? ''), address: String(data.address ?? ''), hours: String(data.business_hours ?? ''), mapEmbedUrl: String(data.map_embed_url ?? ''), instagram: String(social.instagram ?? ''), facebook: String(social.facebook ?? ''), youtube: String(social.youtube ?? ''), heroTitle: String(data.hero_title ?? ''), heroSubtitle: String(data.hero_subtitle ?? ''), tagline: String(data.tagline ?? ''), heroDescription: String(data.hero_description ?? ''), heroBackgroundUrl: String(data.hero_background_url ?? ''), servicesTitle: String(data.services_title ?? ''), servicesSubtitle: String(data.services_subtitle ?? ''), servicesNote: String(data.services_note ?? ''), servicesBackgroundUrl: String(data.services_background_url ?? ''), pricingTitle: String(data.pricing_title ?? ''), pricingSubtitle: String(data.pricing_subtitle ?? ''), pricingBackgroundUrl: String(data.pricing_background_url ?? ''), newsTitle: String(data.news_title ?? ''), newsSubtitle: String(data.news_subtitle ?? ''), newsBackgroundUrl: String(data.news_background_url ?? ''), blogTitle: String(data.blog_title ?? ''), blogSubtitle: String(data.blog_subtitle ?? ''), blogBackgroundUrl: String(data.blog_background_url ?? ''), contactTitle: String(data.contact_title ?? ''), contactLead: String(data.contact_lead ?? ''), contactBackgroundUrl: String(data.contact_background_url ?? ''), benefits, pricingBenefits, privacy: String(data.privacy_text ?? ''), terms: String(data.terms_text ?? ''), seoTitle: String(data.seo_title ?? ''), seoDescription: String(data.seo_description ?? ''), ogImageUrl: String(data.og_image_url ?? '') };
}

async function getImageDimensions(file: File): Promise<{ width?: number; height?: number }> {
  if (typeof window === 'undefined') return {};
  let url = '';
  try {
    url = URL.createObjectURL(file);
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error('無法讀取圖片尺寸'));
      image.src = url;
    });
    return dimensions;
  } catch {
    return {};
  } finally {
    if (url) URL.revokeObjectURL(url);
  }
}

export async function uploadMedia(file: File, alt = '') {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) return { ok: false, url: '', error: '僅支援 JPEG、PNG、WebP，單檔上限 10 MB' };
  const dimensions = await getImageDimensions(file);
  if (!adminSupabase) return { ok: true, mode: 'local' as const, url: URL.createObjectURL(file), ...dimensions };
  const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;
  const { error } = await adminSupabase.storage.from('site-media').upload(path, file, { contentType: file.type, upsert: false });
  if (error) return { ok: false, url: '', error: error.message };
  const { data } = adminSupabase.storage.from('site-media').getPublicUrl(path);
  const { data: media, error: mediaError } = await adminSupabase.from('media_assets').insert({ name: file.name, storage_path: path, alt: alt.trim().slice(0, 160), mime_type: file.type, size_bytes: file.size, width: dimensions.width ?? null, height: dimensions.height ?? null }).select('id').single();
  if (mediaError || !media) {
    await adminSupabase.storage.from('site-media').remove([path]);
    return { ok: false, url: '', error: mediaError?.message || '素材資料建立失敗' };
  }
  return { ok: true, mode: 'supabase' as const, id: String(media.id), url: data.publicUrl, ...dimensions };
}

function safeHttpUrl(value: string | undefined, fallback: string | null = null) { const normalized = value?.trim() || ''; return /^https?:\/\/[^\s]+$/i.test(normalized) || normalized === '#' ? normalized : fallback; }
function safeAssetUrl(value: string | undefined) { return isSafeContentUrl(value, true) ? value.trim() : null; }
export async function saveSettings(value: { brandName?: string; phone: string; line: string; address: string; hours: string; logoUrl?: string; mapEmbedUrl?: string; instagram?: string; facebook?: string; youtube?: string; heroTitle?: string; heroSubtitle?: string; tagline?: string; heroDescription?: string; heroBackgroundUrl?: string; servicesTitle?: string; servicesSubtitle?: string; servicesNote?: string; servicesBackgroundUrl?: string; pricingTitle?: string; pricingSubtitle?: string; pricingBackgroundUrl?: string; newsTitle?: string; newsSubtitle?: string; newsBackgroundUrl?: string; blogTitle?: string; blogSubtitle?: string; blogBackgroundUrl?: string; contactTitle?: string; contactLead?: string; contactBackgroundUrl?: string; benefits?: Array<{ title: string; caption: string }>; pricingBenefits?: Array<{ title: string; caption: string }>; privacy?: string; terms?: string; seoTitle?: string; seoDescription?: string; ogImageUrl?: string }) {
  const imageValues = [value.logoUrl, value.heroBackgroundUrl, value.servicesBackgroundUrl, value.pricingBackgroundUrl, value.newsBackgroundUrl, value.blogBackgroundUrl, value.contactBackgroundUrl, value.ogImageUrl];
  if (imageValues.some((item) => item && !isSafeContentUrl(item, true))) return { ok: false, mode: 'local' as const, error: '圖片網址必須是 https:// 或網站內部路徑' };
  if (value.mapEmbedUrl && !/^https:\/\/[^\s]+$/i.test(value.mapEmbedUrl.trim())) return { ok: false, mode: 'local' as const, error: '地圖 Embed URL 必須使用有效的 https:// 網址' };
  const lineValue = value.line.trim();
  if (!/^https:\/\/[^\s]+$/i.test(lineValue) && !/^@?[A-Za-z0-9._-]{1,120}$/.test(lineValue)) return { ok: false, mode: 'local' as const, error: 'LINE 請輸入 ID 或有效的 https:// 連結' };
  if (value.benefits && !isValidBenefits(value.benefits)) return { ok: false, mode: 'local' as const, error: '特色列最多 4 筆，且 title 最多 120 字、caption 最多 240 字' };
  if (value.pricingBenefits && !isValidBenefits(value.pricingBenefits)) return { ok: false, mode: 'local' as const, error: '價格特色列最多 4 筆，且 title 最多 120 字、caption 最多 240 字' };
  if (!adminSupabase) return { ok: true, mode: 'local' as const };
  const lineUrl = /^https:\/\//i.test(lineValue) ? lineValue : `https://line.me/ti/p/${lineValue}`;
  const { error } = await adminSupabase.from('site_settings').upsert({ id: '00000000-0000-0000-0000-000000000001', brand_name: value.brandName?.trim().slice(0, 120) || '天心閣養生會館', logo_url: safeAssetUrl(value.logoUrl), phone: value.phone.trim().slice(0, 40), line_id: lineValue.slice(0, 120), line_url: lineUrl, address: value.address.trim().slice(0, 240), business_hours: value.hours.trim().slice(0, 120), map_embed_url: safeHttpUrl(value.mapEmbedUrl), social: { line: lineUrl, instagram: safeHttpUrl(value.instagram), facebook: safeHttpUrl(value.facebook), youtube: safeHttpUrl(value.youtube) }, hero_title: value.heroTitle?.trim().slice(0, 120) ?? null, hero_subtitle: value.heroSubtitle?.trim().slice(0, 120) ?? null, tagline: value.tagline?.trim().slice(0, 240) ?? null, hero_description: value.heroDescription?.trim().slice(0, 240) ?? null, hero_background_url: safeAssetUrl(value.heroBackgroundUrl), services_title: value.servicesTitle?.trim().slice(0, 120) ?? null, services_subtitle: value.servicesSubtitle?.trim().slice(0, 240) ?? null, services_note: value.servicesNote?.trim().slice(0, 1000) ?? null, services_background_url: safeAssetUrl(value.servicesBackgroundUrl), pricing_title: value.pricingTitle?.trim().slice(0, 120) ?? null, pricing_subtitle: value.pricingSubtitle?.trim().slice(0, 240) ?? null, pricing_background_url: safeAssetUrl(value.pricingBackgroundUrl), news_title: value.newsTitle?.trim().slice(0, 120) ?? null, news_subtitle: value.newsSubtitle?.trim().slice(0, 240) ?? null, news_background_url: safeAssetUrl(value.newsBackgroundUrl), blog_title: value.blogTitle?.trim().slice(0, 120) ?? null, blog_subtitle: value.blogSubtitle?.trim().slice(0, 240) ?? null, blog_background_url: safeAssetUrl(value.blogBackgroundUrl), contact_title: value.contactTitle?.trim().slice(0, 120) ?? null, contact_lead: value.contactLead?.trim().slice(0, 240) ?? null, contact_background_url: safeAssetUrl(value.contactBackgroundUrl), benefits: value.benefits ?? [], pricing_benefits: value.pricingBenefits ?? [], privacy_text: value.privacy?.trim().slice(0, 10000) ?? null, terms_text: value.terms?.trim().slice(0, 10000) ?? null, seo_title: value.seoTitle?.trim().slice(0, 160) ?? null, seo_description: value.seoDescription?.trim().slice(0, 320) ?? null, og_image_url: safeAssetUrl(value.ogImageUrl) }, { onConflict: 'id' });
  return error ? { ok: false, mode: 'supabase' as const, error: error.message } : { ok: true, mode: 'supabase' as const };
}

export async function markMessageHandled(id: string, note?: string) {
  if (!adminSupabase || id.startsWith('local-')) return { ok: true, mode: 'local' as const };
  const { error } = await adminSupabase.from('contact_messages').update({ status: 'handled', note: note || null }).eq('id', id);
  return error ? { ok: false, mode: 'supabase' as const, error: error.message } : { ok: true, mode: 'supabase' as const };
}

export async function saveMessage(message: { id: string; status: 'unread' | 'handled'; note?: string }) {
  // A local snapshot can be shown when a configured Supabase connection is
  // unavailable. Keep those synthetic records local instead of attempting a
  // remote update with an ID such as `local-message-1`.
  if (!adminSupabase || message.id.startsWith('local-')) return { ok: true, mode: 'local' as const };
  const { error } = await adminSupabase.from('contact_messages').update({ status: message.status, note: message.note || null }).eq('id', message.id);
  return error ? { ok: false, mode: 'supabase' as const, error: error.message } : { ok: true, mode: 'supabase' as const };
}

export async function deleteMessage(id: string) {
  if (!adminSupabase || id.startsWith('local-')) return { ok: true, mode: 'local' as const };
  const { error } = await adminSupabase.from('contact_messages').delete().eq('id', id);
  return error ? { ok: false, mode: 'supabase' as const, error: error.message } : { ok: true, mode: 'supabase' as const };
}

export type ManagedArticle = { id: string; slug: string; title: string; category: string; status: string; excerpt: string; seoTitle?: string; seoDescription?: string; type: 'news' | 'blog'; body: string; coverUrl?: string; publishedAt?: string };
export type AdminCategory = { id: string; name: string; type: 'news' | 'blog' };
export async function loadCategories(): Promise<AdminCategory[] | null> {
  if (!adminSupabase) return null;
  const { data, error } = await adminSupabase.from('article_categories').select('id,name,type').order('name');
  if (error || !data) return null;
  return data.map((row) => ({ id: String(row.id), name: String(row.name), type: row.type as AdminCategory['type'] }));
}
export async function saveCategory(category: Omit<AdminCategory, 'id'> & { id?: string }) {
  if (!adminSupabase) return { ok: true, mode: 'local' as const };
  if (category.id && /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(category.id)) {
    const { error } = await adminSupabase.from('article_categories').update({ name: category.name.trim(), type: category.type }).eq('id', category.id);
    return error ? { ok: false, mode: 'supabase' as const, error: error.message } : { ok: true, mode: 'supabase' as const, id: category.id };
  }
  const categoryName = category.name.trim();
  const existing = await adminSupabase.from('article_categories').select('id').eq('name', categoryName).maybeSingle();
  if (existing.error) return { ok: false, mode: 'supabase' as const, error: existing.error.message };
  if (existing.data) return { ok: false, mode: 'supabase' as const, error: '分類名稱不可重複' };
  const { data, error } = await adminSupabase.from('article_categories').insert({ name: categoryName, type: category.type }).select('id').single();
  return error || !data ? { ok: false, mode: 'supabase' as const, error: error?.message || '新增分類失敗' } : { ok: true, mode: 'supabase' as const, id: String(data.id) };
}
export async function deleteCategory(category: string | Pick<AdminCategory, 'id' | 'name'>) {
  const id = typeof category === 'string' ? category : category.id;
  if (!adminSupabase || id.startsWith('local-')) {
    if (typeof category !== 'string') {
      // The first render may run before useStored writes its snapshot. Use the
      // same fixture references shown in the editor so an in-use category
      // cannot be deleted during that short window.
      const articles = localStorageJson<Array<{ category?: unknown }>>('txg-articles') ?? fixtureArticles;
      if (articles.some((article) => article.category === category.name)) return { ok: false, mode: 'local' as const, error: '使用中的分類無法刪除，請先移動或移除文章。' };
    }
    return { ok: true, mode: 'local' as const };
  }
  const { error } = await adminSupabase.from('article_categories').delete().eq('id', id);
  return error ? { ok: false, mode: 'supabase' as const, error: error.message } : { ok: true, mode: 'supabase' as const };
}
export async function loadArticles() {
  if (!adminSupabase) return null;
  const { data, error } = await adminSupabase.from('articles').select('id,slug,title,excerpt,seo_title,seo_description,type,status,published_at,body,cover_url,category:article_categories(name)').order('published_at', { ascending: false });
  if (error || !data) return null;
  return data.map((row) => { const category = row.category && typeof row.category === 'object' ? String(((row.category as unknown) as Record<string, unknown>).name ?? '') : ''; return { id: String(row.id), slug: String(row.slug), title: String(row.title), category, status: row.status as ManagedArticle['status'], excerpt: String(row.excerpt ?? ''), seoTitle: row.seo_title ? String(row.seo_title) : '', seoDescription: row.seo_description ? String(row.seo_description) : '', type: row.type as ManagedArticle['type'], body: JSON.stringify(row.body ?? []), coverUrl: row.cover_url ? String(row.cover_url) : '', publishedAt: row.published_at ? String(row.published_at) : '' }; });
}
export async function saveArticle(article: ManagedArticle) {
  let body: unknown;
  try { body = JSON.parse(article.body || '[]'); } catch { return { ok: false, mode: 'local' as const, error: '正文必須是合法 JSON 陣列' }; }
  if (!isValidArticleBody(body)) return { ok: false, mode: 'local' as const, error: '正文只能使用合法的結構化區塊' };
  const coverValue = article.coverUrl?.trim() || '';
  if (coverValue && !isSafeContentUrl(coverValue, true)) return { ok: false, mode: 'local' as const, error: '封面圖片網址必須是 https:// 或網站內部路徑' };
  if (!adminSupabase) return { ok: true, mode: 'local' as const };
  let categoryId: string | null = null;
  if (article.category.trim()) {
    const categoryName = article.category.trim();
    const categoryResult = await adminSupabase.from('article_categories').select('id,type').eq('name', categoryName).maybeSingle();
    if (categoryResult.error) return { ok: false, mode: 'supabase' as const, error: categoryResult.error.message };
    if (categoryResult.data) {
      if (categoryResult.data.type !== article.type) return { ok: false, mode: 'supabase' as const, error: '分類名稱已用於另一種文章類型' };
      categoryId = String(categoryResult.data.id);
    } else {
      const createdCategory = await adminSupabase.from('article_categories').insert({ name: categoryName, type: article.type }).select('id').single();
      if (createdCategory.error || !createdCategory.data) return { ok: false, mode: 'supabase' as const, error: createdCategory.error?.message || '新增分類失敗' };
      categoryId = String(createdCategory.data.id);
    }
  }
  const publishedAt = article.publishedAt && /^\d{4}-\d{2}-\d{2}$/.test(article.publishedAt) ? article.publishedAt : new Date().toISOString().slice(0, 10);
  const payload = { slug: article.slug || `${article.type}-${Date.now()}`, title: article.title, excerpt: article.excerpt, seo_title: article.seoTitle?.trim().slice(0, 160) || null, seo_description: article.seoDescription?.trim().slice(0, 320) || null, type: article.type, category_id: categoryId, status: article.status === 'published' ? 'published' : 'draft', body, cover_url: coverValue || null, published_at: publishedAt };
  if (/^[0-9a-f]{8}-[0-9a-f-]{27,}$/.test(article.id)) {
    const { error } = await adminSupabase.from('articles').update(payload).eq('id', article.id);
    return error ? { ok: false, mode: 'supabase' as const, error: error.message } : { ok: true, mode: 'supabase' as const, id: article.id };
  }
  const { data, error } = await adminSupabase.from('articles').insert(payload).select('id').single();
  return error || !data ? { ok: false, mode: 'supabase' as const, error: error?.message || '新增文章失敗' } : { ok: true, mode: 'supabase' as const, id: String(data.id) };
}

export async function deleteArticle(id: string) {
  if (!adminSupabase || id.startsWith('local-')) return { ok: true, mode: 'local' as const };
  const { error } = await adminSupabase.from('articles').delete().eq('id', id);
  return error ? { ok: false, mode: 'supabase' as const, error: error.message } : { ok: true, mode: 'supabase' as const };
}
