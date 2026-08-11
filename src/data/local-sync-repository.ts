import type { SQLiteDatabase } from 'expo-sqlite';

import type { ProductDraft } from '@/domain/product';
import type { StoreMembership, StoreProductDocument } from '@/data/store-sync';
import { buildStoreProductDocument, syncQueueId } from '@/data/store-sync';

export type PendingSyncMutation = {
  id: string;
  kind: 'catalog' | 'store_product';
  storeId: string | null;
  barcode: string;
  payload: Record<string, unknown>;
  attempts: number;
};

type StoreContextRow = {
  store_id: string;
  store_name: string;
  role: StoreMembership['role'];
};

type LegacyProductRow = {
  barcode: string;
  name: string;
  brand: string | null;
  quantity: string | null;
  image_url: string | null;
  source: ProductDraft['source'];
  price_centavos: number;
  updated_at: string;
};

type SyncQueueRow = {
  id: string;
  kind: PendingSyncMutation['kind'];
  store_id: string | null;
  barcode: string;
  payload_json: string;
  attempts: number;
};

export async function saveStoreContext(
  db: SQLiteDatabase,
  userId: string,
  membership: StoreMembership,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO store_context (user_id, store_id, store_name, role, synced_at)
     VALUES (?, ?, ?, ?, NULL)
     ON CONFLICT(user_id) DO UPDATE SET
       store_id = excluded.store_id,
       store_name = excluded.store_name,
       role = excluded.role`,
    userId,
    membership.storeId,
    membership.name,
    membership.role,
  );
}

export async function readStoreContext(
  db: SQLiteDatabase,
  userId: string,
): Promise<StoreMembership | null> {
  const row = await db.getFirstAsync<StoreContextRow>(
    'SELECT store_id, store_name, role FROM store_context WHERE user_id = ?',
    userId,
  );
  if (!row || (row.role !== 'owner' && row.role !== 'bantay')) return null;
  return { storeId: row.store_id, name: row.store_name, role: row.role };
}

export async function migrateLegacyStorePrices(
  db: SQLiteDatabase,
  storeId: string,
  userId: string,
): Promise<void> {
  const rows = await db.getAllAsync<LegacyProductRow>(
    `SELECT products.barcode, products.name, products.brand, products.quantity,
            products.image_url, products.source, store_prices.price_centavos,
            store_prices.updated_at
     FROM products
     INNER JOIN store_prices ON store_prices.barcode = products.barcode
     LEFT JOIN store_product_prices
       ON store_product_prices.store_id = ?
      AND store_product_prices.barcode = products.barcode
     WHERE store_product_prices.barcode IS NULL`,
    storeId,
  );

  for (const row of rows) {
    const mutationId = `legacy-${row.barcode}-${Date.parse(row.updated_at) || Date.now()}`;
    const storeProduct = buildStoreProductDocument(
      row.barcode,
      row.price_centavos,
      userId,
      mutationId,
      row.updated_at,
    );
    await db.withTransactionAsync(async () => {
      await saveStoreProductLocally(db, storeId, storeProduct);
      await enqueueSyncMutation(db, {
        kind: 'catalog',
        storeId: null,
        barcode: row.barcode,
        payload: {
          barcode: row.barcode,
          name: row.name,
          brand: row.brand,
          quantity: row.quantity,
          imageUrl: row.image_url,
          source: row.source,
          fetchedAt: row.updated_at,
          openFoodFacts: {},
          createdBy: userId,
        },
      });
      await enqueueSyncMutation(db, {
        kind: 'store_product',
        storeId,
        barcode: row.barcode,
        payload: storeProduct,
      });
    });
  }
}

export async function markStoreHydrated(
  db: SQLiteDatabase,
  userId: string,
  syncedAt = new Date().toISOString(),
): Promise<void> {
  await db.runAsync('UPDATE store_context SET synced_at = ? WHERE user_id = ?', syncedAt, userId);
}

export async function saveCatalogProductLocally(
  db: SQLiteDatabase,
  product: ProductDraft,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO products (barcode, name, brand, quantity, image_url, source, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(barcode) DO UPDATE SET
       name = excluded.name,
       brand = excluded.brand,
       quantity = excluded.quantity,
       image_url = excluded.image_url,
       source = excluded.source,
       updated_at = excluded.updated_at`,
    product.barcode,
    product.name,
    product.brand,
    product.quantity,
    product.imageUrl,
    product.source,
    product.updatedAt,
  );
}

