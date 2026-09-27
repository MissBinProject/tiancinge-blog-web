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
export async function generateStaticParams() { const result = await loadArticlePage('blog', { pageSize }); const values = Array.from({ length: Math.max(0, result.totalPages - 1) }, (_, index) => ({ page: String(index + 2) })); return values.length ? values : [{ page: '1' }]; }
export async function generateMetadata({ params }: { params: Promise<{ page: string }> }): Promise<Metadata> { const { page } = await params; const site = await loadSettings(); return buildSeoMetadata({ title: `${site.blogTitle}｜第 ${page} 頁｜${site.brandName}`, description: `${site.blogSubtitle}（第 ${page} 頁）`, path: `/blog/page/${page}`, siteName: site.brandName, imageUrl: site.ogImageUrl }); }
export default async function BlogPagination({ params }: { params: Promise<{ page: string }> }) {
  const { page: raw } = await params; const page = Number(raw); if (!Number.isInteger(page) || page < 2) return process.env.STATIC_EXPORT === '1' ? null : notFound();
  const [items, site, categories] = await Promise.all([loadArticlePage('blog', { page, pageSize }), loadSettings(), loadArticleCategories('blog')]);
  if (page > items.totalPages) return process.env.STATIC_EXPORT === '1' ? null : notFound();
  return <><Header siteSettings={site}/><main id="main-content" tabIndex={-1} className="inner-page"><div className="container"><StructuredData data={breadcrumbSchema([{ name: '首頁', path: '/' }, { name: site.blogTitle, path: '/blog' }, { name: `第 ${page} 頁`, path: `/blog/page/${page}` }])}/><Breadcrumbs items={[{ name: '首頁', href: '/' }, { name: site.blogTitle, href: '/blog' }, { name: `第 ${page} 頁` }]}/></div><div className="inner-hero"><span className="eyebrow">OUR BLOG</span><h1>{site.blogTitle}｜第 {page} 頁</h1><p>{site.blogSubtitle}</p></div><ArticleList items={items.items} categories={categories.map(({ name }) => name)} totalPages={items.totalPages} type="blog" page={page}/></main><Footer siteSettings={site}/></>;
}
