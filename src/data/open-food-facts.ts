import {
  mapOpenFoodFactsProduct,
  type OpenFoodFactsProduct,
  type ProductDraft,
} from '@/domain/product';

type OpenFoodFactsResponse = {
  status: number;
  product?: OpenFoodFactsProduct;
};

export async function fetchProductFromOpenFoodFacts(
  barcode: string,
  signal?: AbortSignal,
): Promise<ProductDraft | null> {
  const fields = 'product_name,brands,quantity,image_front_url';
  const controller = new AbortController();
  const abort = () => controller.abort();
  const timeout = setTimeout(abort, 8_000);
  signal?.addEventListener('abort', abort, { once: true });

  let response: Response;
  try {
    response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${fields}`,
      {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      },
    );
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }

  if (!response.ok) {
    throw new Error('Product lookup is unavailable right now.');
  }

  const payload = (await response.json()) as OpenFoodFactsResponse;
  if (payload.status !== 1 || !payload.product) {
    return null;
  }

  return mapOpenFoodFactsProduct(barcode, payload.product);
}
