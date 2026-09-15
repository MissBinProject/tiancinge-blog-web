import { firebaseServer } from '@/lib/firebase-admin';
import { createCsrfToken, createSessionToken, hashCsrfToken, hashSessionToken, SESSION_TTL_SECONDS } from './session';

export type StoredAdminSession = {
  token: string;
  csrfToken: string;
  username: string;
  credentialVersion: string;
  expiresAt: number;
};

type SessionDocument = { username?: unknown; csrfHash?: unknown; credentialVersion?: unknown; expiresAt?: unknown };

function millis(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  if (value && typeof value === 'object' && 'toMillis' in value && typeof (value as { toMillis?: unknown }).toMillis === 'function') return Number((value as { toMillis: () => number }).toMillis());
  return 0;
}

export async function createStoredAdminSession(username: string, credentialVersion: string, now = Date.now()): Promise<StoredAdminSession | null> {
  const firebase = firebaseServer();
  if (!firebase) return null;
  const token = createSessionToken();
  const csrfToken = createCsrfToken();
  const expiresAt = now + SESSION_TTL_SECONDS * 1_000;
  await firebase.db.collection('admin_sessions').doc(hashSessionToken(token)).set({ username, csrfHash: hashCsrfToken(csrfToken), credentialVersion, createdAt: new Date(now), expiresAt: new Date(expiresAt) });
  return { token, csrfToken, username, credentialVersion, expiresAt };
}

export async function readStoredAdminSession(token: string, now = Date.now()): Promise<(Omit<StoredAdminSession, 'token' | 'csrfToken'> & { csrfHash: string }) | null> {
  if (!token) return null;
  const firebase = firebaseServer();
  if (!firebase) return null;
  const snapshot = await firebase.db.collection('admin_sessions').doc(hashSessionToken(token)).get();
  if (!snapshot.exists) return null;
  const data = snapshot.data() as SessionDocument;
  const expiresAt = millis(data.expiresAt);
  if (!expiresAt || expiresAt <= now) return null;
  const username = typeof data.username === 'string' ? data.username : '';
  const credentialVersion = typeof data.credentialVersion === 'string' ? data.credentialVersion : '';
  const csrfHash = typeof data.csrfHash === 'string' ? data.csrfHash : '';
  if (!username || !credentialVersion || !csrfHash) return null;
  return { username, credentialVersion, csrfHash, expiresAt };
}

export async function deleteStoredAdminSession(token: string): Promise<void> {
  if (!token) return;
  const firebase = firebaseServer();
  if (firebase) await firebase.db.collection('admin_sessions').doc(hashSessionToken(token)).delete();
}

export async function rotateStoredCsrfToken(token: string): Promise<string | null> {
  if (!token) return null;
  const firebase = firebaseServer();
  if (!firebase) return null;
  const csrfToken = createCsrfToken();
  await firebase.db.collection('admin_sessions').doc(hashSessionToken(token)).update({ csrfHash: hashCsrfToken(csrfToken) });
  return csrfToken;
}
