import type { SQLiteDatabase } from 'expo-sqlite';

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
    store_prices.price_centavos,
    store_prices.updated_at
  FROM products
  INNER JOIN store_prices ON store_prices.barcode = products.barcode
`;

export async function findProductByBarcode(
  db: SQLiteDatabase,
  barcode: string,
): Promise<Product | null> {
  const row = await db.getFirstAsync<ProductRow>(
    `${selectProduct} WHERE products.barcode = ?`,
    barcode,
  );

  return row ? rowToProduct(row) : null;
}

export async function listProducts(db: SQLiteDatabase): Promise<Product[]> {
  const rows = await db.getAllAsync<ProductRow>(
    `${selectProduct} ORDER BY products.name COLLATE NOCASE`,
  );
  return rows.map(rowToProduct);
}

export async function searchStoredProducts(
  db: SQLiteDatabase,
  query: string,
): Promise<Product[]> {
  const search = `%${query.trim()}%`;
  const rows = await db.getAllAsync<ProductRow>(
    `${selectProduct}
      WHERE products.name LIKE ? COLLATE NOCASE
         OR products.brand LIKE ? COLLATE NOCASE
         OR products.quantity LIKE ? COLLATE NOCASE
         OR products.barcode LIKE ?
      ORDER BY products.name COLLATE NOCASE
      LIMIT 200`,
    search,
    search,
    search,
    search,
  );
  return rows.map(rowToProduct);
}

export class DuplicateBarcodeError extends Error {
  constructor() {
    super('A product with this barcode already exists.');
    this.name = 'DuplicateBarcodeError';
  }
}

async function writeProductWithPrice(
  db: SQLiteDatabase,
  product: ProductDraft,
  priceCentavos: number,
  mode: 'create' | 'update',
): Promise<void> {
  const updatedAt = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    if (mode === 'create') {
      await db.runAsync(
        `INSERT INTO products (barcode, name, brand, quantity, image_url, source, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        product.barcode,
        product.name,
        product.brand,
        product.quantity,
        product.imageUrl,
        product.source,
        updatedAt,
      );
      await db.runAsync(
        `INSERT INTO store_prices (barcode, price_centavos, updated_at)
         VALUES (?, ?, ?)`,
        product.barcode,
        priceCentavos,
        updatedAt,
      );
      return;
    }

    await db.runAsync(
      `UPDATE products SET name = ?, brand = ?, quantity = ?, image_url = ?, source = ?, updated_at = ?
       WHERE barcode = ?`,
      product.name,
      product.brand,
      product.quantity,
      product.imageUrl,
      product.source,
      updatedAt,
      product.barcode,
    );
    await db.runAsync(
      `UPDATE store_prices SET price_centavos = ?, updated_at = ? WHERE barcode = ?`,
      priceCentavos,
      updatedAt,
      product.barcode,
    );
  });
}

export async function createProductWithPrice(
  db: SQLiteDatabase,
  product: ProductDraft,
  priceCentavos: number,
): Promise<void> {
  if (await findProductByBarcode(db, product.barcode)) {
    throw new DuplicateBarcodeError();
  }
  await writeProductWithPrice(db, product, priceCentavos, 'create');
}

export async function updateProductWithPrice(
  db: SQLiteDatabase,
  product: ProductDraft,
  priceCentavos: number,
): Promise<void> {
  await writeProductWithPrice(db, product, priceCentavos, 'update');
}
