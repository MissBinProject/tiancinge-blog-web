import { describe, expect, it } from 'vitest';
import { POST } from './route';

const request = (body: unknown, headers: HeadersInit = {}) => new Request('http://localhost/api/contact', {
  method: 'POST',
  headers: { 'content-type': 'application/json', ...headers },
  body: JSON.stringify(body),
});

describe('POST /api/contact', () => {
  it('rejects a non-JSON content type', async () => {
    const response = await POST(new Request('http://localhost/api/contact', { method: 'POST', headers: { 'content-type': 'text/plain' }, body: 'name=訪客' }));
    expect(response.status).toBe(400);
  });

  it('rejects missing required fields and malformed email', async () => {
    const missing = await POST(request({ name: '', phone: '0900000000', message: 'hello' }));
    expect(missing.status).toBe(400);
    const invalidEmail = await POST(request({ name: '訪客', phone: '0900000001', email: 'bad-email', message: 'hello' }));
    expect(invalidEmail.status).toBe(400);
  });

  it('rejects an oversized request before parsing', async () => {
    const response = await POST(request({ name: '訪客', phone: '0900000002', message: 'hello' }, { 'content-length': '20000' }));
    expect(response.status).toBe(413);
    const chunkedBody = JSON.stringify({ name: '訪客', phone: '0900000002', message: 'x'.repeat(20_000) });
    const chunkedResponse = await POST(new Request('http://localhost/api/contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: chunkedBody }));
    expect(chunkedResponse.status).toBe(413);
  });

  it('deduplicates the same phone and message for thirty seconds', async () => {
    const body = { name: '訪客', phone: '0900000003', message: '請回電確認課程' };
    const first = await POST(request(body, { 'x-forwarded-for': '198.51.100.3' }));
    expect(first.status).toBe(200);
    const duplicate = await POST(request(body, { 'x-forwarded-for': '198.51.100.3' }));
    expect(duplicate.status).toBe(429);
  });

  it('limits each client to five submissions per minute', async () => {
    const ip = '198.51.100.77';
    for (let index = 0; index < 5; index += 1) {
      const response = await POST(request({ name: '訪客', phone: `09120000${index}0`, message: `第 ${index} 則留言` }, { 'x-forwarded-for': ip }));
      expect(response.status).toBe(200);
    }
    const blocked = await POST(request({ name: '訪客', phone: '0912000099', message: '第六則留言' }, { 'x-forwarded-for': ip }));
    expect(blocked.status).toBe(429);
  });
});
