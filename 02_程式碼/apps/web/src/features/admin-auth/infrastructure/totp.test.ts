import { describe, expect, it } from 'vitest';
import { verifyTotp } from './totp';

describe('verifyTotp', () => {
  it('accepts the RFC 6238 SHA-1 test vector at 59 seconds', () => {
    expect(verifyTotp('94287082'.slice(-6), 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', 59_000)).toBe(true);
  });

  it('allows one clock step but rejects malformed or distant codes', () => {
    expect(verifyTotp('942870', 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', 59_000)).toBe(false);
    expect(verifyTotp('287082', 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', 59_000 + 30_000)).toBe(true);
    expect(verifyTotp('942870', 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', 59_000 + 120_000)).toBe(false);
  });
});
