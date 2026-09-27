import type { Article } from '@tian-xin-ge/contracts';

export function articleHeadingId(text: string, index: number): string {
  const normalized = text.trim().toLocaleLowerCase().replace(/\s+/g, '-').replace(/[^\p{Letter}\p{Number}\u3400-\u9fff-]/gu, '').slice(0, 48);
  return `${normalized || 'section'}-${index + 1}`;
}

export function articleHeadings(article: Article) {
  return article.body.flatMap((block, index) => block.type === 'heading' && block.text.trim()
    ? [{ text: block.text.trim(), level: block.level ?? 2, id: articleHeadingId(block.text, index) }]
    : []);
}

export function relatedArticles(article: Article, items: Article[], limit = 3) {
  return items
    .filter((item) => item.id !== article.id && item.type === article.type && item.category === article.category && item.status === 'published')
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || b.id.localeCompare(a.id))
    .slice(0, limit);
}
