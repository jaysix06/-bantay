import { describe, expect, it } from 'vitest';

import {
  formatPrice,
  mapOpenFoodFactsProduct,
  normalizeBarcode,
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

describe('formatPrice', () => {
  it('formats centavos as a Philippine peso price', () => {
    expect(formatPrice(1850)).toBe('₱18.50');
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
});
