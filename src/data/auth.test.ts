import { describe, expect, it } from 'vitest';

import { readGoogleAuthConfig, readGoogleIdToken } from './auth';

describe('readGoogleAuthConfig', () => {
  it('requires the web OAuth client ID used to mint a Firebase-compatible ID token', () => {
    expect(readGoogleAuthConfig({})).toBeNull();
    expect(
      readGoogleAuthConfig({
        EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID:
          '297911886609-example.apps.googleusercontent.com',
      }),
    ).toEqual({ webClientId: '297911886609-example.apps.googleusercontent.com' });
  });
});

describe('readGoogleIdToken', () => {
  it('accepts only a successful native response with a non-empty ID token', () => {
    expect(
      readGoogleIdToken({ type: 'success', data: { idToken: '  google-id-token  ' } }),
    ).toBe('google-id-token');
    expect(readGoogleIdToken({ type: 'success', data: { idToken: null } })).toBeNull();
    expect(readGoogleIdToken({ type: 'cancelled', data: null })).toBeNull();
  });
});
