import { describe, expect, it } from 'vitest';

import { readFirebaseConfig } from './firebase';

describe('readFirebaseConfig', () => {
  it('returns null until every required web-app value is configured', () => {
    expect(readFirebaseConfig({ EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'bantay-test' })).toBeNull();
  });

  it('builds the Firebase web configuration from Expo public variables', () => {
    expect(
      readFirebaseConfig({
        EXPO_PUBLIC_FIREBASE_API_KEY: 'test-api-key',
        EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: 'bantay-test.firebaseapp.com',
        EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'bantay-test',
        EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: 'bantay-test.firebasestorage.app',
        EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '123456789',
        EXPO_PUBLIC_FIREBASE_APP_ID: '1:123456789:web:abc123',
      }),
    ).toEqual({
      apiKey: 'test-api-key',
      authDomain: 'bantay-test.firebaseapp.com',
      projectId: 'bantay-test',
      storageBucket: 'bantay-test.firebasestorage.app',
      messagingSenderId: '123456789',
      appId: '1:123456789:web:abc123',
    });
  });
});
