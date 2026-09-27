import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getServerCsrfTokenForRequest, restoreServerSession, signInWithServerAccount, signOutServerAccount } from './serverAccountClient';

describe('server account client', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('stores the CSRF token only in memory after login', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { username: 'tiancinge', expiresAt: 123, csrfToken: 'csrf-1' } }), { status: 200 })));
    await expect(signInWithServerAccount('tiancinge', 'secret')).resolves.toEqual({ ok: true, username: 'tiancinge', expiresAt: 123, csrfToken: 'csrf-1' });
    expect(getServerCsrfTokenForRequest()).toBe('csrf-1');
  });

  it('maps authentication and rate-limit responses without exposing server detail', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 429 })));
    await expect(restoreServerSession()).resolves.toEqual({ ok: false, reason: 'rate_limited' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401 })));
    await expect(restoreServerSession()).resolves.toEqual({ ok: false, reason: 'invalid' });
  });

  it('sends the in-memory CSRF token when logging out and clears it', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { username: 'tiancinge', expiresAt: 123, csrfToken: 'csrf-1' } }), { status: 200 }))
      .mockResolvedValueOnce(new Response('{}', { status: 200 })));
    await signInWithServerAccount('tiancinge', 'secret');
    await signOutServerAccount();
    const calls = vi.mocked(fetch).mock.calls;
    const request = calls[calls.length - 1]?.[1] as RequestInit;
    expect((request.headers as Record<string, string>)['X-CSRF-Token']).toBe('csrf-1');
    expect(getServerCsrfTokenForRequest()).toBe('');
  });
});
