import { NextResponse } from 'next/server';
import { authorizeAdminRequest } from '@/features/admin-auth/application/authorize';
import { validateCategoryInput } from '@/features/admin-content/categories/category-schema';
import { firebaseServer } from '@/lib/firebase-admin';

export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
function json(payload: Record<string, unknown>, status = 200) { return NextResponse.json(payload, { status, headers: { 'Cache-Control': 'private, no-store' } }); }

export async function GET(request: Request) {
  if (!await authorizeAdminRequest(request)) return json({ ok: false, error: { code: 'unauthorized', message: '請先登入' } }, 401);
  const firebase = firebaseServer(); if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  try { const snapshot = await firebase.db.collection('article_categories').orderBy('name').get(); return json({ ok: true, data: { items: snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) } }); } catch { return json({ ok: false, error: { code: 'service_unavailable', message: '分類讀取失敗' } }, 503); }
}

export async function POST(request: Request) {
  if (!await authorizeAdminRequest(request, true)) return json({ ok: false, error: { code: 'forbidden', message: '無效的管理員 session 或請求驗證' } }, 403);
  const firebase = firebaseServer(); if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  let body: Record<string, unknown>; try { body = await request.json() as Record<string, unknown>; } catch { return json({ ok: false, error: { code: 'invalid_request', message: '資料格式不正確' } }, 400); }
  const validationError = validateCategoryInput(body); if (validationError) return json({ ok: false, error: { code: 'invalid_request', message: validationError } }, 400);
  try { const ref = await firebase.db.collection('article_categories').add({ name: String(body.name).trim(), type: body.type, createdAt: new Date(), updatedAt: new Date() }); return json({ ok: true, data: { id: ref.id } }, 201); } catch { return json({ ok: false, error: { code: 'service_unavailable', message: '分類儲存失敗' } }, 503); }
}
