import { emailForUsername } from '../infrastructure/accountConfig';
import { isValidUsername, normalizeUsername } from '../domain/username';
import { requestPasswordReset, signInAdmin, type AdminPasswordResult, type AdminSignInResult } from '../../../auth';

export async function signInWithUsername(username: string, password: string): Promise<AdminSignInResult> {
  const normalized = normalizeUsername(username);
  const email = isValidUsername(normalized) ? emailForUsername(normalized) : null;
  if (!email) return { ok: false, reason: 'invalid' };
  return signInAdmin(email, password);
}

export async function requestResetByUsername(username: string, redirectTo: string): Promise<AdminPasswordResult> {
  const normalized = normalizeUsername(username);
  const email = isValidUsername(normalized) ? emailForUsername(normalized) : null;
  if (!email) return { ok: true };
  return requestPasswordReset(email, redirectTo);
}
