import type { SQLiteDatabase } from 'expo-sqlite';

import { buildManualCatalogDocument } from '@/data/catalog-repository';
import {
  enqueueSyncMutation,
  saveCatalogProductLocally,
  saveStoreProductLocally,
} from '@/data/local-sync-repository';
import { buildStoreProductDocument } from '@/data/store-sync';
import type { Product, ProductDraft } from '@/domain/product';

type ProductRow = {
  barcode: string;
  name: string;
  brand: string | null;
  quantity: string | null;
  image_url: string | null;
  source: Product['source'];
  price_centavos: number;
  updated_at: string;
};

function rowToProduct(row: ProductRow): Product {
  return {
    barcode: row.barcode,
    name: row.name,
    brand: row.brand,
    quantity: row.quantity,
    imageUrl: row.image_url,
    source: row.source,
    priceCentavos: row.price_centavos,
    updatedAt: row.updated_at,
  };
}

const selectProduct = `
  SELECT
    products.barcode,
    products.name,
    products.brand,
    products.quantity,
    products.image_url,
    products.source,
    store_product_prices.price_centavos,
    store_product_prices.price_updated_at AS updated_at
  FROM products
  INNER JOIN store_product_prices ON store_product_prices.barcode = products.barcode
`;

export async function findProductByBarcode(
  db: SQLiteDatabase,
  storeId: string,
  barcode: string,
): Promise<Product | null> {
  const row = await db.getFirstAsync<ProductRow>(
    `${selectProduct}
     WHERE store_product_prices.store_id = ? AND products.barcode = ?`,
    storeId,
    barcode,
  );

  return row ? rowToProduct(row) : null;
}

export async function listProducts(db: SQLiteDatabase, storeId: string): Promise<Product[]> {
  const rows = await db.getAllAsync<ProductRow>(
    `${selectProduct}
     WHERE store_product_prices.store_id = ?
     ORDER BY products.name COLLATE NOCASE`,
    storeId,
  );
  return rows.map(rowToProduct);
}

export async function searchStoredProducts(
  db: SQLiteDatabase,
  storeId: string,
  query: string,
): Promise<Product[]> {
  const search = `%${query.trim()}%`;
  const rows = await db.getAllAsync<ProductRow>(
    `${selectProduct}
      WHERE store_product_prices.store_id = ?
        AND (products.name LIKE ? COLLATE NOCASE
         OR products.brand LIKE ? COLLATE NOCASE
         OR products.quantity LIKE ? COLLATE NOCASE
         OR products.barcode LIKE ?)
      ORDER BY products.name COLLATE NOCASE
      LIMIT 200`,
    storeId,
    search,
    search,
    search,
    search,
  );
  return rows.map(rowToProduct);
}

export async function findCatalogProductByBarcode(
  db: SQLiteDatabase,
  barcode: string,
): Promise<ProductDraft | null> {
  const row = await db.getFirstAsync<Omit<ProductRow, 'price_centavos'>>(
    `SELECT barcode, name, brand, quantity, image_url, source, updated_at
     FROM products WHERE barcode = ?`,
    barcode,
  );
  return row
    ? {
        barcode: row.barcode,
        name: row.name,
        brand: row.brand,
        quantity: row.quantity,
        imageUrl: row.image_url,
        source: row.source,
        priceCentavos: null,
        updatedAt: row.updated_at,
      }
    : null;
}

export class DuplicateBarcodeError extends Error {
  constructor() {
    super('A product with this barcode already exists.');
    this.name = 'DuplicateBarcodeError';
  }
}

async function writeProductWithPrice(
  db: SQLiteDatabase,
  storeId: string,
  userId: string,
  product: ProductDraft,
  priceCentavos: number,
  mode: 'create' | 'update',
): Promise<void> {
  const updatedAt = new Date().toISOString();
  const mutationId = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  const storeProduct = buildStoreProductDocument(
    product.barcode,
    priceCentavos,
    userId,
    mutationId,
    updatedAt,
  );

  await db.withTransactionAsync(async () => {
    void mode;
    await saveCatalogProductLocally(db, { ...product, updatedAt });
    await saveStoreProductLocally(db, storeId, storeProduct);
    if (product.source === 'manual') {
      const catalog = buildManualCatalogDocument({ ...product, updatedAt }, userId, updatedAt);
      await enqueueSyncMutation(db, {
        kind: 'catalog',
        storeId: null,
        barcode: product.barcode,
        payload: catalog,
      });
    }
    await enqueueSyncMutation(db, {
      kind: 'store_product',
      storeId,
      barcode: product.barcode,
      payload: storeProduct,
    });
  });
}

export async function createProductWithPrice(
  db: SQLiteDatabase,
  storeId: string,
  userId: string,
  product: ProductDraft,
  priceCentavos: number,
): Promise<void> {
  if (await findProductByBarcode(db, storeId, product.barcode)) {
    throw new DuplicateBarcodeError();
  }
  await writeProductWithPrice(db, storeId, userId, product, priceCentavos, 'create');
}

export async function updateProductWithPrice(
  db: SQLiteDatabase,
  storeId: string,
  userId: string,
  product: ProductDraft,
  priceCentavos: number,
): Promise<void> {
  await writeProductWithPrice(db, storeId, userId, product, priceCentavos, 'update');
}
