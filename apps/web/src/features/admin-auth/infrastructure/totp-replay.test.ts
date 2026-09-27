import { describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ lastCounter: -1, set: vi.fn() }));

vi.mock('@/lib/firebase-admin', () => ({
  firebaseServer: () => ({
    db: {
      collection: () => ({ doc: () => ({}) }),
      runTransaction: async (callback: (transaction: { get: () => Promise<{ data: () => unknown }>; set: (ref: unknown, data: unknown, options?: unknown) => void }) => Promise<boolean>) => callback({
        get: async () => ({ data: () => (state.lastCounter < 0 ? undefined : { lastCounter: state.lastCounter }) }),
        set: (_ref: unknown, data: unknown) => { state.lastCounter = (data as { lastCounter: number }).lastCounter; state.set(data); },
      }),
    },
  }),
}));

const { consumeTotpCounter } = await import('./totp-replay');

describe('TOTP counter replay protection', () => {
  it('consumes a counter only once and rejects older counters', async () => {
    state.lastCounter = -1;
    state.set.mockClear();
    await expect(consumeTotpCounter('tiancinge', 100)).resolves.toBe(true);
    await expect(consumeTotpCounter('tiancinge', 100)).resolves.toBe(false);
    await expect(consumeTotpCounter('tiancinge', 99)).resolves.toBe(false);
    await expect(consumeTotpCounter('tiancinge', 101)).resolves.toBe(true);
    expect(state.set).toHaveBeenCalledTimes(2);
  });
});
