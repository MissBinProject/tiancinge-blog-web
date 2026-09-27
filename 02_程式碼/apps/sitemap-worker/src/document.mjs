export const SITE_ORIGIN = 'https://tiancinge-web.web.app';
const serviceSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const escapeXml = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);

export function isoDate(value, now = new Date()) {
  if (!value) return undefined;
  let date;
  try {
    date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
  } catch { return undefined; }
  return Number.isFinite(date.getTime()) && date <= now ? date.toISOString() : undefined;
}

/** Pure rules: failures reading source data must be handled before calling this function. */
export function buildSitemap({ services, pricingPlans = [], articles, categories, settings }, now = new Date()) {
  if (!Array.isArray(services) || !Array.isArray(pricingPlans) || !Array.isArray(articles) || !Array.isArray(categories) || !settings) throw new Error('Incomplete sitemap source');
  const entries = new Map();
  const add = (path, date) => {
    const url = new URL(path, SITE_ORIGIN).href;
    if (new URL(url).origin !== SITE_ORIGIN || url.includes('#') || url.includes('?')) throw new Error('Invalid sitemap URL');
    const lastmod = isoDate(date, now);
    const previous = entries.get(url);
    if (!previous || (lastmod && (!previous.lastmod || lastmod > previous.lastmod))) entries.set(url, { url, lastmod });
  };
  const latest = (rows, fields) => rows
    .flatMap((row) => fields.map((field) => row?.[field]).filter(Boolean))
    .map((value) => isoDate(value, now))
    .filter(Boolean)
    .sort()
    .at(-1);
  const visibleServices = services.filter((service) => service.isVisible === true && typeof service.slug === 'string' && service.slug.length <= 80 && serviceSlug.test(service.slug));
  // Legal pages remain linked and accessible, but are not primary search landing
  // pages. Keeping them out of the sitemap reduces low-intent URL noise.
  const publicArticles = articles.filter((article) => article.status === 'published' && ['news', 'blog'].includes(article.type) && typeof article.slug === 'string' && article.slug.length <= 80 && serviceSlug.test(article.slug));
  add('/');
  add('/services', latest(visibleServices, ['contentUpdatedAt', 'updatedAt']));
  if (pricingPlans.length) add('/pricing', latest(pricingPlans, ['updatedAt']));
  add('/news', latest(publicArticles.filter((article) => article.type === 'news'), ['contentUpdatedAt', 'updatedAt', 'publishedAt']));
  add('/blog', latest(publicArticles.filter((article) => article.type === 'blog'), ['contentUpdatedAt', 'updatedAt', 'publishedAt']));
  if ((settings.editorialBio || settings.editorial_bio || '').trim() && (settings.editorialPolicy || settings.editorial_policy || '').trim()) add('/editorial');
  for (const service of visibleServices) {
    add(`/services/${service.slug}`, service.contentUpdatedAt || service.updatedAt);
  }
  for (const article of publicArticles) {
    add(`/${article.type}/${article.slug}`, article.contentUpdatedAt || article.updatedAt || article.publishedAt);
  }
  // Page 1 is the list route itself. Later pages are separate static HTML
  // files, so sitemap entries must be generated from the same row set.
  const pageSize = 8;
  for (const type of ['news', 'blog']) {
    const rows = publicArticles.filter((article) => article.type === type);
    const latest = rows.map((article) => article.contentUpdatedAt || article.updatedAt || article.publishedAt).filter(Boolean).sort().at(-1);
    for (let page = 2; page <= Math.ceil(rows.length / pageSize); page += 1) add(`/${type}/page/${page}`, latest);
  }
  const urls = [...entries.values()].sort((a, b) => a.url.localeCompare(b.url));
  if (urls.length > 50_000) throw new Error('Sitemap URL limit exceeded');
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.map(({ url, lastmod }) => `  <url><loc>${escapeXml(url)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`).join('\n') + '\n</urlset>\n';
  if (Buffer.byteLength(xml) > 50 * 1024 * 1024) throw new Error('Sitemap byte limit exceeded');
  return { xml, urls };
}

// Search is a noindex utility page; disallow it as well so crawlers do not
// spend crawl budget on arbitrary query strings. Public landing pages remain
// crawlable and the sitemap stays the source of indexable URLs.
export const robots = `User-agent: *\nAllow: /\nDisallow: /search\nDisallow: /api/\nDisallow: /admin\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`;
