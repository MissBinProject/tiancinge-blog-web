import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const root = resolve(fileURLToPath(new URL('../../../', import.meta.url)));

test('static Hosting keeps public pages on Hosting and emits report-only security headers', async () => {
  const config = JSON.parse(await readFile(resolve(root, 'firebase.static.json'), 'utf8'));
  const hosting = config.hosting.find((entry) => entry.target === 'web');
  assert.ok(hosting, 'web static Hosting target is required');
  assert.equal(hosting.rewrites.some((rule) => rule.source === '**'), false, 'public pages must not use a catch-all Cloud Run rewrite');
  assert.deepEqual(
    hosting.redirects?.find((rule) => rule.source === '/services/7usx1gzbua'),
    { source: '/services/7usx1gzbua', destination: '/services/full-body-massage', type: 301 },
    'the retired service URL must preserve search signals with a permanent redirect',
  );
  const allHeaders = hosting.headers.find((rule) => rule.source === '**')?.headers || [];
  const csp = allHeaders.find((header) => header.key === 'Content-Security-Policy-Report-Only')?.value || '';
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /frame-ancestors 'self'/);
});
