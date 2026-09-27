import { fixtureArticles, fixtureCategories, fixturePricingPlans, fixtureServices, fixtureSettings, isPublicSlug, isSafeContentUrl, isValidArticleBody, isValidArticleSources, isValidBenefits, normalizeYouTubeEmbedUrl, type Article, type ArticleCategory, type ContactMessage, type PricingPlan, type Service, type SiteSettings } from '@tian-xin-ge/contracts';
import { firebaseServer, firebaseServerExpected } from './firebase-admin';
import { staticSnapshot } from './static-snapshot';

export const settings: SiteSettings = fixtureSettings;
export const services: Service[] = fixtureServices;
export const pricingPlans: PricingPlan[] = fixturePricingPlans;
export const articles: Article[] = fixtureArticles;
export const messages: ContactMessage[] = [];

function isDeletedRow(row: Record<string, unknown> | undefined | null): boolean {
  return Boolean(row && (row.deletedAt != null || row.deleted_at != null));
}

function mapCategory(row: Record<string, unknown>): ArticleCategory | null {
  const type = row.type === 'news' || row.type === 'blog' ? row.type : null;
  const name = remoteText(row, 'name').trim();
  if (!type || !name || name.length > 120) return null;
  return { id: String(row.id), name, type, description: remoteText(row, 'description').slice(0, 2_000) || undefined, seoTitle: (remoteText(row, 'seo_title') || remoteText(row, 'seoTitle')).slice(0, 160) || undefined, seoDescription: (remoteText(row, 'seo_description') || remoteText(row, 'seoDescription')).slice(0, 300) || undefined, updatedAt: remoteDate(row.updatedAt ?? row.updated_at) };
}

export function getPublished(type?: Article['type']) {
  return articles.filter((article) => article.status === 'published' && (!type || article.type === type));
}

function fixtureOrThrow<T>(value: T): T {
  if (firebaseServerExpected) throw new Error('Firebase 服務設定不完整');
  return value;
}

function isMissingFirestoreIndex(error: unknown) {
  return error instanceof Error && (/requires an index|FAILED_PRECONDITION/i.test(error.message));
}

