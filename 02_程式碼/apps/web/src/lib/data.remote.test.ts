import { describe, expect, it, vi } from 'vitest';

const firestore = vi.hoisted(() => {
  const get = vi.fn();
  const query = {
    where: vi.fn(() => query),
    orderBy: vi.fn(() => query),
    select: vi.fn(() => query),
    limit: vi.fn(() => query),
    get,
  };
  return { get, query };
});

vi.mock('./firebase-admin', () => ({
  firebaseServer: () => ({ db: { collection: () => firestore.query } }),
  firebaseServerExpected: true,
}));

vi.mock('./static-snapshot', () => ({ staticSnapshot: () => null }));

const { loadArticle } = await import('./data');

function document(id: string, data: Record<string, unknown>) {
  return { id, data: () => data };
}

describe('公開文章詳情回收資料隔離', () => {
  it('不會透過已知 slug 讀出已回收文章', async () => {
    firestore.get.mockResolvedValueOnce({ docs: [document('deleted', {
      slug: 'abc1234567', type: 'news', status: 'published', title: '已回收', excerpt: '', body: [], deletedAt: new Date(),
    })] });

    await expect(loadArticle('news', 'abc1234567')).resolves.toBeNull();
  });

  it('仍可讀取未回收的已發布文章', async () => {
    firestore.get.mockResolvedValueOnce({ docs: [document('active', {
      slug: 'abc1234567', type: 'news', status: 'published', title: '公開文章', excerpt: '', body: [], publishedAt: '2026-09-20T00:00:00.000Z',
    })] });

    await expect(loadArticle('news', 'abc1234567')).resolves.toMatchObject({ title: '公開文章', slug: 'abc1234567' });
  });
});
