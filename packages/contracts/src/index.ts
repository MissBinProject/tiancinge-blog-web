export type ContentStatus = 'draft' | 'scheduled' | 'published';
export type ArticleType = 'news' | 'blog';
export const ARTICLE_FONT_SIZES = ['14px', '16px', '18px', '20px', '24px', '28px', '32px', '40px'] as const;
export const ARTICLE_FONT_FAMILIES = ['Noto Sans TC', 'Noto Serif TC', 'Arial', 'Georgia'] as const;
export type ArticleTextAlign = 'left' | 'center' | 'right' | 'justify';
export type ArticleVideoKind = 'youtube' | 'upload';
export type ArticleTextRun = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  color?: string;
  fontSize?: typeof ARTICLE_FONT_SIZES[number];
  fontFamily?: typeof ARTICLE_FONT_FAMILIES[number];
  href?: string;
};
export type ArticleBodyBlock = {
  type: 'heading' | 'paragraph' | 'list' | 'quote' | 'link' | 'image' | 'video';
  text: string;
  /** Heading level for semantic article structure. Missing legacy values mean H2. */
  level?: 2 | 3;
  content?: ArticleTextRun[];
  textAlign?: ArticleTextAlign;
  items?: string[];
  itemContent?: ArticleTextRun[][];
  ordered?: boolean;
  url?: string;
  alt?: string;
  videoKind?: ArticleVideoKind;
};
export type SiteBenefit = { title: string; caption: string };
export type ArticleSource = { title: string; url: string };
export interface ArticleCategory {
  id: string;
  name: string;
  type: ArticleType;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  updatedAt?: string;
}

export function isValidArticleSources(value: unknown): value is ArticleSource[] {
  return Array.isArray(value) && value.length <= 10 && value.every((item: unknown) => {
    if (!item || typeof item !== 'object') return false;
    const record = item as Record<string, unknown>;
    return typeof record.title === 'string' && record.title.trim().length > 0 && record.title.length <= 160
      && typeof record.url === 'string' && /^https:\/\/[^\s]+$/i.test(record.url) && record.url.length <= 2048;
  });
}

const CONTENT_CODE_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

/** Public URL code used by services and articles. Always lower-case, 10 characters. */
export function createContentCode(): string {
  const values = new Uint32Array(10);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(values);
  else for (let index = 0; index < values.length; index += 1) values[index] = Math.floor(Math.random() * 2 ** 32);
  return Array.from(values, (value) => CONTENT_CODE_ALPHABET[value % CONTENT_CODE_ALPHABET.length]).join('');
}

export function isContentCode(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9]{10}$/.test(value);
}

/** Stable, human-readable public URL segment used by service detail pages. */
export function isPublicSlug(value: unknown): value is string {
  return typeof value === 'string'
    && value.length >= 1
    && value.length <= 80
    && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export function isServiceSlug(value: unknown): value is string {
  return isPublicSlug(value);
}

/** Shared URL and structured-body rules used by the admin editor and public mapper. */
export function isSafeContentUrl(value: unknown, image = false): value is string {
  if (typeof value !== 'string' || value.length > 2048 || /^(javascript|data|vbscript):/i.test(value)) return false;
  if (/^https?:\/\//i.test(value)) return image ? /^https:\/\/[^\s]+$/i.test(value) : /^https?:\/\/[^\s]+$/i.test(value);
  if (/^(mailto:|tel:)/i.test(value)) return !/\s/.test(value) && value.length > value.indexOf(':') + 1;
  return image ? /^(\/(?!\/))[^\s]*$/i.test(value) : /^(\/(?!\/)|#)[^\s]*$/i.test(value);
}

/** Convert supported YouTube share/watch/embed URLs to a single privacy-enhanced embed URL. */
export function normalizeYouTubeEmbedUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:') return null;
    const host = url.hostname.toLowerCase().replace(/^(www\.|m\.)/, '');
    let id = '';
    if (host === 'youtu.be') id = url.pathname.split('/').filter(Boolean)[0] || '';
    else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts[0] === 'watch') id = url.searchParams.get('v') || '';
      else if (parts[0] === 'embed' || parts[0] === 'shorts' || parts[0] === 'live') id = parts[1] || '';
    }
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  } catch {
    return null;
  }
}

