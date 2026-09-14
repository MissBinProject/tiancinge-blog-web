'use client';

import { useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Flower2, Gift, Heart, Megaphone } from 'lucide-react';
import { getPublished, settings } from '@/lib/data';
import type { Article, SiteSettings } from '@tian-xin-ge/contracts';
import { SafeImage } from './SafeImage';

export function NewsSection({ items = getPublished('news'), siteSettings = settings }: { items?: Article[]; siteSettings?: SiteSettings }) {
  const pageSize = 3;
  const pageCount = Math.max(1, items.length);
  const showControls = items.length >= pageSize;
  const dotCount = pageCount;
  const [page, setPage] = useState(0);
  const visible = items.length <= pageSize ? items : Array.from({ length: pageSize }, (_, offset) => items[(page + offset) % items.length]);
  const move = (direction: -1 | 1) => setPage((current) => (current + direction + pageCount) % pageCount);

  return <section id="news" className="articles news section">
    <div className="article-backdrop news-bg" style={siteSettings.newsBackgroundUrl ? { backgroundImage: `url(${siteSettings.newsBackgroundUrl})` } : undefined} />
    <p className="article-decor article-side-copy news-side-copy" aria-hidden="true">放慢腳步<br/>感受生活<br/>讓身心<br/>回到最純粹的自己<br/><span>—<br/>SLOW DOWN<br/>BREATHE<br/>HEAL<br/>BE A<br/>BETTER YOU</span></p>
    <p className="article-decor article-handwritten news-top-copy" aria-hidden="true">美好的生活<br/>從照顧自己開始 <b>♥</b></p>
    <p className="article-decor article-handwritten news-bottom-copy" aria-hidden="true">生活可以更溫柔<br/>你也值得被好好對待 <b>♥</b></p>
    <p className="article-decor article-footer-copy news-footer-copy" aria-hidden="true">TIAN XIN GE WELLNESS SPA<br/>RELAX・RECHARGE・BE A BETTER YOU</p>
    <div className="container">
      <div className="section-title"><span className="eyebrow">LATEST NEWS</span><h2>{siteSettings.newsTitle}</h2><p>{siteSettings.newsSubtitle}</p></div>
      <a className="article-more news-more" href="/news">查看更多消息 <ArrowRight size={16} /></a>
      <div className="article-grid">{visible.map((article) => <ArticleCard key={article.id} article={article} />)}{items.length === 0 && <p className="empty">目前沒有最新消息。</p>}</div>
      {showControls && <div className="slider-controls" aria-label="最新消息輪播控制"><button type="button" aria-label="上一頁" disabled={pageCount === 1} onClick={() => move(-1)}><ChevronLeft /></button>{Array.from({ length: dotCount }, (_, index) => <button type="button" key={index} aria-label={`第 ${index + 1} 頁`} disabled={index >= pageCount} className={index === page ? 'dot active' : 'dot'} onClick={() => { if (index < pageCount) setPage(index); }} />)}<button type="button" aria-label="下一頁" disabled={pageCount === 1} onClick={() => move(1)}><ChevronRight /></button></div>}
      <div className="benefit-row">{siteSettings.benefits.slice(0, 4).map((benefit, index) => { const Icon = [Flower2, Megaphone, Gift, Heart][index]; return <span key={`${benefit.title}-${index}`}><Icon />{benefit.title}<small>{benefit.caption}</small></span>; })}</div>
    </div>
  </section>;
}

export function BlogSection({ items = getPublished('blog').slice(0, 4), siteSettings = settings }: { items?: Article[]; siteSettings?: SiteSettings }) {
  const categories = Array.from(new Set(items.map((article) => article.category.trim()).filter(Boolean))).slice(0, 5);
  const glyphs = ['◉', '⌁', '♡', '☕', '▢'];
  return <section id="blog" className="articles blog section">
    <div className="article-backdrop blog-bg" style={siteSettings.blogBackgroundUrl ? { backgroundImage: `url(${siteSettings.blogBackgroundUrl})` } : undefined} />
    <p className="article-decor article-side-copy blog-side-copy" aria-hidden="true">生活的美好<br/>來自於<br/>對自己的溫柔<br/>每一天<br/>都是新的開始<br/><span>—<br/>A<br/>HEALTHIER<br/>HAPPIER<br/>YOU</span></p>
    <p className="article-decor article-handwritten blog-top-copy" aria-hidden="true">療癒，<br/>從閱讀一篇好文章開始 <b>♥</b></p>
    <p className="article-decor article-handwritten blog-bottom-copy" aria-hidden="true">閱讀，讓心更靠近幸福 <b>♥</b></p>
    <p className="article-decor article-footer-copy blog-footer-copy" aria-hidden="true">TIAN XIN GE WELLNESS SPA<br/>RELAX・RECHARGE・BE A BETTER YOU</p>
    <div className="container">
      <div className="section-title"><span className="eyebrow">OUR BLOG</span><h2>{siteSettings.blogTitle}</h2><p>{siteSettings.blogSubtitle}</p></div>
      <a className="article-more blog-more" href="/blog">查看更多文章 <ArrowRight size={16} /></a>
      <div className="article-grid blog-grid">{items.map((article) => <ArticleCard key={article.id} article={article} />)}{items.length === 0 && <p className="empty">目前沒有部落格文章。</p>}</div>
      {categories.length > 0 && <div className="category-row">{categories.map((category, index) => <a href={`/blog?category=${encodeURIComponent(category)}`} key={category}>{glyphs[index]}　{category}</a>)}</div>}
    </div>
  </section>;
}

function ArticleCard({ article }: { article: Article }) {
  const isReferenceCrop = article.coverUrl.startsWith('/assets/crops/');
  return <a className="article-card" href={`/${article.type === 'news' ? 'news' : 'blog'}/${article.slug}`}>
    <div className={isReferenceCrop ? 'article-image crop-image' : 'article-image'}><SafeImage src={article.coverUrl} alt={article.title} /><span>{article.category}</span></div>
    <div className="article-body"><time dateTime={article.publishedAt}>{article.publishedAt.replaceAll('-', ' / ')}</time><h3>{article.title}</h3><p>{article.excerpt}</p><span className="read-more">閱讀更多 <ArrowRight size={15} /></span></div>
  </a>;
}
