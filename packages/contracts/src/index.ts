export type ContentStatus = 'draft' | 'published';
export type ArticleType = 'news' | 'blog';
export const ARTICLE_FONT_SIZES = ['14px', '16px', '18px', '20px', '24px', '28px', '32px', '40px'] as const;
export const ARTICLE_FONT_FAMILIES = ['Noto Sans TC', 'Noto Serif TC', 'Arial', 'Georgia'] as const;
export type ArticleTextAlign = 'left' | 'center' | 'right' | 'justify';
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
  type: 'heading' | 'paragraph' | 'list' | 'quote' | 'link' | 'image';
  text: string;
  content?: ArticleTextRun[];
  textAlign?: ArticleTextAlign;
  items?: string[];
  itemContent?: ArticleTextRun[][];
  ordered?: boolean;
  url?: string;
  alt?: string;
};
export type SiteBenefit = { title: string; caption: string };

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

/** Shared URL and structured-body rules used by the admin editor and public mapper. */
export function isSafeContentUrl(value: unknown, image = false): value is string {
  if (typeof value !== 'string' || value.length > 2048 || /^(javascript|data|vbscript):/i.test(value)) return false;
  if (/^https?:\/\//i.test(value)) return image ? /^https:\/\/[^\s]+$/i.test(value) : /^https?:\/\/[^\s]+$/i.test(value);
  if (/^(mailto:|tel:)/i.test(value)) return !/\s/.test(value) && value.length > value.indexOf(':') + 1;
  return image ? /^(\/(?!\/))[^\s]*$/i.test(value) : /^(\/(?!\/)|#)[^\s]*$/i.test(value);
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
    if (!['heading', 'paragraph', 'list', 'quote', 'link', 'image'].includes(String(type)) || typeof record.text !== 'string' || record.text.length > 10000) return false;
    if (record.textAlign !== undefined && !['left', 'center', 'right', 'justify'].includes(String(record.textAlign))) return false;
    if (record.content !== undefined && (!Array.isArray(record.content) || record.content.length > 500 || !record.content.every(validRun))) return false;
    if (type === 'list') {
      if (!Array.isArray(record.items) || record.items.length > 100 || !record.items.every((item) => typeof item === 'string' && item.length <= 1000)) return false;
      if (record.itemContent !== undefined && (!Array.isArray(record.itemContent) || record.itemContent.length !== record.items.length || !record.itemContent.every((runs) => Array.isArray(runs) && runs.length <= 100 && runs.every(validRun)))) return false;
      return record.ordered === undefined || typeof record.ordered === 'boolean';
    }
    if (type === 'link') return isSafeContentUrl(record.url);
    if (type === 'image') return isSafeContentUrl(record.url, true) && (record.alt === undefined || (typeof record.alt === 'string' && record.alt.length <= 160));
    return true;
  });
}

/** A published article must have at least one validated body block. */
export function isPublishableArticleBody(value: unknown): value is ArticleBodyBlock[] {
  return isValidArticleBody(value) && value.length > 0;
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
}

export interface Service {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  imageUrl: string;
  icon: 'lotus' | 'oil' | 'stone' | 'foot' | 'flower';
  durationMinutes?: number;
  price?: number;
  priceLabel?: string;
  sortOrder: number;
  isVisible: boolean;
}

export interface Article {
  id: string;
  slug: string;
  type: ArticleType;
  category: string;
  title: string;
  excerpt: string;
  seoTitle?: string;
  seoDescription?: string;
  coverUrl: string;
  body: ArticleBodyBlock[];
  publishedAt: string;
  status: ContentStatus;
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

export { fixtureArticles, fixtureCategories, fixtureMedia, fixtureMessages, fixtureServices, fixtureSettings } from './fixtures';
