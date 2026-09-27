import { isSafeContentUrl, isValidBenefits } from '@tian-xin-ge/contracts';

export const SETTINGS_KEYS = ['brandName', 'phone', 'line', 'address', 'hours', 'mapEmbedUrl', 'instagram', 'facebook', 'youtube', 'logoUrl', 'heroTitle', 'heroSubtitle', 'tagline', 'heroDescription', 'heroBackgroundUrl', 'servicesTitle', 'servicesSubtitle', 'servicesNote', 'servicesBackgroundUrl', 'pricingTitle', 'pricingSubtitle', 'pricingBackgroundUrl', 'newsTitle', 'newsSubtitle', 'newsBackgroundUrl', 'blogTitle', 'blogSubtitle', 'blogBackgroundUrl', 'contactTitle', 'contactLead', 'contactBackgroundUrl', 'benefits', 'pricingBenefits', 'privacy', 'terms', 'seoTitle', 'seoDescription', 'ogImageUrl', 'editorialTeamName', 'editorialBio', 'editorialPolicy'] as const;

export function validateSettingsPatch(value: Record<string, unknown>): string | null {
  const maxLengths: Partial<Record<(typeof SETTINGS_KEYS)[number], number>> = { editorialTeamName: 120, editorialBio: 3_000, editorialPolicy: 3_000, seoTitle: 160, seoDescription: 300 };
  for (const key of Object.keys(value)) if (!SETTINGS_KEYS.includes(key as (typeof SETTINGS_KEYS)[number])) return `不允許修改設定欄位：${key}`;
  for (const key of SETTINGS_KEYS) {
    const item = value[key]; if (item == null) continue;
    if (key === 'benefits' || key === 'pricingBenefits') { if (!isValidBenefits(item)) return '特色列格式不正確'; continue; }
    if (typeof item !== 'string' || item.length > (maxLengths[key] || 4_000)) return '設定欄位格式不正確';
    if ((key === 'editorialTeamName' || key === 'editorialBio' || key === 'editorialPolicy') && /<[^>]*>|(?:javascript|data|vbscript):/i.test(item)) return '編輯團隊欄位不可包含 HTML 或 script 內容';
    if (key.endsWith('BackgroundUrl') || key === 'logoUrl' || key === 'ogImageUrl') { if (item && !isSafeContentUrl(item, true)) return '圖片網址不安全'; }
    if (key === 'mapEmbedUrl' && item && !/^https:\/\/[^\s]+$/i.test(item)) return '地圖網址不安全';
  }
  return null;
}
