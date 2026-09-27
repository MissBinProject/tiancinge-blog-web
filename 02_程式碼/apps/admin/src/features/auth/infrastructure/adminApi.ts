import { getServerCsrfTokenForRequest, restoreServerSession } from './serverAccountClient';

export type AdminApiSuccess<T> = { ok: true; data: T };
export type AdminApiFailure = { ok: false; error: string; status: number };
export type AdminApiResult<T> = AdminApiSuccess<T> | AdminApiFailure;
export type AdminUploadProgress = { loaded: number; total: number; percent: number };

function endpoint(path: string): string {
  const origin = (import.meta.env.VITE_ADMIN_API_ORIGIN || '').replace(/\/$/, '');
  return `${origin}/api/admin${path}`;
}

async function requestOnce<T>(path: string, init: RequestInit, csrf: string): Promise<AdminApiResult<T>> {
  const method = (init.method || 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  if (method !== 'GET' && method !== 'HEAD') {
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

export async function adminApiRequest<T>(path: string, init: RequestInit = {}): Promise<AdminApiResult<T>> {
  const method = (init.method || 'GET').toUpperCase();
  const result = await requestOnce<T>(path, init, getServerCsrfTokenForRequest());
  if (method === 'GET' || method === 'HEAD' || result.ok || result.status !== 403) return result;

  // A second admin tab can rotate the one-time CSRF token. A 403 means the
  // request was rejected before it could mutate data, so retrying once is safe.
  const session = await restoreServerSession();
  if (!session.ok) return result;
  return requestOnce<T>(path, init, session.csrfToken);
}

/** XMLHttpRequest is used only for uploads because fetch does not expose upload progress. */
export async function adminApiUpload<T>(path: string, body: FormData, onProgress?: (progress: AdminUploadProgress) => void): Promise<AdminApiResult<T>> {
  const csrf = getServerCsrfTokenForRequest();
  return await new Promise((resolve) => {
    const request = new XMLHttpRequest();
    request.open('POST', endpoint(path), true);
    request.withCredentials = true;
    if (csrf) request.setRequestHeader('X-CSRF-Token', csrf);
    request.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable || event.total <= 0) return;
      resolveProgress(onProgress, event.loaded, event.total);
    });
    request.upload.addEventListener('load', (event) => {
      if (event.lengthComputable && event.total > 0) resolveProgress(onProgress, event.total, event.total);
    });
    request.addEventListener('load', () => {
      let payload: { data?: T; error?: { message?: unknown } } = {};
      try { payload = JSON.parse(request.responseText) as typeof payload; } catch { /* use status below */ }
      if (request.status < 200 || request.status >= 300) {
        resolve({ ok: false, status: request.status, error: typeof payload.error?.message === 'string' ? payload.error.message : '媒體上傳失敗' });
        return;
      }
      if (!('data' in payload)) { resolve({ ok: false, status: 502, error: '上傳 API 回應格式不正確' }); return; }
      resolve({ ok: true, data: payload.data as T });
    });
    request.addEventListener('error', () => resolve({ ok: false, status: 0, error: '媒體上傳網路連線失敗' }));
    request.addEventListener('abort', () => resolve({ ok: false, status: 0, error: '媒體上傳已取消' }));
    request.send(body);
  });
}

function resolveProgress(handler: ((progress: AdminUploadProgress) => void) | undefined, loaded: number, total: number) {
  handler?.({ loaded, total, percent: Math.min(100, Math.max(0, Math.round((loaded / total) * 100))) });
}

export function isServerAdminApiEnabled(): boolean { return import.meta.env.VITE_ADMIN_AUTH_SERVER === 'true'; }
