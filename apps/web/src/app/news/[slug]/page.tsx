import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ArticleBody } from '@/components/ArticleBody';
import { ArticleMeta } from '@/components/ArticleMeta';
import { SafeImage } from '@/components/SafeImage';
import { StructuredData } from '@/components/StructuredData';
import { articleHeadings, relatedArticles } from '@/lib/article-seo';
import { loadArticle, loadArticles, loadSettings } from '@/lib/data';
import { buildSeoMetadata } from '@/lib/seo-metadata';
import { articleSchema, breadcrumbSchema } from '@/lib/seo-schema';

export async function generateStaticParams() { const values = (await loadArticles('news')).map(({ slug }) => ({ slug })); return values.length ? values : [{ slug: 'zzzzzzzzzz' }]; }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [article, site] = await Promise.all([loadArticle('news', slug), loadSettings()]);
  const title = article?.seoTitle || article?.title || '最新消息';
  const description = article?.seoDescription || article?.excerpt || site.newsSubtitle;
  return buildSeoMetadata({ title, description, path: '/news/' + slug, siteName: site.brandName, imageUrl: article?.coverUrl || site.ogImageUrl, imageAlt: article?.coverAlt || article?.title, type: 'article' });
}

export default async function NewsDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [article, site, allArticles] = await Promise.all([loadArticle('news', slug), loadSettings(), loadArticles('news')]);
  if (!article) return process.env.STATIC_EXPORT === '1' ? null : notFound();
  const headings = articleHeadings(article);
  const related = relatedArticles(article, allArticles);
  return <><Header siteSettings={site}/><main id="main-content" tabIndex={-1} className="article-detail"><div className="container">
    <StructuredData data={articleSchema(article, site)}/><StructuredData data={breadcrumbSchema([{ name: '首頁', path: '/' }, { name: '最新消息', path: '/news' }, { name: article.title, path: '/news/' + article.slug }])}/>
    <nav className="breadcrumbs" aria-label="麵包屑"><Link href="/">首頁</Link><span aria-hidden="true">／</span><Link href="/news">最新消息</Link><span aria-hidden="true">／</span><span>{article.title}</span></nav>
    <SafeImage src={article.coverUrl} alt={`消息封面：${article.coverAlt || article.title}`} loading="eager" fetchPriority="high"/>
    <span className="eyebrow">{article.category}</span><ArticleMeta article={article} site={site}/><h1>{article.title}</h1><p className="lead">{article.excerpt}</p>
    {headings.length >= 3 && <nav className="article-toc" aria-label="文章目錄"><strong>文章目錄</strong><ol>{headings.map((heading) => <li key={heading.id} className={heading.level === 3 ? 'level-3' : undefined}><a href={'#' + heading.id}>{heading.text}</a></li>)}</ol></nav>}
    <ArticleBody blocks={article.body}/>
    {article.sources && article.sources.length > 0 && <section className="article-sources" aria-labelledby="article-sources-title"><h2 id="article-sources-title">參考來源</h2><ul>{article.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer noopener">{source.title}</a></li>)}</ul></section>}
    {related.length > 0 && <aside className="related-articles" aria-labelledby="related-articles-title"><h2 id="related-articles-title">延伸閱讀</h2><ul>{related.map((item) => <li key={item.id}><Link href={'/news/' + item.slug}>{item.title}</Link><p>{item.excerpt}</p></li>)}</ul></aside>}
  </div></main><Footer siteSettings={site}/></>;
}