function mapService(row: Record<string, unknown>): Service {
  const serviceIcons: Service['icon'][] = ['lotus', 'oil', 'stone', 'foot', 'flower'];
  return { id: String(row.id), slug: String(row.slug ?? ''), previousSlugs: Array.isArray(row.previousSlugs) ? row.previousSlugs.filter(isPublicSlug) : undefined, name: String(row.name ?? ''), summary: String(row.summary ?? ''), description: String(row.description ?? ''), imageUrl: safeImageUrl(row.imageUrl ?? row.image_url), imageAlt: remoteText(row, 'image_alt') || String(row.name ?? ''), seoTitle: remoteText(row, 'seo_title') || remoteText(row, 'seoTitle') || undefined, seoDescription: remoteText(row, 'seo_description') || remoteText(row, 'seoDescription') || undefined, process: remoteText(row, 'process') || undefined, suitableFor: remoteText(row, 'suitable_for') || undefined, precautions: remoteText(row, 'precautions') || undefined, faq: remoteText(row, 'faq') || undefined, icon: serviceIcons.includes(row.icon as Service['icon']) ? row.icon as Service['icon'] : 'lotus', durationMinutes: row.durationMinutes == null && row.duration_minutes == null ? undefined : Number(row.durationMinutes ?? row.duration_minutes), price: row.price == null ? undefined : Number(row.price), priceLabel: row.priceLabel ?? row.price_label ? String(row.priceLabel ?? row.price_label) : undefined, sortOrder: Number(row.sortOrder ?? row.sort_order ?? 0), isVisible: Boolean(row.isVisible ?? row.is_visible), version: Number.isInteger(row.version) ? Number(row.version) : undefined, contentUpdatedAt: remoteDate(row.contentUpdatedAt ?? row.content_updated_at), updatedAt: remoteDate(row.updatedAt ?? row.updated_at) };
}
function mapPricingPlan(row: Record<string, unknown>): PricingPlan {
  const categories: PricingPlan['category'][] = ['局部舒壓', '足部服務', '全身與精油按摩', '組合方案', '刮痧與拔罐'];
  return { id: String(row.id), name: String(row.name ?? ''), summary: String(row.summary ?? ''), description: String(row.description ?? ''), category: categories.includes(row.category as PricingPlan['category']) ? row.category as PricingPlan['category'] : '組合方案', durationMinutes: row.durationMinutes == null && row.duration_minutes == null ? undefined : Number(row.durationMinutes ?? row.duration_minutes), durationNote: remoteText(row, 'duration_note') || undefined, price: Number(row.price ?? 0), relatedServiceSlugs: Array.isArray(row.relatedServiceSlugs ?? row.related_service_slugs) ? (row.relatedServiceSlugs ?? row.related_service_slugs) as string[] : [], imageUrl: safeImageUrl(row.imageUrl ?? row.image_url), imageAlt: remoteText(row, 'image_alt') || undefined, isVisible: Boolean(row.isVisible ?? row.is_visible), showOnHome: Boolean(row.showOnHome ?? row.show_on_home), isFeatured: Boolean(row.isFeatured ?? row.is_featured), sortOrder: Number(row.sortOrder ?? row.sort_order ?? 0), homeSortOrder: Number(row.homeSortOrder ?? row.home_sort_order ?? 0), version: Number.isInteger(row.version) ? Number(row.version) : undefined, updatedAt: remoteDate(row.updatedAt ?? row.updated_at) };
}
function safeImageUrl(value: unknown, fallback = ''): string { if (!isSafeContentUrl(value, true)) return fallback; return typeof value === 'string' && value.startsWith('/assets/') ? value.replace(/\.png$/i, '.webp') : value; }
function safeLinkUrl(value: unknown, fallback = '#'): string { return isSafeContentUrl(value) ? value : fallback; }
function safeHttpsLinkUrl(value: unknown, fallback = '#'): string { return typeof value === 'string' && /^https:\/\/[^\s]+$/i.test(value) ? value : fallback; }
function safeEmbedUrl(value: unknown, fallback: string): string { return typeof value === 'string' && /^https:\/\/[^\s]+$/i.test(value) ? value : fallback; }
function socialLink(row: Record<string, unknown>, nested: Record<string, unknown>, key: 'instagram' | 'facebook' | 'youtube'): string {
  // Older settings documents stored these values under `social`, while the
  // admin editor writes the editable fields at the document root. Prefer a
  // configured non-placeholder value from either shape so both generations
  // remain readable during migration.
  const candidates = [row[key], row[`${key}_url`], row[`${key}Url`], nested[key], nested[`${key}_url`], nested[`${key}Url`]];
  const configured = candidates.find((candidate) => typeof candidate === 'string' && candidate.trim() && candidate.trim() !== '#' && isSafeContentUrl(candidate));
  if (configured) return configured as string;
  const placeholder = candidates.find((candidate) => isSafeContentUrl(candidate));
  return typeof placeholder === 'string' ? placeholder : '#';
}
function safeBodyUrl(value: unknown, image = false): string | null {
  return isSafeContentUrl(value, image) ? value : null;
}
function remoteText(row: Record<string, unknown>, key: string) {
  const camel = key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
  const value = row[key] ?? row[camel];
  return typeof value === 'string' ? value : '';
}
function remoteDate(value: unknown): string | undefined {
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    const date = (value as { toDate: () => Date }).toDate();
    return date instanceof Date && !Number.isNaN(date.valueOf()) ? date.toISOString() : undefined;
  }
  if (typeof value === 'string' && value.trim()) {
    const date = new Date(value);
    return Number.isNaN(date.valueOf()) ? undefined : date.toISOString();
  }
  return undefined;
}
function requiredRemoteText(row: Record<string, unknown>, key: string, label: string) {
  const value = remoteText(row, key).trim();
  if (!value) throw new Error(`網站設定缺少${label}`);
  return value;
}
function remoteLineUrl(rawLine: string, configuredLineUrl: string) {
  const direct = safeHttpsLinkUrl(rawLine.startsWith('line.me/') ? `https://${rawLine}` : rawLine, '');
  if (direct) return direct;
  if (rawLine) {
    const lineId = rawLine.startsWith('@') ? rawLine : `@${rawLine}`;
    return safeHttpsLinkUrl(`https://line.me/ti/p/${lineId}`, '#contact');
  }
  if (configuredLineUrl) return configuredLineUrl;
  return '#contact';
}
function mapArticle(row: Record<string, unknown>): Article {
  const category = typeof row.category === 'object' && row.category ? String((row.category as Record<string, unknown>).name ?? '') : String(row.category ?? '');
  const body: Article['body'] = Array.isArray(row.body) ? row.body.map((block): Article['body'][number] | null => {
    if (!block || typeof block !== 'object') return null;
    const item = block as Record<string, unknown>;
    const type = String(item.type);
    if (!['heading', 'paragraph', 'list', 'quote', 'link', 'image', 'video'].includes(type) || typeof item.text !== 'string') return null;
    const candidate = { ...item, type, text: item.text } as Article['body'][number];
    if (type === 'heading' && (item.level === 2 || item.level === 3)) candidate.level = item.level;
    if (type === 'link') { const url = safeBodyUrl(item.url); if (!url) return null; candidate.url = url; }
    if (type === 'image') { const url = safeBodyUrl(item.url, true); if (!url) return null; candidate.url = url; candidate.alt = typeof item.alt === 'string' ? item.alt.slice(0, 160) : item.text; }
    if (type === 'video') {
      const videoKind = item.videoKind === 'youtube' ? 'youtube' : item.videoKind === 'upload' ? 'upload' : null;
      const url = videoKind === 'youtube' ? normalizeYouTubeEmbedUrl(item.url) : safeBodyUrl(item.url, true);
      if (!videoKind || !url) return null;
      candidate.videoKind = videoKind;
      candidate.url = url;
    }
    return isValidArticleBody([candidate]) ? candidate : null;
  }).filter((block): block is Article['body'][number] => block !== null) : [];
  const title = String(row.title ?? '');
  const sourcesValue = row.sources;
  const sources = isValidArticleSources(sourcesValue) ? sourcesValue.map((source) => ({ title: source.title.trim(), url: source.url })) : undefined;
  return { id: String(row.id), slug: String(row.slug ?? ''), previousSlugs: Array.isArray(row.previousSlugs) ? row.previousSlugs.filter(isPublicSlug) : undefined, type: row.type as Article['type'], category, title, excerpt: String(row.excerpt ?? ''), seoTitle: typeof (row.seoTitle ?? row.seo_title) === 'string' ? String(row.seoTitle ?? row.seo_title) : undefined, seoDescription: typeof (row.seoDescription ?? row.seo_description) === 'string' ? String(row.seoDescription ?? row.seo_description) : undefined, coverUrl: safeImageUrl(row.coverUrl ?? row.cover_url), coverAlt: remoteText(row, 'cover_alt') || title, body, sources, contentUpdatedAt: remoteDate(row.contentUpdatedAt ?? row.content_updated_at), authorName: remoteText(row, 'author_name').slice(0, 160) || undefined, publishedAt: String(row.publishedAt ?? row.published_at ?? ''), status: row.status as Article['status'], version: Number.isInteger(row.version) ? Number(row.version) : undefined, updatedAt: remoteDate(row.updatedAt ?? row.updated_at) };
}
export async function loadServices(): Promise<Service[]> {
  const snapshot = staticSnapshot();
  if (snapshot) return snapshot.services.map(mapService).filter((service) => service.isVisible).sort((a, b) => a.sortOrder - b.sortOrder);
  const remote = firebaseServer();
  if (!remote) return fixtureOrThrow(services);
  try {
    const snapshot = await remote.db.collection('services').get();
    return snapshot.docs.filter((doc) => !isDeletedRow(doc.data())).map((doc) => mapService({ id: doc.id, ...doc.data() })).filter((service) => service.isVisible).sort((a, b) => a.sortOrder - b.sortOrder);
  } catch (error) {
    throw new Error(`服務資料讀取失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
  }
}

export async function loadPricingPlans(): Promise<PricingPlan[]> {
  const snapshot = staticSnapshot();
  if (snapshot && Array.isArray(snapshot.pricingPlans)) return snapshot.pricingPlans.map(mapPricingPlan).filter((plan) => plan.isVisible).sort((a, b) => a.sortOrder - b.sortOrder);
  const remote = firebaseServer();
  if (!remote) return fixtureOrThrow(pricingPlans);
  try { const snapshot = await remote.db.collection('pricing_plans').get(); return snapshot.docs.filter((doc) => !isDeletedRow(doc.data())).map((doc) => mapPricingPlan({ id: doc.id, ...doc.data() })).filter((plan) => plan.isVisible).sort((a, b) => a.sortOrder - b.sortOrder); } catch (error) { throw new Error(`價目資料讀取失敗：${error instanceof Error ? error.message : '未知錯誤'}`); }
}

export async function loadArticleCategories(type?: ArticleCategory['type']): Promise<ArticleCategory[]> {
  const snapshot = staticSnapshot();
  if (snapshot) return snapshot.categories.map(mapCategory).filter((category): category is ArticleCategory => Boolean(category && (!type || category.type === type)));
  const remote = firebaseServer();
  const local = fixtureCategories.filter((category) => !type || category.type === type);
  if (!remote) return fixtureOrThrow(local);
  try {
    const snapshot = await remote.db.collection('article_categories').orderBy('name').get();
    return snapshot.docs.filter((doc) => !isDeletedRow(doc.data())).map((doc) => mapCategory({ id: doc.id, ...doc.data() })).filter((category): category is ArticleCategory => Boolean(category && (!type || category.type === type)));
  } catch (error) {
    throw new Error(`分類資料讀取失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
  }
}

/** Read one visible service through the same repository boundary as the lists. */
export async function loadService(slug: string): Promise<Service | null> {
  const items = await loadServices();
  return items.find((item) => item.slug === slug) ?? null;
}

/** Map a validated Firestore document without leaking fixture values into production. */
export function mapRemoteSettings(row: Record<string, unknown>): SiteSettings {
  const brandName = requiredRemoteText(row, 'brand_name', '品牌名稱');
  const phone = requiredRemoteText(row, 'phone', '聯絡電話');
  // The admin stores its editable field as `line`; earlier seed data used
  // `line_id`. Prefer the current field so a newly saved ID immediately wins
  // over any legacy link left in the document.
  const rawLineInput = remoteText(row, 'line').trim() || remoteText(row, 'line_id').trim();
  const configuredLineUrl = safeHttpsLinkUrl(row.line_url, '');
  if (!rawLineInput && !configuredLineUrl) throw new Error('網站設定缺少LINE ID或正式連結');
  const lineId = rawLineInput && !safeHttpsLinkUrl(rawLineInput.startsWith('line.me/') ? `https://${rawLineInput}` : rawLineInput, '')
    ? (rawLineInput.startsWith('@') ? rawLineInput : `@${rawLineInput}`)
    : 'LINE';
  const address = requiredRemoteText(row, 'address', '地址');
  const businessHours = requiredRemoteText(row, 'business_hours', '營業時間');
  const lineUrl = remoteLineUrl(rawLineInput, configuredLineUrl);
  const benefits = isValidBenefits(row.benefits) ? row.benefits : [];
  const pricingBenefitsValue = row.pricing_benefits ?? row.pricingBenefits;
  const pricingBenefits = isValidBenefits(pricingBenefitsValue) ? pricingBenefitsValue : [];
  const remoteSocial = row.social && typeof row.social === 'object' ? row.social as Record<string, unknown> : {};
  const social = { line: lineUrl, instagram: socialLink(row, remoteSocial, 'instagram'), facebook: socialLink(row, remoteSocial, 'facebook'), youtube: socialLink(row, remoteSocial, 'youtube') };
  const tagline = remoteText(row, 'tagline');
  const heroDescription = remoteText(row, 'hero_description');
  return {
    brandName,
    tagline,
    logoUrl: safeImageUrl(row.logo_url ?? row.logoUrl),
    phone,
    lineId,
    lineUrl,
    address,
    businessHours,
    mapEmbedUrl: safeEmbedUrl(row.map_embed_url ?? row.mapEmbedUrl, ''),
    social,
    heroTitle: remoteText(row, 'hero_title'),
    heroSubtitle: remoteText(row, 'hero_subtitle'),
    heroDescription,
    heroBackgroundUrl: safeImageUrl(row.hero_background_url ?? row.heroBackgroundUrl),
    servicesTitle: remoteText(row, 'services_title'),
    servicesSubtitle: remoteText(row, 'services_subtitle'),
    servicesNote: remoteText(row, 'services_note'),
    servicesBackgroundUrl: safeImageUrl(row.services_background_url ?? row.servicesBackgroundUrl),
    pricingTitle: remoteText(row, 'pricing_title'),
    pricingSubtitle: remoteText(row, 'pricing_subtitle'),
    pricingBackgroundUrl: safeImageUrl(row.pricing_background_url ?? row.pricingBackgroundUrl),
    newsTitle: remoteText(row, 'news_title'),
    newsSubtitle: remoteText(row, 'news_subtitle'),
    newsBackgroundUrl: safeImageUrl(row.news_background_url ?? row.newsBackgroundUrl),
    blogTitle: remoteText(row, 'blog_title'),
    blogSubtitle: remoteText(row, 'blog_subtitle'),
    blogBackgroundUrl: safeImageUrl(row.blog_background_url ?? row.blogBackgroundUrl),
    contactTitle: remoteText(row, 'contact_title'),
    contactLead: remoteText(row, 'contact_lead'),
    contactBackgroundUrl: safeImageUrl(row.contact_background_url ?? row.contactBackgroundUrl),
    benefits,
    pricingBenefits,
    privacyText: remoteText(row, 'privacy_text'),
    termsText: remoteText(row, 'terms_text'),
    seoTitle: remoteText(row, 'seo_title') || (tagline ? `${brandName}｜${tagline}` : brandName),
    seoDescription: remoteText(row, 'seo_description') || heroDescription,
    ogImageUrl: safeImageUrl(row.og_image_url ?? row.ogImageUrl),
    editorialTeamName: remoteText(row, 'editorial_team_name') || undefined,
    editorialBio: remoteText(row, 'editorial_bio') || undefined,
    editorialPolicy: remoteText(row, 'editorial_policy') || undefined,
  };
}

export async function loadSettings(): Promise<SiteSettings> {
  const snapshot = staticSnapshot();
  if (snapshot) return mapRemoteSettings(snapshot.settings);
  const remote = firebaseServer();
  if (!remote) return fixtureOrThrow(settings);
  try {
    const snapshot = await remote.db.collection('site_settings').doc('singleton').get();
    if (!snapshot.exists) throw new Error('網站設定尚未建立');
    return mapRemoteSettings(snapshot.data() as Record<string, unknown>);
  } catch (error) {
    throw new Error(`網站設定讀取失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
  }
}
const ARTICLE_LIST_FIELDS = ['slug', 'type', 'status', 'category', 'title', 'excerpt', 'seoTitle', 'seoDescription', 'coverUrl', 'coverAlt', 'sources', 'contentUpdatedAt', 'authorName', 'publishedAt', 'updatedAt'];

export async function loadArticles(type?: Article['type'], options?: { category?: string }): Promise<Article[]> {
  const snapshot = staticSnapshot();
  if (snapshot) return snapshot.articles.map(mapArticle).filter((article) => article.status === 'published' && (article.type === 'news' || article.type === 'blog') && isPublicSlug(article.slug) && (!type || article.type === type) && (!options?.category || article.category === options.category));
  const remote = firebaseServer();
  if (!remote) return fixtureOrThrow(getPublished(type).filter((article) => !options?.category || article.category === options.category));
  try {
    let query = remote.db.collection('articles').where('status', '==', 'published');
    if (type) query = query.where('type', '==', type);
    if (options?.category) query = query.where('category', '==', options.category);
    const snapshot = await query.orderBy('publishedAt', 'desc').select(...ARTICLE_LIST_FIELDS).get();
    return snapshot.docs.filter((doc) => !isDeletedRow(doc.data())).map((doc) => mapArticle({ id: doc.id, ...doc.data() })).filter((article) => article.status === 'published' && (article.type === 'news' || article.type === 'blog') && isPublicSlug(article.slug) && (!type || article.type === type));
  } catch (error) {
    if (isMissingFirestoreIndex(error)) {
      try {
        const snapshot = await remote.db.collection('articles').select(...ARTICLE_LIST_FIELDS).get();
        return snapshot.docs.filter((doc) => !isDeletedRow(doc.data())).map((doc) => mapArticle({ id: doc.id, ...doc.data() })).filter((article) => article.status === 'published' && (article.type === 'news' || article.type === 'blog') && isPublicSlug(article.slug) && (!type || article.type === type) && (!options?.category || article.category === options.category)).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || b.id.localeCompare(a.id));
      } catch (fallbackError) {
        throw new Error(`文章資料讀取失敗：${fallbackError instanceof Error ? fallbackError.message : '未知錯誤'}`);
      }
    }
    throw new Error(`文章資料讀取失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
  }
}

export type ArticlePageResult = { items: Article[]; total: number; totalPages: number; page: number; pageSize: number };

/** Query only published list fields and return one bounded page for public list routes. */
export async function loadArticlePage(type: Article['type'], options: { category?: string; page?: number; pageSize?: number } = {}): Promise<ArticlePageResult> {
  const pageSize = Math.min(Math.max(options.pageSize || 8, 1), 24);
  const page = Math.max(Number.isInteger(options.page) ? Number(options.page) : 1, 1);
  const snapshot = staticSnapshot();
  if (snapshot) {
    const rows = snapshot.articles.map(mapArticle).filter((article) => article.status === 'published' && article.type === type && isPublicSlug(article.slug) && (!options.category || article.category === options.category));
    const total = rows.length;
    return { items: rows.slice((page - 1) * pageSize, page * pageSize), total, totalPages: Math.max(1, Math.ceil(total / pageSize)), page, pageSize };
  }
  const remote = firebaseServer();
  if (!remote) {
    const rows = getPublished(type).filter((article) => !options.category || article.category === options.category).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || b.id.localeCompare(a.id));
    const total = rows.length;
    return { items: rows.slice((page - 1) * pageSize, page * pageSize), total, totalPages: Math.max(1, Math.ceil(total / pageSize)), page, pageSize };
  }
  try {
    let query = remote.db.collection('articles').where('status', '==', 'published').where('type', '==', type);
    if (options.category) query = query.where('category', '==', options.category);
    const countSnapshot = await query.count().get();
    const total = Number(countSnapshot.data().count || 0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    // Resolve numbered URLs through Firestore cursors instead of offset. This
    // keeps the query bounded to list fields and avoids scanning skipped
    // documents with an offset on large collections.
    let pageQuery = query.orderBy('publishedAt', 'desc').orderBy('__name__', 'desc').select(...ARTICLE_LIST_FIELDS);
    for (let cursorPage = 1; cursorPage < page; cursorPage += 1) {
      const cursorSnapshot = await pageQuery.limit(pageSize).get();
      const last = cursorSnapshot.docs.at(-1);
      if (!last) break;
      pageQuery = pageQuery.startAfter(last);
    }
    const snapshot = await pageQuery.limit(pageSize).get();
    const items = snapshot.docs.filter((doc) => !isDeletedRow(doc.data())).map((doc) => mapArticle({ id: doc.id, ...doc.data() })).filter((article) => article.status === 'published' && (article.type === 'news' || article.type === 'blog') && isPublicSlug(article.slug));
    return { items, total, totalPages, page, pageSize };
  } catch (error) {
    if (isMissingFirestoreIndex(error)) {
      try {
        const snapshot = await remote.db.collection('articles').select(...ARTICLE_LIST_FIELDS).get();
        const rows = snapshot.docs.filter((doc) => !isDeletedRow(doc.data())).map((doc) => mapArticle({ id: doc.id, ...doc.data() })).filter((article) => article.status === 'published' && (article.type === 'news' || article.type === 'blog') && isPublicSlug(article.slug) && article.type === type && (!options.category || article.category === options.category)).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || b.id.localeCompare(a.id));
        const total = rows.length;
        return { items: rows.slice((page - 1) * pageSize, page * pageSize), total, totalPages: Math.max(1, Math.ceil(total / pageSize)), page, pageSize };
      } catch (fallbackError) {
        throw new Error(`文章列表讀取失敗：${fallbackError instanceof Error ? fallbackError.message : '未知錯誤'}`);
      }
    }
    throw new Error(`文章列表讀取失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
  }
}

/** Read one published article through the same repository boundary as the lists. */
export async function loadArticle(type: Article['type'], slug: string): Promise<Article | null> {
  const snapshot = staticSnapshot();
  if (snapshot) return snapshot.articles.map(mapArticle).find((article) => article.type === type && article.status === 'published' && article.slug === slug) ?? null;
  const remote = firebaseServer();
  if (!remote) return fixtureOrThrow(getPublished(type).find((item) => item.slug === slug) ?? null);
  try {
    const snapshot = await remote.db.collection('articles')
      .where('type', '==', type)
      .where('status', '==', 'published')
      .where('slug', '==', slug)
      .limit(1)
      .get();
    const doc = snapshot.docs[0];
    if (!doc || isDeletedRow(doc.data())) return null;
    return mapArticle({ id: doc.id, ...doc.data() });
  } catch (error) {
    if (isMissingFirestoreIndex(error)) {
      try {
        const snapshot = await remote.db.collection('articles').get();
        const doc = snapshot.docs.filter((item) => !isDeletedRow(item.data())).map((item) => ({ id: item.id, ...item.data() })).map((row) => mapArticle(row)).find((item) => item.type === type && item.status === 'published' && item.slug === slug);
        return doc ?? null;
      } catch (fallbackError) {
        throw new Error(`文章詳情讀取失敗：${fallbackError instanceof Error ? fallbackError.message : '未知錯誤'}`);
      }
    }
    throw new Error(`文章詳情讀取失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
  }
}
