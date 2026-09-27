import { NextResponse } from 'next/server';
import { authorizeAdminRequest } from '@/features/admin-auth/application/authorize';
import { firebaseServer } from '@/lib/firebase-admin';
import { isDeleted } from '@/features/admin-content/deletion';

export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
function json(payload: Record<string, unknown>, status = 200) { return NextResponse.json(payload, { status, headers: { 'Cache-Control': 'private, no-store' } }); }

export async function GET(request: Request) {
  if (!await authorizeAdminRequest(request)) return json({ ok: false, error: { code: 'unauthorized', message: '請先登入' } }, 401);
  const firebase = firebaseServer(); if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  const params = new URL(request.url).searchParams; const status = params.get('status'); const limit = Math.min(Math.max(Number(params.get('limit') || 20), 1), 100); if (status && status !== 'unread' && status !== 'handled') return json({ ok: false, error: { code: 'invalid_request', message: '留言狀態不正確' } }, 400);
  try { let query = firebase.db.collection('contact_messages').orderBy('createdAt', 'desc').limit(limit); if (status) query = firebase.db.collection('contact_messages').where('status', '==', status).orderBy('createdAt', 'desc').limit(limit); const snapshot = await query.get(); return json({ ok: true, data: { items: snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).filter((row) => !isDeleted(row)), nextCursor: null } }); } catch { return json({ ok: false, error: { code: 'service_unavailable', message: '留言讀取失敗' } }, 503); }
}
