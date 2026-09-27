import type { Article, Service, SiteSettings } from '@tian-xin-ge/contracts';
import { absoluteSiteUrl } from './site-url';

const absoluteImage = (value: string) => value ? absoluteSiteUrl(value) : undefined;

function openingHoursData(value: string) {
  const match = value.trim().match(/(?:每日\s*)?(\d{1,2}):(\d{2})\s*[\-–—]\s*(\d{1,2}):(\d{2})/);
  if (!match) return { openingHours: value || undefined };
  const [, opensHour, opensMinute, closesHour, closesMinute] = match;
  const pad = (hour: string, minute: string) => `${hour.padStart(2, '0')}:${minute}`;
  return {
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      opens: pad(opensHour, opensMinute),
      closes: pad(closesHour, closesMinute),
    },
  };
}

export function serviceDescription(service: Pick<Service, 'summary' | 'description'>) {
  const summary = service.summary.trim();
  const description = service.description.trim();
  if (!summary) return description;
  if (!description || description === summary) return summary;
  const prefix = description.startsWith(summary) ? description.slice(summary.length).replace(/^[\s，。；：:、]+/, '') : description;
  return prefix ? `${summary}。${prefix}` : summary;
}

export function serviceAdditionalDescription(service: Pick<Service, 'summary' | 'description'>) {
  const summary = service.summary.trim();
  const description = service.description.trim();
  if (!description || description === summary) return '';
  return description.startsWith(summary) ? description.slice(summary.length).replace(/^[\s，。；：:、]+/, '') : description;
}

export function localBusinessSchema(site: SiteSettings) {
  const sameAs = Object.values(site.social).filter((value): value is string => Boolean(value && /^https:\/\//i.test(value)));
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${absoluteSiteUrl('/')}#business`,
    name: site.brandName,
    url: absoluteSiteUrl('/'),
    logo: absoluteImage(site.logoUrl),
    image: absoluteImage(site.ogImageUrl || site.logoUrl),
    telephone: site.phone,
    address: { '@type': 'PostalAddress', streetAddress: site.address, addressCountry: 'TW' },
    ...openingHoursData(site.businessHours),
    sameAs: sameAs.length ? sameAs : undefined,
  };
}

export function serviceSchema(service: Service, site: SiteSettings) {
  const offers = service.price != null ? { '@type': 'Offer', price: service.price, priceCurrency: 'TWD', url: absoluteSiteUrl(`/services/${service.slug}`) } : undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: serviceDescription(service),
    image: absoluteImage(service.imageUrl),
    url: absoluteSiteUrl(`/services/${service.slug}`),
    provider: { '@id': `${absoluteSiteUrl('/')}#business` },
    offers,
  };
}

export function articleSchema(article: Article, site: SiteSettings) {
  const type = article.type === 'blog' ? 'BlogPosting' : 'Article';
  const authorName = article.authorName || site.editorialTeamName || `${site.brandName}編輯團隊`;
  return {
    '@context': 'https://schema.org',
    '@type': type,
    headline: article.title,
    description: article.seoDescription || article.excerpt,
    image: absoluteImage(article.coverUrl),
    url: absoluteSiteUrl(`/${article.type}/${article.slug}`),
    datePublished: article.publishedAt || undefined,
    dateModified: article.contentUpdatedAt || article.publishedAt || undefined,
    articleSection: article.category || undefined,
    author: { '@type': 'Organization', name: authorName, url: absoluteSiteUrl('/editorial') },
    publisher: { '@id': `${absoluteSiteUrl('/')}#business` },
    mainEntityOfPage: absoluteSiteUrl(`/${article.type}/${article.slug}`),
    isPartOf: { '@id': `${absoluteSiteUrl('/')}#website` },
  };
}

export function websiteSchema(site: SiteSettings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${absoluteSiteUrl('/')}#website`,
    name: site.brandName,
    url: absoluteSiteUrl('/'),
    description: site.seoDescription || site.heroDescription,
    publisher: { '@id': `${absoluteSiteUrl('/')}#business` },
  };
}

export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteSiteUrl(item.path),
    })),
  };
}
