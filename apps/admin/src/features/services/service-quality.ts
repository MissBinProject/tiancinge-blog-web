import type { Service } from '@tian-xin-ge/contracts';

/**
 * SEO/editorial guidance for visible services.
 * These are warnings only: the shop must confirm the actual treatment flow,
 * suitable scenarios and booking conditions before publishing copy.
 */
export function serviceQualityWarnings(service: Service): string[] {
  if (!service.isVisible) return [];
  const warnings: string[] = [];
  const descriptionLength = service.description.replace(/\s+/gu, '').length;
  if (descriptionLength < 120) warnings.push(`正文約 ${descriptionLength} 字，建議補充至 120 字以上`);
  if (!service.summary.trim()) warnings.push('卡片摘要尚未填寫');
  if (!service.seoTitle?.trim()) warnings.push('SEO 標題尚未填寫（將使用服務名稱）');
  if (!service.seoDescription?.trim()) warnings.push('SEO 描述尚未填寫（將使用服務介紹）');
  if (![service.process, service.suitableFor, service.precautions, service.faq].every((value) => value?.trim())) warnings.push('服務流程、適用情境、注意事項與 FAQ 尚未完整填寫');
  if (service.imageUrl && !service.imageAlt?.trim()) warnings.push('服務圖片替代文字尚未填寫');
  return warnings;
}
