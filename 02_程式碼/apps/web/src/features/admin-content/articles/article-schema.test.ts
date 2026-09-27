import { describe, expect, it } from 'vitest';
import { articleContentChanged, articlePayload, validateArticleInput } from './article-schema';

const base = { title: '標題', excerpt: '摘要', body: [{ type: 'paragraph', text: '正文' }], coverUrl: '/assets/a.webp', coverAlt: '封面', sources: [] };

describe('文章實質內容日期判定', () => {
  it('只改 SEO 欄位不視為內容更新', () => {
    expect(articleContentChanged(base, { ...base, seoTitle: '新的 SEO 標題' })).toBe(false);
  });

  it('改正文、封面或來源會視為內容更新', () => {
    expect(articleContentChanged(base, { ...base, body: [{ type: 'paragraph', text: '新正文' }] })).toBe(true);
    expect(articleContentChanged(base, { ...base, coverAlt: '新的封面描述' })).toBe(true);
    expect(articleContentChanged(base, { ...base, authorName: '天心閣編輯團隊' })).toBe(true);
    expect(articleContentChanged(base, { ...base, sources: [{ title: '來源', url: 'https://example.com' }] })).toBe(true);
  });

  it('payload 不接受客戶端任意 contentUpdatedAt', () => {
    expect(articlePayload({ ...base, type: 'blog', status: 'draft', contentUpdatedAt: '1900-01-01' }, 'abc1234567')).not.toHaveProperty('contentUpdatedAt');
  });

  it('保留已驗證的作者欄位並限制長度', () => {
    expect(articlePayload({ ...base, type: 'blog', status: 'draft', authorName: '  天心閣編輯團隊  ' }, 'abc1234567').authorName).toBe('天心閣編輯團隊');
    expect(articlePayload({ ...base, type: 'blog', status: 'draft', authorName: 'x'.repeat(200) }, 'abc1234567').authorName).toHaveLength(160);
  });

  it('排程文章需要未來的 ISO 發布時間與可發布正文', () => {
    const scheduled = { ...base, type: 'blog', status: 'scheduled', category: '指南', scheduledAt: '2999-09-29T02:00:00.000Z' };
    expect(validateArticleInput(scheduled)).toBeNull();
    expect(validateArticleInput({ ...scheduled, scheduledAt: '2020-01-01T00:00:00.000Z' })).toBe('排程發布時間必須晚於目前時間');
    expect(validateArticleInput({ ...scheduled, body: [] })).toBe('文章必須先提供正文內容才能發布或排程');
    expect(articlePayload(scheduled, 'abc1234567').scheduledAt).toBe(scheduled.scheduledAt);
  });

  it('允許安全的自訂網址並拒絕不安全格式', () => {
    const article = { ...base, type: 'blog', status: 'draft', category: '指南', slug: 'foot-massage-guide' };
    expect(validateArticleInput(article)).toBeNull();
    expect(validateArticleInput({ ...article, slug: '../admin' })).toBe('文章網址只能使用英文小寫、數字與連字號，最多 80 字');
  });
});
