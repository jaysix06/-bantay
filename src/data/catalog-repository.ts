import type { SQLiteDatabase } from 'expo-sqlite';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { firestore } from '@/data/firebase';
import {
  completeSyncMutation,
  enqueueSyncMutation,
  saveCatalogProductLocally,
} from '@/data/local-sync-repository';
import { syncQueueId } from '@/data/store-sync';
import type { OpenFoodFactsLookup } from '@/data/open-food-facts';
import {
  normalizeScannedBarcode,
  type ProductDraft,
} from '@/domain/product';

export type CatalogDocument = {
  barcode: string;
  name: string;
  brand: string | null;
  quantity: string | null;
  imageUrl: string | null;
  source: ProductDraft['source'];
  fetchedAt: string;
  openFoodFacts: Record<string, unknown>;
  createdBy?: string;
};

export type CachedCatalogProduct = {
  product: ProductDraft;
  isStale: boolean;
};

const CATALOG_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function buildCatalogDocument(
  lookup: OpenFoodFactsLookup,
  fetchedAt = new Date().toISOString(),
  createdBy?: string,
): CatalogDocument {
  return {
    barcode: lookup.product.barcode,
    name: lookup.product.name,
    brand: lookup.product.brand,
    quantity: lookup.product.quantity,
    imageUrl: lookup.product.imageUrl,
    source: 'open_food_facts',
    fetchedAt,
    openFoodFacts: lookup.openFoodFacts,
    ...(createdBy ? { createdBy } : {}),
  };
}

export function buildManualCatalogDocument(
  product: ProductDraft,
  createdBy: string,
  fetchedAt = new Date().toISOString(),
): CatalogDocument {
  return {
    barcode: product.barcode,
    name: product.name,
    brand: product.brand,
    quantity: product.quantity,
    imageUrl: product.imageUrl,
    source: product.source,
    fetchedAt,
    openFoodFacts: {},
    createdBy,
  };
}

export function parseCatalogDocument(value: unknown): ProductDraft | null {
  if (!isRecord(value)) return null;
  const barcode = typeof value.barcode === 'string' ? normalizeScannedBarcode(value.barcode) : null;
  const name = typeof value.name === 'string' ? value.name.trim().slice(0, 120) : '';
  const source = value.source === 'manual' || value.source === 'open_food_facts' ? value.source : null;
  if (!barcode || !name || !source || !isRecord(value.openFoodFacts)) return null;

  return {
    barcode,
    name,
    brand: typeof value.brand === 'string' ? value.brand.trim().slice(0, 80) || null : null,
    quantity:
      typeof value.quantity === 'string' ? value.quantity.trim().slice(0, 40) || null : null,
    imageUrl:
      typeof value.imageUrl === 'string' && value.imageUrl.startsWith('https://')
        ? value.imageUrl.slice(0, 2048)
        : null,
    priceCentavos: null,
    source,
    updatedAt:
      typeof value.fetchedAt === 'string' ? value.fetchedAt : new Date().toISOString(),
  };
}

export function isCatalogDocumentStale(value: unknown, now = new Date()): boolean {
  if (!isRecord(value) || typeof value.fetchedAt !== 'string') return true;
  const fetchedAt = Date.parse(value.fetchedAt);
  return !Number.isFinite(fetchedAt) || now.getTime() - fetchedAt > CATALOG_TTL_MS;
}

export async function findCachedCatalogProduct(
  barcode: string,
  timeoutMs = 2_500,
): Promise<CachedCatalogProduct | null> {
  if (!firestore) return null;
  const snapshot = await Promise.race([
    getDoc(doc(firestore, 'catalog_products', barcode)),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]);
  if (!snapshot?.exists()) return null;
  const data = snapshot.data();
  const product = parseCatalogDocument(data);
  return product ? { product, isStale: isCatalogDocumentStale(data) } : null;
}

export async function cacheCatalogProduct(
  db: SQLiteDatabase,
  lookup: OpenFoodFactsLookup,
  userId: string,
): Promise<boolean> {
  const document = buildCatalogDocument(lookup, new Date().toISOString(), userId);
  await db.withTransactionAsync(async () => {
    await saveCatalogProductLocally(db, lookup.product);
    await enqueueSyncMutation(db, {
      kind: 'catalog',
      storeId: null,
      barcode: lookup.product.barcode,
      payload: document,
    });
  });
  if (!firestore) return false;
  try {
    await setDoc(
      doc(firestore, 'catalog_products', lookup.product.barcode),
      { ...document, serverUpdatedAt: serverTimestamp() },
      { merge: true },
    );
    await completeSyncMutation(db, syncQueueId('catalog', null, lookup.product.barcode));
    return true;
  } catch {
    return false;
  }
}
