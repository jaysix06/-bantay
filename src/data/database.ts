import type { SQLiteDatabase } from 'expo-sqlite';

export async function initializeDatabase(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS products (
      barcode TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      brand TEXT,
      quantity TEXT,
      image_url TEXT,
      source TEXT NOT NULL CHECK (source IN ('manual', 'open_food_facts')),
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS store_prices (
      barcode TEXT PRIMARY KEY NOT NULL,
      price_centavos INTEGER NOT NULL CHECK (price_centavos >= 0),
      updated_at TEXT NOT NULL,
      FOREIGN KEY (barcode) REFERENCES products(barcode) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS store_context (
      user_id TEXT PRIMARY KEY NOT NULL,
      store_id TEXT NOT NULL,
      store_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('owner', 'bantay')),
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS store_product_prices (
      store_id TEXT NOT NULL,
      barcode TEXT NOT NULL,
      price_centavos INTEGER NOT NULL CHECK (price_centavos >= 0),
      price_updated_at TEXT NOT NULL,
      updated_by TEXT NOT NULL,
      mutation_id TEXT NOT NULL,
      PRIMARY KEY (store_id, barcode),
      FOREIGN KEY (barcode) REFERENCES products(barcode) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('catalog', 'store_product')),
      store_id TEXT,
      barcode TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT
    );

    CREATE INDEX IF NOT EXISTS store_product_prices_store_id_idx
      ON store_product_prices(store_id);

    CREATE INDEX IF NOT EXISTS sync_queue_store_id_idx
      ON sync_queue(store_id, created_at);
  `);
}
