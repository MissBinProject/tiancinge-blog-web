import { NextResponse } from 'next/server';
import { createContentCode, isPublicSlug } from '@tian-xin-ge/contracts';
import { authorizeAdminRequest } from '@/features/admin-auth/application/authorize';
import { articleMatches, decodeArticleCursor, encodeArticleCursor } from '@/features/admin-content/articles/article-list';
import { articlePayload, articleContentChanged, validateArticleInput } from '@/features/admin-content/articles/article-schema';
import { firebaseServer } from '@/lib/firebase-admin';
import { readJsonObject } from '@/lib/request-body';
import { recordAdminAudit } from '@/features/admin-auth/infrastructure/audit';
import { isDeleted } from '@/features/admin-content/deletion';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const MAX_SCAN = 200;
function json(payload: Record<string, unknown>, status = 200) { return NextResponse.json(payload, { status, headers: { 'Cache-Control': 'private, no-store' } }); }

export async function GET(request: Request) {
  if (!await authorizeAdminRequest(request)) return json({ ok: false, error: { code: 'unauthorized', message: '請先登入' } }, 401);
  const firebase = firebaseServer();
  if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  const params = new URL(request.url).searchParams;
  const type = params.get('type');
  const status = params.get('status');
  const q = (params.get('q') || '').trim().slice(0, 120);
  const limit = Math.min(Math.max(Number(params.get('limit') || 20), 1), 100);
  const cursor = decodeArticleCursor(params.get('cursor'));
  if (type && type !== 'news' && type !== 'blog') return json({ ok: false, error: { code: 'invalid_request', message: '文章類型不正確' } }, 400);
  if (status && status !== 'draft' && status !== 'scheduled' && status !== 'published') return json({ ok: false, error: { code: 'invalid_request', message: '文章狀態不正確' } }, 400);
  try {
    const snapshot = await firebase.db.collection('articles').limit(MAX_SCAN).get();
    const matched = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Record<string, unknown>)
      .filter((row) => !isDeleted(row))
      .filter((row) => articleMatches(row, type as 'news' | 'blog' | null, status as 'draft' | 'published' | null, q))
      .sort((a, b) => { const date = String(b.publishedAt ?? '').localeCompare(String(a.publishedAt ?? '')); return date || String(b.id).localeCompare(String(a.id)); })
      .filter((row) => !cursor || String(row.publishedAt ?? '') < cursor.publishedAt || (String(row.publishedAt ?? '') === cursor.publishedAt && String(row.id) < cursor.id));
    const page = matched.slice(0, limit);
    const last = page.length ? page[page.length - 1] : undefined;
    return json({ ok: true, data: { items: page, nextCursor: matched.length > limit && last ? encodeArticleCursor({ publishedAt: String(last.publishedAt ?? ''), id: String(last.id) }) : null, scanned: MAX_SCAN } });
  } catch { return json({ ok: false, error: { code: 'service_unavailable', message: '文章列表讀取失敗' } }, 503); }
}

export async function POST(request: Request) {
  const admin = await authorizeAdminRequest(request, true);
  if (!admin) return json({ ok: false, error: { code: 'forbidden', message: '無效的管理員 session 或請求驗證' } }, 403);
  const firebase = firebaseServer();
  if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  const parsed = await readJsonObject(request, 512 * 1024);
  if (!parsed.ok) return json({ ok: false, error: { code: parsed.reason === 'too_large' ? 'too_large' : 'invalid_request', message: parsed.reason === 'too_large' ? '文章資料大小超過限制' : '資料格式不正確' } }, parsed.reason === 'too_large' ? 413 : 400);
  const body = parsed.value;
  const validationError = validateArticleInput(body);
  if (validationError) return json({ ok: false, error: { code: 'invalid_request', message: validationError } }, 400);
  try {
    const slug = typeof body.slug === 'string' && body.slug.trim() ? body.slug.trim().toLowerCase() : createContentCode();
    if (!isPublicSlug(slug)) return json({ ok: false, error: { code: 'invalid_request', message: '文章網址格式不正確' } }, 400);
    const [duplicate, historical] = await Promise.all([
      firebase.db.collection('articles').where('slug', '==', slug).limit(1).get(),
      firebase.db.collection('articles').where('previousSlugs', 'array-contains', slug).limit(1).get(),
    ]);
    if (!duplicate.empty || !historical.empty) return json({ ok: false, error: { code: 'conflict', message: '這個文章網址已被使用' } }, 409);
    const now = new Date();
    const ref = await firebase.db.collection('articles').add({ ...articlePayload(body, slug), previousSlugs: [], contentUpdatedAt: now, version: 1, createdAt: now });
    await recordAdminAudit(firebase, admin, request, 'create', 'article', ref.id).catch(() => undefined);
    return json({ ok: true, data: { id: ref.id, slug, version: 1 } }, 201);
  } catch { return json({ ok: false, error: { code: 'service_unavailable', message: '文章儲存失敗' } }, 503); }
}
