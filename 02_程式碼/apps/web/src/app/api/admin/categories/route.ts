import { NextResponse } from 'next/server';
import { authorizeAdminRequest } from '@/features/admin-auth/application/authorize';
import { categoryPayload, validateCategoryInput } from '@/features/admin-content/categories/category-schema';
import { firebaseServer } from '@/lib/firebase-admin';
import { readJsonObject } from '@/lib/request-body';
import { recordAdminAudit } from '@/features/admin-auth/infrastructure/audit';
import { isDeleted } from '@/features/admin-content/deletion';

export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
function json(payload: Record<string, unknown>, status = 200) { return NextResponse.json(payload, { status, headers: { 'Cache-Control': 'private, no-store' } }); }

export async function GET(request: Request) {
  if (!await authorizeAdminRequest(request)) return json({ ok: false, error: { code: 'unauthorized', message: '請先登入' } }, 401);
  const firebase = firebaseServer(); if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  try { const snapshot = await firebase.db.collection('article_categories').orderBy('name').get(); return json({ ok: true, data: { items: snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).filter((row) => !isDeleted(row)) } }); } catch { return json({ ok: false, error: { code: 'service_unavailable', message: '分類讀取失敗' } }, 503); }
}

export async function POST(request: Request) {
  const admin = await authorizeAdminRequest(request, true);
  if (!admin) return json({ ok: false, error: { code: 'forbidden', message: '無效的管理員 session 或請求驗證' } }, 403);
  const firebase = firebaseServer(); if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  const parsed = await readJsonObject(request, 64 * 1024);
  if (!parsed.ok) return json({ ok: false, error: { code: parsed.reason === 'too_large' ? 'too_large' : 'invalid_request', message: parsed.reason === 'too_large' ? '資料大小超過限制' : '資料格式不正確' } }, parsed.reason === 'too_large' ? 413 : 400);
  const body = parsed.value;
  const validationError = validateCategoryInput(body); if (validationError) return json({ ok: false, error: { code: 'invalid_request', message: validationError } }, 400);
  try { const ref = await firebase.db.collection('article_categories').add({ ...categoryPayload(body), createdAt: new Date() }); await recordAdminAudit(firebase, admin, request, 'create', 'article_category', ref.id).catch(() => undefined); return json({ ok: true, data: { id: ref.id } }, 201); } catch { return json({ ok: false, error: { code: 'service_unavailable', message: '分類儲存失敗' } }, 503); }
}
