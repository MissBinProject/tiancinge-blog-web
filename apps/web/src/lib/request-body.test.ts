import { describe, expect, it } from 'vitest';
import { readJsonObject, readRequestBytes } from './request-body';

describe('readJsonObject', () => {
  it('reads a JSON object within the limit', async () => {
    const result = await readJsonObject(new Request('https://example.test', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin' }),
      headers: { 'content-type': 'application/json' },
    }), 1024);

    expect(result).toEqual({ ok: true, value: { username: 'admin' } });
  });

  it('rejects arrays and malformed JSON', async () => {
    const arrayResult = await readJsonObject(new Request('https://example.test', { method: 'POST', body: '[1,2,3]' }), 1024);
    const malformedResult = await readJsonObject(new Request('https://example.test', { method: 'POST', body: '{' }), 1024);

    expect(arrayResult).toEqual({ ok: false, reason: 'invalid' });
    expect(malformedResult).toEqual({ ok: false, reason: 'invalid' });
  });

  it('rejects an advertised body over the limit before parsing', async () => {
    const result = await readJsonObject(new Request('https://example.test', {
      method: 'POST',
      body: JSON.stringify({ value: '12345' }),
      headers: { 'content-length': '9999' },
    }), 10);

    expect(result).toEqual({ ok: false, reason: 'too_large' });
  });

  it('rejects a streamed body that crosses the limit', async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"value":"123456789"}'));
        controller.close();
      },
    });
    const result = await readJsonObject(new Request('https://example.test', { method: 'POST', body, duplex: 'half' } as RequestInit & { duplex: 'half' }), 10);

    expect(result).toEqual({ ok: false, reason: 'too_large' });
  });

  it('buffers a bounded non-JSON body and rejects streamed overflow', async () => {
    const valid = await readRequestBytes(new Request('https://example.test', { method: 'POST', body: 'abc' }), 3);
    expect(valid.ok).toBe(true);
    if (valid.ok) expect(new TextDecoder().decode(valid.bytes)).toBe('abc');

    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('abcd'));
        controller.close();
      },
    });
    const overflow = await readRequestBytes(new Request('https://example.test', { method: 'POST', body, duplex: 'half' } as RequestInit & { duplex: 'half' }), 3);
    expect(overflow).toEqual({ ok: false, reason: 'too_large' });
  });
});
