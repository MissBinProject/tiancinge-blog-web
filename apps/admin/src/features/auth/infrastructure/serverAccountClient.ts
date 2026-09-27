export type ServerAccountFailure = 'invalid' | 'rate_limited' | 'origin_denied' | 'unavailable' | 'network' | 'mfa_required';
export type ServerAccountResult = { ok: true; username: string; expiresAt: number; csrfToken: string } | { ok: false; reason: ServerAccountFailure };

let csrfToken = '';

function endpoint(path: string): string {
  const origin = (import.meta.env.VITE_ADMIN_API_ORIGIN || '').replace(/\/$/, '');
  return `${origin}/api/admin${path}`;
}

function failure(status: number): ServerAccountFailure {
  if (status === 401) return 'invalid';
  if (status === 403) return 'origin_denied';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'unavailable';
  return 'invalid';
}

async function readResult(response: Response): Promise<ServerAccountResult> {
  if (!response.ok) {
    if (response.status === 401) {
      try {
        const payload = await response.clone().json() as { error?: { code?: unknown } };
        if (payload.error?.code === 'mfa_required') return { ok: false, reason: 'mfa_required' };
      } catch { /* keep generic failure */ }
    }
    return { ok: false, reason: failure(response.status) };
  }
  try {
    const payload = await response.json() as { data?: { username?: unknown; expiresAt?: unknown; csrfToken?: unknown } };
    const data = payload.data;
    if (!data || typeof data.username !== 'string' || typeof data.expiresAt !== 'number' || typeof data.csrfToken !== 'string') return { ok: false, reason: 'unavailable' };
    csrfToken = data.csrfToken;
    return { ok: true, username: data.username, expiresAt: data.expiresAt, csrfToken };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

export async function signInWithServerAccount(username: string, password: string, otp = '', recoveryCode = ''): Promise<ServerAccountResult> {
  try {
    const response = await fetch(endpoint('/auth/login'), { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password, ...(otp ? { otp } : {}), ...(recoveryCode ? { recoveryCode } : {}) }) });
    return await readResult(response);
  } catch {
    return { ok: false, reason: 'network' };
  }
}

export async function restoreServerSession(): Promise<ServerAccountResult> {
  try {
    const response = await fetch(endpoint('/auth/session'), { credentials: 'include', headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : undefined });
    return await readResult(response);
  } catch {
    return { ok: false, reason: 'network' };
  }
}

export async function signOutServerAccount(): Promise<void> {
  try { await fetch(endpoint('/auth/logout'), { method: 'POST', credentials: 'include', headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : undefined }); } finally { csrfToken = ''; }
}

export function getServerCsrfTokenForRequest(): string { return csrfToken; }
