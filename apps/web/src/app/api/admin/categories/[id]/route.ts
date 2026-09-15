import { NextResponse } from 'next/server';
import { authorizeAdminRequest } from '@/features/admin-auth/application/authorize';
import { validateCategoryInput } from '@/features/admin-content/categories/category-schema';
import { firebaseServer } from '@/lib/firebase-admin';

export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
function json(payload: Record<string, unknown>, status = 200) { return NextResponse.json(payload, { status, headers: { 'Cache-Control': 'private, no-store' } }); }
async function getId(context: { params: Promise<{ id: string }> }) { return (await context.params).id; }

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await authorizeAdminRequest(request, true)) return json({ ok: false, error: { code: 'forbidden', message: '無效的管理員 session 或請求驗證' } }, 403);
  const firebase = firebaseServer(); if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  let body: Record<string, unknown>; try { body = await request.json() as Record<string, unknown>; } catch { return json({ ok: false, error: { code: 'invalid_request', message: '資料格式不正確' } }, 400); }
  const id = await getId(context); try { const ref = firebase.db.collection('article_categories').doc(id); const current = await ref.get(); if (!current.exists) return json({ ok: false, error: { code: 'not_found', message: '分類不存在' } }, 404); const merged = { ...current.data(), ...body }; const validationError = validateCategoryInput(merged); if (validationError) return json({ ok: false, error: { code: 'invalid_request', message: validationError } }, 400); await ref.update({ name: String(merged.name).trim(), type: merged.type, updatedAt: new Date() }); return json({ ok: true, data: { id } }); } catch { return json({ ok: false, error: { code: 'service_unavailable', message: '分類儲存失敗' } }, 503); }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await authorizeAdminRequest(request, true)) return json({ ok: false, error: { code: 'forbidden', message: '無效的管理員 session 或請求驗證' } }, 403);
  const firebase = firebaseServer(); if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  const id = await getId(context); try { const ref = firebase.db.collection('article_categories').doc(id); const current = await ref.get(); if (!current.exists) return json({ ok: false, error: { code: 'not_found', message: '分類不存在' } }, 404); const used = await firebase.db.collection('articles').where('category', '==', current.data()?.name).limit(1).get(); if (!used.empty) return json({ ok: false, error: { code: 'conflict', message: '使用中的分類無法刪除' } }, 409); await ref.delete(); return json({ ok: true, data: { id } }); } catch { return json({ ok: false, error: { code: 'service_unavailable', message: '分類刪除失敗' } }, 503); }
}