export function isValidArticleBody(value: unknown): value is ArticleBodyBlock[] {
  const validRun = (run: unknown) => {
    if (!run || typeof run !== 'object') return false;
    const record = run as Record<string, unknown>;
    if (typeof record.text !== 'string' || record.text.length > 10000) return false;
    for (const key of ['bold', 'italic', 'underline', 'strike']) if (record[key] !== undefined && typeof record[key] !== 'boolean') return false;
    if (record.color !== undefined && (typeof record.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(record.color))) return false;
    if (record.fontSize !== undefined && !ARTICLE_FONT_SIZES.includes(record.fontSize as typeof ARTICLE_FONT_SIZES[number])) return false;
    if (record.fontFamily !== undefined && !ARTICLE_FONT_FAMILIES.includes(record.fontFamily as typeof ARTICLE_FONT_FAMILIES[number])) return false;
    if (record.href !== undefined && !isSafeContentUrl(record.href)) return false;
    return true;
  };
  return Array.isArray(value) && value.length <= 100 && value.every((block: unknown) => {
    if (!block || typeof block !== 'object') return false;
    const record = block as Record<string, unknown>;
    const type = record.type;
    if (!['heading', 'paragraph', 'list', 'quote', 'link', 'image', 'video'].includes(String(type)) || typeof record.text !== 'string' || record.text.length > 10000) return false;
    if (record.textAlign !== undefined && !['left', 'center', 'right', 'justify'].includes(String(record.textAlign))) return false;
    if (record.content !== undefined && (!Array.isArray(record.content) || record.content.length > 500 || !record.content.every(validRun))) return false;
    if (type === 'heading' && record.level !== undefined && record.level !== 2 && record.level !== 3) return false;
    if (type === 'list') {
      if (!Array.isArray(record.items) || record.items.length > 100 || !record.items.every((item) => typeof item === 'string' && item.length <= 1000)) return false;
      if (record.itemContent !== undefined && (!Array.isArray(record.itemContent) || record.itemContent.length !== record.items.length || !record.itemContent.every((runs) => Array.isArray(runs) && runs.length <= 100 && runs.every(validRun)))) return false;
      return record.ordered === undefined || typeof record.ordered === 'boolean';
    }
    if (type === 'link') return isSafeContentUrl(record.url);
    if (type === 'image') return isSafeContentUrl(record.url, true) && (record.alt === undefined || (typeof record.alt === 'string' && record.alt.length <= 160));
    if (type === 'video') {
      if (record.videoKind === 'youtube') return normalizeYouTubeEmbedUrl(record.url) !== null;
      return record.videoKind === 'upload' && isSafeContentUrl(record.url, true);
    }
    return true;
  });
}

/** A published article must have at least one validated body block. */
export function isPublishableArticleBody(value: unknown): value is ArticleBodyBlock[] {
  return isValidArticleBody(value) && value.length > 0;
}

/**
 * Count visible article text for editorial quality guidance.
 * Media blocks contribute their optional captions, while whitespace is not
 * counted. This is a warning metric only; it must not rewrite or reject
 * content supplied by the store.
 */
export function articleBodyTextLength(value: unknown): number {
  if (!Array.isArray(value)) return 0;
  const textOfRuns = (runs: unknown) => Array.isArray(runs)
    ? runs.filter((run): run is Record<string, unknown> => Boolean(run) && typeof run === 'object')
      .map((run) => typeof run.text === 'string' ? run.text : '').join('')
    : '';
  const textOfBlock = (block: unknown) => {
    if (!block || typeof block !== 'object') return '';
    const record = block as Record<string, unknown>;
    if (record.type === 'list') {
      return Array.isArray(record.itemContent)
        ? record.itemContent.map(textOfRuns).join('')
        : Array.isArray(record.items) ? record.items.filter((item): item is string => typeof item === 'string').join('') : '';
    }
    const richText = textOfRuns(record.content);
    return richText || (typeof record.text === 'string' ? record.text : '');
  };
  return value.map(textOfBlock).join('').replace(/\s+/gu, '').length;
}

export function isValidBenefits(value: unknown): value is SiteBenefit[] {
  return Array.isArray(value) && value.length <= 4 && value.every((item: unknown) => {
    if (!item || typeof item !== 'object') return false;
    const record = item as Record<string, unknown>;
    return typeof record.title === 'string' && record.title.length <= 120 && typeof record.caption === 'string' && record.caption.length <= 240;
  });
}

