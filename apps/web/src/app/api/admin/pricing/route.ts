import { NextResponse } from 'next/server';
import { authorizeAdminRequest } from '@/features/admin-auth/application/authorize';
import { firebaseServer } from '@/lib/firebase-admin';
import { readJsonObject } from '@/lib/request-body';
import { recordAdminAudit } from '@/features/admin-auth/infrastructure/audit';
import { isDeleted } from '@/features/admin-content/deletion';
import { pricingPayload, validatePricingInput } from '@/features/admin-content/pricing/pricing-schema';

export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
function json(payload: Record<string, unknown>, status = 200) { return NextResponse.json(payload, { status, headers: { 'Cache-Control': 'private, no-store' } }); }

export async function GET(request: Request) {
  if (!await authorizeAdminRequest(request)) return json({ ok: false, error: { code: 'unauthorized', message: '請先登入' } }, 401);
  const firebase = firebaseServer(); if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  try { const snapshot = await firebase.db.collection('pricing_plans').orderBy('sortOrder').get(); return json({ ok: true, data: { items: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })).filter((row) => !isDeleted(row)) } }); } catch { return json({ ok: false, error: { code: 'service_unavailable', message: '價目資料讀取失敗' } }, 503); }
}

export async function POST(request: Request) {
  const admin = await authorizeAdminRequest(request, true); if (!admin) return json({ ok: false, error: { code: 'forbidden', message: '無效的管理員 session 或請求驗證' } }, 403);
  const firebase = firebaseServer(); if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  const parsed = await readJsonObject(request, 64 * 1024); if (!parsed.ok) return json({ ok: false, error: { code: 'invalid_request', message: '資料格式不正確' } }, 400);
  const validationError = validatePricingInput(parsed.value); if (validationError) return json({ ok: false, error: { code: 'invalid_request', message: validationError } }, 400);
  try { const ref = await firebase.db.collection('pricing_plans').add({ ...pricingPayload(parsed.value), version: 1, createdAt: new Date() }); await recordAdminAudit(firebase, admin, request, 'create', 'pricing_plan', ref.id).catch(() => undefined); return json({ ok: true, data: { id: ref.id, version: 1 } }, 201); } catch { return json({ ok: false, error: { code: 'service_unavailable', message: '價目儲存失敗' } }, 503); }
}
