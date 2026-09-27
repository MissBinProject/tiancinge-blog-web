import { createHash } from 'node:crypto';
import { firebaseServer } from '@/lib/firebase-admin';

const RECOVERY_CODE_PATTERN = /^[0-9A-HJKMNP-TV-Z]{16}$/;
const RECOVERY_COLLECTION = 'admin_recovery_codes';

/** Normalize the operator-facing grouped code before hashing or lookup. */
export function normalizeRecoveryCode(value: string): string {
  return value.replace(/[\s-]/g, '').toUpperCase();
}

export function isValidRecoveryCode(value: string): boolean {
  return RECOVERY_CODE_PATTERN.test(normalizeRecoveryCode(value));
}

export function digestRecoveryCode(value: string): string {
  return createHash('sha256').update(normalizeRecoveryCode(value)).digest('hex');
}

/**
 * Atomically consumes a recovery code. The plaintext code never enters
 * Firestore, logs, URLs, or the response body. A code can only be used once.
 */
export async function consumeRecoveryCode(username: string, value: string): Promise<boolean> {
  const normalized = normalizeRecoveryCode(value);
  if (!RECOVERY_CODE_PATTERN.test(normalized)) return false;
  const firebase = firebaseServer();
  if (!firebase) return false;
  const ref = firebase.db.collection(RECOVERY_COLLECTION).doc(digestRecoveryCode(normalized));
  return firebase.db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) return false;
    const data = snapshot.data() as { username?: unknown; usedAt?: unknown } | undefined;
    if (data?.username !== username || data.usedAt) return false;
    transaction.update(ref, { usedAt: new Date() });
    return true;
  });
}
