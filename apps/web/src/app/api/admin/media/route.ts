import { NextResponse } from 'next/server';
import { authorizeAdminRequest } from '@/features/admin-auth/application/authorize';
import { firebaseServer } from '@/lib/firebase-admin';
import { mediaDownloadUrl, mediaStoragePath, validateImageBuffer } from '@/features/admin-content/media/media-utils';

export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
const MAX_LIST = 100;
function json(payload: Record<string, unknown>, status = 200) { return NextResponse.json(payload, { status, headers: { 'Cache-Control': 'private, no-store' } }); }

export async function GET(request: Request) {
  if (!await authorizeAdminRequest(request)) return json({ ok: false, error: { code: 'unauthorized', message: '請先登入' } }, 401);
  const firebase = firebaseServer(); if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  const limit = Math.min(Math.max(Number(new URL(request.url).searchParams.get('limit') || 20), 1), MAX_LIST);
  try { const snapshot = await firebase.db.collection('media_assets').orderBy('createdAt', 'desc').limit(limit).get(); return json({ ok: true, data: { items: snapshot.docs.map((item) => ({ id: item.id, ...item.data() })), nextCursor: null } }); } catch { return json({ ok: false, error: { code: 'service_unavailable', message: '素材列表讀取失敗' } }, 503); }
}

export async function POST(request: Request) {
  if (!await authorizeAdminRequest(request, true)) return json({ ok: false, error: { code: 'forbidden', message: '無效的管理員 session 或請求驗證' } }, 403);
  const firebase = firebaseServer(); if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  const contentType = request.headers.get('content-type') || ''; if (!contentType.toLowerCase().startsWith('multipart/form-data')) return json({ ok: false, error: { code: 'invalid_request', message: '請使用圖片上傳格式' } }, 400);
  let file: File; let alt = '';
  try { const form = await request.formData(); const candidate = form.get('file'); if (!(candidate instanceof File)) return json({ ok: false, error: { code: 'invalid_request', message: '請選擇圖片檔案' } }, 400); file = candidate; alt = String(form.get('alt') || '').trim().slice(0, 160); } catch { return json({ ok: false, error: { code: 'invalid_request', message: '上傳資料格式不正確' } }, 400); }
  if (file.size > 10 * 1024 * 1024) return json({ ok: false, error: { code: 'too_large', message: '圖片單檔上限 10 MB' } }, 413);
  try {
    const buffer = new Uint8Array(await file.arrayBuffer()); const dimensions = validateImageBuffer(buffer, file.type); if (!dimensions) return json({ ok: false, error: { code: 'invalid_request', message: '圖片格式或尺寸不符合限制' } }, 400);
    const path = mediaStoragePath(file.name); const token = crypto.randomUUID(); const object = firebase.storage.bucket().file(path);
    await object.save(Buffer.from(buffer), { resumable: false, metadata: { contentType: file.type, metadata: { firebaseStorageDownloadTokens: token } } });
    const url = mediaDownloadUrl(firebase.storage.bucket().name, path, token);
    try { const ref = await firebase.db.collection('media_assets').add({ name: file.name.slice(0, 160), url, storagePath: path, alt, mimeType: file.type, size: buffer.byteLength, width: dimensions.width, height: dimensions.height, createdAt: new Date(), updatedAt: new Date() }); return json({ ok: true, data: { id: ref.id, url, storagePath: path, width: dimensions.width, height: dimensions.height } }, 201); } catch (error) { await object.delete().catch(() => undefined); throw error; }
  } catch { return json({ ok: false, error: { code: 'service_unavailable', message: '素材上傳失敗' } }, 503); }
}
