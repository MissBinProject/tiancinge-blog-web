export const DEFAULT_SITE_URL = 'https://tiancinge-web.web.app';

/**
 * Resolve the public origin once at request time. Production must never fall
 * back to localhost because metadata, feeds and robots.txt are crawl-facing
 * documents.
 */
export function getSiteUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const fallback = process.env.NODE_ENV === 'production' ? DEFAULT_SITE_URL : 'http://localhost:3000';
  const value = configured || fallback;
  try {
    const parsed = new URL(value.endsWith('/') ? value : `${value}/`);
    if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') return new URL(`${DEFAULT_SITE_URL}/`);
    return parsed;
  } catch {
    return new URL(`${DEFAULT_SITE_URL}/`);
  }
}

export function absoluteSiteUrl(path = '/'): string {
  if (/^https?:\/\//i.test(path)) return path;
  return new URL(path.startsWith('/') ? path : `/${path}`, getSiteUrl()).toString();
}
