import { describe, expect, it } from 'vitest';
import { articleBodyTextLength } from '@tian-xin-ge/contracts';

describe('文章內容品質字數計算', () => {
  it('計算一般段落、標題與清單的可見文字，不計空白', () => {
    expect(articleBodyTextLength([
      { type: 'heading', text: '  SEO 標題  ' },
      { type: 'paragraph', text: '第一段 文字' },
      { type: 'list', text: '', items: ['清單 一', '清單 二'] },
    ])).toBe(16);
  });

  it('使用富文字 runs，並保留圖片與影片說明文字', () => {
    expect(articleBodyTextLength([
      { type: 'paragraph', text: '', content: [{ text: '圖文' }, { text: '內容' }] },
      { type: 'image', text: '按摩環境照片', url: '/assets/photo.webp' },
      { type: 'video', text: '體驗介紹影片', url: '/assets/video.mp4', videoKind: 'upload' },
    ])).toBe(16);
  });

  it('非陣列或無文字內容回傳零', () => {
    expect(articleBodyTextLength(null)).toBe(0);
    expect(articleBodyTextLength([{ type: 'image', text: '', url: '/assets/photo.webp' }])).toBe(0);
  });
});
