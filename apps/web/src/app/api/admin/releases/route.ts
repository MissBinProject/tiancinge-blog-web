import { NextResponse } from 'next/server';
import { authorizeAdminRequest } from '@/features/admin-auth/application/authorize';
import { adminReleaseLog } from '@/features/admin-content/releases/release-log';
import { firebaseServer } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(payload: Record<string, unknown>, status = 200) {
  return NextResponse.json(payload, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

export async function GET(request: Request) {
  if (!await authorizeAdminRequest(request)) return json({ ok: false, error: { code: 'unauthorized', message: '請先登入' } }, 401);
  const firebase = firebaseServer();
  if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  try {
    const snapshot = await firebase.db.collection('web_release_logs').orderBy('publishedAt', 'desc').limit(100).get();
    const rows = snapshot.docs
      .map((doc) => adminReleaseLog(doc.id, doc.data()))
      .filter((row) => row !== null);
    return json({ ok: true, data: rows });
  } catch {
    return json({ ok: false, error: { code: 'service_unavailable', message: '發布紀錄讀取失敗' } }, 503);
  }
}
