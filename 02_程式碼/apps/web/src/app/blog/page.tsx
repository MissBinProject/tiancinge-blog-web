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
  return buildSeoMetadata({ title: `${site.blogTitle}｜${site.brandName}`, description: site.blogSubtitle, path: '/blog', siteName: site.brandName, imageUrl: site.ogImageUrl });
}

export default async function BlogPage() {
  const [pageData, siteSettings, categoryList] = await Promise.all([loadArticlePage('blog', { page: 1, pageSize: 8 }), loadSettings(), loadArticleCategories('blog')]);
  return <><Header siteSettings={siteSettings}/><main id="main-content" tabIndex={-1} className="inner-page"><div className="container"><StructuredData data={breadcrumbSchema([{ name: '首頁', path: '/' }, { name: siteSettings.blogTitle, path: '/blog' }])}/><Breadcrumbs items={[{ name: '首頁', href: '/' }, { name: siteSettings.blogTitle }]}/></div><div className="inner-hero"><span className="eyebrow">OUR BLOG</span><h1>{siteSettings.blogTitle}</h1><p>{siteSettings.blogSubtitle}</p></div><ArticleList items={pageData.items} categories={categoryList.map((item) => item.name)} totalPages={pageData.totalPages} type="blog" page={1}/></main><Footer siteSettings={siteSettings}/></>;
}
