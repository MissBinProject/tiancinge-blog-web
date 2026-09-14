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
    <div className="container">
      <div className="section-title"><span className="eyebrow">LATEST NEWS</span><h2>{siteSettings.newsTitle}</h2><p>{siteSettings.newsSubtitle}</p></div>
      <div className="article-grid">{visible.map((article) => <ArticleCard key={article.id} article={article} />)}{items.length === 0 && <p className="empty">目前沒有最新消息。</p>}</div>
      {showControls && <div className="slider-controls" aria-label="最新消息輪播控制"><button type="button" aria-label="上一頁" disabled={pageCount === 1} onClick={() => move(-1)}><ChevronLeft /></button>{Array.from({ length: dotCount }, (_, index) => <button type="button" key={index} aria-label={`第 ${index + 1} 頁`} disabled={index >= pageCount} className={index === page ? 'dot active' : 'dot'} onClick={() => { if (index < pageCount) setPage(index); }} />)}<button type="button" aria-label="下一頁" disabled={pageCount === 1} onClick={() => move(1)}><ChevronRight /></button></div>}
      <div className="benefit-row">{siteSettings.benefits.slice(0, 4).map((benefit, index) => { const Icon = [Flower2, Megaphone, Gift, Heart][index]; return <span key={`${benefit.title}-${index}`}><Icon />{benefit.title}<small>{benefit.caption}</small></span>; })}</div>
    </div>
  </section>;
}

export function BlogSection({ items = getPublished('blog').slice(0, 4), siteSettings = settings }: { items?: Article[]; siteSettings?: SiteSettings }) {
  return <section id="blog" className="articles blog section">
    <div className="article-backdrop blog-bg" style={siteSettings.blogBackgroundUrl ? { backgroundImage: `url(${siteSettings.blogBackgroundUrl})` } : undefined} />
    <div className="container">
      <div className="section-title"><span className="eyebrow">OUR BLOG</span><h2>{siteSettings.blogTitle}</h2><p>{siteSettings.blogSubtitle}</p></div>
      <div className="article-grid blog-grid">{items.map((article) => <ArticleCard key={article.id} article={article} />)}{items.length === 0 && <p className="empty">目前沒有部落格文章。</p>}</div>
      <div className="category-row"><a href="/blog?category=養生知識">◉　養生知識</a><a href="/blog?category=生活美學">⌁　生活美學</a><a href="/blog?category=心靈成長">♡　心靈成長</a><a href="/blog?category=健康飲食">☕　健康飲食</a><a href="/blog?category=館內日常">▢　館內日常</a></div>
    </div>
  </section>;
}

function ArticleCard({ article }: { article: Article }) {
  return <a className="article-card" href={`/${article.type === 'news' ? 'news' : 'blog'}/${article.slug}`}>
    <div className="article-image"><SafeImage src={article.coverUrl} alt={article.title} /><span>{article.category}</span></div>
    <div className="article-body"><time dateTime={article.publishedAt}>{article.publishedAt.replaceAll('-', ' / ')}</time><h3>{article.title}</h3><p>{article.excerpt}</p><span className="read-more">閱讀更多 <ArrowRight size={15} /></span></div>
  </a>;
}
