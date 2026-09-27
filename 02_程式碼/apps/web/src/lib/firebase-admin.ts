import { applicationDefault, cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';

let app: App | null = null;
let db: Firestore | null = null;
let storage: Storage | null = null;

function createServerApp(): App | null {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim() || process.env.GOOGLE_CLOUD_PROJECT?.trim() || process.env.GCLOUD_PROJECT?.trim();
  if (!projectId && !process.env.FIREBASE_CONFIG) return null;
  if (getApps().length) return getApps()[0];
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const credential = privateKey && process.env.FIREBASE_CLIENT_EMAIL
      ? cert({ projectId, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey })
      : applicationDefault();
    return initializeApp({ credential, projectId, storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app` });
  } catch {
    return null;
  }
}

app = createServerApp();
if (app) {
  db = getFirestore(app);
  storage = getStorage(app);
}

export const firebaseServerConfigured = Boolean(db);
export const firebaseServerExpected = Boolean(process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || process.env.FIREBASE_CONFIG);
export function firebaseServer(): { db: Firestore; storage: Storage } | null {
  return db && storage ? { db, storage } : null;
}
