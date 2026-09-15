import { beforeEach, describe, expect, it, vi } from 'vitest';

const { signInAdmin, requestPasswordReset } = vi.hoisted(() => ({ signInAdmin: vi.fn(), requestPasswordReset: vi.fn() }));
vi.mock('../../../auth', () => ({ signInAdmin, requestPasswordReset }));

import { requestResetByUsername, signInWithUsername } from './accountLogin';

describe('account login use cases', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { location: { origin: 'http://test.local' } });
    signInAdmin.mockReset();
    requestPasswordReset.mockReset();
    signInAdmin.mockResolvedValue({ ok: true, session: { uid: 'admin-uid' } });
    requestPasswordReset.mockResolvedValue({ ok: true });
  });

  it('maps the public username to the existing Firebase identity', async () => {
    const result = await signInWithUsername('  TianCinge ', 'secret');
    expect(result.ok).toBe(true);
    expect(signInAdmin).toHaveBeenCalledWith('ouyangtaisen@gmail.com', 'secret');
  });

  it('does not call Firebase for an unknown username', async () => {
    const result = await signInWithUsername('unknown-account', 'secret');
    expect(result).toEqual({ ok: false, reason: 'invalid' });
    expect(signInAdmin).not.toHaveBeenCalled();
  });

  it('uses a neutral reset response for an unknown username', async () => {
    const result = await requestResetByUsername('unknown-account');
    expect(result).toEqual({ ok: true });
    expect(requestPasswordReset).not.toHaveBeenCalled();
  });

  it('sends reset through the mapped Firebase identity', async () => {
    await requestResetByUsername('tiancinge');
    expect(requestPasswordReset).toHaveBeenCalledWith('ouyangtaisen@gmail.com', 'http://test.local');
  });
});
