import type { Metadata } from 'next';
import { absoluteSiteUrl } from './site-url';

export type SeoMetadataInput = {
  title: string;
  description: string;
  path: string;
  siteName: string;
  imageUrl?: string;
  imageAlt?: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
};

/** Build crawl-facing metadata with one canonical URL policy for every route. */
export function buildSeoMetadata({ title, description, path, siteName, imageUrl, imageAlt, type = 'website', noIndex = false }: SeoMetadataInput): Metadata {
  const url = absoluteSiteUrl(path);
  const safeImage = imageUrl && (/^\//.test(imageUrl) || /^https:\/\//i.test(imageUrl)) ? imageUrl : undefined;
  const image = safeImage ? { url: absoluteSiteUrl(safeImage), alt: imageAlt || title } : undefined;
  return {
    title: title.trim().slice(0, 160),
    description: description.trim().slice(0, 300),
    alternates: { canonical: url },
    robots: noIndex ? { index: false, follow: true } : undefined,
    openGraph: {
      title: title.trim().slice(0, 160),
      description: description.trim().slice(0, 300),
      url,
      siteName,
      locale: 'zh_TW',
      type,
      images: image ? [image] : undefined,
    },
    twitter: image ? { card: 'summary_large_image', title: title.trim().slice(0, 160), description: description.trim().slice(0, 300), images: [image.url] } : { card: 'summary', title: title.trim().slice(0, 160), description: description.trim().slice(0, 300) },
  };
}
