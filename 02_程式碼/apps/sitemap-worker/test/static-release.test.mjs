import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prepareStaticRelease } from '../../../scripts/static-release.mjs';

const source = { services: [], articles: [], categories: [], settings: {} };
const origin = 'https://tiancinge-web.web.app';
const html = (path) => `<!doctype html><html><head><title>標題</title><meta name="description" content="說明"><link rel="canonical" href="${origin}${path}"></head><body><main>內容</main></body></html>`;
test('writes sitemap and robots only after every indexable HTML artifact validates', async () => {
  const root = await mkdtemp(join(tmpdir(), 'static-release-'));
  try {
    for (const path of ['index.html', 'services.html', 'news.html', 'blog.html', 'privacy.html', 'terms.html']) {
      const route = path === 'index.html' ? '/' : `/${path.replace('.html', '')}`;
      await writeFile(join(root, path), html(route));
    }
    const result = await prepareStaticRelease(root, source, new Date('2026-02-01'));
    assert.equal(result.urls.length, 4);
    assert.deepEqual((await readFile(join(root, 'sitemap-diagnostic.txt'), 'utf8')).trim().split('\n'), result.urls.map(({ url }) => url));
    assert.match(await readFile(join(root, 'sitemap.xml'), 'utf8'), /<urlset/);
    const robotsText = await readFile(join(root, 'robots.txt'), 'utf8');
    assert.match(robotsText, /Sitemap:/);
    assert.match(robotsText, /Disallow: \/search/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
test('refuses to publish when an indexable file has the wrong canonical', async () => {
  const root = await mkdtemp(join(tmpdir(), 'static-release-'));
  try {
    for (const path of ['index.html', 'services.html', 'news.html', 'blog.html', 'privacy.html', 'terms.html']) await writeFile(join(root, path), html('/wrong'));
    await assert.rejects(prepareStaticRelease(root, source), /Canonical mismatch/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
