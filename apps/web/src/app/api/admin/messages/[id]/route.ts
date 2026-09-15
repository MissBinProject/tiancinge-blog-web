import { NextResponse } from 'next/server';
import { authorizeAdminRequest } from '@/features/admin-auth/application/authorize';
import { validateMessagePatch } from '@/features/admin-content/messages/message-schema';
import { firebaseServer } from '@/lib/firebase-admin';

export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
function json(payload: Record<string, unknown>, status = 200) { return NextResponse.json(payload, { status, headers: { 'Cache-Control': 'private, no-store' } }); }

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await authorizeAdminRequest(request, true)) return json({ ok: false, error: { code: 'forbidden', message: '無效的管理員 session 或請求驗證' } }, 403);
  const firebase = firebaseServer(); if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  let body: Record<string, unknown>; try { body = await request.json() as Record<string, unknown>; } catch { return json({ ok: false, error: { code: 'invalid_request', message: '資料格式不正確' } }, 400); }
  const validationError = validateMessagePatch(body); if (validationError) return json({ ok: false, error: { code: 'invalid_request', message: validationError } }, 400);
  const id = (await context.params).id; try { const ref = firebase.db.collection('contact_messages').doc(id); const current = await ref.get(); if (!current.exists) return json({ ok: false, error: { code: 'not_found', message: '留言不存在' } }, 404); await ref.update({ ...body, updatedAt: new Date() }); return json({ ok: true, data: { id } }); } catch { return json({ ok: false, error: { code: 'service_unavailable', message: '留言儲存失敗' } }, 503); }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await authorizeAdminRequest(request, true)) return json({ ok: false, error: { code: 'forbidden', message: '無效的管理員 session 或請求驗證' } }, 403);
  const firebase = firebaseServer(); if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  const id = (await context.params).id; try { const ref = firebase.db.collection('contact_messages').doc(id); const current = await ref.get(); if (!current.exists) return json({ ok: false, error: { code: 'not_found', message: '留言不存在' } }, 404); await ref.delete(); return json({ ok: true, data: { id } }); } catch { return json({ ok: false, error: { code: 'service_unavailable', message: '留言刪除失敗' } }, 503); }
}
