import { getServerCsrfTokenForRequest } from './serverAccountClient';

export type AdminApiSuccess<T> = { ok: true; data: T };
export type AdminApiFailure = { ok: false; error: string; status: number };
export type AdminApiResult<T> = AdminApiSuccess<T> | AdminApiFailure;

function endpoint(path: string): string {
  const origin = (import.meta.env.VITE_ADMIN_API_ORIGIN || '').replace(/\/$/, '');
  return `${origin}/api/admin${path}`;
}

export async function adminApiRequest<T>(path: string, init: RequestInit = {}): Promise<AdminApiResult<T>> {
  const method = (init.method || 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  if (method !== 'GET' && method !== 'HEAD') {
    const csrf = getServerCsrfTokenForRequest();
    if (csrf) headers.set('X-CSRF-Token', csrf);
  }
  try {
    const response = await fetch(endpoint(path), { ...init, headers, credentials: 'include' });
    let payload: { data?: T; error?: { message?: unknown } } = {};
    try { payload = await response.json() as typeof payload; } catch { /* use status below */ }
    if (!response.ok) return { ok: false, status: response.status, error: typeof payload.error?.message === 'string' ? payload.error.message : '管理 API 請求失敗' };
    if (!('data' in payload)) return { ok: false, status: 502, error: '管理 API 回應格式不正確' };
    return { ok: true, data: payload.data as T };
  } catch { return { ok: false, status: 0, error: '管理 API 網路連線失敗' }; }
}

export function isServerAdminApiEnabled(): boolean { return import.meta.env.VITE_ADMIN_AUTH_SERVER === 'true'; }
