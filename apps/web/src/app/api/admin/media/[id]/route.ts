import { NextResponse } from 'next/server';
import { authorizeAdminRequest } from '@/features/admin-auth/application/authorize';
import { firebaseServer } from '@/lib/firebase-admin';
import { readJsonObject } from '@/lib/request-body';
import { recordAdminAudit } from '@/features/admin-auth/infrastructure/audit';
import { deletedBy, isDeleted } from '@/features/admin-content/deletion';

export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
function json(payload: Record<string, unknown>, status = 200) { return NextResponse.json(payload, { status, headers: { 'Cache-Control': 'private, no-store' } }); }
async function isInUse(firebase: NonNullable<ReturnType<typeof firebaseServer>>, id: string, url: string): Promise<boolean> {
  const [services, articles, settings] = await Promise.all([firebase.db.collection('services').get(), firebase.db.collection('articles').get(), firebase.db.collection('site_settings').doc('singleton').get()]);
  const usedInServices = services.docs.some((item) => { const row = item.data(); return row.imageUrl === url || row.imageMediaId === id; });
  const usedInArticles = articles.docs.some((item) => { const row = item.data(); return row.coverUrl === url || row.coverMediaId === id || JSON.stringify(row.body || []).includes(url) || JSON.stringify(row.body || []).includes(id); });
  const usedInSettings = Object.values(settings.data() || {}).some((value) => value === url || value === id);
  return usedInServices || usedInArticles || usedInSettings;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await authorizeAdminRequest(request, true);
  if (!admin) return json({ ok: false, error: { code: 'forbidden', message: '無效的管理員 session 或請求驗證' } }, 403);
  const firebase = firebaseServer(); if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  const parsed = await readJsonObject(request, 64 * 1024);
  if (!parsed.ok) return json({ ok: false, error: { code: parsed.reason === 'too_large' ? 'too_large' : 'invalid_request', message: parsed.reason === 'too_large' ? '資料大小超過限制' : '資料格式不正確' } }, parsed.reason === 'too_large' ? 413 : 400);
  const body = parsed.value;
  if (Object.keys(body).some((key) => key !== 'alt') || typeof body.alt !== 'string' || body.alt.length > 160) return json({ ok: false, error: { code: 'invalid_request', message: '只允許修改替代文字' } }, 400);
  const id = (await context.params).id; try { const ref = firebase.db.collection('media_assets').doc(id); const current = await ref.get(); if (!current.exists || isDeleted(current.data())) return json({ ok: false, error: { code: 'not_found', message: '素材不存在' } }, 404); await ref.update({ alt: body.alt.trim(), updatedAt: new Date() }); await recordAdminAudit(firebase, admin, request, 'update', 'media_asset', id).catch(() => undefined); return json({ ok: true, data: { id } }); } catch { return json({ ok: false, error: { code: 'service_unavailable', message: '替代文字儲存失敗' } }, 503); }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await authorizeAdminRequest(request, true);
  if (!admin) return json({ ok: false, error: { code: 'forbidden', message: '無效的管理員 session 或請求驗證' } }, 403);
  const firebase = firebaseServer(); if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  const id = (await context.params).id; try { const ref = firebase.db.collection('media_assets').doc(id); const current = await ref.get(); if (!current.exists || isDeleted(current.data())) return json({ ok: false, error: { code: 'not_found', message: '素材不存在' } }, 404); const row = current.data() || {}; if (await isInUse(firebase, id, String(row.url || ''))) return json({ ok: false, error: { code: 'conflict', message: '正在使用的素材無法刪除，請先替換所有引用' } }, 409); await ref.update(deletedBy(admin)); await recordAdminAudit(firebase, admin, request, 'delete', 'media_asset', id).catch(() => undefined); return json({ ok: true, data: { id, deleted: true } }); } catch { return json({ ok: false, error: { code: 'service_unavailable', message: '素材刪除失敗' } }, 503); }
}
