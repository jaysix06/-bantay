import { describe, expect, it } from 'vitest';

import { parseOpenFoodFactsResponse } from './open-food-facts';

describe('parseOpenFoodFactsResponse', () => {
  it('keeps the complete returned product payload for cloud caching', () => {
    const lookup = parseOpenFoodFactsResponse('3017620422003', {
      status: 'success',
      product: {
        code: '3017620422003',
        product_name: 'Nutella',
        brands: 'Ferrero',
        quantity: '400 g',
        nutriments: { energy_kcal_100g: 539 },
        allergens_tags: ['en:nuts'],
      },
    });

    expect(lookup?.product).toMatchObject({
      barcode: '3017620422003',
      name: 'Nutella',
      brand: 'Ferrero',
      quantity: '400 g',
      priceCentavos: null,
    });
    expect(lookup?.openFoodFacts).toMatchObject({
      nutriments: { energy_kcal_100g: 539 },
      allergens_tags: ['en:nuts'],
    });
  });

  it('treats an unsuccessful response as a catalog miss', () => {
    expect(parseOpenFoodFactsResponse('00000000', { status: 'failure' })).toBeNull();
  });

  it('accepts a usable product returned with non-fatal v3 errors', () => {
    expect(
      parseOpenFoodFactsResponse('3017620422003', {
        status: 'success_with_errors',
        product: { product_name: 'Nutella' },
      })?.product.name,
    ).toBe('Nutella');
  });
});
