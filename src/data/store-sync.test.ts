import { describe, expect, it } from 'vitest';

import {
  buildStoreProductDocument,
  canManageStore,
  parseStoreDocument,
  parseStoreProductDocument,
  syncQueueId,
} from './store-sync';

describe('store membership', () => {
  const store = {
    name: 'Mama\'s Store',
    ownerUid: 'owner-uid',
    bantayUids: ['bantay-uid'],
    createdAt: '2026-08-10T00:00:00.000Z',
    updatedAt: '2026-08-10T00:00:00.000Z',
  };

  it('identifies the owner and a linked bantay without treating strangers as members', () => {
    expect(parseStoreDocument('store-1', store, 'owner-uid')?.role).toBe('owner');
    expect(parseStoreDocument('store-1', store, 'bantay-uid')?.role).toBe('bantay');
    expect(parseStoreDocument('store-1', store, 'stranger-uid')).toBeNull();
  });

  it('allows only the owner to manage store truth', () => {
    expect(canManageStore({ storeId: 'store-1', role: 'owner', name: "Mama's Store" })).toBe(true);
    expect(canManageStore({ storeId: 'store-1', role: 'bantay', name: "Mama's Store" })).toBe(false);
  });

  it('rejects malformed membership documents', () => {
    expect(parseStoreDocument('store-1', { ...store, bantayUids: ['valid', 42] }, 'valid')).toBeNull();
    expect(parseStoreDocument('store-1', { ...store, ownerUid: '' }, 'owner-uid')).toBeNull();
  });
});

describe('store product documents', () => {
  it('stores only the catalog reference and store-owned price fields', () => {
    expect(
      buildStoreProductDocument('4801234567890', 1850, 'owner-uid', 'mutation-1'),
    ).toEqual({
      catalogProductId: '4801234567890',
      priceCentavos: 1850,
      priceUpdatedAt: expect.any(String),
      updatedBy: 'owner-uid',
      mutationId: 'mutation-1',
    });
  });

  it('parses valid prices and rejects redundant or malformed product data', () => {
    const document = buildStoreProductDocument('4801234567890', 1850, 'owner-uid', 'mutation-1');
    expect(parseStoreProductDocument('4801234567890', document)?.priceCentavos).toBe(1850);
    expect(parseStoreProductDocument('4801234567890', { ...document, name: 'Duplicated name' })).toBeNull();
    expect(parseStoreProductDocument('4801234567890', { ...document, priceCentavos: -1 })).toBeNull();
  });

  it('uses stable queue identities so a newer offline edit replaces an older one', () => {
    expect(syncQueueId('catalog', null, '4801234567890')).toBe('catalog:4801234567890');
    expect(syncQueueId('store_product', 'store-1', '4801234567890')).toBe(
      'store_product:store-1:4801234567890',
    );
  });
});
