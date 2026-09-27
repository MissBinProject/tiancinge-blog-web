import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SearchResults } from '@/components/SearchResults';
import { buildSeoMetadata } from '@/lib/seo-metadata';
import { loadArticles, loadServices, loadSettings } from '@/lib/data';

export async function generateMetadata(): Promise<Metadata> { const site = await loadSettings(); return buildSeoMetadata({ title: `搜尋內容｜${site.brandName}`, description: `搜尋${site.brandName}的服務、最新消息與部落格文章。`, path: '/search', siteName: site.brandName, imageUrl: site.ogImageUrl, noIndex: true }); }
export default async function SearchPage() {
  const [services, articles, site] = await Promise.all([loadServices(), loadArticles(), loadSettings()]);
  const items = [...services.map((item) => ({ title: item.name, excerpt: item.summary, url: `/services/${item.slug}`, kind: '服務', text: `${item.name} ${item.summary}`.toLowerCase() })), ...articles.map((item) => ({ title: item.title, excerpt: item.excerpt, url: `/${item.type}/${item.slug}`, kind: item.type === 'news' ? '消息' : '文章', text: `${item.title} ${item.excerpt}`.toLowerCase() }))];
  return <><Header siteSettings={site}/><main id="main-content" tabIndex={-1} className="search-page container"><span className="eyebrow">SEARCH</span><h1>搜尋內容</h1><SearchResults items={items}/></main><Footer siteSettings={site}/></>;
}
