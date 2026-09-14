import { fixtureArticles, fixtureServices, fixtureSettings, isSafeContentUrl, isValidBenefits, type Article, type ContactMessage, type Service, type SiteSettings } from '@tian-xin-ge/contracts';
import { hasAnySupabaseEnv, supabase } from './supabase';

export const settings: SiteSettings = fixtureSettings;
export const services: Service[] = fixtureServices;
export const articles: Article[] = fixtureArticles;
export const messages: ContactMessage[] = [];

export function getPublished(type?: Article['type']) {
  return articles.filter((article) => article.status === 'published' && (!type || article.type === type));
}

function fixtureOrThrow<T>(value: T): T {
  if (hasAnySupabaseEnv) throw new Error('Supabase 環境變數設定不完整');
  return value;
}

function mapService(row: Record<string, unknown>): Service {
  const serviceIcons: Service['icon'][] = ['lotus', 'oil', 'stone', 'foot', 'flower'];
  return { id: String(row.id), slug: String(row.slug), name: String(row.name), summary: String(row.summary ?? ''), description: String(row.description ?? ''), imageUrl: safeImageUrl(row.image_url), icon: serviceIcons.includes(row.icon as Service['icon']) ? row.icon as Service['icon'] : 'lotus', durationMinutes: row.duration_minutes == null ? undefined : Number(row.duration_minutes), price: row.price == null ? undefined : Number(row.price), priceLabel: row.price_label ? String(row.price_label) : undefined, sortOrder: Number(row.sort_order ?? 0), isVisible: Boolean(row.is_visible) };
}
function safeImageUrl(value: unknown, fallback = ''): string { return isSafeContentUrl(value, true) ? value : fallback; }
function safeLinkUrl(value: unknown, fallback = '#'): string { return isSafeContentUrl(value) ? value : fallback; }
function safeHttpsLinkUrl(value: unknown, fallback = '#'): string { return typeof value === 'string' && /^https:\/\/[^\s]+$/i.test(value) ? value : fallback; }
function safeEmbedUrl(value: unknown, fallback: string): string { return typeof value === 'string' && /^https:\/\/[^\s]+$/i.test(value) ? value : fallback; }
function safeBodyUrl(value: unknown, image = false): string | null {
  return isSafeContentUrl(value, image) ? value : null;
}
function remoteText(row: Record<string, unknown>, key: string) {
  return typeof row[key] === 'string' ? row[key] as string : '';
}
function requiredRemoteText(row: Record<string, unknown>, key: string, label: string) {
  const value = remoteText(row, key).trim();
  if (!value) throw new Error(`網站設定缺少${label}`);
  return value;
}
function remoteLineUrl(row: Record<string, unknown>, lineId: string) {
  const configured = safeHttpsLinkUrl(row.line_url, '');
  if (configured) return configured;
  if (lineId) return safeHttpsLinkUrl(`https://line.me/ti/p/${lineId}`, '#contact');
  return '#contact';
}
function mapArticle(row: Record<string, unknown>): Article {
  const category = typeof row.category === 'object' && row.category ? String((row.category as Record<string, unknown>).name ?? '') : String(row.category ?? '');
  const body: Article['body'] = Array.isArray(row.body) ? row.body.map((block): Article['body'][number] | null => {
    if (!block || typeof block !== 'object') return null;
    const item = block as Record<string, unknown>;
    const type = String(item.type);
    if (!['heading', 'paragraph', 'list', 'link', 'image'].includes(type) || typeof item.text !== 'string') return null;
    if (type === 'list') return { type: 'list', text: item.text, items: Array.isArray(item.items) ? item.items.filter((entry): entry is string => typeof entry === 'string') : [] };
    if (type === 'link') { const url = safeBodyUrl(item.url); return url ? { type: 'link', text: item.text, url } : null; }
    if (type === 'image') { const url = safeBodyUrl(item.url, true); return url ? { type: 'image', text: item.text, url, alt: typeof item.alt === 'string' ? item.alt.slice(0, 160) : item.text } : null; }
    return { type: type as 'heading' | 'paragraph', text: item.text };
  }).filter((block): block is Article['body'][number] => block !== null) : [];
  return { id: String(row.id), slug: String(row.slug), type: row.type as Article['type'], category, title: String(row.title), excerpt: String(row.excerpt ?? ''), seoTitle: typeof row.seo_title === 'string' ? row.seo_title : undefined, seoDescription: typeof row.seo_description === 'string' ? row.seo_description : undefined, coverUrl: safeImageUrl(row.cover_url), body, publishedAt: String(row.published_at), status: row.status as Article['status'] };
}
export async function loadServices(): Promise<Service[]> {
  if (!supabase) return fixtureOrThrow(services);
  const { data, error } = await supabase.from('services').select('*').eq('is_visible', true).order('sort_order');
  if (error) throw new Error(`服務資料讀取失敗：${error.message}`);
  return (data ?? []).map((row) => mapService(row as Record<string, unknown>));
}