export interface SiteSettings {
  brandName: string;
  tagline: string;
  logoUrl: string;
  phone: string;
  lineId: string;
  lineUrl: string;
  address: string;
  businessHours: string;
  mapEmbedUrl: string;
  social: { line?: string; instagram?: string; facebook?: string; youtube?: string };
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  heroBackgroundUrl: string;
  servicesTitle: string;
  servicesSubtitle: string;
  servicesNote: string;
  servicesBackgroundUrl: string;
  pricingTitle: string;
  pricingSubtitle: string;
  pricingBackgroundUrl: string;
  newsTitle: string;
  newsSubtitle: string;
  newsBackgroundUrl: string;
  blogTitle: string;
  blogSubtitle: string;
  blogBackgroundUrl: string;
  contactTitle: string;
  contactLead: string;
  contactBackgroundUrl: string;
  benefits: SiteBenefit[];
  pricingBenefits: SiteBenefit[];
  privacyText: string;
  termsText: string;
  seoTitle: string;
  seoDescription: string;
  ogImageUrl: string;
  editorialTeamName?: string;
  editorialBio?: string;
  editorialPolicy?: string;
}

export interface Service {
  id: string;
  slug: string;
  /** Retired URL segments that permanently redirect to the current slug. */
  previousSlugs?: string[];
  name: string;
  summary: string;
  description: string;
  imageUrl: string;
  /** Descriptive alternative text for the service image. */
  imageAlt?: string;
  /** Optional search title; the public page falls back to name + brand. */
  seoTitle?: string;
  /** Optional search description; the public page falls back to service content. */
  seoDescription?: string;
  /** Optional confirmed treatment flow shown on the public detail page. */
  process?: string;
  /** Optional confirmed suitable scenarios shown on the public detail page. */
  suitableFor?: string;
  /** Optional confirmed precautions shown on the public detail page. */
  precautions?: string;
  /** Optional frequently asked questions shown on the public detail page. */
  faq?: string;
  icon: 'lotus' | 'oil' | 'stone' | 'foot' | 'flower';
  durationMinutes?: number;
  price?: number;
  priceLabel?: string;
  sortOrder: number;
  isVisible: boolean;
  /** Monotonic server version used for optimistic concurrency checks. */
  version?: number;
  /** Date when the substantive service content was last changed. */
  contentUpdatedAt?: string;
  updatedAt?: string;
}

export type PricingCategory = '局部舒壓' | '足部服務' | '全身與精油按摩' | '組合方案' | '刮痧與拔罐';

export interface PricingPlan {
  id: string;
  name: string;
  summary: string;
  description: string;
  category: PricingCategory;
  durationMinutes?: number | null;
  durationNote?: string;
  price: number;
  relatedServiceSlugs?: string[];
  imageUrl?: string;
  imageAlt?: string;
  isVisible: boolean;
  showOnHome: boolean;
  isFeatured: boolean;
  sortOrder: number;
  homeSortOrder: number;
  version?: number;
  updatedAt?: string;
}

export interface Article {
  id: string;
  slug: string;
  /** Retired URL segments that permanently redirect to the current slug. */
  previousSlugs?: string[];
  type: ArticleType;
  category: string;
  title: string;
  excerpt: string;
  seoTitle?: string;
  seoDescription?: string;
  coverUrl: string;
  /** Descriptive alternative text for the article cover. */
  coverAlt?: string;
  sources?: ArticleSource[];
  /** Date when the substantive body was last reviewed or changed. */
  contentUpdatedAt?: string;
  /** Public author label; use the configured editorial team when omitted. */
  authorName?: string;
  body: ArticleBodyBlock[];
  publishedAt: string;
  /** ISO-8601 instant when a scheduled article should become public. */
  scheduledAt?: string | null;
  status: ContentStatus;
  /** Monotonic server version used for optimistic concurrency checks. */
  version?: number;
  updatedAt?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  email?: string;
  message: string;
  status: 'unread' | 'handled';
  note?: string;
  createdAt: string;
}

export interface MediaAsset {
  id: string;
  name: string;
  url: string;
  alt: string;
  mimeType: string;
  size: number;
  /** Cloud Storage object path, when the asset is persisted remotely. */
  storagePath?: string;
  /** Dimensions captured at upload time for layout and media QA. */
  width?: number;
  height?: number;
  createdAt: string;
}

export { fixtureArticles, fixtureCategories, fixtureMedia, fixtureMessages, fixturePricingPlans, fixtureServices, fixtureSettings } from './fixtures';
