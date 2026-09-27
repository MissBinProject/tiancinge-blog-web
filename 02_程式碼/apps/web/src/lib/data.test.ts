import { describe, expect, it } from 'vitest';
import { fixtureSettings, isSafeContentUrl, isServiceSlug, isValidArticleBody, isValidBenefits, normalizeYouTubeEmbedUrl } from '@tian-xin-ge/contracts';
import { getPublished, loadArticle, loadArticlePage, loadService, mapRemoteSettings, services } from './data';

describe('公開內容 fixture', () => {
  it('提供五項依序排列的服務，客製課程使用洽詢價格', () => {
    expect(services).toHaveLength(5);
    expect(services.map((service) => service.sortOrder)).toEqual([1, 2, 3, 4, 5]);
    expect(services.at(-1)?.priceLabel).toBe('洽詢');
    expect(services.every((service) => isServiceSlug(service.slug))).toBe(true);
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
    await expect(loadService('full-body-massage')).resolves.toMatchObject({ slug: 'full-body-massage', isVisible: true });
    await expect(loadService('missing-service')).resolves.toBeNull();
    await expect(loadArticle('news', 'mid-autumn-massage-offer')).resolves.toMatchObject({ slug: 'mid-autumn-massage-offer', status: 'published' });
    await expect(loadArticle('news', 'autumn-wellness-plan')).resolves.toBeNull();
  });

  it('列表頁使用固定頁大小與分類篩選', async () => {
    await expect(loadArticlePage('blog', { page: 1, pageSize: 2 })).resolves.toMatchObject({ total: 4, totalPages: 2, items: expect.arrayContaining([expect.objectContaining({ type: 'blog' })]) });
    await expect(loadArticlePage('blog', { page: 2, pageSize: 2 })).resolves.toMatchObject({ total: 4, totalPages: 2, items: expect.any(Array) });
    await expect(loadArticlePage('news', { category: '活動訊息', page: 1 })).resolves.toMatchObject({ total: 1, totalPages: 1, items: [expect.objectContaining({ category: '活動訊息' })] });
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
    const editedLine = mapRemoteSettings({
      brand_name: '正式天心閣', phone: '02-1234-5678', line: '@edited-id', line_url: 'https://line.me/ti/p/@outdated-id',
      address: '正式營業地址', business_hours: '10:00 - 22:00',
    });
    expect(editedLine.lineUrl).toBe('https://line.me/ti/p/@edited-id');
    expect(editedLine.social.line).toBe(editedLine.lineUrl);
    expect(() => mapRemoteSettings({ brand_name: '正式天心閣', phone: '02-1234-5678', line_url: 'http://example.com/line', address: '正式營業地址', business_hours: '10:00 - 22:00' })).toThrow('LINE');
  });

  it('社群連結同時相容舊的 nested social 與後台扁平欄位', () => {
    const legacy = mapRemoteSettings({
      brand_name: '正式天心閣', phone: '02-1234-5678', line: '@official', address: '正式營業地址', business_hours: '10:00 - 22:00',
      social: { instagram: 'https://instagram.com/legacy', facebook: 'https://facebook.com/legacy' },
    });
    expect(legacy.social.instagram).toBe('https://instagram.com/legacy');
    expect(legacy.social.facebook).toBe('https://facebook.com/legacy');
    const edited = mapRemoteSettings({
      brand_name: '正式天心閣', phone: '02-1234-5678', line: '@official', address: '正式營業地址', business_hours: '10:00 - 22:00',
      instagram: 'https://instagram.com/edited', facebook: 'https://facebook.com/edited', social: { instagram: '#', facebook: '#' },
    });
    expect(edited.social.instagram).toBe('https://instagram.com/edited');
    expect(edited.social.facebook).toBe('https://facebook.com/edited');
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
    expect(isValidArticleBody([{ type: 'paragraph', text: '格式文字', textAlign: 'center', content: [{ text: '格式', bold: true, color: '#c83f62', fontSize: '24px', fontFamily: 'Noto Serif TC' }, { text: '文字', underline: true }] }])).toBe(true);
    expect(isValidArticleBody([{ type: 'paragraph', text: '危險格式', content: [{ text: '危險', color: 'red;background:url(javascript:alert(1))' }] }])).toBe(false);
    expect(isValidArticleBody([{ type: 'paragraph', text: '危險連結', content: [{ text: '點我', href: 'javascript:alert(1)' }] }])).toBe(false);
    expect(isValidBenefits([{ title: '最新活動', caption: '不錯過優惠' }])).toBe(true);
    expect(isValidBenefits(Array.from({ length: 5 }, () => ({ title: 'x', caption: 'y' })))).toBe(false);
    expect(isValidArticleBody([{ type: 'heading', text: '小標', level: 3 }])).toBe(true);
    expect(isValidArticleBody([{ type: 'heading', text: '錯誤層級', level: 4 as 2 }])).toBe(false);
    expect(normalizeYouTubeEmbedUrl('https://youtu.be/dQw4w9WgXcQ')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(isValidArticleBody([{ type: 'video', text: '教學影片', videoKind: 'youtube', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }])).toBe(true);
    expect(isValidArticleBody([{ type: 'video', text: '上傳影片', videoKind: 'upload', url: 'https://cdn.example.com/demo.mp4' }])).toBe(true);
    expect(isValidArticleBody([{ type: 'video', text: '危險影片', videoKind: 'upload', url: 'javascript:alert(1)' }])).toBe(false);
  });
});
