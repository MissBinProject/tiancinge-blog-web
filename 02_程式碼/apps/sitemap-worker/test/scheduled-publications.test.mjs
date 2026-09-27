import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isDueScheduledArticle, taipeiDate } from '../src/scheduled-publications.mjs';

test('only due, active scheduled articles are eligible', () => {
  const now = new Date('2026-09-29T02:00:00.000Z');
  assert.equal(isDueScheduledArticle({ status: 'scheduled', scheduledAt: '2026-09-29T02:00:00.000Z' }, now), true);
  assert.equal(isDueScheduledArticle({ status: 'scheduled', scheduledAt: '2026-09-29T02:01:00.000Z' }, now), false);
  assert.equal(isDueScheduledArticle({ status: 'published', scheduledAt: '2026-09-29T01:00:00.000Z' }, now), false);
  assert.equal(isDueScheduledArticle({ status: 'scheduled', scheduledAt: 'invalid' }, now), false);
  assert.equal(isDueScheduledArticle({ status: 'scheduled', scheduledAt: '2026-09-29T01:00:00.000Z', deletedAt: now }, now), false);
});

test('published date follows Asia/Taipei calendar date', () => {
  assert.equal(taipeiDate('2026-09-28T16:30:00.000Z'), '2026-09-29');
});
