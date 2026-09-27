export type ReadJsonResult =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; reason: 'too_large' | 'invalid' };

export type ReadBytesResult =
  | { ok: true; bytes: Uint8Array }
  | { ok: false; reason: 'too_large' | 'invalid' };

/**
 * Buffer a non-JSON request body with the same hard stream limit used by JSON
 * routes. Callers can then hand the bounded bytes to a format parser such as
 * FormData without allowing chunked requests to bypass the limit.
 */
export async function readRequestBytes(request: Request, maxBytes: number): Promise<ReadBytesResult> {
  const advertisedLength = Number(request.headers.get('content-length') || 0);
  if (Number.isFinite(advertisedLength) && advertisedLength > maxBytes) return { ok: false, reason: 'too_large' };
  if (!request.body) return { ok: true, bytes: new Uint8Array() };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return { ok: false, reason: 'too_large' };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, reason: 'invalid' };
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, bytes };
}

/**
 * Read a JSON object without trusting Content-Length. The stream is stopped as
 * soon as the configured limit is crossed, so an attacker cannot force the
 * server to parse an arbitrarily large request body.
 */
export async function readJsonObject(request: Request, maxBytes: number): Promise<ReadJsonResult> {
  const read = await readRequestBytes(request, maxBytes);
  if (!read.ok) return read;
  try {
    const bytes = read.bytes;
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { ok: false, reason: 'invalid' };
    return { ok: true, value: parsed as Record<string, unknown> };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}
