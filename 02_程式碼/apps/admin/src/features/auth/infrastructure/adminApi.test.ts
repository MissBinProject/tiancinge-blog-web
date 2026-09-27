import { beforeEach, describe, expect, it, vi } from 'vitest';
import { adminApiRequest } from './adminApi';
import { signInWithServerAccount } from './serverAccountClient';

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

  it('refreshes an expired CSRF token and retries a rejected mutation once', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { username: 'tiancinge', expiresAt: 123, csrfToken: 'stale-token' } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: 'CSRF 驗證失敗' } }), { status: 403 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { username: 'tiancinge', expiresAt: 456, csrfToken: 'fresh-token' } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { deleted: true } }), { status: 200 })));

    await signInWithServerAccount('tiancinge', 'secret');
    await expect(adminApiRequest<{ deleted: boolean }>('/messages/message-1', { method: 'DELETE' })).resolves.toEqual({ ok: true, data: { deleted: true } });

    const calls = vi.mocked(fetch).mock.calls;
    expect((calls[1]?.[1] as RequestInit).headers).toEqual(expect.any(Headers));
    expect(((calls[1]?.[1] as RequestInit).headers as Headers).get('X-CSRF-Token')).toBe('stale-token');
    expect(((calls[3]?.[1] as RequestInit).headers as Headers).get('X-CSRF-Token')).toBe('fresh-token');
  });
});
