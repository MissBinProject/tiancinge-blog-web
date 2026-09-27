/** Read a consistent snapshot. Never replace a failed collection read with []. */
export async function loadSource(db) {
  return db.runTransaction(async (transaction) => {
    const [services, pricingPlans, articles, categories, settings] = await Promise.all([
      transaction.get(db.collection('services')),
      transaction.get(db.collection('pricing_plans')),
      transaction.get(db.collection('articles').where('status', '==', 'published')),
      transaction.get(db.collection('article_categories')),
      transaction.get(db.collection('site_settings').doc('singleton')),
    ]);
    if (!settings.exists) throw new Error('Missing site settings; retaining previous sitemap');
    return {
      services: services.docs.filter((doc) => doc.data().deletedAt == null && doc.data().deleted_at == null).map((doc) => {
        const row = doc.data();
        return { slug: row.slug, isVisible: Boolean(row.isVisible ?? row.is_visible), updatedAt: row.updatedAt ?? row.updated_at };
      }),
      pricingPlans: (pricingPlans?.docs || []).filter((doc) => doc.data().deletedAt == null && doc.data().deleted_at == null).map((doc) => ({ id: doc.id, row: doc.data() })),
      articles: articles.docs.filter((doc) => doc.data().deletedAt == null && doc.data().deleted_at == null).map((doc) => {
        const row = doc.data();
        return {
          slug: row.slug, type: row.type, status: row.status, category: row.category,
          contentUpdatedAt: row.contentUpdatedAt ?? row.content_updated_at,
          updatedAt: row.updatedAt ?? row.updated_at,
          publishedAt: row.publishedAt ?? row.published_at,
        };
      }),
      categories: categories.docs.filter((doc) => doc.data().deletedAt == null && doc.data().deleted_at == null).map((doc) => {
        const row = doc.data();
        return { type: row.type, name: row.name };
      }),
      settings: settings.data(),
    };
  }, { readOnly: true });
}
