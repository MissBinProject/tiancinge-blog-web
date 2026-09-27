import { NextResponse } from 'next/server';
import { isPublicSlug } from '@tian-xin-ge/contracts';
import { authorizeAdminRequest } from '@/features/admin-auth/application/authorize';
import { articleContentChanged, articlePayload, validateArticleInput } from '@/features/admin-content/articles/article-schema';
import { firebaseServer } from '@/lib/firebase-admin';
import { readJsonObject } from '@/lib/request-body';
import { recordAdminAudit } from '@/features/admin-auth/infrastructure/audit';
import { deletedBy, isDeleted } from '@/features/admin-content/deletion';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
function json(payload: Record<string, unknown>, status = 200) { return NextResponse.json(payload, { status, headers: { 'Cache-Control': 'private, no-store' } }); }

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await authorizeAdminRequest(request)) return json({ ok: false, error: { code: 'unauthorized', message: '請先登入' } }, 401);
  const firebase = firebaseServer(); if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  const { id } = await context.params;
  try { const snapshot = await firebase.db.collection('articles').doc(id).get(); if (!snapshot.exists || isDeleted(snapshot.data())) return json({ ok: false, error: { code: 'not_found', message: '文章不存在' } }, 404); return json({ ok: true, data: { id, ...snapshot.data() } }); } catch { return json({ ok: false, error: { code: 'service_unavailable', message: '文章讀取失敗' } }, 503); }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await authorizeAdminRequest(request, true);
  if (!admin) return json({ ok: false, error: { code: 'forbidden', message: '無效的管理員 session 或請求驗證' } }, 403);
  const firebase = firebaseServer(); if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  const { id } = await context.params;
  const parsed = await readJsonObject(request, 512 * 1024);
  if (!parsed.ok) return json({ ok: false, error: { code: parsed.reason === 'too_large' ? 'too_large' : 'invalid_request', message: parsed.reason === 'too_large' ? '文章資料大小超過限制' : '資料格式不正確' } }, parsed.reason === 'too_large' ? 413 : 400);
  const body = parsed.value;
  try {
    const ref = firebase.db.collection('articles').doc(id); const current = await ref.get(); if (!current.exists || isDeleted(current.data())) return json({ ok: false, error: { code: 'not_found', message: '文章不存在' } }, 404);
    const currentVersion = Number.isInteger(current.data()?.version) ? Number(current.data()?.version) : 1;
    if (body.version != null && (!Number.isInteger(body.version) || Number(body.version) !== currentVersion)) return json({ ok: false, error: { code: 'conflict', message: '資料已被其他視窗更新，請重新載入後再儲存' } }, 409);
    const currentData = current.data() as Record<string, unknown>;
    if (body.type != null && body.type !== currentData.type) return json({ ok: false, error: { code: 'invalid_request', message: '文章類型不可修改' } }, 400);
    const currentSlug = String(currentData.slug ?? '');
    const nextSlug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : currentSlug;
    const merged = { ...currentData, ...body, slug: nextSlug } as Record<string, unknown>; const validationError = validateArticleInput(merged); if (validationError) return json({ ok: false, error: { code: 'invalid_request', message: validationError } }, 400);
    if (!isPublicSlug(nextSlug)) return json({ ok: false, error: { code: 'invalid_request', message: '文章網址格式不正確' } }, 400);
    if (nextSlug !== currentSlug) {
      const [duplicate, historical] = await Promise.all([
        firebase.db.collection('articles').where('slug', '==', nextSlug).limit(2).get(),
        firebase.db.collection('articles').where('previousSlugs', 'array-contains', nextSlug).limit(2).get(),
      ]);
      if ([...duplicate.docs, ...historical.docs].some((doc) => doc.id !== id)) return json({ ok: false, error: { code: 'conflict', message: '這個文章網址已被使用' } }, 409);
    }
    const contentChanged = articleContentChanged(currentData, merged);
    const payload = articlePayload(merged, nextSlug);
    const history = [...new Set([...(Array.isArray(currentData.previousSlugs) ? currentData.previousSlugs : []), ...(nextSlug !== currentSlug ? [currentSlug] : [])])]
      .filter((slug): slug is string => isPublicSlug(slug) && slug !== nextSlug).slice(-20);
    const update = { ...payload, previousSlugs: history, version: currentVersion + 1, ...(contentChanged ? { contentUpdatedAt: new Date() } : currentData.contentUpdatedAt ? { contentUpdatedAt: currentData.contentUpdatedAt } : {}) };
    await ref.update(update); await recordAdminAudit(firebase, admin, request, 'update', 'article', id).catch(() => undefined); return json({ ok: true, data: { id, slug: nextSlug, version: currentVersion + 1 } });
  } catch { return json({ ok: false, error: { code: 'service_unavailable', message: '文章儲存失敗' } }, 503); }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await authorizeAdminRequest(request, true);
  if (!admin) return json({ ok: false, error: { code: 'forbidden', message: '無效的管理員 session 或請求驗證' } }, 403);
  const firebase = firebaseServer(); if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  const { id } = await context.params;
  try { const ref = firebase.db.collection('articles').doc(id); const current = await ref.get(); if (!current.exists || isDeleted(current.data())) return json({ ok: false, error: { code: 'not_found', message: '文章不存在' } }, 404); await ref.update(deletedBy(admin)); await recordAdminAudit(firebase, admin, request, 'delete', 'article', id).catch(() => undefined); return json({ ok: true, data: { id, deleted: true } }); } catch { return json({ ok: false, error: { code: 'service_unavailable', message: '文章刪除失敗' } }, 503); }
}
