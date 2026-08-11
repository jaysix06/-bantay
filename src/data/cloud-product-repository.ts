import type { SQLiteDatabase } from 'expo-sqlite';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import {
  parseCatalogDocument,
  type CatalogDocument,
} from '@/data/catalog-repository';
import { requireFirestore } from '@/data/firebase';
import {
  completeSyncMutation,
  deleteStoreProductLocally,
  failSyncMutation,
  hasPendingSyncMutation,
  listPendingSyncMutations,
  saveCatalogProductLocally,
  saveStoreProductLocally,
} from '@/data/local-sync-repository';
import { classifyRealtimeSnapshot, type RealtimeSnapshotSource } from '@/data/realtime-sync';
import {
  parseStoreProductDocument,
  type StoreProductDocument,
} from '@/data/store-sync';
import type { Product, ProductDraft } from '@/domain/product';

export type CloudProductLookup = {
  catalog: ProductDraft | null;
  storeProduct: StoreProductDocument | null;
  product: Product | null;
};

export type RealtimeStoreSyncHandlers = {
  onError: (error: unknown) => void;
  onSnapshotSource: (source: RealtimeSnapshotSource) => void;
  onSynchronized: () => void | Promise<void>;
};

function errorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === 'string') return code;
  }
  return 'sync/unknown';
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs = 8_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error('sync/timeout')), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function writeCatalogProductToCloud(document: CatalogDocument): Promise<void> {
  await withTimeout(
    setDoc(
      doc(requireFirestore(), 'catalog_products', document.barcode),
      { ...document, serverUpdatedAt: serverTimestamp() },
      { merge: true },
    ),
  );
}

export async function writeStoreProductToCloud(
  storeId: string,
  document: StoreProductDocument,
): Promise<void> {
  await withTimeout(
    setDoc(
      doc(requireFirestore(), 'stores', storeId, 'products', document.catalogProductId),
      { ...document, serverUpdatedAt: serverTimestamp() },
      { merge: true },
    ),
  );
}

export async function fetchCloudProduct(
  storeId: string,
  barcode: string,
): Promise<CloudProductLookup> {
  const db = requireFirestore();
  const [catalogSnapshot, priceSnapshot] = await withTimeout(
    Promise.all([
      getDoc(doc(db, 'catalog_products', barcode)),
      getDoc(doc(db, 'stores', storeId, 'products', barcode)),
    ]),
  );
  const catalog = catalogSnapshot.exists() ? parseCatalogDocument(catalogSnapshot.data()) : null;
  const storeProduct = priceSnapshot.exists()
    ? parseStoreProductDocument(barcode, priceSnapshot.data())
    : null;
  return {
    catalog,
    storeProduct,
    product:
      catalog && storeProduct
        ? {
            ...catalog,
            priceCentavos: storeProduct.priceCentavos,
            updatedAt: storeProduct.priceUpdatedAt,
          }
        : null,
  };
}

export async function saveCloudProductLocally(
  db: SQLiteDatabase,
  storeId: string,
  lookup: CloudProductLookup,
): Promise<void> {
  if (!lookup.catalog) return;
  const [catalogPending, pricePending] = await Promise.all([
    hasPendingSyncMutation(db, 'catalog', null, lookup.catalog.barcode),
    hasPendingSyncMutation(db, 'store_product', storeId, lookup.catalog.barcode),
  ]);
  await db.withTransactionAsync(async () => {
    if (!catalogPending) await saveCatalogProductLocally(db, lookup.catalog!);
    if (lookup.storeProduct && !pricePending) {
      await saveStoreProductLocally(db, storeId, lookup.storeProduct);
    }
  });
}

