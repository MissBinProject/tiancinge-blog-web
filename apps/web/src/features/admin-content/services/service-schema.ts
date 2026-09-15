import { isSafeContentUrl, type Service } from '@tian-xin-ge/contracts';

export const SERVICE_ICONS: Service['icon'][] = ['lotus', 'oil', 'stone', 'foot', 'flower'];

export function validateServiceInput(value: Record<string, unknown>): string | null {
  const name = typeof value.name === 'string' ? value.name.trim() : '';
  const summary = typeof value.summary === 'string' ? value.summary.trim() : '';
  const description = typeof value.description === 'string' ? value.description.trim() : '';
  const imageUrl = typeof value.imageUrl === 'string' ? value.imageUrl.trim() : '';
  const icon = value.icon;
  const duration = value.durationMinutes;
  const price = value.price;
  const priceLabel = value.priceLabel;
  if (!name || name.length > 120 || summary.length > 240 || description.length > 2_000) return '服務名稱、摘要或介紹格式不正確';
  if (!isSafeContentUrl(imageUrl, true)) return '圖片網址必須是 https:// 或站內素材路徑';
  if (!SERVICE_ICONS.includes(icon as Service['icon'])) return '服務圖示格式不正確';
  if (duration != null && (!Number.isInteger(duration) || Number(duration) < 0 || Number(duration) > 1_440)) return '療程分鐘格式不正確';
  if (price != null && (!Number.isInteger(price) || Number(price) < 0 || Number(price) > 10_000_000)) return '價格格式不正確';
  if (priceLabel != null && (typeof priceLabel !== 'string' || priceLabel.length > 80 || price != null)) return '價格顯示格式不正確';
  return null;
}

export function servicePayload(value: Record<string, unknown>, slug: string) {
  return {
    slug,
    name: String(value.name).trim(),
    summary: String(value.summary ?? '').trim(),
    description: String(value.description ?? '').trim(),
    imageUrl: String(value.imageUrl ?? '').trim(),
    icon: value.icon,
    durationMinutes: value.durationMinutes == null ? null : Number(value.durationMinutes),
    price: value.price == null || value.price === '' ? null : Number(value.price),
    priceLabel: value.priceLabel == null || value.priceLabel === '' ? null : String(value.priceLabel).trim(),
    sortOrder: Number.isInteger(value.sortOrder) ? Number(value.sortOrder) : 0,
    isVisible: value.isVisible === true,
    updatedAt: new Date(),
  };
}
