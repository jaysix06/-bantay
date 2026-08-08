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
};

export function normalizeBarcode(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 6 && digits.length <= 18 ? digits : null;
}

export function formatPrice(priceCentavos: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(priceCentavos / 100);
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
    name: external.product_name?.trim() || 'Unknown product',
    brand: external.brands?.trim() || null,
    quantity: external.quantity?.trim() || null,
    imageUrl: external.image_front_url || null,
    priceCentavos: null,
    source: 'open_food_facts',
    updatedAt: new Date().toISOString(),
  };
}
