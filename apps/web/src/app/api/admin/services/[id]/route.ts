import { NextResponse } from 'next/server';
import { isPublicSlug } from '@tian-xin-ge/contracts';
import { authorizeAdminRequest } from '@/features/admin-auth/application/authorize';
import { validateServiceInput, serviceContentChanged, servicePayload } from '@/features/admin-content/services/service-schema';
import { firebaseServer } from '@/lib/firebase-admin';
import { readJsonObject } from '@/lib/request-body';
import { recordAdminAudit } from '@/features/admin-auth/infrastructure/audit';
import { deletedBy, isDeleted } from '@/features/admin-content/deletion';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(payload: Record<string, unknown>, status = 200) { return NextResponse.json(payload, { status, headers: { 'Cache-Control': 'private, no-store' } }); }

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await authorizeAdminRequest(request, true);
  if (!admin) return json({ ok: false, error: { code: 'forbidden', message: '無效的管理員 session 或請求驗證' } }, 403);
  const firebase = firebaseServer();
  if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  const { id } = await context.params;
  const parsed = await readJsonObject(request, 64 * 1024);
  if (!parsed.ok) return json({ ok: false, error: { code: parsed.reason === 'too_large' ? 'too_large' : 'invalid_request', message: parsed.reason === 'too_large' ? '資料大小超過限制' : '資料格式不正確' } }, parsed.reason === 'too_large' ? 413 : 400);
  const body = parsed.value;
  const current = await firebase.db.collection('services').doc(id).get();
  if (!current.exists || isDeleted(current.data())) return json({ ok: false, error: { code: 'not_found', message: '服務不存在' } }, 404);
  const currentVersion = Number.isInteger(current.data()?.version) ? Number(current.data()?.version) : 1;
  if (body.version != null && (!Number.isInteger(body.version) || Number(body.version) !== currentVersion)) return json({ ok: false, error: { code: 'conflict', message: '資料已被其他視窗更新，請重新載入後再儲存' } }, 409);
  const currentData = current.data() ?? {};
  const currentSlug = String(currentData.slug ?? '');
  const nextSlug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : currentSlug;
  const merged = { ...currentData, ...body, slug: nextSlug } as Record<string, unknown>;
  const validationError = validateServiceInput(merged);
  if (validationError) return json({ ok: false, error: { code: 'invalid_request', message: validationError } }, 400);
  if (!isPublicSlug(nextSlug)) return json({ ok: false, error: { code: 'invalid_request', message: '服務網址格式不正確' } }, 400);
  try {
    if (nextSlug !== currentSlug) {
      const [duplicate, historical] = await Promise.all([
        firebase.db.collection('services').where('slug', '==', nextSlug).limit(2).get(),
        firebase.db.collection('services').where('previousSlugs', 'array-contains', nextSlug).limit(2).get(),
      ]);
      if ([...duplicate.docs, ...historical.docs].some((doc) => doc.id !== id)) return json({ ok: false, error: { code: 'conflict', message: '這個服務網址已被使用' } }, 409);
    }
    const contentUpdatedAt = serviceContentChanged(currentData, merged) ? new Date() : currentData.contentUpdatedAt;
    const history = [...new Set([...(Array.isArray(currentData.previousSlugs) ? currentData.previousSlugs : []), ...(nextSlug !== currentSlug ? [currentSlug] : [])])]
      .filter((slug): slug is string => isPublicSlug(slug) && slug !== nextSlug).slice(-20);
    const payload = servicePayload(merged, nextSlug, { contentUpdatedAt: contentUpdatedAt ?? null });
    const batch = firebase.db.batch();
    batch.update(current.ref, { ...payload, previousSlugs: history, version: currentVersion + 1 });
    if (nextSlug !== currentSlug) {
      const pricing = await firebase.db.collection('pricing_plans').where('relatedServiceSlugs', 'array-contains', currentSlug).get();
      for (const plan of pricing.docs) {
        const row = plan.data();
        const slugs = Array.isArray(row.relatedServiceSlugs) ? row.relatedServiceSlugs : [];
        batch.update(plan.ref, { relatedServiceSlugs: [...new Set(slugs.map((slug) => slug === currentSlug ? nextSlug : slug))], version: (Number.isInteger(row.version) ? row.version : 1) + 1, updatedAt: new Date() });
      }
    }
    await batch.commit();
    await recordAdminAudit(firebase, admin, request, 'update', 'service', id).catch(() => undefined);
    return json({ ok: true, data: { id, slug: nextSlug, version: currentVersion + 1 } });
  } catch { return json({ ok: false, error: { code: 'service_unavailable', message: '服務儲存失敗' } }, 503); }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await authorizeAdminRequest(request, true);
  if (!admin) return json({ ok: false, error: { code: 'forbidden', message: '無效的管理員 session 或請求驗證' } }, 403);
  const firebase = firebaseServer();
  if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  const { id } = await context.params;
  try { const ref = firebase.db.collection('services').doc(id); const snapshot = await ref.get(); if (!snapshot.exists || isDeleted(snapshot.data())) return json({ ok: false, error: { code: 'not_found', message: '服務不存在' } }, 404); await ref.update(deletedBy(admin)); await recordAdminAudit(firebase, admin, request, 'delete', 'service', id).catch(() => undefined); return json({ ok: true, data: { id, deleted: true } }); } catch { return json({ ok: false, error: { code: 'service_unavailable', message: '服務刪除失敗' } }, 503); }
}
