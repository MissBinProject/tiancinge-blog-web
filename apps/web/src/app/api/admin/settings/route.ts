import { NextResponse } from 'next/server';
import { authorizeAdminRequest } from '@/features/admin-auth/application/authorize';
import { SETTINGS_KEYS, validateSettingsPatch } from '@/features/admin-content/settings/settings-schema';
import { firebaseServer } from '@/lib/firebase-admin';

export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
function json(payload: Record<string, unknown>, status = 200) { return NextResponse.json(payload, { status, headers: { 'Cache-Control': 'private, no-store' } }); }

export async function GET(request: Request) {
  if (!await authorizeAdminRequest(request)) return json({ ok: false, error: { code: 'unauthorized', message: '請先登入' } }, 401);
  const firebase = firebaseServer(); if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  try { const snapshot = await firebase.db.collection('site_settings').doc('singleton').get(); if (!snapshot.exists) return json({ ok: false, error: { code: 'not_found', message: '網站設定尚未建立' } }, 404); const row = snapshot.data() || {}; return json({ ok: true, data: Object.fromEntries(SETTINGS_KEYS.map((key) => [key, row[key] ?? null])) }); } catch { return json({ ok: false, error: { code: 'service_unavailable', message: '網站設定讀取失敗' } }, 503); }
}

export async function PATCH(request: Request) {
  if (!await authorizeAdminRequest(request, true)) return json({ ok: false, error: { code: 'forbidden', message: '無效的管理員 session 或請求驗證' } }, 403);
  const firebase = firebaseServer(); if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  let body: Record<string, unknown>; try { body = await request.json() as Record<string, unknown>; } catch { return json({ ok: false, error: { code: 'invalid_request', message: '資料格式不正確' } }, 400); }
  const validationError = validateSettingsPatch(body); if (validationError) return json({ ok: false, error: { code: 'invalid_request', message: validationError } }, 400);
  try { await firebase.db.collection('site_settings').doc('singleton').set({ ...body, updatedAt: new Date() }, { merge: true }); return json({ ok: true, data: { updatedAt: new Date().toISOString() } }); } catch { return json({ ok: false, error: { code: 'service_unavailable', message: '網站設定儲存失敗' } }, 503); }
}
