import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ArticleList } from '@/components/ArticleList';
import { loadArticleCategories, loadArticlePage, loadSettings } from '@/lib/data';
import { buildSeoMetadata } from '@/lib/seo-metadata';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StructuredData } from '@/components/StructuredData';
import { breadcrumbSchema } from '@/lib/seo-schema';

const pageSize = 8;
export async function generateStaticParams() { const result = await loadArticlePage('news', { pageSize }); const values = Array.from({ length: Math.max(0, result.totalPages - 1) }, (_, index) => ({ page: String(index + 2) })); return values.length ? values : [{ page: '1' }]; }
export async function generateMetadata({ params }: { params: Promise<{ page: string }> }): Promise<Metadata> { const { page } = await params; const site = await loadSettings(); return buildSeoMetadata({ title: `${site.newsTitle}｜第 ${page} 頁｜${site.brandName}`, description: `${site.newsSubtitle}（第 ${page} 頁）`, path: `/news/page/${page}`, siteName: site.brandName, imageUrl: site.ogImageUrl }); }
export default async function NewsPagination({ params }: { params: Promise<{ page: string }> }) {
  const { page: raw } = await params; const page = Number(raw); if (!Number.isInteger(page) || page < 2) return process.env.STATIC_EXPORT === '1' ? null : notFound();
  const [items, site, categories] = await Promise.all([loadArticlePage('news', { page, pageSize }), loadSettings(), loadArticleCategories('news')]);
  if (page > items.totalPages) return process.env.STATIC_EXPORT === '1' ? null : notFound();
  return <><Header siteSettings={site}/><main id="main-content" tabIndex={-1} className="inner-page"><div className="container"><StructuredData data={breadcrumbSchema([{ name: '首頁', path: '/' }, { name: site.newsTitle, path: '/news' }, { name: `第 ${page} 頁`, path: `/news/page/${page}` }])}/><Breadcrumbs items={[{ name: '首頁', href: '/' }, { name: site.newsTitle, href: '/news' }, { name: `第 ${page} 頁` }]}/></div><div className="inner-hero"><span className="eyebrow">LATEST NEWS</span><h1>{site.newsTitle}｜第 {page} 頁</h1><p>{site.newsSubtitle}</p></div><ArticleList items={items.items} categories={categories.map(({ name }) => name)} totalPages={items.totalPages} type="news" page={page}/></main><Footer siteSettings={site}/></>;
}
