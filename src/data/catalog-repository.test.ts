import { describe, expect, it } from 'vitest';

import {
  buildCatalogDocument,
  isCatalogDocumentStale,
  parseCatalogDocument,
} from './catalog-repository';

const lookup = {
  product: {
    barcode: '3017620422003',
    name: 'Nutella',
    brand: 'Ferrero',
    quantity: '400 g',
    imageUrl: 'https://example.com/nutella.jpg',
    priceCentavos: null,
    source: 'open_food_facts' as const,
    updatedAt: '2026-08-09T00:00:00.000Z',
  },
  openFoodFacts: {
    product_name: 'Nutella',
    brands: 'Ferrero',
    quantity: '400 g',
    nutriments: { energy_kcal_100g: 539 },
  },
};

describe('catalog document conversion', () => {
  it('stores the complete Open Food Facts response separately from store price data', () => {
    expect(buildCatalogDocument(lookup, '2026-08-09T01:00:00.000Z')).toMatchObject({
      barcode: '3017620422003',
      fetchedAt: '2026-08-09T01:00:00.000Z',
      openFoodFacts: {
        nutriments: { energy_kcal_100g: 539 },
      },
    });
  });

  it('recreates an unpriced product draft from a valid cached document', () => {
    const product = parseCatalogDocument(buildCatalogDocument(lookup, lookup.product.updatedAt));
    expect(product).toMatchObject({
      barcode: '3017620422003',
      name: 'Nutella',
      brand: 'Ferrero',
      priceCentavos: null,
      source: 'open_food_facts',
    });
  });

  it('rejects malformed cached data', () => {
    expect(parseCatalogDocument({ barcode: 'not-a-barcode', openFoodFacts: {} })).toBeNull();
  });

  it('recreates a manually registered catalog product without store price duplication', () => {
    expect(
      parseCatalogDocument({
        barcode: '4801234567890',
        name: 'Sardines',
        brand: 'Local Brand',
        quantity: '155 g',
        imageUrl: null,
        source: 'manual',
        fetchedAt: '2026-08-10T00:00:00.000Z',
        openFoodFacts: {},
        createdBy: 'owner-uid',
      }),
    ).toEqual({
      barcode: '4801234567890',
      name: 'Sardines',
      brand: 'Local Brand',
      quantity: '155 g',
      imageUrl: null,
      priceCentavos: null,
      source: 'manual',
      updatedAt: '2026-08-10T00:00:00.000Z',
    });
  });

  it('expires catalog data so product details can be refreshed periodically', () => {
    const document = buildCatalogDocument(lookup, '2026-01-01T00:00:00.000Z');
    expect(isCatalogDocumentStale(document, new Date('2026-02-15T00:00:00.000Z'))).toBe(true);
    expect(isCatalogDocumentStale(document, new Date('2026-01-15T00:00:00.000Z'))).toBe(false);
  });
});
