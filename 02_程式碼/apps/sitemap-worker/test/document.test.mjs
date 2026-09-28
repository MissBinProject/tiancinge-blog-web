import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSitemap, isoDate } from '../src/document.mjs';
const source = () => ({ services: [], articles: [], categories: [], settings: {} });
test('only published articles and visible services; ignores unsafe slugs', () => {
  const data = source();
  data.articles = [{ type: 'blog', slug: 'abcdefghij', status: 'published' }, { type: 'news', slug: '1234567890', status: 'draft' }, { type: 'blog', slug: '../private', status: 'published' }];
  data.services = [{ slug: 'full-body', isVisible: true }, { slug: 'hidden-service', isVisible: false }];
  const result = buildSitemap(data);
  assert.equal(result.urls.length, 6);
  assert.ok(result.xml.includes('/blog/abcdefghij'));
  assert.ok(result.xml.includes('/services/full-body'));
  data.articles[0].status = 'draft';
  data.services[0].isVisible = false;
  assert.equal(buildSitemap(data).urls.length, 4);
});
test('category routes never enter the sitemap', () => {
  const data = source();
  data.categories = [{ type: 'blog', name: '生活美學' }];
  data.articles = Array.from({ length: 9 }, (_, index) => ({
    type: 'blog', slug: `abcde${String(index).padStart(5, '0')}`, status: 'published', category: '生活美學',
  }));
  const result = buildSitemap(data);
  assert.ok(result.urls.some(({ url }) => url.endsWith('/blog/page/2')));
  assert.equal(result.urls.some(({ url }) => url.includes('/category/')), false);
});
test('deduplicates and keeps newest actual date; invalid/future dates omitted', () => {
  const data = source();
  data.articles = ['2026-01-01', '2026-01-02'].map((updatedAt) => ({ type: 'news', slug: 'abcdefghij', status: 'published', updatedAt }));
  const result = buildSitemap(data, new Date('2026-02-01'));
  assert.equal(result.urls.length, 5);
  assert.ok(result.xml.includes('<lastmod>2026-01-02</lastmod>'));
  assert.equal(isoDate('2026-09-26T07:05:52.962Z', new Date('2026-09-27')), '2026-09-26');
  assert.doesNotMatch(result.xml, /<lastmod>[^<]*T[^<]*<\/lastmod>/);
  assert.equal(isoDate('invalid'), undefined);
  assert.equal(isoDate('2099-01-01'), undefined);
});
test('missing required data fails instead of publishing a partial document', () => {
  assert.throws(() => buildSitemap({ ...source(), settings: null }));
});
test('deleting the final public article removes its detail URL', () => {
  const data = source();
  data.categories = [{ type: 'blog', name: '生活美學' }];
  data.articles = [{ type: 'blog', slug: 'abcdefghij', status: 'published', category: '生活美學' }];
  assert.equal(buildSitemap(data).urls.length, 5);
  data.articles = [];
  assert.equal(buildSitemap(data).urls.length, 4);
});
test('editorial requires both fields and supports existing snake-case settings', () => {
  const data = source();
  data.settings = { editorial_bio: '作者', editorial_policy: ' ' };
  assert.equal(buildSitemap(data).urls.length, 4);
  data.settings.editorial_policy = '編輯政策';
  assert.equal(buildSitemap(data).urls.length, 5);
  assert.equal(buildSitemap(data).xml, buildSitemap(data, new Date('2099-01-01')).xml);
});
test('adds only generated list pages after the first eight public rows', () => {
  const data = source();
  data.articles = Array.from({ length: 9 }, (_, index) => ({ type: 'blog', slug: `aaaaaaa${String(index).padStart(3, '0')}`, status: 'published', publishedAt: '2026-01-01' }));
  // Keep content codes valid while preserving a predictable ninth page route.
  data.articles = data.articles.map((article, index) => ({ ...article, slug: `abcde${String(index).padStart(5, '0')}` }));
  const result = buildSitemap(data, new Date('2026-02-01'));
  assert.ok(result.urls.some(({ url }) => url.endsWith('/blog/page/2')));
  assert.equal(result.urls.filter(({ url }) => url.includes('/blog/page/')).length, 1);
});

test('uses substantive service date and latest row date for list pages', () => {
  const data = source();
  data.services = [{ slug: '1234567890', isVisible: true, contentUpdatedAt: '2026-01-20', updatedAt: '2026-01-21' }];
  data.articles = Array.from({ length: 9 }, (_, index) => ({
    type: 'blog', slug: `abcde${String(index).padStart(5, '0')}`, status: 'published',
    publishedAt: '2026-01-01', contentUpdatedAt: index === 8 ? '2026-01-25' : '2026-01-02',
  }));
  const result = buildSitemap(data, new Date('2026-02-01'));
  const service = result.urls.find(({ url }) => url.endsWith('/services/1234567890'));
  const page = result.urls.find(({ url }) => url.endsWith('/blog/page/2'));
  assert.match(service.lastmod, /2026-01-20/);
  assert.match(page.lastmod, /2026-01-25/);
});

test('uses the latest real content date for service, news and blog lists', () => {
  const data = source();
  data.services = [{ slug: '1234567890', isVisible: true, contentUpdatedAt: '2026-01-20' }];
  data.categories = [{ type: 'news', name: '活動訊息' }];
  data.articles = [
    { type: 'news', slug: 'abcdefghij', status: 'published', category: '活動訊息', publishedAt: '2026-01-01', contentUpdatedAt: '2026-01-15' },
    { type: 'blog', slug: '1234567890', status: 'published', publishedAt: '2026-01-18', updatedAt: '2026-01-19' },
  ];
  const result = buildSitemap(data, new Date('2026-02-01'));
  const lastmod = (path) => result.urls.find(({ url }) => url.endsWith(path))?.lastmod;
  assert.match(lastmod('/services'), /2026-01-20/);
  assert.match(lastmod('/news'), /2026-01-15/);
  assert.match(lastmod('/blog'), /2026-01-19/);
  assert.equal(result.urls.some(({ url }) => url.includes('/category/')), false);
});
