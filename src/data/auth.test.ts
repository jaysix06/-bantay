import { describe, expect, it } from 'vitest';

import {
  getCreateAccountErrorMessage,
  getEmailSignInErrorMessage,
  readAuthErrorCode,
  readGoogleAuthConfig,
  readGoogleIdToken,
  validateCreateAccount,
  validateEmailSignIn,
} from './auth';

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

describe('readAuthErrorCode', () => {
  it('reads only a string Firebase error code', () => {
    expect(readAuthErrorCode({ code: 'auth/requires-recent-login' })).toBe(
      'auth/requires-recent-login',
    );
    expect(readAuthErrorCode({ code: 123 })).toBeNull();
    expect(readAuthErrorCode(null)).toBeNull();
  });
});

describe('validateEmailSignIn', () => {
  it('normalizes a valid email and preserves the password exactly', () => {
    expect(validateEmailSignIn('  Owner@Example.com ', ' secret with spaces ')).toEqual({
      credentials: { email: 'owner@example.com', password: ' secret with spaces ' },
      errors: {},
    });
  });

  it('returns field-specific guidance for missing or malformed credentials', () => {
    expect(validateEmailSignIn('not-an-email', '')).toEqual({
      credentials: null,
      errors: {
        email: 'Enter a valid email address.',
        password: 'Enter your password.',
      },
    });
  });
});

describe('getEmailSignInErrorMessage', () => {
  it('turns Firebase codes into useful recovery messages without revealing account existence', () => {
    expect(getEmailSignInErrorMessage({ code: 'auth/invalid-credential' })).toBe(
      'The email or password is incorrect. Check both and try again.',
    );
    expect(getEmailSignInErrorMessage({ code: 'auth/too-many-requests' })).toBe(
      'Too many attempts. Wait a moment, then try again.',
    );
    expect(getEmailSignInErrorMessage({ code: 'auth/network-request-failed' })).toBe(
      'Could not reach Bantay. Check your connection and try again.',
    );
  });
});

describe('validateCreateAccount', () => {
  it('normalizes a complete profile while preserving the password exactly', () => {
    expect(
      validateCreateAccount(
        '  Ana  ',
        '  Santos  ',
        '  Ana@Example.com ',
        'eight chars ',
        'eight chars ',
      ),
    ).toEqual({
      account: {
        displayName: 'Ana Santos',
        email: 'ana@example.com',
        password: 'eight chars ',
      },
      errors: {},
    });
  });

  it('returns field-specific guidance for an incomplete or mismatched form', () => {
    expect(validateCreateAccount('', '', 'not-an-email', 'short', 'different')).toEqual({
      account: null,
      errors: {
        firstName: 'Enter your first name.',
        lastName: 'Enter your last name.',
        email: 'Enter a valid email address.',
        password: 'Use at least 8 characters.',
        confirmPassword: 'Passwords do not match.',
      },
    });
  });
});

describe('getCreateAccountErrorMessage', () => {
  it('turns Firebase registration failures into useful recovery messages', () => {
    expect(getCreateAccountErrorMessage({ code: 'auth/email-already-in-use' })).toBe(
      'An account already uses this email. Sign in instead.',
    );
    expect(getCreateAccountErrorMessage({ code: 'auth/network-request-failed' })).toBe(
      'Could not reach Bantay. Check your connection and try again.',
    );
  });
});
