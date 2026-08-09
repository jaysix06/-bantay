import { doc, getDoc, setDoc } from 'firebase/firestore';

import { firestore } from '@/data/firebase';
import type { OpenFoodFactsLookup } from '@/data/open-food-facts';
import {
  mapOpenFoodFactsProduct,
  normalizeScannedBarcode,
  type ProductDraft,
} from '@/domain/product';

type CatalogDocument = {
  barcode: string;
  name: string;
  brand: string | null;
  quantity: string | null;
  imageUrl: string | null;
  source: 'open_food_facts';
  fetchedAt: string;
  openFoodFacts: Record<string, unknown>;
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
  };
}

export function parseCatalogDocument(value: unknown): ProductDraft | null {
  if (!isRecord(value)) return null;
  const barcode = typeof value.barcode === 'string' ? normalizeScannedBarcode(value.barcode) : null;
  if (!barcode || !isRecord(value.openFoodFacts)) return null;

  const product = mapOpenFoodFactsProduct(barcode, value.openFoodFacts);
  return {
    ...product,
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

export async function cacheCatalogProduct(lookup: OpenFoodFactsLookup): Promise<boolean> {
  if (!firestore) return false;
  await setDoc(
    doc(firestore, 'catalog_products', lookup.product.barcode),
    buildCatalogDocument(lookup),
    { merge: true },
  );
  return true;
}
