import { createHash } from 'node:crypto';
import { firebaseServer } from '@/lib/firebase-admin';

const WINDOW_MS = 15 * 60 * 1_000;
const MAX_ATTEMPTS = 10;

export type LoginRateLimitResult = { allowed: boolean; retryAfterSeconds?: number };

export function requestSourceKey(request: Request): string {
  const direct = request.headers.get('x-real-ip')?.trim();
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const source = direct || forwarded || 'unknown';
  return createHash('sha256').update(source).digest('hex');
}

export async function consumeLoginAttempt(request: Request, now = Date.now()): Promise<LoginRateLimitResult> {
  const firebase = firebaseServer();
  if (!firebase) return { allowed: false, retryAfterSeconds: 60 };
  const ref = firebase.db.collection('admin_login_guards').doc(requestSourceKey(request));
  return firebase.db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const data = snapshot.data() as { startedAt?: unknown; count?: unknown } | undefined;
    const startedAt = typeof data?.startedAt === 'number' ? data.startedAt : now;
    const count = now - startedAt < WINDOW_MS ? Number(data?.count ?? 0) : 0;
    if (count >= MAX_ATTEMPTS) return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((WINDOW_MS - (now - startedAt)) / 1_000)) };
    transaction.set(ref, { startedAt: count ? startedAt : now, count: count + 1, updatedAt: now });
    return { allowed: true };
  });
}
