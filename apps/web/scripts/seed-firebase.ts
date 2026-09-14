import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { fixtureArticles, fixtureCategories, fixtureMedia, fixtureMessages, fixtureServices, fixtureSettings } from '../../../packages/contracts/src/fixtures.ts';

const projectId = process.env.FIREBASE_PROJECT_ID || 'tiancinge';
const app = getApps()[0] ?? initializeApp({ credential: applicationDefault(), projectId, storageBucket: `${projectId}.firebasestorage.app` });
const db = getFirestore(app);
const now = new Date().toISOString();
const stableContentCode = (seed: string) => { let hash = 2166136261; for (const char of seed) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619); const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'; let value = hash >>> 0; return Array.from({ length: 10 }, () => { value = Math.imul(value ^ (value >>> 13), 16777619) >>> 0; return alphabet[value % alphabet.length]; }).join(''); };

const settings = {
  brandName: fixtureSettings.brandName, phone: fixtureSettings.phone, line: fixtureSettings.lineId, lineId: fixtureSettings.lineId, lineUrl: fixtureSettings.lineUrl,
  address: fixtureSettings.address, hours: fixtureSettings.businessHours, businessHours: fixtureSettings.businessHours, mapEmbedUrl: fixtureSettings.mapEmbedUrl,
  social: fixtureSettings.social, logoUrl: fixtureSettings.logoUrl, heroTitle: fixtureSettings.heroTitle, heroSubtitle: fixtureSettings.heroSubtitle,
  tagline: fixtureSettings.tagline, heroDescription: fixtureSettings.heroDescription, heroBackgroundUrl: fixtureSettings.heroBackgroundUrl,
  servicesTitle: fixtureSettings.servicesTitle, servicesSubtitle: fixtureSettings.servicesSubtitle, servicesNote: fixtureSettings.servicesNote, servicesBackgroundUrl: fixtureSettings.servicesBackgroundUrl,
  pricingTitle: fixtureSettings.pricingTitle, pricingSubtitle: fixtureSettings.pricingSubtitle, pricingBackgroundUrl: fixtureSettings.pricingBackgroundUrl,
  newsTitle: fixtureSettings.newsTitle, newsSubtitle: fixtureSettings.newsSubtitle, newsBackgroundUrl: fixtureSettings.newsBackgroundUrl,
  blogTitle: fixtureSettings.blogTitle, blogSubtitle: fixtureSettings.blogSubtitle, blogBackgroundUrl: fixtureSettings.blogBackgroundUrl,
  contactTitle: fixtureSettings.contactTitle, contactLead: fixtureSettings.contactLead, contactBackgroundUrl: fixtureSettings.contactBackgroundUrl,
  benefits: fixtureSettings.benefits, pricingBenefits: fixtureSettings.pricingBenefits, privacy: fixtureSettings.privacyText, terms: fixtureSettings.termsText,
  privacyText: fixtureSettings.privacyText, termsText: fixtureSettings.termsText, seoTitle: fixtureSettings.seoTitle, seoDescription: fixtureSettings.seoDescription, ogImageUrl: fixtureSettings.ogImageUrl, updatedAt: now,
};

async function seed() {
  const batch = db.batch();
  batch.set(db.collection('site_settings').doc('singleton'), settings, { merge: true });
  for (const item of fixtureServices) batch.set(db.collection('services').doc(item.id), { ...item, slug: stableContentCode(`service:${item.id}`), createdAt: now, updatedAt: now });
  for (const item of fixtureCategories) batch.set(db.collection('article_categories').doc(item.id), item, { merge: true });
  for (const item of fixtureArticles) batch.set(db.collection('articles').doc(item.id), { ...item, slug: stableContentCode(`article:${item.id}`), createdAt: now, updatedAt: now });
  for (const item of fixtureMedia) batch.set(db.collection('media_assets').doc(item.id), item, { merge: true });
  for (const item of fixtureMessages) batch.set(db.collection('contact_messages').doc(item.id), { ...item, updatedAt: now });
  await batch.commit();
  console.log(`Seeded settings, ${fixtureServices.length} services, ${fixtureArticles.length} articles, ${fixtureMedia.length} media, ${fixtureMessages.length} messages.`);
}

await seed();
