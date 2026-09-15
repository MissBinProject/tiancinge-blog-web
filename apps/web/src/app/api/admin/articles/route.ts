import { NextResponse } from 'next/server';
import { createContentCode } from '@tian-xin-ge/contracts';
import { authorizeAdminRequest } from '@/features/admin-auth/application/authorize';
import { articleMatches, decodeArticleCursor, encodeArticleCursor } from '@/features/admin-content/articles/article-list';
import { articlePayload, validateArticleInput } from '@/features/admin-content/articles/article-schema';
import { firebaseServer } from '@/lib/firebase-admin';

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
  if (status && status !== 'draft' && status !== 'published') return json({ ok: false, error: { code: 'invalid_request', message: '文章狀態不正確' } }, 400);
  try {
    const snapshot = await firebase.db.collection('articles').limit(MAX_SCAN).get();
    const matched = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Record<string, unknown>)
      .filter((row) => articleMatches(row, type as 'news' | 'blog' | null, status as 'draft' | 'published' | null, q))
      .sort((a, b) => { const date = String(b.publishedAt ?? '').localeCompare(String(a.publishedAt ?? '')); return date || String(b.id).localeCompare(String(a.id)); })
      .filter((row) => !cursor || String(row.publishedAt ?? '') < cursor.publishedAt || (String(row.publishedAt ?? '') === cursor.publishedAt && String(row.id) < cursor.id));
    const page = matched.slice(0, limit);
    const last = page.length ? page[page.length - 1] : undefined;
    return json({ ok: true, data: { items: page, nextCursor: matched.length > limit && last ? encodeArticleCursor({ publishedAt: String(last.publishedAt ?? ''), id: String(last.id) }) : null, scanned: MAX_SCAN } });
  } catch { return json({ ok: false, error: { code: 'service_unavailable', message: '文章列表讀取失敗' } }, 503); }
}

export async function POST(request: Request) {
  if (!await authorizeAdminRequest(request, true)) return json({ ok: false, error: { code: 'forbidden', message: '無效的管理員 session 或請求驗證' } }, 403);
  const firebase = firebaseServer();
  if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return json({ ok: false, error: { code: 'invalid_request', message: '資料格式不正確' } }, 400); }
  const validationError = validateArticleInput(body);
  if (validationError) return json({ ok: false, error: { code: 'invalid_request', message: validationError } }, 400);
  try {
    let slug = createContentCode();
    for (let attempt = 0; attempt < 5; attempt += 1) { const duplicate = await firebase.db.collection('articles').where('slug', '==', slug).limit(1).get(); if (duplicate.empty) break; slug = createContentCode(); }
    const ref = await firebase.db.collection('articles').add({ ...articlePayload(body, slug), createdAt: new Date() });
    return json({ ok: true, data: { id: ref.id, slug } }, 201);
  } catch { return json({ ok: false, error: { code: 'service_unavailable', message: '文章儲存失敗' } }, 503); }
}
