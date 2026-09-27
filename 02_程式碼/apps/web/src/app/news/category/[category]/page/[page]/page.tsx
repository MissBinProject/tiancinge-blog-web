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
export async function generateStaticParams() { const categories = await loadArticleCategories('news'); const pairs = await Promise.all(categories.map(async ({ name }) => ({ name, totalPages: (await loadArticlePage('news', { category: name, pageSize })).totalPages }))); const values = pairs.flatMap(({ name, totalPages }) => Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => ({ category: name, page: String(index + 2) }))); return values.length ? values : [{ category: '__placeholder__', page: '1' }]; }
function decodeCategory(value: string) { try { return decodeURIComponent(value).trim(); } catch { return ''; } }
export async function generateMetadata({ params }: { params: Promise<{ category: string; page: string }> }): Promise<Metadata> { const { category, page } = await params; const name = decodeCategory(category); const [site, categories] = await Promise.all([loadSettings(), loadArticleCategories('news')]); const info = categories.find((item) => item.name === name); return buildSeoMetadata({ title: `${info?.seoTitle || name}｜${site.newsTitle}｜第 ${page} 頁｜${site.brandName}`, description: `${info?.seoDescription || info?.description || site.newsSubtitle}（第 ${page} 頁）`, path: `/news/category/${encodeURIComponent(name)}/page/${page}`, siteName: site.brandName, imageUrl: site.ogImageUrl }); }
export default async function NewsCategoryPagination({ params }: { params: Promise<{ category: string; page: string }> }) {
  const { category, page: raw } = await params; const page = Number(raw); if (!Number.isInteger(page) || page < 2) return process.env.STATIC_EXPORT === '1' ? null : notFound();
  const [items, site, categories] = await Promise.all([loadArticlePage('news', { category, page, pageSize }), loadSettings(), loadArticleCategories('news')]);
  const info = categories.find(({ name }) => name === category); if (!info || !items.total || page > items.totalPages) return process.env.STATIC_EXPORT === '1' ? null : notFound();
  const name = decodeCategory(category); return <><Header siteSettings={site}/><main id="main-content" tabIndex={-1} className="inner-page"><div className="container"><StructuredData data={breadcrumbSchema([{ name: '首頁', path: '/' }, { name: site.newsTitle, path: '/news' }, { name, path: `/news/category/${encodeURIComponent(name)}` }, { name: `第 ${page} 頁`, path: `/news/category/${encodeURIComponent(name)}/page/${page}` }])}/><Breadcrumbs items={[{ name: '首頁', href: '/' }, { name: site.newsTitle, href: '/news' }, { name, href: `/news/category/${encodeURIComponent(name)}` }, { name: `第 ${page} 頁` }]}/></div><div className="inner-hero"><span className="eyebrow">NEWS CATEGORY</span><h1>{name}｜第 {page} 頁</h1><p>{info.description || site.newsSubtitle}</p></div><ArticleList items={items.items} categories={categories.map(({ name }) => name)} totalPages={items.totalPages} type="news" category={category} page={page}/></main><Footer siteSettings={site}/></>;
}
