import type { Article } from '@tian-xin-ge/contracts';
import Link from 'next/link';
import { SafeImage } from './SafeImage';
import { displayDate } from '../lib/display-date';

export function ArticleList({ items, type, category, page = 1, categories: categoryOptions, totalPages: suppliedTotalPages }: { items: Article[]; type: 'news' | 'blog'; category?: string; page?: number; categories?: string[]; totalPages?: number }) {
  const filtered = category ? items.filter((item) => item.category === category) : items;
  const categories = categoryOptions || Array.from(new Set(items.map((item) => item.category).filter(Boolean)));
  const pageSize = 8;
  const totalPages = suppliedTotalPages || Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  // The server-backed list already contains the requested page. Only apply
  // client-side slicing for callers that pass the complete local fixture list.
  const pageItems = suppliedTotalPages !== undefined ? filtered : filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const label = type === 'news' ? '最新消息' : '部落格';
  return <>
    <nav className="category-filters" aria-label={label + '分類'}>
      <Link className={!category ? 'active' : ''} href={'/' + type} aria-current={!category ? 'page' : undefined}>全部</Link>
      {categories.map((item) => <Link className={category === item ? 'active' : ''} href={'/' + type + '/category/' + encodeURIComponent(item)} aria-current={category === item ? 'page' : undefined} key={item}>{item}</Link>)}
    </nav>
    <div className="container inner-grid article-list">
      {pageItems.map((article) => <Link href={'/' + type + '/' + article.slug} className="inner-card" key={article.id}><SafeImage src={article.coverUrl} alt={`${type === 'news' ? '消息' : '文章'}列表封面：${article.coverAlt || article.title}`}/><time dateTime={article.publishedAt}>{displayDate(article.publishedAt)}</time><h2>{article.title}</h2><p>{article.excerpt}</p><span>閱讀更多　→</span></Link>)}
      {pageItems.length === 0 && <p className="empty">目前沒有符合條件的內容。</p>}
    </div>
    {totalPages > 1 && <nav className="pagination" aria-label="文章分頁">{Array.from({ length: totalPages }, (_, index) => { const next = index + 1; const base = category ? `/${type}/category/${encodeURIComponent(category)}` : `/${type}`; const href = next === 1 ? base : `${base}/page/${next}`; return <Link className={next === safePage ? 'active' : ''} href={href} key={next}>{next}</Link>; })}</nav>}
  </>;
}