export async function hydrateStoreProducts(
  db: SQLiteDatabase,
  storeId: string,
): Promise<void> {
  const snapshot = await withTimeout(
    getDocs(collection(requireFirestore(), 'stores', storeId, 'products')),
  );
  await Promise.all(
    snapshot.docs.map(async (priceSnapshot) => {
      const storeProduct = parseStoreProductDocument(priceSnapshot.id, priceSnapshot.data());
      if (!storeProduct) return;
      const catalogSnapshot = await withTimeout(
        getDoc(doc(requireFirestore(), 'catalog_products', storeProduct.catalogProductId)),
      );
      if (!catalogSnapshot.exists()) return;
      const catalog = parseCatalogDocument(catalogSnapshot.data());
      if (!catalog) return;
      const [catalogPending, pricePending] = await Promise.all([
        hasPendingSyncMutation(db, 'catalog', null, storeProduct.catalogProductId),
        hasPendingSyncMutation(db, 'store_product', storeId, storeProduct.catalogProductId),
      ]);
      await db.withTransactionAsync(async () => {
        if (!catalogPending) await saveCatalogProductLocally(db, catalog);
        if (!pricePending) await saveStoreProductLocally(db, storeId, storeProduct);
      });
    }),
  );
}

export function subscribeToStoreProducts(
  db: SQLiteDatabase,
  storeId: string,
  handlers: RealtimeStoreSyncHandlers,
): () => void {
  let serialWork = Promise.resolve();

  return onSnapshot(
    collection(requireFirestore(), 'stores', storeId, 'products'),
    { includeMetadataChanges: true },
    (snapshot) => {
      const source = classifyRealtimeSnapshot(snapshot.metadata);
      handlers.onSnapshotSource(source);
      if (source !== 'server') return;

      const changes = snapshot.docChanges().map((change) => ({
        barcode: change.doc.id,
        data: change.doc.data(),
        type: change.type,
      }));

      serialWork = serialWork
        .then(async () => {
          for (const change of changes) {
            const pricePending = await hasPendingSyncMutation(
              db,
              'store_product',
              storeId,
              change.barcode,
            );
            if (pricePending) continue;
            if (change.type === 'removed') {
              await deleteStoreProductLocally(db, storeId, change.barcode);
              continue;
            }

            const storeProduct = parseStoreProductDocument(change.barcode, change.data);
            if (!storeProduct) continue;
            const catalogSnapshot = await withTimeout(
              getDoc(doc(requireFirestore(), 'catalog_products', storeProduct.catalogProductId)),
            );
            if (!catalogSnapshot.exists()) continue;
            const catalog = parseCatalogDocument(catalogSnapshot.data());
            if (!catalog) continue;
            await saveCloudProductLocally(db, storeId, {
              catalog,
              storeProduct,
              product: {
                ...catalog,
                priceCentavos: storeProduct.priceCentavos,
                updatedAt: storeProduct.priceUpdatedAt,
              },
            });
          }
          await handlers.onSynchronized();
        })
        .catch(handlers.onError);
    },
    handlers.onError,
  );
}

export async function pushPendingSyncMutations(
  db: SQLiteDatabase,
  storeId: string,
): Promise<number> {
  const mutations = await listPendingSyncMutations(db, storeId);
  for (const mutation of mutations) {
    try {
      if (mutation.kind === 'catalog') {
        const catalog = mutation.payload as unknown as CatalogDocument;
        if (!parseCatalogDocument(catalog) || catalog.barcode !== mutation.barcode) {
          await failSyncMutation(db, mutation.id, 'sync/invalid-catalog');
          continue;
        }
        await writeCatalogProductToCloud(catalog);
      } else {
        const storeProduct = parseStoreProductDocument(mutation.barcode, mutation.payload);
        if (!storeProduct || mutation.storeId !== storeId) {
          await failSyncMutation(db, mutation.id, 'sync/invalid-store-product');
          continue;
        }
        await writeStoreProductToCloud(storeId, storeProduct);
      }
      await completeSyncMutation(db, mutation.id);
    } catch (error) {
      await failSyncMutation(db, mutation.id, errorCode(error));
    }
  }
  return mutations.length;
}
