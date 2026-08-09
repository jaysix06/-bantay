import {
  mapOpenFoodFactsProduct,
  type OpenFoodFactsProduct,
  type ProductDraft,
} from '@/domain/product';

type OpenFoodFactsRecord = OpenFoodFactsProduct & Record<string, unknown>;

type OpenFoodFactsResponse = {
  status?: string;
  product?: OpenFoodFactsRecord;
};

export type OpenFoodFactsLookup = {
  product: ProductDraft;
  openFoodFacts: OpenFoodFactsRecord;
};

const PRODUCT_FIELDS = [
  'code',
  'product_name',
  'product_name_en',
  'brands',
  'quantity',
  'image_front_url',
  'image_front_small_url',
  'categories',
  'categories_tags_en',
  'ingredients_text',
  'allergens',
  'allergens_tags',
  'nutriments',
  'nutriscore_grade',
  'nova_group',
  'ecoscore_grade',
  'labels',
  'labels_tags',
  'countries',
  'countries_tags',
  'stores',
  'packaging',
  'packaging_text',
  'origins',
  'manufacturing_places',
].join(',');

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

export function parseOpenFoodFactsResponse(
  barcode: string,
  payload: OpenFoodFactsResponse,
): OpenFoodFactsLookup | null {
  if (!payload.status?.startsWith('success') || !payload.product) return null;

  return {
    product: mapOpenFoodFactsProduct(barcode, payload.product),
    openFoodFacts: payload.product,
  };
}

async function fetchAttempt(barcode: string, signal?: AbortSignal): Promise<Response> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  const timeout = setTimeout(abort, 15_000);
  signal?.addEventListener('abort', abort, { once: true });

  try {
    return await fetch(
      `https://world.openfoodfacts.org/api/v3/product/${encodeURIComponent(barcode)}.json?fields=${PRODUCT_FIELDS}`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Bantay/0.1.0 (Expo Android; barcode price lookup)',
        },
        signal: controller.signal,
      },
    );
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}

export async function fetchProductFromOpenFoodFacts(
  barcode: string,
  signal?: AbortSignal,
): Promise<OpenFoodFactsLookup | null> {
  let response: Response | null = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      response = await fetchAttempt(barcode, signal);
    } catch (error) {
      if (signal?.aborted || attempt === 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 350));
      continue;
    }

    if (response.status === 404) return null;
    if (!RETRYABLE_STATUS.has(response.status) || attempt === 1) break;
    await new Promise((resolve) => setTimeout(resolve, 350));
  }

  if (!response?.ok) {
    throw new Error('Product lookup is unavailable right now.');
  }

  const payload = (await response.json()) as OpenFoodFactsResponse;
  return parseOpenFoodFactsResponse(barcode, payload);
}
