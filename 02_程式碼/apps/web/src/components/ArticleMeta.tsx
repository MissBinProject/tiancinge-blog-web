import type { Article, SiteSettings } from '@tian-xin-ge/contracts';
import { displayDate } from '../lib/display-date';

export function ArticleMeta({ article, site }: { article: Article; site: SiteSettings }) {
  const author = article.authorName || site.editorialTeamName || `${site.brandName}編輯團隊`;
  const modified = article.contentUpdatedAt && article.contentUpdatedAt.slice(0, 10) !== article.publishedAt ? article.contentUpdatedAt : undefined;
  return <div className="article-meta" aria-label="文章資訊">
    <span>作者：{author}</span>
    <time dateTime={article.publishedAt}>發布：{displayDate(article.publishedAt)}</time>
    {modified && <time dateTime={modified}>更新：{displayDate(modified)}</time>}
  </div>;
}
