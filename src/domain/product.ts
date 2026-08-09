export type ProductSource = 'manual' | 'open_food_facts';

export type Product = {
  barcode: string;
  name: string;
  brand: string | null;
  quantity: string | null;
  priceCentavos: number;
  imageUrl: string | null;
  source: ProductSource;
  updatedAt: string;
};

export type ProductDraft = Omit<Product, 'priceCentavos'> & {
  priceCentavos: number | null;
};

export type OpenFoodFactsProduct = {
  product_name?: string;
  brands?: string;
  quantity?: string;
  image_front_url?: string;
  image_front_small_url?: string;
};

function cleanOptionalText(value: string | undefined, maxLength: number): string | null {
  const cleaned = value?.trim().slice(0, maxLength);
  return cleaned || null;
}

function cleanImageUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export function normalizeBarcode(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 6 && digits.length <= 18 ? digits : null;
}

export function normalizeScannedBarcode(value: string): string | null {
  const trimmed = value.trim();
  return /^\d{6,18}$/.test(trimmed) ? trimmed : null;
}

export function formatPrice(priceCentavos: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(priceCentavos / 100);
}

export function parsePriceInput(value: string): number | null {
  const normalized = value.replace(/[₱,\s]/g, '');
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const centavos = Math.round(Number(normalized) * 100);
  return Number.isSafeInteger(centavos) ? centavos : null;
}

export function parseProductTimestamp(value: string): Date | null {
  const timestamp = new Date(value);
  return Number.isNaN(timestamp.getTime()) ? null : timestamp;
}

export function searchProducts(products: Product[], query: string): Product[] {
  const normalizedQuery = query.trim().toLocaleLowerCase('en-PH');

  if (!normalizedQuery) {
    return products;
  }

  return products.filter((product) =>
    [product.name, product.brand, product.quantity, product.barcode]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLocaleLowerCase('en-PH').includes(normalizedQuery)),
  );
}

export function mapOpenFoodFactsProduct(
  barcode: string,
  external: OpenFoodFactsProduct,
): ProductDraft {
  return {
    barcode,
    name: cleanOptionalText(external.product_name, 120) || 'Unknown product',
    brand: cleanOptionalText(external.brands, 80),
    quantity: cleanOptionalText(external.quantity, 40),
    imageUrl:
      cleanImageUrl(external.image_front_url) ??
      cleanImageUrl(external.image_front_small_url),
    priceCentavos: null,
    source: 'open_food_facts',
    updatedAt: new Date().toISOString(),
  };
}
