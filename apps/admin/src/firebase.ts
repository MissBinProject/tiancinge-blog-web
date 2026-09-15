import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

export const firebaseConfigured = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);
let app: FirebaseApp | null = null;
if (firebaseConfigured) app = getApps().length ? getApp() : initializeApp(config);

export const firebaseAuth: Auth | null = app ? getAuth(app) : null;
export const firebaseDb: Firestore | null = app ? getFirestore(app) : null;
export const firebaseStorage: FirebaseStorage | null = app ? getStorage(app) : null;

if (firebaseAuth && import.meta.env.VITE_FIREBASE_AUTH_EMULATOR) {
  connectAuthEmulator(firebaseAuth, import.meta.env.VITE_FIREBASE_AUTH_EMULATOR, { disableWarnings: true });
}
if (firebaseDb && import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR) {
  const [host, portText] = String(import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR).split(':');
  const port = Number(portText);
  if (host && Number.isInteger(port) && port > 0) connectFirestoreEmulator(firebaseDb, host, port);
}
