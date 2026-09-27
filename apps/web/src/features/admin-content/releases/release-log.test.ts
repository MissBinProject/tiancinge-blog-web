import { describe, expect, it } from 'vitest';
import { adminReleaseLog } from './release-log';

describe('adminReleaseLog', () => {
  it('returns only the safe fields used by the admin page', () => {
    const result = adminReleaseLog('hosting-v1', {
      publishedAt: { toDate: () => new Date('2026-09-22T04:30:00.000Z') },
      source: 'automatic', status: 'published', mode: 'static', count: 18, sequence: 7,
      version: 'sites/demo/versions/v1', snapshotDigest: 'must-not-leak',
    });
    expect(result).toEqual({
      id: 'hosting-v1', publishedAt: '2026-09-22T04:30:00.000Z', source: 'automatic', mode: 'static',
      count: 18, sequence: 7, version: 'sites/demo/versions/v1',
    });
    expect(result).not.toHaveProperty('snapshotDigest');
  });

  it('rejects unfinished or malformed rows', () => {
    expect(adminReleaseLog('pending', { status: 'pending', source: 'automatic', publishedAt: new Date() })).toBeNull();
    expect(adminReleaseLog('missing-time', { status: 'published', source: 'automatic' })).toBeNull();
  });
});
