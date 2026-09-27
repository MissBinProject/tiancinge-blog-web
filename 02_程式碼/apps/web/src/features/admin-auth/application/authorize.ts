import { cookies } from 'next/headers';
import { readAdminRuntimeConfig } from '../infrastructure/config';
import { hashCsrfToken, SESSION_COOKIE } from '../infrastructure/session';
import { readStoredAdminSession } from '../infrastructure/session-store';

export type AuthorizedAdmin = { username: string; credentialVersion: string; expiresAt: number; token: string };

export async function authorizeAdminRequest(request: Request, requireCsrf = false): Promise<AuthorizedAdmin | null> {
  const config = readAdminRuntimeConfig();
  if (!config) return null;
  const origin = request.headers.get('origin');
  if (request.method !== 'GET' && origin !== config.allowedOrigin) return null;
  if (request.method === 'GET' && origin && origin !== config.allowedOrigin) return null;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value || '';
  const session = await readStoredAdminSession(token);
  if (!session || session.credentialVersion !== config.credentialVersion) return null;
  if (requireCsrf) {
    const csrf = request.headers.get('x-csrf-token') || '';
    if (!csrf || hashCsrfToken(csrf) !== session.csrfHash) return null;
  }
  return { username: session.username, credentialVersion: session.credentialVersion, expiresAt: session.expiresAt, token };
}
