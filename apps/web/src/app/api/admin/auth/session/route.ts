import { NextResponse } from 'next/server';
import { authorizeAdminRequest } from '@/features/admin-auth/application/authorize';
import { readAdminRuntimeConfig } from '@/features/admin-auth/infrastructure/config';
import { readStoredAdminSession, rotateStoredCsrfToken } from '@/features/admin-auth/infrastructure/session-store';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/features/admin-auth/infrastructure/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const admin = await authorizeAdminRequest(request);
  if (!admin) return NextResponse.json({ ok: false, error: { code: 'unauthorized', message: '請先登入' } }, { status: 401, headers: { 'Cache-Control': 'private, no-store' } });
  const config = readAdminRuntimeConfig();
  const session = await readStoredAdminSession((await cookies()).get(SESSION_COOKIE)?.value || '');
  if (!config || !session) return NextResponse.json({ ok: false, error: { code: 'unauthorized', message: '請先登入' } }, { status: 401, headers: { 'Cache-Control': 'private, no-store' } });
  const csrfToken = await rotateStoredCsrfToken(admin.token);
  if (!csrfToken) return NextResponse.json({ ok: false, error: { code: 'service_unavailable', message: '登入服務暫時無法使用' } }, { status: 503, headers: { 'Cache-Control': 'private, no-store' } });
  return NextResponse.json({ ok: true, data: { username: admin.username, expiresAt: admin.expiresAt, csrfToken } }, { headers: { 'Cache-Control': 'private, no-store' } });
}
