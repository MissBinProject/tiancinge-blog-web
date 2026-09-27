import { describe, expect, it } from 'vitest';
import { serviceQualityWarnings } from './service-quality';

const service = {
  id: 's1', slug: '7usx1gzbua', name: '全身舒壓', summary: '釋放壓力',
  description: '短內容', imageUrl: '/assets/service.webp', icon: 'lotus' as const,
  durationMinutes: 60, price: 1500, sortOrder: 1, isVisible: true,
};

describe('服務內容品質提醒', () => {
  it('對已上架且正文過短的服務提出非阻擋提醒', () => {
    expect(serviceQualityWarnings(service)).toEqual([
      '正文約 3 字，建議補充至 120 字以上',
      'SEO 標題尚未填寫（將使用服務名稱）',
      'SEO 描述尚未填寫（將使用服務介紹）',
      '服務流程、適用情境、注意事項與 FAQ 尚未完整填寫',
      '服務圖片替代文字尚未填寫',
    ]);
  });

  it('草稿服務不要求 SEO 文案完整度', () => {
    expect(serviceQualityWarnings({ ...service, isVisible: false })).toEqual([]);
  });

  it('內容達標且有摘要與替代文字時不產生提醒', () => {
    expect(serviceQualityWarnings({
      ...service,
      description: '這是一段已由店家確認的服務介紹。'.repeat(20),
      imageAlt: '全身舒壓療程環境與服務示意圖',
      seoTitle: '全身舒壓按摩｜天心閣養生會館',
      seoDescription: '天心閣全身舒壓按摩服務，提供時間與價格資訊，預約前請確認最新安排。',
      process: '先進行身體狀況確認，再依序完成泡腳、按摩與術後休息。',
      suitableFor: '適合久坐、久站、運動後或近期需要放鬆的成人。',
      precautions: '孕期、急性疼痛或有特殊病史者，請先向專業人員確認。',
      faq: 'Q：需要預約嗎？A：建議事先透過 LINE 預約，以確認時段。',
    })).toEqual([]);
  });
});
