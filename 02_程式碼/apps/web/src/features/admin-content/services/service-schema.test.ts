import { describe, expect, it } from 'vitest';
import { serviceContentChanged, servicePayload, validateServiceInput } from './service-schema';

const base = {
  name: '全身舒壓', summary: '釋放壓力', description: '完整介紹', imageUrl: '/assets/service.webp',
  imageAlt: '全身舒壓', seoTitle: '全身舒壓按摩｜天心閣養生會館', seoDescription: '天心閣全身舒壓按摩服務介紹。', process: '先確認需求，再完成泡腳、按摩與休息。', suitableFor: '適合久坐、久站或運動後放鬆。', precautions: '有特殊病史請先諮詢專業人員。', faq: 'Q：需要預約嗎？A：建議提前預約。', icon: 'lotus', durationMinutes: 60, price: 1500, priceLabel: null,
};

describe('服務實質內容日期判定', () => {
  it('只改排序或可見狀態不改服務正文日期', () => {
    expect(serviceContentChanged(base, { ...base, sortOrder: 3, isVisible: false })).toBe(false);
  });

  it('改服務說明、價格或圖片會更新內容日期', () => {
    expect(serviceContentChanged(base, { ...base, description: '新介紹' })).toBe(true);
    expect(serviceContentChanged(base, { ...base, price: 1800 })).toBe(true);
    expect(serviceContentChanged(base, { ...base, imageAlt: '新的圖片說明' })).toBe(true);
  });

  it('管理員不能透過輸入偽造 contentUpdatedAt', () => {
    const payload = servicePayload({ ...base, contentUpdatedAt: '1900-01-01' }, 'abcdefghij');
    expect(payload.contentUpdatedAt).not.toBe('1900-01-01');
  });

  it('SEO 標題與描述會視為公開內容並保留在 payload', () => {
    expect(serviceContentChanged(base, { ...base, seoDescription: '更新後的搜尋描述' })).toBe(true);
    expect(servicePayload(base, 'abcdefghij')).toMatchObject({ seoTitle: base.seoTitle, seoDescription: base.seoDescription });
  });

  it('服務詳情欄位會視為公開內容並保留在 payload', () => {
    expect(serviceContentChanged(base, { ...base, process: '更新後的服務流程' })).toBe(true);
    expect(servicePayload(base, 'abcdefghij')).toMatchObject({ process: base.process, suitableFor: base.suitableFor, precautions: base.precautions, faq: base.faq });
  });

  it('允許安全的自訂網址並拒絕不安全格式', () => {
    expect(validateServiceInput({ ...base, slug: 'full-body', sortOrder: 1, isVisible: true })).toBeNull();
    expect(validateServiceInput({ ...base, slug: 'Full_Body', sortOrder: 1, isVisible: true })).toBe('服務網址只能使用英文小寫、數字與連字號，最多 80 字');
  });
});
