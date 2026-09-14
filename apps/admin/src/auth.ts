import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { adminSupabase } from './supabase';

export type AdminSessionCheck =
  | { status: 'signed-out' }
  | { status: 'ok'; session: Session }
  | { status: 'forbidden' }
  | { status: 'error' };

export type AdminSignInResult =
  | { ok: true; session: Session }
  | { ok: false; reason: 'unconfigured' | 'invalid' | 'forbidden' | 'error' };

export type AdminPasswordResult = { ok: true } | { ok: false; reason: 'unconfigured' | 'error' };

/**
 * Check the Supabase session and the database-backed administrator allowlist.
 * UI components should use this adapter instead of querying `admin_users`.
 */
export async function verifyAdminSession(session: Session | null): Promise<AdminSessionCheck> {
  if (!session) return { status: 'signed-out' };
  if (!adminSupabase) return { status: 'error' };

  const { data, error } = await adminSupabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', session.user.id)
    .maybeSingle();
  if (error) return { status: 'error' };
  if (!data) return { status: 'forbidden' };
  return { status: 'ok', session };
}

export function subscribeAuthChanges(callback: (event: AuthChangeEvent, session: Session | null) => void): () => void {
  if (!adminSupabase) return () => undefined;
  const { data } = adminSupabase.auth.onAuthStateChange(callback);
  return () => data.subscription.unsubscribe();
}

export async function signInAdmin(email: string, password: string): Promise<AdminSignInResult> {
  if (!adminSupabase) return { ok: false, reason: 'unconfigured' };
  const { data, error } = await adminSupabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) return { ok: false, reason: 'invalid' };

  const check = await verifyAdminSession(data.session);
  if (check.status === 'ok') return { ok: true, session: data.session };
  await adminSupabase.auth.signOut();
  return { ok: false, reason: check.status === 'forbidden' ? 'forbidden' : 'error' };
}

export async function signOutAdmin(): Promise<void> {
  if (adminSupabase) await adminSupabase.auth.signOut();
}

export async function requestPasswordReset(email: string, redirectTo: string): Promise<AdminPasswordResult> {
  if (!adminSupabase) return { ok: false, reason: 'unconfigured' };
  const { error } = await adminSupabase.auth.resetPasswordForEmail(email, { redirectTo });
  return error ? { ok: false, reason: 'error' } : { ok: true };
}

export async function updateAdminPassword(password: string): Promise<AdminPasswordResult> {
  if (!adminSupabase) return { ok: false, reason: 'unconfigured' };
  const { error } = await adminSupabase.auth.updateUser({ password });
  return error ? { ok: false, reason: 'error' } : { ok: true };
}
