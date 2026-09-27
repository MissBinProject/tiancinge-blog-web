import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enqueue, refreshTask } from '../src/queue.mjs';
test('events in one minute share a task scheduled within sixty seconds', () => {
  assert.deepEqual(refreshTask(60001), refreshTask(119999));
  assert.notEqual(refreshTask(120000).id, refreshTask(119999).id);
  assert.equal(Date.parse(refreshTask(60001).scheduleTime), 120000);
});
test('deduplication is accepted; actual queue failure propagates for retry', async () => {
  const input = { project: 'demo', region: 'asia-east1', queue: 'sitemap-publish', workerUrl: 'https://example.run.app', invoker: 'worker@example.com', id: 'refresh-1' };
  assert.equal((await enqueue({ ...input, api: async () => { throw Object.assign(new Error(), { status: 409 }); } })).coalesced, true);
  await assert.rejects(enqueue({ ...input, api: async () => { throw Object.assign(new Error('Unavailable'), { status: 503 }); } }), /Unavailable/);
});
