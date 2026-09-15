import { onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updatePassword, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { firebaseAuth, firebaseDb, firebaseConfigured } from './firebase';

export type AdminAuthEvent = 'INITIAL_SESSION' | 'SIGNED_IN' | 'SIGNED_OUT' | 'PASSWORD_RECOVERY';
export type AdminSessionCheck =
  | { status: 'signed-out' }
  | { status: 'ok'; session: User }
  | { status: 'forbidden' }
  | { status: 'error' };
export type AdminSignInResult =
  | { ok: true; session: User }
  | { ok: false; reason: 'unconfigured' | 'invalid' | 'forbidden' | 'error' };
export type AdminPasswordResult = { ok: true } | { ok: false; reason: 'unconfigured' | 'error' };

export function classifyAuthError(error: unknown): Extract<AdminSignInResult, { ok: false }>['reason'] {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: unknown }).code) : '';
  if (code.includes('configuration-not-found') || code.includes('auth/operation-not-allowed')) return 'unconfigured';
  if (code.includes('network-request-failed') || code.includes('too-many-requests')) return 'error';
  return 'invalid';
}

/** Firebase Auth plus a Firestore admins/{uid} allowlist. */
export async function verifyAdminSession(user: User | null): Promise<AdminSessionCheck> {
  if (!user) return { status: 'signed-out' };
  if (!firebaseAuth || !firebaseDb) return { status: 'error' };
  try {
    const admin = await getDoc(doc(firebaseDb, 'admins', user.uid));
    return admin.exists() && admin.data().active !== false ? { status: 'ok', session: user } : { status: 'forbidden' };
  } catch {
    return { status: 'error' };
  }
}

export function subscribeAuthChanges(callback: (event: AdminAuthEvent, session: User | null) => void): () => void {
  if (!firebaseAuth) return () => undefined;
  let first = true;
  return onAuthStateChanged(firebaseAuth, (user) => {
    const event: AdminAuthEvent = first ? 'INITIAL_SESSION' : user ? 'SIGNED_IN' : 'SIGNED_OUT';
    first = false;
    callback(event, user);
  });
}

export async function signInAdmin(email: string, password: string): Promise<AdminSignInResult> {
  if (!firebaseAuth || !firebaseConfigured) return { ok: false, reason: 'unconfigured' };
  try {
    const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
    const check = await verifyAdminSession(credential.user);
    if (check.status === 'ok') return { ok: true, session: credential.user };
    await signOut(firebaseAuth);
    return { ok: false, reason: check.status === 'forbidden' ? 'forbidden' : 'error' };
  } catch (error) {
    return { ok: false, reason: classifyAuthError(error) };
  }
}

export async function signOutAdmin(): Promise<void> { if (firebaseAuth) await signOut(firebaseAuth); }

export async function requestPasswordReset(email: string, _redirectTo: string): Promise<AdminPasswordResult> {
  if (!firebaseAuth || !firebaseConfigured) return { ok: false, reason: 'unconfigured' };
  try { await sendPasswordResetEmail(firebaseAuth, email); return { ok: true }; } catch { return { ok: false, reason: 'error' }; }
}

export async function updateAdminPassword(password: string): Promise<AdminPasswordResult> {
  if (!firebaseAuth || !firebaseConfigured || !firebaseAuth.currentUser) return { ok: false, reason: 'unconfigured' };
  try { await updatePassword(firebaseAuth.currentUser, password); return { ok: true }; } catch { return { ok: false, reason: 'error' }; }
}
