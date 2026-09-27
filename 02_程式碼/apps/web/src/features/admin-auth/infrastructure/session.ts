import { createHash, randomBytes } from 'node:crypto';

export const SESSION_COOKIE = '__session';
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

export function createSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export const hashCsrfToken = hashSessionToken;

export function createCsrfToken(): string {
  return randomBytes(32).toString('base64url');
}
