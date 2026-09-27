import Link from 'next/link';

export type BreadcrumbItem = { name: string; href?: string };

/** Visible, crawlable context for list, category and detail pages. */
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return <nav className="breadcrumbs" aria-label="麵包屑">{items.map((item, index) => <span key={`${item.name}-${index}`}>{index > 0 && <span aria-hidden="true">／</span>}{item.href ? <Link href={item.href}>{item.name}</Link> : <span aria-current={index === items.length - 1 ? 'page' : undefined}>{item.name}</span>}</span>)}</nav>;
}
