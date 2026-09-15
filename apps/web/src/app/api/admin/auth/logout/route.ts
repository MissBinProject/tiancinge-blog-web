import { NextResponse } from 'next/server';
import { authorizeAdminRequest } from '@/features/admin-auth/application/authorize';
import { deleteStoredAdminSession } from '@/features/admin-auth/infrastructure/session-store';
import { SESSION_COOKIE } from '@/features/admin-auth/infrastructure/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const admin = await authorizeAdminRequest(request, true);
  if (admin) await deleteStoredAdminSession(admin.token);
  const response = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'private, no-store' } });
  response.cookies.set({ name: SESSION_COOKIE, value: '', httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 0 });
  return response;
}
