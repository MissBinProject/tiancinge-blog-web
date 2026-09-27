import { createHash } from 'node:crypto';

const text = (value, max = 10_000) => typeof value === 'string' ? value.slice(0, max) : '';
const value = (row, snake, max) => text(row[snake] ?? row[snake.replace(/_([a-z])/g, (_, c) => c.toUpperCase())], max);
const socialValue = (row, nested, key, max = 2_048) => {
  const candidates = [row[key], row[`${key}_url`], row[`${key}Url`], nested[key], nested[`${key}_url`], nested[`${key}Url`]];
  const configured = candidates.find((candidate) => typeof candidate === 'string' && candidate.trim() && candidate.trim() !== '#');
  return text(configured ?? candidates.find((candidate) => typeof candidate === 'string'), max);
};
const date = (value) => {
  if (value && typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' && !Number.isNaN(new Date(value).valueOf())) return new Date(value).toISOString();
  return undefined;
};
const serviceSlug = (value) => typeof value === 'string' && value.length <= 80 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const previousSlugs = (row) => Array.isArray(row.previousSlugs) ? [...new Set(row.previousSlugs.filter(serviceSlug))].slice(0, 20) : [];
const notDeleted = (row) => row && row.deletedAt == null && row.deleted_at == null;

/**
 * Project only fields that are allowed to be delivered to a public browser.
 * Keep this module free of rendering logic so the same snapshot drives the
 * static build, search index and sitemap.
 */
export function projectPublicSnapshot({ services, pricingPlans = [], articles, categories, settings }) {
  if (!Array.isArray(services) || !Array.isArray(pricingPlans) || !Array.isArray(articles) || !Array.isArray(categories) || !settings) throw new Error('Incomplete public snapshot source');
  const publicServices = services.map(({ id, row }) => ({
    id, slug: text(row.slug, 80), previousSlugs: previousSlugs(row), name: text(row.name, 160), summary: text(row.summary, 600), description: text(row.description, 10_000),
    imageUrl: value(row, 'image_url', 2_048), imageAlt: value(row, 'image_alt', 160), seoTitle: value(row, 'seo_title', 160), seoDescription: value(row, 'seo_description', 300), process: value(row, 'process', 2_000), suitableFor: value(row, 'suitable_for', 2_000), precautions: value(row, 'precautions', 2_000), faq: value(row, 'faq', 2_000), icon: text(row.icon, 32),
    durationMinutes: Number.isFinite(Number(row.durationMinutes ?? row.duration_minutes)) ? Number(row.durationMinutes ?? row.duration_minutes) : undefined,
    price: Number.isFinite(Number(row.price)) ? Number(row.price) : undefined, priceLabel: value(row, 'price_label', 160),
    sortOrder: Number.isFinite(Number(row.sortOrder ?? row.sort_order)) ? Number(row.sortOrder ?? row.sort_order) : 0,
    isVisible: Boolean(row.isVisible ?? row.is_visible), contentUpdatedAt: date(row.contentUpdatedAt ?? row.content_updated_at), updatedAt: date(row.updatedAt ?? row.updated_at),
  })).filter((item, index) => notDeleted(services[index]?.row) && item.isVisible && serviceSlug(item.slug)).sort((a, b) => a.sortOrder - b.sortOrder || a.slug.localeCompare(b.slug));
  const publicPricingPlans = pricingPlans.map(({ id, row }) => ({
    id, name: text(row.name, 160), summary: text(row.summary, 600), description: text(row.description, 2_000), category: text(row.category, 80), durationMinutes: Number.isFinite(Number(row.durationMinutes ?? row.duration_minutes)) ? Number(row.durationMinutes ?? row.duration_minutes) : undefined, durationNote: value(row, 'duration_note', 240), price: Number.isFinite(Number(row.price)) ? Number(row.price) : 0, relatedServiceSlugs: Array.isArray(row.relatedServiceSlugs ?? row.related_service_slugs) ? (row.relatedServiceSlugs ?? row.related_service_slugs).filter((item) => typeof item === 'string').slice(0, 10) : [], imageUrl: value(row, 'image_url', 2_048), imageAlt: value(row, 'image_alt', 160), isVisible: Boolean(row.isVisible ?? row.is_visible), showOnHome: Boolean(row.showOnHome ?? row.show_on_home), isFeatured: Boolean(row.isFeatured ?? row.is_featured), sortOrder: Number.isFinite(Number(row.sortOrder ?? row.sort_order)) ? Number(row.sortOrder ?? row.sort_order) : 0, homeSortOrder: Number.isFinite(Number(row.homeSortOrder ?? row.home_sort_order)) ? Number(row.homeSortOrder ?? row.home_sort_order) : 0, version: Number.isInteger(row.version) ? Number(row.version) : undefined, updatedAt: date(row.updatedAt ?? row.updated_at),
  })).filter((item, index) => notDeleted(pricingPlans[index]?.row) && item.isVisible).sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
  const publicArticles = articles.map(({ id, row }) => ({
    id, slug: text(row.slug, 80), previousSlugs: previousSlugs(row), type: text(row.type, 12), status: text(row.status, 12), category: text(row.category, 120),
    title: text(row.title, 160), excerpt: text(row.excerpt, 600), seoTitle: value(row, 'seo_title', 160), seoDescription: value(row, 'seo_description', 300),
    coverUrl: value(row, 'cover_url', 2_048), coverAlt: value(row, 'cover_alt', 160), body: Array.isArray(row.body) ? row.body : [],
    sources: Array.isArray(row.sources) ? row.sources : [], contentUpdatedAt: date(row.contentUpdatedAt ?? row.content_updated_at), authorName: value(row, 'author_name', 160),
    publishedAt: date(row.publishedAt ?? row.published_at), updatedAt: date(row.updatedAt ?? row.updated_at),
  })).filter((item, index) => notDeleted(articles[index]?.row) && item.status === 'published' && (item.type === 'news' || item.type === 'blog') && serviceSlug(item.slug))
    .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')) || a.slug.localeCompare(b.slug));
  const publicCategories = categories.filter(({ row }) => notDeleted(row)).map(({ id, row }) => ({ id, type: text(row.type, 12), name: text(row.name, 120), description: text(row.description, 2_000), seoTitle: value(row, 'seo_title', 160), seoDescription: value(row, 'seo_description', 300), updatedAt: date(row.updatedAt ?? row.updated_at) }))
    .filter((item) => (item.type === 'news' || item.type === 'blog') && item.name && publicArticles.some((article) => article.type === item.type && article.category === item.name));
  const rawSocial = settings.social && typeof settings.social === 'object' ? settings.social : {};
  const publicSettings = {
    brandName: value(settings, 'brand_name', 160), tagline: value(settings, 'tagline', 300), logoUrl: value(settings, 'logo_url', 2_048),
    phone: value(settings, 'phone', 80), line: value(settings, 'line', 160), lineId: value(settings, 'line_id', 160), lineUrl: value(settings, 'line_url', 2_048), address: value(settings, 'address', 300), businessHours: value(settings, 'business_hours', 300), mapEmbedUrl: value(settings, 'map_embed_url', 2_048), social: { line: socialValue(settings, rawSocial, 'line'), instagram: socialValue(settings, rawSocial, 'instagram'), facebook: socialValue(settings, rawSocial, 'facebook'), youtube: socialValue(settings, rawSocial, 'youtube') },
    heroTitle: value(settings, 'hero_title', 300), heroSubtitle: value(settings, 'hero_subtitle', 600), heroDescription: value(settings, 'hero_description', 2_000), heroBackgroundUrl: value(settings, 'hero_background_url', 2_048),
    servicesTitle: value(settings, 'services_title', 160), servicesSubtitle: value(settings, 'services_subtitle', 600), servicesNote: value(settings, 'services_note', 1_000), servicesBackgroundUrl: value(settings, 'services_background_url', 2_048),
    pricingTitle: value(settings, 'pricing_title', 160), pricingSubtitle: value(settings, 'pricing_subtitle', 600), pricingBackgroundUrl: value(settings, 'pricing_background_url', 2_048),
    newsTitle: value(settings, 'news_title', 160), newsSubtitle: value(settings, 'news_subtitle', 600), newsBackgroundUrl: value(settings, 'news_background_url', 2_048),
    blogTitle: value(settings, 'blog_title', 160), blogSubtitle: value(settings, 'blog_subtitle', 600), blogBackgroundUrl: value(settings, 'blog_background_url', 2_048),
    contactTitle: value(settings, 'contact_title', 160), contactLead: value(settings, 'contact_lead', 1_000), contactBackgroundUrl: value(settings, 'contact_background_url', 2_048),
    benefits: Array.isArray(settings.benefits) ? settings.benefits : [], pricingBenefits: Array.isArray(settings.pricingBenefits ?? settings.pricing_benefits) ? settings.pricingBenefits ?? settings.pricing_benefits : [],
    seoTitle: value(settings, 'seo_title', 160), seoDescription: value(settings, 'seo_description', 300), ogImageUrl: value(settings, 'og_image_url', 2_048), editorialTeamName: value(settings, 'editorial_team_name', 160), editorialBio: value(settings, 'editorial_bio', 2_000), editorialPolicy: value(settings, 'editorial_policy', 2_000),
  };
  if (!publicSettings.brandName || !publicSettings.phone || !publicSettings.address) throw new Error('Public site settings are incomplete');
  const snapshot = { schemaVersion: 1, services: publicServices, pricingPlans: publicPricingPlans, articles: publicArticles, categories: publicCategories, settings: publicSettings };
  return { ...snapshot, digest: createHash('sha256').update(JSON.stringify(snapshot)).digest('hex') };
}

/** Obtain a Firestore transaction snapshot exactly once for a static release. */
export async function loadPublicSnapshot(db) {
  return db.runTransaction(async (transaction) => {
    const [services, pricingPlans, articles, categories, settings] = await Promise.all([
      transaction.get(db.collection('services')),
      transaction.get(db.collection('pricing_plans')),
      transaction.get(db.collection('articles').where('status', '==', 'published')),
      transaction.get(db.collection('article_categories')),
      transaction.get(db.collection('site_settings').doc('singleton')),
    ]);
    if (!settings.exists) throw new Error('Missing site settings; retaining current release');
    return projectPublicSnapshot({
      services: services.docs.map((doc) => ({ id: doc.id, row: doc.data() })),
      pricingPlans: pricingPlans.docs.map((doc) => ({ id: doc.id, row: doc.data() })),
      articles: articles.docs.map((doc) => ({ id: doc.id, row: doc.data() })),
      categories: categories.docs.map((doc) => ({ id: doc.id, row: doc.data() })),
      settings: settings.data(),
    });
  }, { readOnly: true });
}
