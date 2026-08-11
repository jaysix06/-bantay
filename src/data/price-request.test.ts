import { describe, expect, it } from 'vitest';

import {
  buildPriceRequestDraft,
  parsePriceRequestDocument,
  priceRequestId,
} from './price-request';

const timestamp = (iso: string) => ({ toDate: () => new Date(iso) });

describe('price requests', () => {
  it('uses the normalized barcode as the deduplication identity', () => {
    expect(priceRequestId('4801 2345 67890')).toBe('4801234567890');
    expect(() => priceRequestId('short')).toThrow('valid barcode');
  });

  it('builds bounded product context without accepting an external price', () => {
    expect(buildPriceRequestDraft({
      barcode: '4801234567890',
      name: '  Instant Coffee  ',
      brand: 'Brand',
      quantity: '20 g',
      imageUrl: 'http://unsafe.example/item.png',
      priceCentavos: 9999,
      source: 'open_food_facts',
      updatedAt: '2026-08-11T00:00:00.000Z',
    }, 'bantay-1')).toEqual({
      barcode: '4801234567890',
      name: 'Instant Coffee',
      brand: 'Brand',
      quantity: '20 g',
      source: 'open_food_facts',
      imageUrl: null,
      requestedBy: 'bantay-1',
    });
  });

  it('parses pending and answered requests with valid timestamp states', () => {
    const pending = {
      barcode: '4801234567890', name: 'Coffee', brand: null, quantity: null, source: 'manual', imageUrl: null,
      requestedBy: 'bantay-1', requestedAt: timestamp('2026-08-11T01:00:00.000Z'),
      status: 'pending', answeredAt: null,
    };
    expect(parsePriceRequestDocument('4801234567890', pending)?.status).toBe('pending');
    expect(parsePriceRequestDocument('4801234567890', {
      ...pending,
      status: 'answered',
      answeredAt: timestamp('2026-08-11T01:05:00.000Z'),
    })?.answeredAt?.toISOString()).toBe('2026-08-11T01:05:00.000Z');
  });

  it('rejects malformed state and unexpected fields', () => {
    const pending = {
      barcode: '4801234567890', name: null, brand: null, quantity: null, source: 'manual', imageUrl: null,
      requestedBy: 'bantay-1', requestedAt: timestamp('2026-08-11T01:00:00.000Z'),
      status: 'pending', answeredAt: null,
    };
    expect(parsePriceRequestDocument('4801234567890', { ...pending, answeredAt: timestamp('2026-08-11T01:05:00.000Z') })).toBeNull();
    expect(parsePriceRequestDocument('4801234567890', { ...pending, message: 'set it to 10' })).toBeNull();
  });
});
