/** Credentials stay in ADC. Never log API response bodies (which may contain data). */
export function googleApi(auth, base) {
  return async (path, { method = 'GET', body, binary, signal } = {}) => {
    const token = await auth.getAccessToken();
    const response = await fetch(path.startsWith('https://') ? path : `${base}/${path}`, {
      method, signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(20000)]) : AbortSignal.timeout(20000),
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': binary ? 'application/octet-stream' : 'application/json' },
      body: binary ?? (body === undefined ? undefined : JSON.stringify(body)),
    });
    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      const reason = typeof detail.error?.message === 'string' ? detail.error.message.slice(0, 400) : '';
      const error = new Error(`Google API ${response.status} (${method} ${new URL(response.url).pathname}): ${reason}`);
      error.status = response.status;
      throw error;
    }
    const text = await response.text();
    if (binary) return {};
    return text ? JSON.parse(text) : {};
  };
}
