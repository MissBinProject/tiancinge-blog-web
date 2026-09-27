import { isSafeContentUrl, type PricingCategory, type PricingPlan } from '@tian-xin-ge/contracts';

export const PRICING_CATEGORIES: PricingCategory[] = ['局部舒壓', '足部服務', '全身與精油按摩', '組合方案', '刮痧與拔罐'];

export function validatePricingInput(value: Record<string, unknown>): string | null {
  const name = typeof value.name === 'string' ? value.name.trim() : '';
  const summary = typeof value.summary === 'string' ? value.summary.trim() : '';
  const description = typeof value.description === 'string' ? value.description.trim() : '';
  const category = value.category;
  const duration = value.durationMinutes;
  const durationNote = typeof value.durationNote === 'string' ? value.durationNote.trim() : '';
  const price = value.price;
  const imageUrl = typeof value.imageUrl === 'string' ? value.imageUrl.trim() : '';
  const imageAlt = typeof value.imageAlt === 'string' ? value.imageAlt.trim() : '';
  if (!name || name.length > 160 || summary.length > 240 || description.length > 2_000 || durationNote.length > 240 || imageAlt.length > 160) return '價目名稱、摘要、說明、時間備註或圖片替代文字格式不正確';
  if (!PRICING_CATEGORIES.includes(category as PricingCategory)) return '價目分類不正確';
  if (duration != null && duration !== '' && (!Number.isInteger(Number(duration)) || Number(duration) < 0 || Number(duration) > 1_440)) return '服務分鐘數格式不正確';
  if (!Number.isInteger(Number(price)) || Number(price) < 0 || Number(price) > 10_000_000) return '價格格式不正確';
  if (imageUrl && !isSafeContentUrl(imageUrl, true)) return '圖片網址格式不正確';
  if (value.showOnHome === true && (!imageUrl || !imageAlt)) return '顯示於首頁的方案必須提供圖片與替代文字';
  return null;
}

export function pricingPayload(value: Record<string, unknown>, options: { updatedAt?: Date | string } = {}) {
  return {
    name: String(value.name ?? '').trim(), summary: String(value.summary ?? '').trim(), description: String(value.description ?? '').trim(), category: value.category as PricingCategory,
    durationMinutes: value.durationMinutes == null || value.durationMinutes === '' ? null : Number(value.durationMinutes), durationNote: String(value.durationNote ?? '').trim(), price: Number(value.price),
    relatedServiceSlugs: Array.isArray(value.relatedServiceSlugs) ? value.relatedServiceSlugs.filter((item): item is string => typeof item === 'string').slice(0, 10) : [], imageUrl: String(value.imageUrl ?? '').trim(), imageAlt: String(value.imageAlt ?? '').trim().slice(0, 160),
    isVisible: value.isVisible === true, showOnHome: value.showOnHome === true, isFeatured: value.isFeatured === true, sortOrder: Number.isInteger(value.sortOrder) ? Number(value.sortOrder) : 0, homeSortOrder: Number.isInteger(value.homeSortOrder) ? Number(value.homeSortOrder) : 0,
    updatedAt: options.updatedAt || new Date(),
  } satisfies Omit<PricingPlan, 'id' | 'version' | 'updatedAt'> & { updatedAt: Date | string };
}
