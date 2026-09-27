import { NextResponse } from 'next/server';
import { authorizeAdminRequest } from '@/features/admin-auth/application/authorize';
import { firebaseServer } from '@/lib/firebase-admin';
import { MAX_IMAGE_BYTES, MAX_MEDIA_BYTES, MAX_VIDEO_BYTES, isSupportedMediaMimeType, mediaDownloadUrl, mediaStoragePath, normalizeImageBuffer, validateVideoBuffer } from '@/features/admin-content/media/media-utils';
import { recordAdminAudit } from '@/features/admin-auth/infrastructure/audit';
import { readRequestBytes } from '@/lib/request-body';
import { isDeleted } from '@/features/admin-content/deletion';

export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
const MAX_LIST = 100;
const MAX_MULTIPART_BYTES = MAX_MEDIA_BYTES + 64 * 1024;
function json(payload: Record<string, unknown>, status = 200) { return NextResponse.json(payload, { status, headers: { 'Cache-Control': 'private, no-store' } }); }

export async function GET(request: Request) {
  if (!await authorizeAdminRequest(request)) return json({ ok: false, error: { code: 'unauthorized', message: '請先登入' } }, 401);
  const firebase = firebaseServer(); if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  const limit = Math.min(Math.max(Number(new URL(request.url).searchParams.get('limit') || 20), 1), MAX_LIST);
  try { const snapshot = await firebase.db.collection('media_assets').orderBy('createdAt', 'desc').limit(limit).get(); return json({ ok: true, data: { items: snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).filter((row) => !isDeleted(row)), nextCursor: null } }); } catch { return json({ ok: false, error: { code: 'service_unavailable', message: '素材列表讀取失敗' } }, 503); }
}

export async function POST(request: Request) {
  const admin = await authorizeAdminRequest(request, true);
  if (!admin) return json({ ok: false, error: { code: 'forbidden', message: '無效的管理員 session 或請求驗證' } }, 403);
  const firebase = firebaseServer(); if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  const contentType = request.headers.get('content-type') || ''; if (!contentType.toLowerCase().startsWith('multipart/form-data')) return json({ ok: false, error: { code: 'invalid_request', message: '請使用媒體上傳格式' } }, 400);
  const advertisedLength = Number(request.headers.get('content-length') || 0);
  if (Number.isFinite(advertisedLength) && advertisedLength > MAX_MULTIPART_BYTES) return json({ ok: false, error: { code: 'too_large', message: '上傳資料過大' } }, 413);
  const body = await readRequestBytes(request, MAX_MULTIPART_BYTES);
  if (!body.ok) return json({ ok: false, error: { code: body.reason === 'too_large' ? 'too_large' : 'invalid_request', message: body.reason === 'too_large' ? '上傳資料過大' : '上傳資料格式不正確' } }, body.reason === 'too_large' ? 413 : 400);
  let file: File; let alt = '';
  try {
    const buffered = new Request(request.url, { method: request.method, headers: request.headers, body: body.bytes, duplex: 'half' } as RequestInit & { duplex: 'half' });
    const form = await buffered.formData();
    const fileEntries = Array.from(form.values()).filter((value): value is File => value instanceof File);
    const candidate = form.get('file');
    if (!(candidate instanceof File) || fileEntries.length !== 1 || form.has('files')) return json({ ok: false, error: { code: 'invalid_request', message: '請一次只上傳一個媒體檔案' } }, 400);
    file = candidate;
    alt = String(form.get('alt') || '').trim().slice(0, 160);
  } catch { return json({ ok: false, error: { code: 'invalid_request', message: '上傳資料格式不正確' } }, 400); }
  if (!isSupportedMediaMimeType(file.type)) return json({ ok: false, error: { code: 'invalid_request', message: '僅支援 JPEG、PNG、WebP、MP4、WebM、MOV' } }, 400);
  const isVideo = file.type.startsWith('video/');
  const sizeLimit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > sizeLimit) return json({ ok: false, error: { code: 'too_large', message: isVideo ? '影片單檔上限 25 MB' : '圖片單檔上限 10 MB' } }, 413);
  try {
    const buffer = new Uint8Array(await file.arrayBuffer());
    const normalized = isVideo ? null : await normalizeImageBuffer(buffer, file.type);
    if (isVideo ? !validateVideoBuffer(buffer, file.type) : !normalized) return json({ ok: false, error: { code: 'invalid_request', message: isVideo ? '影片格式或內容不符合限制' : '圖片格式、尺寸或內容不符合限制' } }, 400);
    const storedMimeType = isVideo ? file.type : 'image/webp';
    const storedData = isVideo ? Buffer.from(buffer) : normalized!.data;
    const storedName = isVideo ? file.name : file.name.replace(/\.[^.]+$/, '') + '.webp';
    const path = mediaStoragePath(storedName); const token = crypto.randomUUID(); const object = firebase.storage.bucket().file(path);
    await object.save(storedData, { resumable: false, metadata: { contentType: storedMimeType, metadata: { firebaseStorageDownloadTokens: token } } });
    const url = mediaDownloadUrl(firebase.storage.bucket().name, path, token);
    try {
      const dimensions = normalized ? { width: normalized.width, height: normalized.height } : {};
      const ref = await firebase.db.collection('media_assets').add({ name: file.name.slice(0, 160), url, storagePath: path, alt, mimeType: storedMimeType, originalMimeType: file.type, size: storedData.byteLength, ...dimensions, createdAt: new Date(), updatedAt: new Date() });
      await recordAdminAudit(firebase, admin, request, 'create', 'media_asset', ref.id).catch(() => undefined);
      return json({ ok: true, data: { id: ref.id, name: file.name.slice(0, 160), url, storagePath: path, mimeType: storedMimeType, size: storedData.byteLength, ...dimensions } }, 201);
    } catch (error) { await object.delete().catch(() => undefined); throw error; }
  } catch { return json({ ok: false, error: { code: 'service_unavailable', message: '素材上傳失敗' } }, 503); }
}
