import { describe, expect, it } from 'vitest';
import { serviceDetailSections } from './service-detail';

describe('服務詳情區塊', () => {
  it('只輸出有店家確認內容的欄位，並保留原文', () => {
    expect(serviceDetailSections({ process: '  先確認需求，再開始療程。 ', suitableFor: '', precautions: undefined, faq: 'Q：需要預約嗎？ A：建議提前預約。' })).toEqual([
      { title: '服務流程', text: '  先確認需求，再開始療程。 ' },
      { title: '常見問題', text: 'Q：需要預約嗎？ A：建議提前預約。' },
    ]);
  });

  it('所有欄位空白時不輸出區塊', () => {
    expect(serviceDetailSections({ process: '  ', suitableFor: undefined, precautions: '', faq: undefined })).toEqual([]);
  });
});
