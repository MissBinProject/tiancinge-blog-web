import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadSource } from '../src/source.mjs';

function database({ fail, missingSettings = false } = {}) {
  const rows = {
    services: [{ slug: 'abcdefghij', is_visible: true, updated_at: '2026-01-01' }],
    pricing_plans: [],
    articles: [{ slug: 'abcdefghij', status: 'published', type: 'blog', content_updated_at: '2026-01-02' }],
    article_categories: [],
  };
  return {
    collection(name) { return { name, where() { return this; }, doc() { return this; } }; },
    runTransaction(callback, options) {
      assert.equal(options.readOnly, true);
      return callback({ async get(ref) {
        if (ref.name === fail) throw new Error('Source unavailable');
        if (ref.name === 'site_settings') return { exists: !missingSettings, data: () => ({}) };
        return { docs: rows[ref.name].map((row) => ({ data: () => row })) };
      } });
    },
  };
}
test('normalizes legacy fields from a consistent read-only snapshot', async () => {
  const source = await loadSource(database());
  assert.equal(source.services[0].isVisible, true);
  assert.equal(source.services[0].updatedAt, '2026-01-01');
  assert.equal(source.articles[0].contentUpdatedAt, '2026-01-02');
});
test('filters recycled rows before building the public source projection', async () => {
  const source = await loadSource(databaseWithRecycledRows());
  assert.deepEqual(source.services, []);
  assert.deepEqual(source.articles, []);
  assert.deepEqual(source.categories, []);
});

function databaseWithRecycledRows() {
  const db = database();
  const original = db.runTransaction;
  db.runTransaction = (callback, options) => original.call(db, async (transaction) => {
    const source = await transaction.get({ name: 'services' });
    assert.equal(source.docs.length, 1);
    return callback({
      async get(ref) {
        if (ref.name === 'site_settings') return { exists: true, data: () => ({}) };
        if (ref.name === 'services') return { docs: [{ data: () => ({ slug: 'abcdefghij', is_visible: true, deletedAt: '2026-01-01' }) }] };
        if (ref.name === 'articles') return { docs: [{ data: () => ({ slug: 'abcdefghij', status: 'published', type: 'blog', deleted_at: '2026-01-01' }) }] };
        return { docs: [{ data: () => ({ type: 'blog', name: '回收分類', deletedAt: '2026-01-01' }) }] };
      },
    });
  }, options);
  return db;
}
test('any failed collection prevents a partial source result', async () => {
  for (const fail of ['services', 'articles', 'article_categories', 'site_settings']) {
    await assert.rejects(loadSource(database({ fail })), /Source unavailable/);
  }
  await assert.rejects(loadSource(database({ missingSettings: true })), /Missing site settings/);
});
