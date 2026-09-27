import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { authorizeAdminRequest } from '@/features/admin-auth/application/authorize';
import { recordAdminAudit } from '@/features/admin-auth/infrastructure/audit';
import { isDeleted } from '@/features/admin-content/deletion';
import { isRecycleAction, isRecycleCollection, recycleResourceType } from '@/features/admin-content/recycle';
import { firebaseServer } from '@/lib/firebase-admin';
import { readJsonObject } from '@/lib/request-body';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(payload: Record<string, unknown>, status = 200) {
  return NextResponse.json(payload, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

function dateValue(value: unknown): string | undefined {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) return value.toISOString();
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    const date = (value as { toDate: () => Date }).toDate();
    return date instanceof Date && !Number.isNaN(date.valueOf()) ? date.toISOString() : undefined;
  }
  return typeof value === 'string' && !Number.isNaN(new Date(value).valueOf()) ? new Date(value).toISOString() : undefined;
}

/** List only minimal metadata for recovery operations; never return PII/body. */
export async function GET(request: Request) {
  const admin = await authorizeAdminRequest(request);
  if (!admin) return json({ ok: false, error: { code: 'unauthorized', message: '請先登入' } }, 401);
  const firebase = firebaseServer();
  if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  const params = new URL(request.url).searchParams;
  const collection = params.get('collection');
  const limit = Math.min(Math.max(Number(params.get('limit') || 50), 1), 100);
  if (!isRecycleCollection(collection)) return json({ ok: false, error: { code: 'invalid_request', message: '回收資料類型不正確' } }, 400);
  try {
    const snapshot = await firebase.db.collection(collection).orderBy('deletedAt', 'desc').limit(limit).get();
    const items = snapshot.docs.filter((doc) => isDeleted(doc.data())).map((doc) => {
      const row = doc.data();
      const label = collection === 'articles' ? row.title : collection === 'services' ? row.name : collection === 'media_assets' ? row.name : collection === 'article_categories' ? row.name : row.name;
      return { id: doc.id, label: typeof label === 'string' ? label.slice(0, 160) : undefined, slug: collection === 'articles' || collection === 'services' ? String(row.slug || '') : undefined, mimeType: collection === 'media_assets' ? String(row.mimeType || '') : undefined, status: collection === 'articles' || collection === 'contact_messages' ? String(row.status || '') : undefined, deletedAt: dateValue(row.deletedAt), deletedBy: typeof row.deletedBy === 'string' ? row.deletedBy : undefined };
    });
    return json({ ok: true, data: { collection, items, nextCursor: null } });
  } catch {
    return json({ ok: false, error: { code: 'service_unavailable', message: '回收列表讀取失敗' } }, 503);
  }
}

/**
 * Controlled recycle-bin operation. Normal CRUD routes never expose deleted
 * rows. Restore and purge require a live admin session plus CSRF protection;
 * purge additionally requires an explicit confirmation phrase.
 */
export async function POST(request: Request) {
  const admin = await authorizeAdminRequest(request, true);
  if (!admin) return json({ ok: false, error: { code: 'forbidden', message: '無效的管理員 session 或請求驗證' } }, 403);
  const firebase = firebaseServer();
  if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  const parsed = await readJsonObject(request, 16 * 1024);
  if (!parsed.ok) return json({ ok: false, error: { code: parsed.reason === 'too_large' ? 'too_large' : 'invalid_request', message: '回收操作格式不正確' } }, parsed.reason === 'too_large' ? 413 : 400);
  const collection = parsed.value.collection;
  const id = typeof parsed.value.id === 'string' ? parsed.value.id.trim() : '';
  const action = parsed.value.action;
  if (!isRecycleCollection(collection) || !isRecycleAction(action) || !/^[A-Za-z0-9_-]{1,160}$/.test(id)) {
    return json({ ok: false, error: { code: 'invalid_request', message: '回收操作參數不正確' } }, 400);
  }
  if (action === 'purge' && parsed.value.confirm !== 'PURGE') {
    return json({ ok: false, error: { code: 'confirmation_required', message: '永久清除需要輸入 PURGE 確認' } }, 400);
  }
  const ref = firebase.db.collection(collection).doc(id);
  try {
    const snapshot = await ref.get();
    const row = (snapshot.data() || {}) as Record<string, unknown>;
    if (!snapshot.exists || !isDeleted(row)) return json({ ok: false, error: { code: 'not_found', message: '回收項目不存在' } }, 404);
    const resourceType = recycleResourceType(collection);
    if (action === 'restore') {
      // Clear both current and legacy tombstone fields so an imported legacy
      // record is fully restored and remains visible to all readers.
      await ref.update({ deletedAt: FieldValue.delete(), deletedBy: FieldValue.delete(), deleted_at: FieldValue.delete(), updatedAt: new Date() });
      await recordAdminAudit(firebase, admin, request, 'restore', resourceType, id).catch(() => undefined);
      return json({ ok: true, data: { id, restored: true } });
    }
    if (collection === 'media_assets' && row.storagePath) {
      await firebase.storage.bucket().file(String(row.storagePath)).delete().catch((error: unknown) => {
        const code = error && typeof error === 'object' && 'code' in error ? String((error as { code: unknown }).code) : '';
        if (code !== '404') throw error;
      });
    }
    await ref.delete();
    await recordAdminAudit(firebase, admin, request, 'purge', resourceType, id).catch(() => undefined);
    return json({ ok: true, data: { id, purged: true } });
  } catch {
    return json({ ok: false, error: { code: 'service_unavailable', message: action === 'restore' ? '回收項目復原失敗' : '回收項目永久清除失敗' } }, 503);
  }
}
