import { test } from 'node:test';
import assert from 'node:assert/strict';
import { publishSitemap, publishStaticSite, digest } from '../src/hosting.mjs';
import { robots } from '../src/document.mjs';

const xml = '<urlset></urlset>';
function fixture({ fail, conflict, hash, sequence = '0' } = {}) {
  const calls = [];
  let reads = 0;
  const live = { name: 'sites/demo/versions/old', status: 'FINALIZED', labels: { 'web-sequence': sequence, ...(hash ? { 'sitemap-digest': hash } : {}) }, config: { rewrites: [{ glob: '**', run: { serviceId: 'web' } }], headers: [{ glob: '**', headers: { 'X-Test': 'preserve' } }] } };
  const api = async (path, options = {}) => {
    calls.push({ path, ...options });
    if (fail && path.includes(fail)) throw new Error('Injected failure');
    if (path.endsWith('/channels/live')) return { release: { name: conflict && ++reads > 1 ? 'changed' : 'original', version: live } };
    if (path === live.name || path.endsWith('/candidate')) return { ...live, name: path };
    if (path.endsWith(':clone')) return { done: true, response: { name: 'sites/demo/versions/new' } };
    if (path.endsWith(':populateFiles')) return { uploadRequiredHashes: Object.values(options.body.files), uploadUrl: 'https://upload-firebasehosting.googleapis.com/upload' };
    if (path.includes('/releases?')) return { name: 'new-release' };
    return {};
  };
  return { api, calls, live };
}
test('clones live assets, replaces only two files, preserves routes/headers and releases last', async () => {
  const f = fixture();
  const result = await publishSitemap({ api: f.api, site: 'demo', xml });
  assert.equal(result.status, 'published');
  assert.equal(f.calls.find((c) => c.path.endsWith(':clone')).body.sourceVersion, f.live.name);
  assert.deepEqual(Object.keys(f.calls.find((c) => c.path.endsWith(':populateFiles')).body.files), ['/sitemap.xml', '/robots.txt']);
  const config = f.calls.find((c) => c.method === 'PATCH').body.config;
  assert.deepEqual(config.rewrites, f.live.config.rewrites);
  assert.deepEqual(config.headers[0], f.live.config.headers[0]);
  assert.match(f.calls.at(-1).path, /\/releases\?/);
});
test('clone/upload/finalize failures and concurrent release never publish a partial version', async () => {
  for (const fail of [':clone', ':populateFiles', 'upload-firebasehosting', '?updateMask']) {
    const f = fixture({ fail });
    await assert.rejects(publishSitemap({ api: f.api, site: 'demo', xml }), /Injected failure/);
    assert.ok(!f.calls.some((c) => c.path.includes('/releases?')));
  }
  const f = fixture({ conflict: true });
  await assert.rejects(publishSitemap({ api: f.api, site: 'demo', xml }), /Live release changed/);
  assert.ok(!f.calls.some((c) => c.path.includes('/releases?')));
});
test('unchanged content and stale full deployments do not deploy', async () => {
  const f = fixture({ hash: digest(xml + robots) });
  assert.equal((await publishSitemap({ api: f.api, site: 'demo', xml })).status, 'unchanged');
  assert.equal(f.calls.length, 2);
  const g = fixture({ sequence: '8' });
  assert.equal((await publishSitemap({ api: g.api, site: 'demo', xml, candidateVersion: 'sites/demo/versions/candidate', sequence: 7 })).status, 'superseded');
});
test('full deploy uses candidate assets and advances sequence; refresh retains it', async () => {
  const f = fixture({ sequence: '8' });
  await publishSitemap({ api: f.api, site: 'demo', xml, candidateVersion: 'sites/demo/versions/candidate', sequence: 9 });
  assert.equal(f.calls.find((c) => c.path.endsWith(':clone')).body.sourceVersion, 'sites/demo/versions/candidate');
  assert.equal(f.calls.find((c) => c.method === 'PATCH').body.labels['web-sequence'], '9');
  const g = fixture({ sequence: '9' });
  await publishSitemap({ api: g.api, site: 'demo', xml });
  assert.equal(g.calls.find((c) => c.method === 'PATCH').body.labels['web-sequence'], '9');
});
test('static release clones a validated candidate without replacing its sitemap files', async () => {
  const f = fixture({ sequence: '3' });
  const result = await publishStaticSite({ api: f.api, site: 'demo', candidateVersion: 'sites/demo/versions/candidate', snapshotDigest: 'a'.repeat(64), sequence: 4 });
  assert.equal(result.status, 'published');
  assert.equal(f.calls.find((c) => c.path.endsWith(':clone')).body.sourceVersion, 'sites/demo/versions/candidate');
  assert.equal(f.calls.some((c) => c.path.endsWith(':populateFiles')), false);
  const patch = f.calls.find((c) => c.method === 'PATCH').body;
  assert.equal(patch.labels['render-mode'], 'static');
  assert.equal(patch.labels['snapshot-digest'], 'a'.repeat(64));
});
