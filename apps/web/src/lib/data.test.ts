import { describe, expect, it } from 'vitest';
import { fixtureSettings, isContentCode, isSafeContentUrl, isValidArticleBody, isValidBenefits } from '@tian-xin-ge/contracts';
import { getPublished, loadArticle, loadService, mapRemoteSettings, services } from './data';

describe('公開內容 fixture', () => {
  it('提供五項依序排列的服務，客製課程使用洽詢價格', () => {
    expect(services).toHaveLength(5);
    expect(services.map((service) => service.sortOrder)).toEqual([1, 2, 3, 4, 5]);
    expect(services.at(-1)?.priceLabel).toBe('洽詢');
    expect(services.every((service) => isContentCode(service.slug))).toBe(true);
  });

  it('只回傳已發布且符合類型的文章', () => {
    expect(getPublished('news')).toHaveLength(3);
    expect(getPublished('blog')).toHaveLength(4);
    expect(getPublished().every((article) => article.status === 'published')).toBe(true);
  });

  it('價格信任列與消息特色列使用不同的固定資料', () => {
    expect(fixtureSettings.benefits[0]?.title).toBe('最新活動');
    expect(fixtureSettings.pricingBenefits[0]?.title).toBe('透明收費');
  });

  it('詳情 repository 只回傳可公開的服務與文章', async () => {
    await expect(loadService('7usx1gzbua')).resolves.toMatchObject({ slug: '7usx1gzbua', isVisible: true });
    await expect(loadService('missing-service')).resolves.toBeNull();
    await expect(loadArticle('news', '0333lu87r6')).resolves.toMatchObject({ slug: '0333lu87r6', status: 'published' });
    await expect(loadArticle('news', 'dt8qch6sy6')).resolves.toBeNull();
  });

  it('正式網站設定只使用資料庫值，且要求有效的 LINE 連結', () => {
    const mapped = mapRemoteSettings({
      brand_name: '正式天心閣',
      phone: '02-1234-5678',
      line_id: '@official',
      address: '正式營業地址',
      business_hours: '10:00 - 22:00',
      hero_description: '正式品牌介紹',
      logo_url: 'javascript:alert(1)',
    });
    expect(mapped.brandName).toBe('正式天心閣');
    expect(mapped.phone).toBe('02-1234-5678');
    expect(mapped.lineUrl).toBe('https://line.me/ti/p/@official');
    expect(mapped.logoUrl).toBe('');
    expect(mapped.servicesTitle).toBe('');
    expect(mapped.seoTitle).toBe('正式天心閣');
    expect(() => mapRemoteSettings({ brand_name: '正式天心閣', phone: '02-1234-5678', line_url: 'http://example.com/line', address: '正式營業地址', business_hours: '10:00 - 22:00' })).toThrow('LINE');
  });

  it('共用內容驗證會拒絕危險 URL 及過量正文區塊', () => {
    expect(isSafeContentUrl('/assets/crops/service-1.png', true)).toBe(true);
    expect(isSafeContentUrl('http://cdn.example.com/image.png', true)).toBe(false);
    expect(isSafeContentUrl('http://cdn.example.com/image.png')).toBe(true);
    expect(isSafeContentUrl('https://')).toBe(false);
    expect(isSafeContentUrl('//evil.example/image.png', true)).toBe(false);
    expect(isSafeContentUrl('javascript:alert(1)')).toBe(false);
    expect(isValidArticleBody(Array.from({ length: 101 }, () => ({ type: 'paragraph', text: 'x' })))).toBe(false);
    expect(isValidArticleBody([{ type: 'list', text: 'x', items: Array.from({ length: 101 }, () => 'item') }])).toBe(false);
    expect(isValidBenefits([{ title: '最新活動', caption: '不錯過優惠' }])).toBe(true);
    expect(isValidBenefits(Array.from({ length: 5 }, () => ({ title: 'x', caption: 'y' })))).toBe(false);
  });
});
