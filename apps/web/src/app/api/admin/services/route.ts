import { NextResponse } from 'next/server';
import { createContentCode } from '@tian-xin-ge/contracts';
import { authorizeAdminRequest } from '@/features/admin-auth/application/authorize';
import { validateServiceInput, servicePayload } from '@/features/admin-content/services/service-schema';
import { firebaseServer } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(payload: Record<string, unknown>, status = 200) { return NextResponse.json(payload, { status, headers: { 'Cache-Control': 'private, no-store' } }); }

export async function GET(request: Request) {
  if (!await authorizeAdminRequest(request)) return json({ ok: false, error: { code: 'unauthorized', message: '請先登入' } }, 401);
  const firebase = firebaseServer();
  if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  try {
    const snapshot = await firebase.db.collection('services').orderBy('sortOrder').get();
    const items = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    return json({ ok: true, data: { items, nextCursor: null } });
  } catch { return json({ ok: false, error: { code: 'service_unavailable', message: '服務資料讀取失敗' } }, 503); }
}

export async function POST(request: Request) {
  if (!await authorizeAdminRequest(request, true)) return json({ ok: false, error: { code: 'forbidden', message: '無效的管理員 session 或請求驗證' } }, 403);
  const firebase = firebaseServer();
  if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return json({ ok: false, error: { code: 'invalid_request', message: '資料格式不正確' } }, 400); }
  const validationError = validateServiceInput(body);
  if (validationError) return json({ ok: false, error: { code: 'invalid_request', message: validationError } }, 400);
  try {
    let slug = createContentCode();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const duplicate = await firebase.db.collection('services').where('slug', '==', slug).limit(1).get();
      if (duplicate.empty) break;
      slug = createContentCode();
    }
    const ref = await firebase.db.collection('services').add({ ...servicePayload(body, slug), createdAt: new Date() });
    return json({ ok: true, data: { id: ref.id, slug } }, 201);
  } catch { return json({ ok: false, error: { code: 'service_unavailable', message: '服務儲存失敗' } }, 503); }
}
