import { describe, expect, it } from 'vitest';
import { classifyAuthError } from './auth';

describe('Firebase auth error classification', () => {
  it('keeps credential errors generic', () => {
    expect(classifyAuthError({ code: 'auth/invalid-credential' })).toBe('invalid');
    expect(classifyAuthError({ code: 'auth/user-not-found' })).toBe('invalid');
  });

  it('separates configuration and transient failures', () => {
    expect(classifyAuthError({ code: 'auth/operation-not-allowed' })).toBe('unconfigured');
    expect(classifyAuthError({ code: 'auth/network-request-failed' })).toBe('error');
    expect(classifyAuthError({ code: 'auth/too-many-requests' })).toBe('error');
  });
});
