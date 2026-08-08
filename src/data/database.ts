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
  `);
}