export async function saveStoreProductLocally(
  db: SQLiteDatabase,
  storeId: string,
  document: StoreProductDocument,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO store_product_prices (
       store_id, barcode, price_centavos, price_updated_at, updated_by, mutation_id
     ) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(store_id, barcode) DO UPDATE SET
       price_centavos = excluded.price_centavos,
       price_updated_at = excluded.price_updated_at,
       updated_by = excluded.updated_by,
       mutation_id = excluded.mutation_id`,
    storeId,
    document.catalogProductId,
    document.priceCentavos,
    document.priceUpdatedAt,
    document.updatedBy,
    document.mutationId,
  );
}

export async function deleteStoreProductLocally(
  db: SQLiteDatabase,
  storeId: string,
  barcode: string,
): Promise<void> {
  await db.runAsync(
    'DELETE FROM store_product_prices WHERE store_id = ? AND barcode = ?',
    storeId,
    barcode,
  );
}

export async function enqueueSyncMutation(
  db: SQLiteDatabase,
  mutation: Omit<PendingSyncMutation, 'id' | 'attempts'>,
): Promise<void> {
  const id = syncQueueId(mutation.kind, mutation.storeId, mutation.barcode);
  await db.runAsync(
    `INSERT INTO sync_queue (
       id, kind, store_id, barcode, payload_json, created_at, attempts, last_error
     ) VALUES (?, ?, ?, ?, ?, ?, 0, NULL)
     ON CONFLICT(id) DO UPDATE SET
       payload_json = excluded.payload_json,
       created_at = excluded.created_at,
       attempts = 0,
       last_error = NULL`,
    id,
    mutation.kind,
    mutation.storeId,
    mutation.barcode,
    JSON.stringify(mutation.payload),
    new Date().toISOString(),
  );
}

export async function listPendingSyncMutations(
  db: SQLiteDatabase,
  storeId: string,
): Promise<PendingSyncMutation[]> {
  const rows = await db.getAllAsync<SyncQueueRow>(
    `SELECT id, kind, store_id, barcode, payload_json, attempts
     FROM sync_queue
     WHERE store_id IS NULL OR store_id = ?
     ORDER BY CASE kind WHEN 'catalog' THEN 0 ELSE 1 END, created_at
     LIMIT 100`,
    storeId,
  );

  return rows.flatMap((row) => {
    try {
      const payload = JSON.parse(row.payload_json) as unknown;
      if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) return [];
      return [{
        id: row.id,
        kind: row.kind,
        storeId: row.store_id,
        barcode: row.barcode,
        payload: payload as Record<string, unknown>,
        attempts: row.attempts,
      }];
    } catch {
      return [];
    }
  });
}

export async function completeSyncMutation(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM sync_queue WHERE id = ?', id);
}

export async function failSyncMutation(
  db: SQLiteDatabase,
  id: string,
  errorCode: string,
): Promise<void> {
  await db.runAsync(
    `UPDATE sync_queue
     SET attempts = attempts + 1, last_error = ?
     WHERE id = ?`,
    errorCode.slice(0, 120),
    id,
  );
}

export async function countPendingSyncMutations(
  db: SQLiteDatabase,
  storeId: string,
): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM sync_queue WHERE store_id IS NULL OR store_id = ?',
    storeId,
  );
  return row?.count ?? 0;
}

export async function hasPendingSyncMutation(
  db: SQLiteDatabase,
  kind: PendingSyncMutation['kind'],
  storeId: string | null,
  barcode: string,
): Promise<boolean> {
  const row = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM sync_queue WHERE id = ?',
    syncQueueId(kind, storeId, barcode),
  );
  return Boolean(row);
}
