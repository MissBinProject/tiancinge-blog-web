import { NextResponse } from 'next/server';
import { authorizeAdminRequest } from '@/features/admin-auth/application/authorize';
import { validateMessagePatch } from '@/features/admin-content/messages/message-schema';
import { firebaseServer } from '@/lib/firebase-admin';
import { readJsonObject } from '@/lib/request-body';
import { recordAdminAudit } from '@/features/admin-auth/infrastructure/audit';
import { deletedBy, isDeleted } from '@/features/admin-content/deletion';

export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
function json(payload: Record<string, unknown>, status = 200) { return NextResponse.json(payload, { status, headers: { 'Cache-Control': 'private, no-store' } }); }

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await authorizeAdminRequest(request, true);
  if (!admin) return json({ ok: false, error: { code: 'forbidden', message: '無效的管理員 session 或請求驗證' } }, 403);
  const firebase = firebaseServer(); if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  const parsed = await readJsonObject(request, 64 * 1024);
  if (!parsed.ok) return json({ ok: false, error: { code: parsed.reason === 'too_large' ? 'too_large' : 'invalid_request', message: parsed.reason === 'too_large' ? '資料大小超過限制' : '資料格式不正確' } }, parsed.reason === 'too_large' ? 413 : 400);
  const body = parsed.value;
  const validationError = validateMessagePatch(body); if (validationError) return json({ ok: false, error: { code: 'invalid_request', message: validationError } }, 400);
  const id = (await context.params).id; try { const ref = firebase.db.collection('contact_messages').doc(id); const current = await ref.get(); if (!current.exists || isDeleted(current.data())) return json({ ok: false, error: { code: 'not_found', message: '留言不存在' } }, 404); await ref.update({ ...body, updatedAt: new Date() }); await recordAdminAudit(firebase, admin, request, 'update', 'contact_message', id).catch(() => undefined); return json({ ok: true, data: { id } }); } catch { return json({ ok: false, error: { code: 'service_unavailable', message: '留言儲存失敗' } }, 503); }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await authorizeAdminRequest(request, true);
  if (!admin) return json({ ok: false, error: { code: 'forbidden', message: '無效的管理員 session 或請求驗證' } }, 403);
  const firebase = firebaseServer(); if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  const id = (await context.params).id; try { const ref = firebase.db.collection('contact_messages').doc(id); const current = await ref.get(); if (!current.exists || isDeleted(current.data())) return json({ ok: false, error: { code: 'not_found', message: '留言不存在' } }, 404); await ref.update(deletedBy(admin)); await recordAdminAudit(firebase, admin, request, 'delete', 'contact_message', id).catch(() => undefined); return json({ ok: true, data: { id, deleted: true } }); } catch { return json({ ok: false, error: { code: 'service_unavailable', message: '留言刪除失敗' } }, 503); }
}
