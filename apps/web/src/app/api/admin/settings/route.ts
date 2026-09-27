import { NextResponse } from 'next/server';
import { authorizeAdminRequest } from '@/features/admin-auth/application/authorize';
import { SETTINGS_KEYS, validateSettingsPatch } from '@/features/admin-content/settings/settings-schema';
import { firebaseServer } from '@/lib/firebase-admin';
import { readJsonObject } from '@/lib/request-body';
import { recordAdminAudit } from '@/features/admin-auth/infrastructure/audit';

export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
function json(payload: Record<string, unknown>, status = 200) { return NextResponse.json(payload, { status, headers: { 'Cache-Control': 'private, no-store' } }); }
function lineUrlFromInput(value: string): string | null {
  const input = value.trim();
  if (!input) return null;
  const direct = input.startsWith('line.me/') ? `https://${input}` : input;
  if (/^https:\/\/[^\s]+$/i.test(direct)) return direct;
  const lineId = input.startsWith('@') ? input : `@${input}`;
  return `https://line.me/ti/p/${lineId}`;
}
const SOCIAL_KEYS = ['instagram', 'facebook', 'youtube'] as const;
function nestedSocial(row: Record<string, unknown>): Record<string, unknown> {
  return row.social && typeof row.social === 'object' ? row.social as Record<string, unknown> : {};
}
function settingValue(row: Record<string, unknown>, key: string): unknown {
  if (row[key] != null) return row[key];
  if ((SOCIAL_KEYS as readonly string[]).includes(key)) return nestedSocial(row)[key] ?? '';
  if (key === 'benefits' || key === 'pricingBenefits') return [];
  return '';
}

export async function GET(request: Request) {
  if (!await authorizeAdminRequest(request)) return json({ ok: false, error: { code: 'unauthorized', message: '請先登入' } }, 401);
  const firebase = firebaseServer(); if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  try { const snapshot = await firebase.db.collection('site_settings').doc('singleton').get(); if (!snapshot.exists) return json({ ok: false, error: { code: 'not_found', message: '網站設定尚未建立' } }, 404); const row = snapshot.data() || {}; const version = Number.isInteger(row.version) && Number(row.version) > 0 ? Number(row.version) : 1; return json({ ok: true, data: { ...Object.fromEntries(SETTINGS_KEYS.map((key) => [key, settingValue(row, key)])), version } }); } catch { return json({ ok: false, error: { code: 'service_unavailable', message: '網站設定讀取失敗' } }, 503); }
}

export async function PATCH(request: Request) {
  const admin = await authorizeAdminRequest(request, true);
  if (!admin) return json({ ok: false, error: { code: 'forbidden', message: '無效的管理員 session 或請求驗證' } }, 403);
  const firebase = firebaseServer(); if (!firebase) return json({ ok: false, error: { code: 'service_unavailable', message: '資料服務尚未完成伺服器設定' } }, 503);
  const parsed = await readJsonObject(request, 64 * 1024);
  if (!parsed.ok) return json({ ok: false, error: { code: parsed.reason === 'too_large' ? 'too_large' : 'invalid_request', message: parsed.reason === 'too_large' ? '資料大小超過限制' : '資料格式不正確' } }, parsed.reason === 'too_large' ? 413 : 400);
  const body = parsed.value;
  const validationError = validateSettingsPatch(body); if (validationError) return json({ ok: false, error: { code: 'invalid_request', message: validationError } }, 400);
  const line = typeof body.line === 'string' ? body.line : '';
  const lineUrl = lineUrlFromInput(line);
  const matchHeader = request.headers.get('if-match')?.trim() || '';
  const expectedVersion = matchHeader ? Number(matchHeader) : null;
  if (matchHeader && (expectedVersion == null || !Number.isInteger(expectedVersion) || expectedVersion < 1)) return json({ ok: false, error: { code: 'invalid_request', message: '資料版本格式不正確' } }, 400);
  try {
    const ref = firebase.db.collection('site_settings').doc('singleton');
    let nextVersion = 1;
    await firebase.db.runTransaction(async (transaction) => {
      const current = await transaction.get(ref);
      const currentVersion = Number.isInteger(current.data()?.version) && Number(current.data()?.version) > 0 ? Number(current.data()?.version) : 1;
      if (expectedVersion != null && expectedVersion !== currentVersion) throw new Error('settings_version_conflict');
      nextVersion = currentVersion + 1;
      const currentRow = current.data() || {};
      const currentSocial = nestedSocial(currentRow);
      const socialPatch = Object.fromEntries(SOCIAL_KEYS.filter((key) => typeof body[key] === 'string').map((key) => [key, body[key]]));
      transaction.set(ref, { ...body, social: { ...currentSocial, ...socialPatch }, ...(lineUrl ? { line_url: lineUrl } : {}), version: nextVersion, updatedAt: new Date() }, { merge: true });
    });
    await recordAdminAudit(firebase, admin, request, 'update', 'site_settings', 'singleton').catch(() => undefined);
    return json({ ok: true, data: { version: nextVersion, updatedAt: new Date().toISOString() } });
  } catch (error) {
    if (error instanceof Error && error.message === 'settings_version_conflict') return json({ ok: false, error: { code: 'conflict', message: '設定已被其他視窗更新，請重新載入後再儲存' } }, 409);
    return json({ ok: false, error: { code: 'service_unavailable', message: '網站設定儲存失敗' } }, 503);
  }
}
