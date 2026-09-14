import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { hasAnySupabaseEnv, serviceSupabase } from '@/lib/supabase';

const recentSubmissions = new Map<string, number>();
const rateWindows = new Map<string, { startedAt: number; count: number }>();
const WINDOW_MS = 60_000;
const DUPLICATE_MS = 30_000;
const MAX_BODY_BYTES = 16_384;

function json(payload: Record<string, unknown>, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function cleanup(now: number) {
  for (const [key, timestamp] of recentSubmissions) {
    if (now - timestamp > WINDOW_MS) recentSubmissions.delete(key);
  }
  for (const [key, state] of rateWindows) {
    if (now - state.startedAt > WINDOW_MS) rateWindows.delete(key);
  }
}

function digest(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

async function readBodyWithinLimit(request: Request) {
  if (!request.body) return '';
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > MAX_BODY_BYTES) return json({ error: '提交內容過大' }, 413);

    const rawBody = await readBodyWithinLimit(request);
    if (rawBody === null) return json({ error: '提交內容過大' }, 413);
    const body = JSON.parse(rawBody) as Record<string, unknown>;
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';

    if (!name || !phone || !message) return json({ error: '請填寫必填欄位' }, 400);
    if (name.length > 80 || phone.length > 40 || message.length > 2_000 || email.length > 254) {
      return json({ error: '欄位長度超過限制' }, 400);
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Email 格式不正確' }, 400);

    const now = Date.now();
    const clientId = (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || phone)
      .split(',')[0]
      .trim();
    const duplicateKey = `${phone}:${message}`;
    if (serviceSupabase) {
      const guard = await serviceSupabase.rpc('reserve_contact_submission', {
        client_key: digest(clientId),
        duplicate_key: digest(duplicateKey),
      });
      if (guard.error) return json({ error: '留言服務尚未完成伺服器設定' }, 503);
      if (guard.data === 'rate_limited') return json({ error: '提交次數過多，請稍後再試' }, 429);
      if (guard.data === 'duplicate') return json({ error: '請稍候再送出' }, 429);
      if (guard.data !== 'ok') return json({ error: '提交內容無效' }, 400);
      const { error } = await serviceSupabase.from('contact_messages').insert({
        name,
        phone,
        email: email || null,
        message,
      });
      if (error) return json({ error: '目前無法儲存留言' }, 503);
    } else if (hasAnySupabaseEnv) {
      return json({ error: '留言服務尚未完成伺服器設定' }, 503);
    } else {
      const clientWindow = rateWindows.get(clientId);
      if (clientWindow && now - clientWindow.startedAt < WINDOW_MS) {
        if (clientWindow.count >= 5) return json({ error: '提交次數過多，請稍後再試' }, 429);
        clientWindow.count += 1;
      } else {
        rateWindows.set(clientId, { startedAt: now, count: 1 });
      }
      const lastSubmission = recentSubmissions.get(duplicateKey) ?? 0;
      if (now - lastSubmission < DUPLICATE_MS) return json({ error: '請稍候再送出' }, 429);
    }

    recentSubmissions.set(duplicateKey, now);
    cleanup(now);
    return json({ ok: true });
  } catch {
    return json({ error: '格式錯誤' }, 400);
  }
}
