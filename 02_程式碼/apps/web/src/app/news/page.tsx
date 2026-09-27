import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ArticleList } from '@/components/ArticleList';
import { buildSeoMetadata } from '@/lib/seo-metadata';
import { loadArticleCategories, loadArticlePage, loadSettings } from '@/lib/data';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StructuredData } from '@/components/StructuredData';
import { breadcrumbSchema } from '@/lib/seo-schema';

export async function generateMetadata(): Promise<Metadata> {
  const site = await loadSettings();
  return buildSeoMetadata({ title: `${site.newsTitle}｜${site.brandName}`, description: site.newsSubtitle, path: '/news', siteName: site.brandName, imageUrl: site.ogImageUrl });
}

export default async function NewsPage() {
  const [pageData, siteSettings, categoryList] = await Promise.all([loadArticlePage('news', { page: 1, pageSize: 8 }), loadSettings(), loadArticleCategories('news')]);
  return <><Header siteSettings={siteSettings}/><main id="main-content" tabIndex={-1} className="inner-page"><div className="container"><StructuredData data={breadcrumbSchema([{ name: '首頁', path: '/' }, { name: siteSettings.newsTitle, path: '/news' }])}/><Breadcrumbs items={[{ name: '首頁', href: '/' }, { name: siteSettings.newsTitle }]}/></div><div className="inner-hero"><span className="eyebrow">LATEST NEWS</span><h1>{siteSettings.newsTitle}</h1><p>{siteSettings.newsSubtitle}</p></div><ArticleList items={pageData.items} categories={categoryList.map((item) => item.name)} totalPages={pageData.totalPages} type="news" page={1}/></main><Footer siteSettings={siteSettings}/></>;
}
