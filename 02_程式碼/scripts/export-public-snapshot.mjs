import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { loadPublicSnapshot } from '../apps/sitemap-worker/src/public-snapshot.mjs';

// This root script deliberately resolves Firebase Admin from the worker
// package, which owns that production dependency. Root tooling stays lean.
const require = createRequire(new URL('../apps/sitemap-worker/package.json', import.meta.url));
const { applicationDefault, initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const output = process.argv[2];
if (!output) throw new Error('Usage: node scripts/export-public-snapshot.mjs <private-output.json>');
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'tiancinge';
const app = initializeApp({ credential: applicationDefault(), projectId });
const snapshot = await loadPublicSnapshot(getFirestore(app));
const target = resolve(output);
await mkdir(dirname(target), { recursive: true, mode: 0o700 });
await writeFile(target, `${JSON.stringify({ ...snapshot, generatedAt: new Date().toISOString() })}\n`, { mode: 0o600 });
process.stdout.write(`${JSON.stringify({ digest: snapshot.digest, articles: snapshot.articles.length, services: snapshot.services.length })}\n`);
