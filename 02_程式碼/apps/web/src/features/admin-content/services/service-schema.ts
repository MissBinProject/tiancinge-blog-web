import { isPublicSlug, isSafeContentUrl, type Service } from '@tian-xin-ge/contracts';

export const SERVICE_ICONS: Service['icon'][] = ['lotus', 'oil', 'stone', 'foot', 'flower'];

export function validateServiceInput(value: Record<string, unknown>): string | null {
  const name = typeof value.name === 'string' ? value.name.trim() : '';
  const summary = typeof value.summary === 'string' ? value.summary.trim() : '';
  const description = typeof value.description === 'string' ? value.description.trim() : '';
  const imageUrl = typeof value.imageUrl === 'string' ? value.imageUrl.trim() : '';
  const imageAlt = typeof value.imageAlt === 'string' ? value.imageAlt.trim() : '';
  const seoTitle = typeof value.seoTitle === 'string' ? value.seoTitle.trim() : '';
  const seoDescription = typeof value.seoDescription === 'string' ? value.seoDescription.trim() : '';
  const process = typeof value.process === 'string' ? value.process.trim() : '';
  const suitableFor = typeof value.suitableFor === 'string' ? value.suitableFor.trim() : '';
  const precautions = typeof value.precautions === 'string' ? value.precautions.trim() : '';
  const faq = typeof value.faq === 'string' ? value.faq.trim() : '';
  const icon = value.icon;
  const duration = value.durationMinutes;
  const price = value.price;
  const priceLabel = value.priceLabel;
  if (value.slug != null && !isPublicSlug(typeof value.slug === 'string' ? value.slug.trim().toLowerCase() : value.slug)) return '服務網址只能使用英文小寫、數字與連字號，最多 80 字';
  if (!name || name.length > 120 || summary.length > 240 || description.length > 2_000 || imageAlt.length > 160 || seoTitle.length > 160 || seoDescription.length > 300 || process.length > 2_000 || suitableFor.length > 2_000 || precautions.length > 2_000 || faq.length > 2_000) return '服務名稱、摘要、介紹、流程、適用情境、注意事項、FAQ、SEO 欄位或圖片替代文字格式不正確';
  if (!isSafeContentUrl(imageUrl, true)) return '圖片網址必須是 https:// 或站內素材路徑';
  if (!SERVICE_ICONS.includes(icon as Service['icon'])) return '服務圖示格式不正確';
  if (duration != null && (!Number.isInteger(duration) || Number(duration) < 0 || Number(duration) > 1_440)) return '療程分鐘格式不正確';
  if (price != null && (!Number.isInteger(price) || Number(price) < 0 || Number(price) > 10_000_000)) return '價格格式不正確';
  if (priceLabel != null && (typeof priceLabel !== 'string' || priceLabel.length > 80 || price != null)) return '價格顯示格式不正確';
  return null;
}

/** Compare only fields that change the public service detail page. */
export function serviceContentChanged(current: Record<string, unknown>, next: Record<string, unknown>) {
  const normalize = (value: Record<string, unknown>) => JSON.stringify({
    name: value.name,
    summary: value.summary,
    description: value.description,
    imageUrl: value.imageUrl ?? value.image_url,
    imageAlt: value.imageAlt ?? value.image_alt,
    seoTitle: value.seoTitle ?? value.seo_title,
    seoDescription: value.seoDescription ?? value.seo_description,
    process: value.process,
    suitableFor: value.suitableFor ?? value.suitable_for,
    precautions: value.precautions,
    faq: value.faq,
    icon: value.icon,
    durationMinutes: value.durationMinutes ?? value.duration_minutes,
    price: value.price,
    priceLabel: value.priceLabel ?? value.price_label,
  });
  return normalize(current) !== normalize(next);
}

export function servicePayload(value: Record<string, unknown>, slug: string, options: { contentUpdatedAt?: Date | string | null } = {}) {
  const now = new Date();
  const hasContentDate = Object.prototype.hasOwnProperty.call(options, 'contentUpdatedAt');
  const contentUpdatedAt = hasContentDate ? options.contentUpdatedAt : now;
  return {
    slug,
    name: String(value.name).trim(),
    summary: String(value.summary ?? '').trim(),
    description: String(value.description ?? '').trim(),
    imageUrl: String(value.imageUrl ?? '').trim(),
    imageAlt: String(value.imageAlt ?? '').trim().slice(0, 160),
    seoTitle: String(value.seoTitle ?? value.seo_title ?? '').trim().slice(0, 160),
    seoDescription: String(value.seoDescription ?? value.seo_description ?? '').trim().slice(0, 300),
    process: String(value.process ?? '').trim().slice(0, 2_000),
    suitableFor: String(value.suitableFor ?? value.suitable_for ?? '').trim().slice(0, 2_000),
    precautions: String(value.precautions ?? '').trim().slice(0, 2_000),
    faq: String(value.faq ?? '').trim().slice(0, 2_000),
    icon: value.icon,
    durationMinutes: value.durationMinutes == null ? null : Number(value.durationMinutes),
    price: value.price == null || value.price === '' ? null : Number(value.price),
    priceLabel: value.priceLabel == null || value.priceLabel === '' ? null : String(value.priceLabel).trim(),
    sortOrder: Number.isInteger(value.sortOrder) ? Number(value.sortOrder) : 0,
    isVisible: value.isVisible === true,
    ...(contentUpdatedAt ? { contentUpdatedAt } : {}),
    updatedAt: now,
  };
}
