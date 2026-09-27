import { describe, expect, it } from 'vitest';
import { digestRecoveryCode, isValidRecoveryCode, normalizeRecoveryCode } from './recovery-codes';

describe('recovery codes', () => {
  it('normalizes grouped operator input without changing its digest', () => {
    expect(normalizeRecoveryCode(' abcd-efgh-jkmn-pqrs ')).toBe('ABCDEFGHJKMNPQRS');
    expect(digestRecoveryCode('ABCD-EFGH-JKMN-PQRS')).toBe(digestRecoveryCode('abcdefghjkmnpqrs'));
  });

  it('accepts only the fixed 16-character Crockford-style alphabet', () => {
    expect(isValidRecoveryCode('ABCD-EFGH-JKMN-PQRS')).toBe(true);
    expect(isValidRecoveryCode('ABCD-EFGH-IJMN-PQRS')).toBe(false);
    expect(isValidRecoveryCode('too-short')).toBe(false);
  });
});
