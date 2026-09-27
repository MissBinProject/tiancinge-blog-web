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

export async function generateStaticParams() { const values = (await loadArticleCategories('blog')).map(({ name }) => ({ category: name })); return values.length ? values : [{ category: '__placeholder__' }]; }

function decodeCategory(value: string) {
  try { return decodeURIComponent(value).trim(); } catch { return ''; }
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const name = decodeCategory(category);
  const [site, categories] = await Promise.all([loadSettings(), loadArticleCategories('blog')]);
  const categoryInfo = categories.find((item) => item.name === name);
  return buildSeoMetadata({ title: categoryInfo?.seoTitle || (name ? `${name}｜${site.blogTitle}｜${site.brandName}` : '部落格分類'), description: categoryInfo?.seoDescription || (name ? `${site.brandName}的${name}養生文章。` : site.blogSubtitle), path: '/blog/category/' + encodeURIComponent(name), siteName: site.brandName, imageUrl: site.ogImageUrl });
}

export default async function BlogCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const name = decodeCategory(category);
  const [items, site, categories] = await Promise.all([loadArticles('blog', { category: name }), loadSettings(), loadArticleCategories('blog')]);
  const categoryInfo = categories.find((item) => item.name === name);
  if (!name || !categoryInfo || !items.length) return process.env.STATIC_EXPORT === '1' ? null : notFound();
  return <><Header siteSettings={site}/><main id="main-content" tabIndex={-1} className="inner-page"><div className="container"><StructuredData data={breadcrumbSchema([{ name: '首頁', path: '/' }, { name: site.blogTitle, path: '/blog' }, { name, path: `/blog/category/${encodeURIComponent(name)}` }])}/><Breadcrumbs items={[{ name: '首頁', href: '/' }, { name: site.blogTitle, href: '/blog' }, { name }]}/></div><div className="inner-hero"><span className="eyebrow">BLOG CATEGORY</span><h1>{name}</h1><p>{categoryInfo.description || site.blogSubtitle}</p></div><ArticleList items={items} type="blog" category={name}/></main><Footer siteSettings={site}/></>;
}
