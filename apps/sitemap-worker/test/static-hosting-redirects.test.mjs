import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildStaticHostingConfig } from '../../../scripts/static-hosting-config.mjs';

test('builds direct permanent redirects for retired service, news and blog URLs', () => {
  const base = { hosting: [{ target: 'web', redirects: [{ source: '/legacy', destination: '/', type: 301 }] }] };
  const snapshot = {
    services: [{ slug: 'full-body', previousSlugs: ['7usx1gzbua', 'older-full-body'] }],
    articles: [
      { type: 'news', slug: 'new-offer', previousSlugs: ['old-offer'] },
      { type: 'blog', slug: 'massage-guide', previousSlugs: ['old-guide', '../unsafe'] },
    ],
  };
  const redirects = buildStaticHostingConfig(base, snapshot).hosting[0].redirects;
  assert.deepEqual(redirects.find((rule) => rule.source === '/services/7usx1gzbua'), { source: '/services/7usx1gzbua', destination: '/services/full-body', type: 301 });
  assert.deepEqual(redirects.find((rule) => rule.source === '/news/old-offer'), { source: '/news/old-offer', destination: '/news/new-offer', type: 301 });
  assert.deepEqual(redirects.find((rule) => rule.source === '/blog/old-guide'), { source: '/blog/old-guide', destination: '/blog/massage-guide', type: 301 });
  assert.equal(redirects.some((rule) => rule.source.includes('unsafe')), false);
  assert.ok(redirects.some((rule) => rule.source === '/legacy'));
});
