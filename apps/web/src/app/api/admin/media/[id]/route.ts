import { NextResponse } from 'next/server';
import { authorizeAdminRequest } from '@/features/admin-auth/application/authorize';
import { firebaseServer } from '@/lib/firebase-admin';

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
  if (!await authorizeAdminRequest(request, true)) return json({ ok: false, error: { code: 'forbidden', message: '無效的管理員 session 或請求驗證' } }, 403);
  const firebase = firebaseServer(); if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  let body: Record<string, unknown>; try { body = await request.json() as Record<string, unknown>; } catch { return json({ ok: false, error: { code: 'invalid_request', message: '資料格式不正確' } }, 400); }
  if (Object.keys(body).some((key) => key !== 'alt') || typeof body.alt !== 'string' || body.alt.length > 160) return json({ ok: false, error: { code: 'invalid_request', message: '只允許修改替代文字' } }, 400);
  const id = (await context.params).id; try { const ref = firebase.db.collection('media_assets').doc(id); const current = await ref.get(); if (!current.exists) return json({ ok: false, error: { code: 'not_found', message: '素材不存在' } }, 404); await ref.update({ alt: body.alt.trim(), updatedAt: new Date() }); return json({ ok: true, data: { id } }); } catch { return json({ ok: false, error: { code: 'service_unavailable', message: '替代文字儲存失敗' } }, 503); }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await authorizeAdminRequest(request, true)) return json({ ok: false, error: { code: 'forbidden', message: '無效的管理員 session 或請求驗證' } }, 403);
  const firebase = firebaseServer(); if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  const id = (await context.params).id; try { const ref = firebase.db.collection('media_assets').doc(id); const current = await ref.get(); if (!current.exists) return json({ ok: false, error: { code: 'not_found', message: '素材不存在' } }, 404); const row = current.data() || {}; if (await isInUse(firebase, id, String(row.url || ''))) return json({ ok: false, error: { code: 'conflict', message: '正在使用的素材無法刪除，請先替換所有引用' } }, 409); if (row.storagePath) await firebase.storage.bucket().file(String(row.storagePath)).delete().catch((error: unknown) => { const code = error && typeof error === 'object' && 'code' in error ? String((error as { code: unknown }).code) : ''; if (code !== '404') throw error; }); await ref.delete(); return json({ ok: true, data: { id } }); } catch { return json({ ok: false, error: { code: 'service_unavailable', message: '素材刪除失敗' } }, 503); }
}
