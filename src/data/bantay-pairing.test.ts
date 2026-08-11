import { describe, expect, it } from 'vitest';

import {
  BANTAY_PAIRING_TTL_MS,
  buildBantayPairingPayload,
  isBantayPairingExpired,
  parseClaimedBantayStoreId,
  parseBantayPairingPayload,
} from '@/data/bantay-pairing';

describe('bantay pairing payload', () => {
  const token = 'AbCdEfGhIjKlMnOpQr12';

  it('round-trips a Firestore auto-ID without exposing a user UID', () => {
    const payload = buildBantayPairingPayload(token);

    expect(payload).toBe(`bantay://pair?v=1&code=${token}`);
    expect(parseBantayPairingPayload(payload)).toBe(token);
  });

  it.each([
    '',
    'https://example.com/?code=AbCdEfGhIjKlMnOpQr12',
    'bantay://pair?v=2&code=AbCdEfGhIjKlMnOpQr12',
    'bantay://pair?v=1&code=short',
    'bantay://pair?v=1&code=AbCdEfGhIjKlMnOpQr12&owner=true',
  ])('rejects an untrusted or malformed scan: %s', (payload) => {
    expect(parseBantayPairingPayload(payload)).toBeNull();
  });

  it('expires codes at the five-minute boundary', () => {
    const createdAt = Date.UTC(2026, 7, 10, 12, 0, 0);

    expect(isBantayPairingExpired(createdAt + BANTAY_PAIRING_TTL_MS, createdAt + BANTAY_PAIRING_TTL_MS - 1)).toBe(false);
    expect(isBantayPairingExpired(createdAt + BANTAY_PAIRING_TTL_MS, createdAt + BANTAY_PAIRING_TTL_MS)).toBe(true);
  });

  it('recognizes when the current bantay account has been linked to a store', () => {
    expect(parseClaimedBantayStoreId({
      bantayUid: 'bantay-1',
      claimedByStoreId: 'store-1',
    }, 'bantay-1')).toBe('store-1');

    expect(parseClaimedBantayStoreId({
      bantayUid: 'another-account',
      claimedByStoreId: 'store-1',
    }, 'bantay-1')).toBeNull();
    expect(parseClaimedBantayStoreId({
      bantayUid: 'bantay-1',
      claimedByStoreId: null,
    }, 'bantay-1')).toBeNull();
  });
});
