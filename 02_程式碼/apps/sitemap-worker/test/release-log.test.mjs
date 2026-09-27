import { test } from 'node:test';
import assert from 'node:assert/strict';
import { releaseLogFromResult } from '../src/release-log.mjs';

test('records a completed automatic Hosting publication', () => {
  const timestamp = { server: true };
  const record = releaseLogFromResult({
    status: 'published', version: 'sites/demo/versions/version-7', release: 'sites/demo/releases/release-7', sequence: 7,
  }, { mode: 'static', count: 18, sequence: 7 }, timestamp);
  assert.equal(record.id, 'hosting-version-7');
  assert.deepEqual(record.data, {
    publishedAt: timestamp, source: 'automatic', status: 'published', mode: 'static', count: 18, sequence: 7,
    version: 'sites/demo/versions/version-7', release: 'sites/demo/releases/release-7',
  });
});

test('recovers the same completed sequence on a queue retry without logging stale work', () => {
  assert.ok(releaseLogFromResult({ status: 'superseded', version: 'sites/demo/versions/live', sequence: 9 }, { mode: 'static', count: 20, sequence: 9 }, new Date()));
  assert.equal(releaseLogFromResult({ status: 'superseded', version: 'sites/demo/versions/live', sequence: 10 }, { mode: 'static', count: 20, sequence: 9 }, new Date()), null);
  assert.equal(releaseLogFromResult({ status: 'unchanged', version: 'sites/demo/versions/live', sequence: 9 }, { mode: 'sitemap', count: 20, sequence: 9 }, new Date()), null);
});
