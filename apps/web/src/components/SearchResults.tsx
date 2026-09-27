'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type SearchItem = { title: string; excerpt: string; url: string; kind: string; text: string };
export function SearchResults({ items }: { items: SearchItem[] }) {
  const [query, setQuery] = useState('');
  useEffect(() => setQuery(new URLSearchParams(window.location.search).get('q')?.trim() || ''), []);
  const found = useMemo(() => query ? items.filter((item) => item.text.includes(query.toLowerCase())) : [], [items, query]);
  return <><form action="/search"><input name="q" defaultValue={query} placeholder="搜尋服務、消息或文章"/><button className="btn">搜尋</button></form>{query && <p className="search-result">「{query}」找到 {found.length} 筆結果</p>}<div className="search-list">{found.map((item) => <Link href={item.url} key={item.url}><span>{item.kind}</span><h2>{item.title}</h2><p>{item.excerpt}</p></Link>)}{query && found.length === 0 && <p>找不到符合的內容，請換個關鍵字。</p>}</div></>;
}
