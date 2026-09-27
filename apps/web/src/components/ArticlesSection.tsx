'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Flower2, Gift, Heart, Megaphone } from 'lucide-react';
import type { Article, SiteSettings } from '@tian-xin-ge/contracts';
import { SafeImage } from './SafeImage';
import { DeferredBackground } from './DeferredBackground';
import { displayDate } from '../lib/display-date';

export function NewsSection({ items, siteSettings }: { items: Article[]; siteSettings: SiteSettings }) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 700px)');
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);
  const pageSize = isMobile ? 1 : 4;
  const pageCount = isMobile
    ? Math.max(1, Math.ceil(items.length / pageSize))
    : Math.max(1, items.length - pageSize + 1);
  const showControls = items.length > pageSize;
  const dotCount = pageCount;
  const [page, setPage] = useState(0);
  useEffect(() => { setPage((current) => Math.min(current, pageCount - 1)); }, [pageCount]);
  const visible = items.length <= pageSize
    ? items
    : isMobile
      ? items.slice(page * pageSize, page * pageSize + pageSize)
      : Array.from({ length: pageSize }, (_, offset) => items[(page + offset) % items.length]);
  const move = (direction: -1 | 1) => setPage((current) => (current + direction + pageCount) % pageCount);

  return <section id="news" className="articles news section">
    <DeferredBackground className="article-backdrop news-bg" src={siteSettings.newsBackgroundUrl} />
    <div className="container">
      <div className="section-title"><span className="eyebrow">LATEST NEWS</span><h2>{siteSettings.newsTitle}</h2><p>{siteSettings.newsSubtitle}</p></div>
      <a className="article-more news-more" href="/news">查看更多消息 <ArrowRight size={16} /></a>
      <div className="article-grid">{visible.map((article) => <ArticleCard key={article.id} article={article} />)}{items.length === 0 && <p className="empty">目前沒有最新消息。</p>}</div>
      {showControls && <div className="slider-controls" role="group" aria-label="最新消息輪播控制"><button type="button" aria-label="上一頁" disabled={pageCount === 1} onClick={() => move(-1)}><ChevronLeft /></button>{Array.from({ length: dotCount }, (_, index) => <button type="button" key={index} aria-label={`第 ${index + 1} 頁`} disabled={index >= pageCount} className={index === page ? 'dot active' : 'dot'} onClick={() => { if (index < pageCount) setPage(index); }} />)}<button type="button" aria-label="下一頁" disabled={pageCount === 1} onClick={() => move(1)}><ChevronRight /></button></div>}
      <div className="benefit-row">{siteSettings.benefits.slice(0, 4).map((benefit, index) => { const Icon = [Flower2, Megaphone, Gift, Heart][index]; return <span key={`${benefit.title}-${index}`}><Icon />{benefit.title}<small>{benefit.caption}</small></span>; })}</div>
    </div>
  </section>;
}

export function BlogSection({ items, siteSettings }: { items: Article[]; siteSettings: SiteSettings }) {
  const cards = items.slice(0, 4);
  const categories = Array.from(new Set(items.map((article) => article.category.trim()).filter(Boolean)));
  const glyphs = ['◉', '⌁', '♡', '☕', '▢'];
  return <section id="blog" className="articles blog section">
    <DeferredBackground className="article-backdrop blog-bg" src={siteSettings.blogBackgroundUrl} />
    <div className="container">
      <div className="section-title"><span className="eyebrow">OUR BLOG</span><h2>{siteSettings.blogTitle}</h2><p>{siteSettings.blogSubtitle}</p></div>
      <a className="article-more blog-more" href="/blog">查看更多文章 <ArrowRight size={16} /></a>
      <div className="article-grid blog-grid">{cards.map((article) => <ArticleCard key={article.id} article={article} />)}{cards.length === 0 && <p className="empty">目前沒有部落格文章。</p>}</div>
      {categories.length > 0 && <div className="category-row">{categories.map((category, index) => <a href={`/blog?category=${encodeURIComponent(category)}`} key={category}>{glyphs[index]}　{category}</a>)}</div>}
    </div>
  </section>;
}

function ArticleCard({ article }: { article: Article }) {
  const isReferenceCrop = article.coverUrl.startsWith('/assets/crops/');
  return <a className="article-card" href={`/${article.type === 'news' ? 'news' : 'blog'}/${article.slug}`}>
    <div className={isReferenceCrop ? 'article-image crop-image' : 'article-image'}><SafeImage src={article.coverUrl} alt={`${article.type === 'news' ? '消息' : '文章'}封面：${article.coverAlt || article.title}`} /><span>{article.category}</span></div>
    <div className="article-body"><time dateTime={article.publishedAt}>{displayDate(article.publishedAt)}</time><h3>{article.title}</h3><p>{article.excerpt}</p><span className="read-more">閱讀更多 <ArrowRight size={15} /></span></div>
  </a>;
}
