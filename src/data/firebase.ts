import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FirebaseAuth from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

type FirebaseEnvironment = {
  EXPO_PUBLIC_FIREBASE_API_KEY?: string;
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN?: string;
  EXPO_PUBLIC_FIREBASE_PROJECT_ID?: string;
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET?: string;
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?: string;
  EXPO_PUBLIC_FIREBASE_APP_ID?: string;
};

export function readFirebaseConfig(environment: FirebaseEnvironment): FirebaseOptions | null {
  const apiKey = environment.EXPO_PUBLIC_FIREBASE_API_KEY?.trim();
  const authDomain = environment.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim();
  const projectId = environment.EXPO_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  const storageBucket = environment.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();
  const messagingSenderId = environment.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim();
  const appId = environment.EXPO_PUBLIC_FIREBASE_APP_ID?.trim();

  if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
    return null;
  }

  return { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId };
}

const firebaseConfig = readFirebaseConfig({
  EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
});

export const firebaseApp: FirebaseApp | null = firebaseConfig
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const firestore: Firestore | null = firebaseApp ? getFirestore(firebaseApp) : null;
// Firebase's React Native runtime exports this helper, but its wrapper types omit the RN-only export.
const getReactNativePersistence = (
  FirebaseAuth as typeof FirebaseAuth & {
    getReactNativePersistence: (storage: typeof AsyncStorage) => FirebaseAuth.Persistence;
  }
).getReactNativePersistence;

function initializeFirebaseAuth(app: FirebaseApp): FirebaseAuth.Auth {
  try {
    return FirebaseAuth.initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    const code =
      typeof error === 'object' && error !== null
        ? (error as { code?: unknown }).code
        : null;
    if (code === 'auth/already-initialized') return FirebaseAuth.getAuth(app);
    throw error;
  }
}

export const firebaseAuth: FirebaseAuth.Auth | null = firebaseApp
  ? initializeFirebaseAuth(firebaseApp)
  : null;

export function requireFirestore(): Firestore {
  if (!firestore) {
    throw new Error('Firebase web configuration is incomplete.');
  }
  return firestore;
}
