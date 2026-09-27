import test from 'node:test';
import assert from 'node:assert/strict';
import { staticBuildRequest } from '../src/static-build.mjs';

test('creates a Cloud Build request with pinned source and preview publication', () => {
  const build = staticBuildRequest({
    source: { bucket: 'private-source', object: 'static/site.tgz', generation: '123' },
    serviceAccount: 'projects/p/serviceAccounts/build@p.iam.gserviceaccount.com',
    workerUrl: 'https://worker.example.run.app',
  });
  assert.equal(build.source.storageSource.generation, '123');
  assert.equal(build.steps.length, 1);
  assert.match(build.steps[0].args[1], /STATIC_STAGE_ONLY="1"/);
  assert.match(build.steps[0].args[1], /SITEMAP_WORKER_URL="https:\/\/worker\.example\.run\.app"/);
  assert.equal(build.options.logging, 'CLOUD_LOGGING_ONLY');
});
