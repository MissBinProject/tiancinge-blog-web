import { describe, expect, it } from 'vitest';
import { validateCategoryInput } from './category-schema';

describe('分類 SEO 欄位驗證', () => {
  it('接受選填 SEO 欄位', () => {
    expect(validateCategoryInput({ name: '養生知識', type: 'blog', description: '介紹', seoTitle: '標題', seoDescription: '描述' })).toBeNull();
  });

  it('拒絕 HTML 與 script scheme', () => {
    expect(validateCategoryInput({ name: '分類', type: 'blog', description: '<script>alert(1)</script>' })).toMatch(/不可包含/);
    expect(validateCategoryInput({ name: '分類', type: 'blog', seoDescription: 'javascript:alert(1)' })).toMatch(/不可包含/);
  });
});
