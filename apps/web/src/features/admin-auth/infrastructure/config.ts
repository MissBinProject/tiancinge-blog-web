import { normalizeAdminUsername, isValidAdminUsername } from '../domain/credentials';

export type AdminRuntimeConfig = {
  username: string;
  passwordHash: string;
  credentialVersion: string;
  allowedOrigin: string;
};

export function readAdminRuntimeConfig(env: Record<string, string | undefined> = process.env): AdminRuntimeConfig | null {
  const username = normalizeAdminUsername(env.ADMIN_USERNAME ?? '');
  const passwordHash = env.ADMIN_PASSWORD_HASH?.trim() ?? '';
  const credentialVersion = env.ADMIN_CREDENTIAL_VERSION?.trim() || '1';
  const allowedOrigin = env.ADMIN_ALLOWED_ORIGIN?.trim().replace(/\/$/, '') ?? '';
  if (!isValidAdminUsername(username) || !passwordHash || !/^\d+$/.test(credentialVersion) || !/^https:\/\/[^\s/]+(?:\/[^\s]*)?$/.test(allowedOrigin)) return null;
  return { username, passwordHash, credentialVersion, allowedOrigin };
}
