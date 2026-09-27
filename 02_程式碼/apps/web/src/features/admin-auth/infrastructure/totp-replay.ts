import { firebaseServer } from '@/lib/firebase-admin';

const REPLAY_COLLECTION = 'admin_mfa_replay';

/**
 * Atomically records a successful TOTP counter. A counter can only be used
 * once for an admin account, so retrying the same code is rejected even while
 * its 30-second time step is still valid.
 */
export async function consumeTotpCounter(username: string, counter: number, now = Date.now()): Promise<boolean> {
  if (!username || !Number.isSafeInteger(counter) || counter < 0) return false;
  const firebase = firebaseServer();
  if (!firebase) return false;
  const ref = firebase.db.collection(REPLAY_COLLECTION).doc(username);
  return firebase.db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const data = snapshot.data() as { lastCounter?: unknown } | undefined;
    const lastCounter = typeof data?.lastCounter === 'number' ? data.lastCounter : -1;
    if (lastCounter >= counter) return false;
    transaction.set(ref, { lastCounter: counter, updatedAt: new Date(now) }, { merge: true });
    return true;
  });
}
