import { describe, expect, it } from 'vitest';
import { createPasswordHash, DUMMY_PASSWORD_HASH, verifyPassword } from './password';

describe('server password hashing', () => {
  it('creates a salted scrypt hash that verifies only with the original password', () => {
    const hash = createPasswordHash('test-password-123');
    expect(hash).toMatch(/^scrypt\$v1\$/);
    expect(verifyPassword('test-password-123', hash)).toBe(true);
    expect(verifyPassword('wrong-password', hash)).toBe(false);
    expect(createPasswordHash('test-password-123')).not.toBe(hash);
  });

  it('rejects malformed hashes and uses the dummy path safely', () => {
    expect(verifyPassword('test-password-123', 'not-a-hash')).toBe(false);
    expect(verifyPassword('test-password-123', DUMMY_PASSWORD_HASH)).toBe(false);
  });
});