/** Read one visible service through the same repository boundary as the lists. */
export async function loadService(slug: string): Promise<Service | null> {
  const items = await loadServices();
  return items.find((item) => item.slug === slug) ?? null;
}

/** Map a validated Supabase row without leaking fixture values into production. */
export function mapRemoteSettings(row: Record<string, unknown>): SiteSettings {
  const brandName = requiredRemoteText(row, 'brand_name', '品牌名稱');
  const phone = requiredRemoteText(row, 'phone', '聯絡電話');
  const rawLineId = remoteText(row, 'line_id').trim();
  const configuredLineUrl = safeHttpsLinkUrl(row.line_url, '');
  if (!rawLineId && !configuredLineUrl) throw new Error('網站設定缺少LINE ID或正式連結');
  const lineId = rawLineId || 'LINE';
  const address = requiredRemoteText(row, 'address', '地址');
  const businessHours = requiredRemoteText(row, 'business_hours', '營業時間');
  const lineUrl = remoteLineUrl(row, lineId);
  const benefits = isValidBenefits(row.benefits) ? row.benefits : [];
  const pricingBenefits = isValidBenefits(row.pricing_benefits) ? row.pricing_benefits : [];
  const remoteSocial = row.social && typeof row.social === 'object' ? row.social as Record<string, unknown> : {};
  const social = { line: safeHttpsLinkUrl(remoteSocial.line, lineUrl), instagram: safeLinkUrl(remoteSocial.instagram, '#'), facebook: safeLinkUrl(remoteSocial.facebook, '#'), youtube: safeLinkUrl(remoteSocial.youtube, '#') };
  const tagline = remoteText(row, 'tagline');
  const heroDescription = remoteText(row, 'hero_description');
  return {
    brandName,
    tagline,
    logoUrl: safeImageUrl(row.logo_url),
    phone,
    lineId,
    lineUrl,
    address,
    businessHours,
    mapEmbedUrl: safeEmbedUrl(row.map_embed_url, ''),
    social,
    heroTitle: remoteText(row, 'hero_title'),
    heroSubtitle: remoteText(row, 'hero_subtitle'),
    heroDescription,
    heroBackgroundUrl: safeImageUrl(row.hero_background_url),
    servicesTitle: remoteText(row, 'services_title'),
    servicesSubtitle: remoteText(row, 'services_subtitle'),
    servicesNote: remoteText(row, 'services_note'),
    servicesBackgroundUrl: safeImageUrl(row.services_background_url),
    pricingTitle: remoteText(row, 'pricing_title'),
    pricingSubtitle: remoteText(row, 'pricing_subtitle'),
    pricingBackgroundUrl: safeImageUrl(row.pricing_background_url),
    newsTitle: remoteText(row, 'news_title'),
    newsSubtitle: remoteText(row, 'news_subtitle'),
    newsBackgroundUrl: safeImageUrl(row.news_background_url),
    blogTitle: remoteText(row, 'blog_title'),
    blogSubtitle: remoteText(row, 'blog_subtitle'),
    blogBackgroundUrl: safeImageUrl(row.blog_background_url),
    contactTitle: remoteText(row, 'contact_title'),
    contactLead: remoteText(row, 'contact_lead'),
    contactBackgroundUrl: safeImageUrl(row.contact_background_url),
    benefits,
    pricingBenefits,
    privacyText: remoteText(row, 'privacy_text'),
    termsText: remoteText(row, 'terms_text'),
    seoTitle: remoteText(row, 'seo_title') || (tagline ? `${brandName}｜${tagline}` : brandName),
    seoDescription: remoteText(row, 'seo_description') || heroDescription,
    ogImageUrl: safeImageUrl(row.og_image_url),
  };
}

export async function loadSettings(): Promise<SiteSettings> {
  if (!supabase) return fixtureOrThrow(settings);
  const { data, error } = await supabase.from('site_settings').select('*').limit(1).maybeSingle();
  if (error) throw new Error(`網站設定讀取失敗：${error.message}`);
  if (!data) throw new Error('網站設定尚未建立');
  return mapRemoteSettings(data as Record<string, unknown>);
}
export async function loadArticles(type?: Article['type']): Promise<Article[]> {
  if (!supabase) return fixtureOrThrow(getPublished(type));
  let query = supabase.from('articles').select('*, category:article_categories(name)').eq('status', 'published').order('published_at', { ascending: false });
  if (type) query = query.eq('type', type);
  const { data, error } = await query;
  if (error) throw new Error(`文章資料讀取失敗：${error.message}`);
  return (data ?? []).map((row) => mapArticle(row as Record<string, unknown>));
}

/** Read one published article through the same repository boundary as the lists. */
export async function loadArticle(type: Article['type'], slug: string): Promise<Article | null> {
  const items = await loadArticles(type);
  return items.find((item) => item.slug === slug) ?? null;
}
