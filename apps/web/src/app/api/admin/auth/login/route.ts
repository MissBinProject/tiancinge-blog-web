import { NextResponse } from 'next/server';
import { DUMMY_PASSWORD_HASH, verifyPassword } from '@/features/admin-auth/infrastructure/password';
import { readAdminRuntimeConfig } from '@/features/admin-auth/infrastructure/config';
import { createStoredAdminSession } from '@/features/admin-auth/infrastructure/session-store';
import { SESSION_COOKIE, SESSION_TTL_SECONDS } from '@/features/admin-auth/infrastructure/session';
import { clearLoginAttempts, consumeLoginAttempt } from '@/features/admin-auth/infrastructure/rate-limit';
import { isValidAdminUsername, normalizeAdminUsername } from '@/features/admin-auth/domain/credentials';
import { firebaseServer } from '@/lib/firebase-admin';
import { readJsonObject } from '@/lib/request-body';
import { getTotpCounter } from '@/features/admin-auth/infrastructure/totp';
import { consumeTotpCounter } from '@/features/admin-auth/infrastructure/totp-replay';
import { consumeRecoveryCode } from '@/features/admin-auth/infrastructure/recovery-codes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(payload: Record<string, unknown>, status = 200) {
  return NextResponse.json(payload, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

function originAllowed(request: Request, allowedOrigin: string): boolean {
  return request.headers.get('origin') === allowedOrigin;
}

export async function POST(request: Request) {
  const config = readAdminRuntimeConfig();
  if (!config || !firebaseServer()) return json({ ok: false, error: { code: 'service_unavailable', message: '登入服務尚未完成伺服器設定' } }, 503);
  if (!originAllowed(request, config.allowedOrigin)) return json({ ok: false, error: { code: 'origin_denied', message: '請從後台網站登入' } }, 403);
  if ((request.headers.get('content-type') || '').split(';', 1)[0].trim().toLowerCase() !== 'application/json') return json({ ok: false, error: { code: 'invalid_request', message: '請使用 JSON 格式提交' } }, 400);

  const parsed = await readJsonObject(request, 8 * 1024);
  if (!parsed.ok) return json({ ok: false, error: { code: parsed.reason === 'too_large' ? 'too_large' : 'invalid_request', message: parsed.reason === 'too_large' ? '登入資料過大' : '登入資料格式不正確' } }, parsed.reason === 'too_large' ? 413 : 400);
  const body = parsed.value;
  const username = typeof body.username === 'string' ? normalizeAdminUsername(body.username) : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const otp = typeof body.otp === 'string' ? body.otp.trim() : '';
  const recoveryCode = typeof body.recoveryCode === 'string' ? body.recoveryCode.trim() : '';
  if (!isValidAdminUsername(username) || password.length < 1 || password.length > 256) return json({ ok: false, error: { code: 'invalid_request', message: '帳號或密碼格式不正確' } }, 400);
  const limit = await consumeLoginAttempt(request, username);
  if (!limit.allowed) return json({ ok: false, error: { code: 'rate_limited', message: '登入嘗試次數過多，請稍後再試' } }, 429);
  const matchesUsername = username === config.username;
  const validPassword = verifyPassword(password, matchesUsername ? config.passwordHash : DUMMY_PASSWORD_HASH);
  if (!matchesUsername || !validPassword) return json({ ok: false, error: { code: 'invalid_credentials', message: '帳號或密碼不正確' } }, 401);
  if (config.totpSecret) {
    const totpCounter = getTotpCounter(otp, config.totpSecret);
    const recoveryValid = totpCounter === null && recoveryCode ? await consumeRecoveryCode(username, recoveryCode) : false;
    if (totpCounter === null && !recoveryValid) return json({ ok: false, error: { code: 'mfa_required', message: '請輸入驗證器的一次性驗證碼或一次性恢復碼' } }, 401);
    if (totpCounter !== null) {
      try {
        if (!await consumeTotpCounter(username, totpCounter)) return json({ ok: false, error: { code: 'mfa_required', message: '請輸入尚未使用的一次性驗證碼' } }, 401);
      } catch {
        return json({ ok: false, error: { code: 'service_unavailable', message: '登入服務暫時無法使用' } }, 503);
      }
    }
  }
  await clearLoginAttempts(request, username);
  try {
    const session = await createStoredAdminSession(username, config.credentialVersion);
    if (!session) return json({ ok: false, error: { code: 'service_unavailable', message: '登入服務暫時無法使用' } }, 503);
    const response = json({ ok: true, data: { username: session.username, expiresAt: session.expiresAt, csrfToken: session.csrfToken } });
    response.cookies.set({ name: SESSION_COOKIE, value: session.token, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: SESSION_TTL_SECONDS });
    return response;
  } catch { return json({ ok: false, error: { code: 'service_unavailable', message: '登入服務暫時無法使用' } }, 503); }
}
