import { describe, expect, it } from 'vitest';

import {
  formatPrice,
  mapOpenFoodFactsProduct,
  normalizeBarcode,
  normalizeScannedBarcode,
  parsePriceInput,
  parseProductTimestamp,
  searchProducts,
  type Product,
} from '@/domain/product';

const products: Product[] = [
  {
    barcode: '4800012345678',
    name: 'Kape 3 in 1 Original',
    brand: 'Bantay Demo',
    quantity: '30 g',
    priceCentavos: 1800,
    imageUrl: null,
    source: 'manual',
    updatedAt: '2026-08-09T00:00:00.000Z',
  },
  {
    barcode: '4800098765432',
    name: 'Classic Condensed Milk',
    brand: 'Alaska',
    quantity: '300 ml',
    priceCentavos: 6200,
    imageUrl: null,
    source: 'manual',
    updatedAt: '2026-08-09T00:00:00.000Z',
  },
];

describe('normalizeBarcode', () => {
  it('keeps only digits and rejects empty values', () => {
    expect(normalizeBarcode(' 4800-0123 45678 ')).toBe('4800012345678');
    expect(normalizeBarcode('not a barcode')).toBeNull();
  });
});

describe('normalizeScannedBarcode', () => {
  it('accepts numeric retail codes without stripping alphanumeric payloads', () => {
    expect(normalizeScannedBarcode('4800012345678')).toBe('4800012345678');
    expect(normalizeScannedBarcode('ABC123456')).toBeNull();
  });
});

describe('formatPrice', () => {
  it('formats centavos as a Philippine peso price', () => {
    expect(formatPrice(1850)).toBe('₱18.50');
  });
});

describe('parsePriceInput', () => {
  it('converts a peso input into whole centavos and rejects invalid prices', () => {
    expect(parsePriceInput('18.50')).toBe(1850);
    expect(parsePriceInput('₱ 62')).toBe(6200);
    expect(parsePriceInput('-1')).toBeNull();
    expect(parsePriceInput('free')).toBeNull();
  });
});

describe('parseProductTimestamp', () => {
  it('accepts valid timestamps and rejects malformed catalog values', () => {
    expect(parseProductTimestamp('2026-08-09T00:00:00.000Z')?.toISOString()).toBe(
      '2026-08-09T00:00:00.000Z',
    );
    expect(parseProductTimestamp('not-a-date')).toBeNull();
  });
});

describe('searchProducts', () => {
  it('matches product name, brand, quantity, or barcode without case sensitivity', () => {
    expect(searchProducts(products, 'alaska')).toEqual([products[1]]);
    expect(searchProducts(products, '30 g')).toEqual([products[0]]);
    expect(searchProducts(products, '480009')).toEqual([products[1]]);
  });
});

describe('mapOpenFoodFactsProduct', () => {
  it('maps available general product data without inventing a store price', () => {
    expect(
      mapOpenFoodFactsProduct('4801234567890', {
        product_name: 'Example Crackers',
        brands: 'Example Brand',
        quantity: '60 g',
        image_front_url: 'https://example.com/product.jpg',
      }),
    ).toMatchObject({
      barcode: '4801234567890',
      name: 'Example Crackers',
      brand: 'Example Brand',
      quantity: '60 g',
      imageUrl: 'https://example.com/product.jpg',
      priceCentavos: null,
      source: 'open_food_facts',
    });
  });

  it('bounds untrusted catalog text and accepts only HTTPS image URLs', () => {
    const product = mapOpenFoodFactsProduct('4801234567890', {
      product_name: 'A'.repeat(500),
      image_front_url: 'http://example.com/product.jpg',
    });

    expect(product.name).toHaveLength(120);
    expect(product.imageUrl).toBeNull();
  });

  it('uses the small Open Food Facts front image when the full image is unavailable', () => {
    const product = mapOpenFoodFactsProduct('4801234567890', {
      product_name: 'Example Crackers',
      image_front_small_url: 'https://images.openfoodfacts.org/example-small.jpg',
    });

    expect(product.imageUrl).toBe('https://images.openfoodfacts.org/example-small.jpg');
  });
});
