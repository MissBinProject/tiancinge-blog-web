import { describe, expect, it } from 'vitest';
import { buildSeoMetadata } from './seo-metadata';

describe('共用 SEO metadata', () => {
  it('produces absolute canonical and Open Graph URLs', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://tiancinge-web.web.app';
    const metadata = buildSeoMetadata({ title: '測試頁', description: '測試描述', path: '/blog/example', siteName: '天心閣', imageUrl: '/assets/og.png', type: 'article' });
    expect(metadata.alternates?.canonical).toBe('https://tiancinge-web.web.app/blog/example');
    expect(metadata.openGraph?.url).toBe('https://tiancinge-web.web.app/blog/example');
    expect((metadata.openGraph as { type?: string } | undefined)?.type).toBe('article');
    expect(metadata.robots).toBeUndefined();
  });

  it('marks internal search results as noindex while keeping links followable', () => {
    const metadata = buildSeoMetadata({ title: '搜尋', description: '搜尋內容', path: '/search', siteName: '天心閣', noIndex: true });
    expect(metadata.robots).toMatchObject({ index: false, follow: true });
  });
});
