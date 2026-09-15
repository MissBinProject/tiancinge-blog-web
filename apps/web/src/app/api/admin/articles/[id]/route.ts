import { NextResponse } from 'next/server';
import { isContentCode } from '@tian-xin-ge/contracts';
import { authorizeAdminRequest } from '@/features/admin-auth/application/authorize';
import { articlePayload, validateArticleInput } from '@/features/admin-content/articles/article-schema';
import { firebaseServer } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
function json(payload: Record<string, unknown>, status = 200) { return NextResponse.json(payload, { status, headers: { 'Cache-Control': 'private, no-store' } }); }

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await authorizeAdminRequest(request)) return json({ ok: false, error: { code: 'unauthorized', message: '請先登入' } }, 401);
  const firebase = firebaseServer(); if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  const { id } = await context.params;
  try { const snapshot = await firebase.db.collection('articles').doc(id).get(); if (!snapshot.exists) return json({ ok: false, error: { code: 'not_found', message: '文章不存在' } }, 404); return json({ ok: true, data: { id, ...snapshot.data() } }); } catch { return json({ ok: false, error: { code: 'service_unavailable', message: '文章讀取失敗' } }, 503); }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await authorizeAdminRequest(request, true)) return json({ ok: false, error: { code: 'forbidden', message: '無效的管理員 session 或請求驗證' } }, 403);
  const firebase = firebaseServer(); if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  const { id } = await context.params;
  let body: Record<string, unknown>; try { body = await request.json() as Record<string, unknown>; } catch { return json({ ok: false, error: { code: 'invalid_request', message: '資料格式不正確' } }, 400); }
  try {
    const ref = firebase.db.collection('articles').doc(id); const current = await ref.get(); if (!current.exists) return json({ ok: false, error: { code: 'not_found', message: '文章不存在' } }, 404);
    const merged = { ...current.data(), ...body } as Record<string, unknown>; const validationError = validateArticleInput(merged); if (validationError) return json({ ok: false, error: { code: 'invalid_request', message: validationError } }, 400);
    if (body.slug != null && (!isContentCode(body.slug) || body.slug !== current.data()?.slug)) return json({ ok: false, error: { code: 'invalid_request', message: '系統代碼不可修改' } }, 400);
    await ref.update(articlePayload(merged, String(current.data()?.slug ?? ''))); return json({ ok: true, data: { id } });
  } catch { return json({ ok: false, error: { code: 'service_unavailable', message: '文章儲存失敗' } }, 503); }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await authorizeAdminRequest(request, true)) return json({ ok: false, error: { code: 'forbidden', message: '無效的管理員 session 或請求驗證' } }, 403);
  const firebase = firebaseServer(); if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  const { id } = await context.params;
  try { const ref = firebase.db.collection('articles').doc(id); const current = await ref.get(); if (!current.exists) return json({ ok: false, error: { code: 'not_found', message: '文章不存在' } }, 404); await ref.delete(); return json({ ok: true, data: { id } }); } catch { return json({ ok: false, error: { code: 'service_unavailable', message: '文章刪除失敗' } }, 503); }
}
