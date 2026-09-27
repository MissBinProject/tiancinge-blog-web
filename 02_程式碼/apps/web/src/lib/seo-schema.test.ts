import { describe, expect, it } from 'vitest';
import { fixtureArticles, fixtureServices, fixtureSettings } from '@tian-xin-ge/contracts';
import { articleSchema, localBusinessSchema, serviceDescription, serviceSchema } from './seo-schema';

process.env.NEXT_PUBLIC_SITE_URL = 'https://tiancinge-web.web.app';

describe('公開頁面 SEO schema', () => {
  it('uses the configured public origin and visible business values', () => {
    const schema = localBusinessSchema(fixtureSettings);
    expect(schema['@type']).toBe('LocalBusiness');
    expect(schema.url).toBe('https://tiancinge-web.web.app/');
    expect(schema.telephone).toBe(fixtureSettings.phone);
    expect(schema.address.streetAddress).toBe(fixtureSettings.address);
  });

  it('represents a cross-midnight business-hours range as OpeningHoursSpecification', () => {
    const schema = localBusinessSchema({ ...fixtureSettings, businessHours: '10:00 - 02:00' });
    expect(schema.openingHours).toBeUndefined();
    expect(schema.openingHoursSpecification).toMatchObject({ opens: '10:00', closes: '02:00' });
  });

  it('describes service offers without inventing a price for consultation services', () => {
    const priced = serviceSchema(fixtureServices[0], fixtureSettings);
    const consultation = serviceSchema(fixtureServices[4], fixtureSettings);
    expect(priced.offers).toMatchObject({ price: 1500, priceCurrency: 'TWD' });
    expect(consultation.offers).toBeUndefined();
    expect(priced.description).toContain('釋放壓力');
    expect(priced.description).toContain('重拾輕盈自在');
    expect(priced.description).not.toMatch(/釋放壓力.*釋放壓力/);
    expect(serviceDescription({ summary: '摘要', description: '摘要，補充說明' })).toBe('摘要。補充說明');
  });

  it('uses Article for news and BlogPosting for blog content', () => {
    expect(articleSchema(fixtureArticles[0], fixtureSettings)['@type']).toBe('Article');
    expect(articleSchema(fixtureArticles[3], fixtureSettings)['@type']).toBe('BlogPosting');
    expect(articleSchema(fixtureArticles[3], fixtureSettings).author).toMatchObject({ name: '天心閣養生會館編輯團隊' });
  });
});
