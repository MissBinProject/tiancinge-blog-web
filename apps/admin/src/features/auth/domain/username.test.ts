import { describe, expect, it } from 'vitest';
import { isValidUsername, normalizeUsername } from './username';

describe('admin username rules', () => {
  it('normalizes case and surrounding whitespace', () => {
    expect(normalizeUsername('  TianCinge ')).toBe('tiancinge');
  });

  it('accepts the configured alias and rejects email or unsafe values', () => {
    expect(isValidUsername('tiancinge')).toBe(true);
    expect(isValidUsername('admin@example.com')).toBe(false);
    expect(isValidUsername('ab')).toBe(false);
    expect(isValidUsername('admin space')).toBe(false);
  });
});
