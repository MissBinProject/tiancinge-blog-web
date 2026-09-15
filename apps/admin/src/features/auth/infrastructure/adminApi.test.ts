import { beforeEach, describe, expect, it, vi } from 'vitest';
import { adminApiRequest } from './adminApi';

describe('admin api client', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('sends credentials and the in-memory CSRF header for mutations', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { items: [] } }), { status: 200 })));
    const result = await adminApiRequest<{ items: unknown[] }>('/services', { method: 'PATCH', body: '{}' });
    expect(result).toEqual({ ok: true, data: { items: [] } });
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(init?.credentials).toBe('include');
  });

  it('normalizes non-JSON errors to a safe message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('bad gateway', { status: 502 })));
    await expect(adminApiRequest('/services')).resolves.toEqual({ ok: false, status: 502, error: '管理 API 請求失敗' });
  });
});
