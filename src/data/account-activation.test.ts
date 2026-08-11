import { describe, expect, it } from 'vitest';

import { cleanStoreName, resolveAccountGate } from './account-activation';

describe('account activation', () => {
  it('keeps a signed-in account without membership in activation', () => {
    expect(resolveAccountGate({ isReady: true, isStoreReady: true, signedIn: true, hasMembership: false }))
      .toBe('activation');
  });

  it('routes only existing members into the store app', () => {
    expect(resolveAccountGate({ isReady: true, isStoreReady: true, signedIn: true, hasMembership: true }))
      .toBe('app');
    expect(resolveAccountGate({ isReady: true, isStoreReady: true, signedIn: false, hasMembership: false }))
      .toBe('auth');
  });

  it('does not treat a failed membership lookup as a new unassigned account', () => {
    expect(resolveAccountGate({
      isReady: true,
      isStoreReady: true,
      signedIn: true,
      hasMembership: false,
      hasStoreError: true,
    })).toBe('store-error');
  });

  it('normalizes an explicit store name without inventing one from the account name', () => {
    expect(cleanStoreName('  Santos Sari-Sari Store  ')).toBe('Santos Sari-Sari Store');
    expect(cleanStoreName('')).toBeNull();
    expect(cleanStoreName('a'.repeat(90))).toHaveLength(80);
  });
});
