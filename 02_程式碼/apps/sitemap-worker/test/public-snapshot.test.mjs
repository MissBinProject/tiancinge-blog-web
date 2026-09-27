import { test } from 'node:test';
import assert from 'node:assert/strict';
import { projectPublicSnapshot } from '../src/public-snapshot.mjs';

function source() { return { services: [], articles: [], categories: [], settings: { brand_name: '天心閣', phone: '02-1234', address: '台北市' } }; }
test('only projects fields permitted to reach the public artifact', () => {
  const input = source();
  input.services = [{ id: 'service-id', row: { slug: 'full-body', name: '服務', is_visible: true, privateNote: 'never' } }];
  input.articles = [{ id: 'article-id', row: { slug: '1234567890', type: 'blog', status: 'published', title: '文章', body: [], internalNote: 'never', adminId: 'never' } }];
  input.settings.adminPasswordHash = 'never';
  const result = projectPublicSnapshot(input);
  assert.equal(result.services[0].privateNote, undefined);
  assert.equal(result.services[0].slug, 'full-body');
  assert.equal(result.articles[0].internalNote, undefined);
  assert.equal(result.settings.adminPasswordHash, undefined);
  assert.equal(result.articles[0].slug, '1234567890');
  assert.match(result.digest, /^[a-f0-9]{64}$/);
});
test('drafts, scheduled articles, hidden services and malformed public slugs are excluded', () => {
  const input = source();
  input.services = [{ id: 'x', row: { slug: '../bad', is_visible: true } }, { id: 'y', row: { slug: 'abcdefghij', is_visible: false } }];
  input.articles = [{ id: 'x', row: { slug: 'abcdefghij', type: 'news', status: 'draft' } }, { id: 'scheduled', row: { slug: '1234567890', type: 'blog', status: 'scheduled', scheduledAt: '2099-01-01T00:00:00.000Z' } }, { id: 'y', row: { slug: 'Invalid_slug', type: 'blog', status: 'published' } }];
  const result = projectPublicSnapshot(input);
  assert.deepEqual(result.services, []);
  assert.deepEqual(result.articles, []);
});
test('recycled services, articles and categories never enter the public snapshot', () => {
  const input = source();
  input.services = [{ id: 'service-id', row: { slug: 'abcdefghij', is_visible: true, deletedAt: '2026-01-01' } }];
  input.articles = [{ id: 'article-id', row: { slug: '1234567890', type: 'blog', status: 'published', deleted_at: '2026-01-01' } }];
  input.categories = [{ id: 'category-id', row: { type: 'blog', name: '回收分類', deletedAt: '2026-01-01' } }];
  const result = projectPublicSnapshot(input);
  assert.deepEqual(result.services, []);
  assert.deepEqual(result.articles, []);
  assert.deepEqual(result.categories, []);
});
test('drops categories without a matching public article', () => {
  const input = source();
  input.categories = [{ id: 'empty', row: { type: 'blog', name: '空分類' } }];
  assert.deepEqual(projectPublicSnapshot(input).categories, []);
});

test('keeps substantive update dates and service SEO fields in the public snapshot', () => {
  const input = source();
  input.services = [{ id: 'service-id', row: { slug: 'abcdefghij', name: '服務', is_visible: true, seo_title: '服務 SEO 標題', seo_description: '服務 SEO 描述', process: '服務流程', suitable_for: '適用情境', precautions: '注意事項', faq: '常見問題', contentUpdatedAt: '2026-01-20', updatedAt: '2026-01-21' } }];
  input.articles = [{ id: 'article-id', row: { slug: '1234567890', type: 'blog', status: 'published', author_name: '天心閣編輯團隊', contentUpdatedAt: '2026-01-19', updatedAt: '2026-01-21' } }];
  const result = projectPublicSnapshot(input);
  assert.equal(result.services[0].contentUpdatedAt, '2026-01-20T00:00:00.000Z');
  assert.equal(result.services[0].seoTitle, '服務 SEO 標題');
  assert.equal(result.services[0].seoDescription, '服務 SEO 描述');
  assert.equal(result.services[0].process, '服務流程');
  assert.equal(result.services[0].suitableFor, '適用情境');
  assert.equal(result.services[0].precautions, '注意事項');
  assert.equal(result.services[0].faq, '常見問題');
  assert.equal(result.articles[0].contentUpdatedAt, '2026-01-19T00:00:00.000Z');
  assert.equal(result.articles[0].authorName, '天心閣編輯團隊');
});

test('keeps safe custom slugs and redirect history for public content', () => {
  const input = source();
  input.services = [{ id: 'service-id', row: { slug: 'full-body', previousSlugs: ['7usx1gzbua', '../bad'], is_visible: true } }];
  input.articles = [{ id: 'article-id', row: { slug: 'massage-guide', previousSlugs: ['abcdefghij', 'Bad_slug'], type: 'blog', status: 'published', body: [] } }];
  const result = projectPublicSnapshot(input);
  assert.deepEqual(result.services[0].previousSlugs, ['7usx1gzbua']);
  assert.equal(result.articles[0].slug, 'massage-guide');
  assert.deepEqual(result.articles[0].previousSlugs, ['abcdefghij']);
});

test('normalizes social links from both legacy nested and admin flat settings', () => {
  const input = source();
  input.settings.social = { instagram: '#', facebook: 'https://facebook.com/legacy', youtube: '#' };
  input.settings.instagram = 'https://instagram.com/edited';
  const result = projectPublicSnapshot(input);
  assert.deepEqual(result.settings.social, {
    line: '',
    instagram: 'https://instagram.com/edited',
    facebook: 'https://facebook.com/legacy',
    youtube: '#',
  });
});
