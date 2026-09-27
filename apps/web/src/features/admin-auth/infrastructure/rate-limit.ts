import { createHash } from 'node:crypto';
import { firebaseServer } from '@/lib/firebase-admin';

const WINDOW_MS = 15 * 60 * 1_000;
const MAX_ATTEMPTS = 10;

export type LoginRateLimitResult = { allowed: boolean; retryAfterSeconds?: number };

export function requestSourceKey(request: Request): string {
  // Cloud Run supplies X-Forwarded-For at the trusted edge. Do not accept
  // X-Real-IP here because a browser can send that header directly.
  const source = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  return createHash('sha256').update(source).digest('hex');
}

function accountKey(username: string): string {
  return createHash('sha256').update(`account:${username.trim().toLowerCase()}`).digest('hex');
}

export async function consumeLoginAttempt(request: Request, username = '', now = Date.now()): Promise<LoginRateLimitResult> {
  const firebase = firebaseServer();
  if (!firebase) return { allowed: false, retryAfterSeconds: 60 };
  const collection = firebase.db.collection('admin_login_guards');
  const refs = [collection.doc(`ip-${requestSourceKey(request)}`)];
  if (username) refs.push(collection.doc(`account-${accountKey(username)}`));
  return firebase.db.runTransaction(async (transaction) => {
    const snapshots = await Promise.all(refs.map((ref) => transaction.get(ref)));
    let nextStartedAt = now;
    let nextCount = 0;
    for (const snapshot of snapshots) {
      const data = snapshot.data() as { startedAt?: unknown; count?: unknown } | undefined;
      const startedAt = typeof data?.startedAt === 'number' ? data.startedAt : now;
      const count = now - startedAt < WINDOW_MS ? Number(data?.count ?? 0) : 0;
      if (count >= MAX_ATTEMPTS) return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((WINDOW_MS - (now - startedAt)) / 1_000)) };
      if (count > nextCount) { nextCount = count; nextStartedAt = startedAt; }
    }
    for (const ref of refs) transaction.set(ref, { startedAt: nextCount ? nextStartedAt : now, count: nextCount + 1, updatedAt: now, expiresAt: new Date(now + WINDOW_MS) });
    return { allowed: true };
  });
}

export async function clearLoginAttempts(request: Request, username = ''): Promise<void> {
  const firebase = firebaseServer();
  if (!firebase) return;
  const collection = firebase.db.collection('admin_login_guards');
  const refs = [collection.doc(`ip-${requestSourceKey(request)}`)];
  if (username) refs.push(collection.doc(`account-${accountKey(username)}`));
  await firebase.db.runTransaction(async (transaction) => {
    for (const ref of refs) transaction.delete(ref);
  });
}
