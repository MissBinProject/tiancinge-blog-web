import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID || 'tiancinge';
const app = getApps()[0] ?? initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore(app);
const apply = process.argv.includes('--apply');

const serviceTargets = new Map([
  ['s1', 'full-body-massage'],
  ['s2', 'essential-oil-massage'],
  ['s3', 'hot-stone-massage'],
  ['s4', 'foot-massage'],
  ['s5', 'custom-massage-course'],
]);

const articleTargets = new Map([
  ['H4v0b0kqnUGpvLjJZRJn', 'ximending-massage-tian-xin-ge'],
  ['n1', 'mid-autumn-massage-offer'],
  ['n2', 'essential-oil-massage-course'],
  ['n3', 'massage-space-upgrade'],
]);

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const unique = (values) => [...new Set(values.filter((value) => typeof value === 'string' && slugPattern.test(value)))];
const historyFor = (row, target) => unique([...(Array.isArray(row.previousSlugs) ? row.previousSlugs : []), row.slug]).filter((slug) => slug !== target).slice(-20);

const [servicesSnapshot, articlesSnapshot, pricingSnapshot] = await Promise.all([
  db.collection('services').get(),
  db.collection('articles').get(),
  db.collection('pricing_plans').get(),
]);

const services = new Map(servicesSnapshot.docs.map((doc) => [doc.id, { ref: doc.ref, ...doc.data() }]));
const articles = new Map(articlesSnapshot.docs.map((doc) => [doc.id, { ref: doc.ref, ...doc.data() }]));

for (const [id, slug] of [...serviceTargets, ...articleTargets]) {
  if (!slugPattern.test(slug) || slug.length > 80) throw new Error(`Invalid target slug: ${id} -> ${slug}`);
}
if (new Set(serviceTargets.values()).size !== serviceTargets.size) throw new Error('Duplicate service target slug');
if (new Set(articleTargets.values()).size !== articleTargets.size) throw new Error('Duplicate article target slug');

const assertUnclaimed = (rows, targets, namespace) => {
  for (const [targetId, targetSlug] of targets) {
    const target = rows.get(targetId);
    if (!target) throw new Error(`Missing ${namespace} document: ${targetId}`);
    for (const [id, row] of rows) {
      if (id === targetId) continue;
      const claims = unique([row.slug, ...(Array.isArray(row.previousSlugs) ? row.previousSlugs : [])]);
      if (claims.includes(targetSlug)) throw new Error(`${namespace} slug already claimed: ${targetSlug} by ${id}`);
    }
  }
};

assertUnclaimed(services, serviceTargets, 'service');
assertUnclaimed(articles, articleTargets, 'article');

const serviceOldToNew = new Map();
const changes = [];
for (const [id, targetSlug] of serviceTargets) {
  const row = services.get(id);
  if (row.slug === targetSlug) continue;
  serviceOldToNew.set(row.slug, targetSlug);
  changes.push({ kind: 'service', id, from: row.slug, to: targetSlug, history: historyFor(row, targetSlug) });
}
for (const [id, targetSlug] of articleTargets) {
  const row = articles.get(id);
  if (row.slug === targetSlug) continue;
  changes.push({ kind: row.type || 'article', id, from: row.slug, to: targetSlug, history: historyFor(row, targetSlug) });
}

const pricingChanges = pricingSnapshot.docs.flatMap((doc) => {
  const row = doc.data();
  if (!Array.isArray(row.relatedServiceSlugs)) return [];
  const next = unique(row.relatedServiceSlugs.map((slug) => serviceOldToNew.get(slug) || slug));
  return JSON.stringify(next) === JSON.stringify(row.relatedServiceSlugs) ? [] : [{ doc, from: row.relatedServiceSlugs, to: next }];
});

console.log(JSON.stringify({ apply, changes, pricingChanges: pricingChanges.map(({ doc, from, to }) => ({ id: doc.id, from, to })) }, null, 2));

if (apply && (changes.length || pricingChanges.length)) {
  const batch = db.batch();
  const now = Timestamp.now();
  for (const change of changes) {
    const rows = change.kind === 'service' ? services : articles;
    const row = rows.get(change.id);
    batch.update(row.ref, {
      slug: change.to,
      previousSlugs: change.history,
      version: Number.isInteger(row.version) ? row.version + 1 : 2,
      updatedAt: now,
    });
  }
  for (const { doc, to } of pricingChanges) {
    const row = doc.data();
    batch.update(doc.ref, {
      relatedServiceSlugs: to,
      version: Number.isInteger(row.version) ? row.version + 1 : 2,
      updatedAt: now,
    });
  }
  await batch.commit();
  console.log(`Applied ${changes.length} URL changes and ${pricingChanges.length} pricing reference changes.`);
} else if (apply) {
  console.log('No changes required.');
} else {
  console.log('Dry run only. Run again with --apply to commit.');
}

await app.delete();
