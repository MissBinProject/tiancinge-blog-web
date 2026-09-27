import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ArticleList } from '@/components/ArticleList';
import { loadArticleCategories, loadArticles, loadSettings } from '@/lib/data';
import { buildSeoMetadata } from '@/lib/seo-metadata';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StructuredData } from '@/components/StructuredData';
import { breadcrumbSchema } from '@/lib/seo-schema';

export async function generateStaticParams() { const values = (await loadArticleCategories('news')).map(({ name }) => ({ category: name })); return values.length ? values : [{ category: '__placeholder__' }]; }

function decodeCategory(value: string) {
  try { return decodeURIComponent(value).trim(); } catch { return ''; }
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const name = decodeCategory(category);
  const [site, categories] = await Promise.all([loadSettings(), loadArticleCategories('news')]);
  const categoryInfo = categories.find((item) => item.name === name);
  return buildSeoMetadata({ title: categoryInfo?.seoTitle || (name ? `${name}｜${site.newsTitle}｜${site.brandName}` : '消息分類'), description: categoryInfo?.seoDescription || (name ? `${site.brandName}的${name}最新消息。` : site.newsSubtitle), path: '/news/category/' + encodeURIComponent(name), siteName: site.brandName, imageUrl: site.ogImageUrl });
}

export default async function NewsCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const name = decodeCategory(category);
  const [items, site, categories] = await Promise.all([loadArticles('news', { category: name }), loadSettings(), loadArticleCategories('news')]);
  const categoryInfo = categories.find((item) => item.name === name);
  if (!name || !categoryInfo || !items.length) return process.env.STATIC_EXPORT === '1' ? null : notFound();
  return <><Header siteSettings={site}/><main id="main-content" tabIndex={-1} className="inner-page"><div className="container"><StructuredData data={breadcrumbSchema([{ name: '首頁', path: '/' }, { name: site.newsTitle, path: '/news' }, { name, path: `/news/category/${encodeURIComponent(name)}` }])}/><Breadcrumbs items={[{ name: '首頁', href: '/' }, { name: site.newsTitle, href: '/news' }, { name }]}/></div><div className="inner-hero"><span className="eyebrow">NEWS CATEGORY</span><h1>{name}</h1><p>{categoryInfo.description || site.newsSubtitle}</p></div><ArticleList items={items} type="news" category={name}/></main><Footer siteSettings={site}/></>;
}
