import { describe, expect, it } from 'vitest';
import { pricingPayload, validatePricingInput } from './pricing-schema';

describe('pricing schema', () => {
  it('stores an empty duration as null so Firestore never receives undefined', () => {
    const payload = pricingPayload({ name: '削腳皮', summary: '足部整理', category: '足部服務', price: 600, durationMinutes: '' });
    expect(payload.durationMinutes).toBeNull();
  });

  it('requires image metadata for homepage plans', () => {
    expect(validatePricingInput({ name: '方案', summary: '摘要', category: '組合方案', price: 600, showOnHome: true })).toContain('圖片');
  });
});
