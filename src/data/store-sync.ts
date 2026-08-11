import { normalizeScannedBarcode } from '@/domain/product';

export type StoreRole = 'owner' | 'bantay';

export type StoreMembership = {
  storeId: string;
  name: string;
  role: StoreRole;
};

export type StoreProductDocument = {
  catalogProductId: string;
  priceCentavos: number;
  priceUpdatedAt: string;
  updatedBy: string;
  mutationId: string;
};

type SyncKind = 'catalog' | 'store_product';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowedKeys: string[]): boolean {
  return Object.keys(value).every((key) => allowedKeys.includes(key));
}

export function parseStoreDocument(
  storeId: string,
  value: unknown,
  userId: string,
): StoreMembership | null {
  if (!storeId || !userId || !isRecord(value)) return null;
  const name = typeof value.name === 'string' ? value.name.trim().slice(0, 80) : '';
  const ownerUid = typeof value.ownerUid === 'string' ? value.ownerUid.trim() : '';
  const bantayUids = value.bantayUids;
  if (
    !name ||
    !ownerUid ||
    !Array.isArray(bantayUids) ||
    !bantayUids.every((uid): uid is string => typeof uid === 'string' && Boolean(uid.trim()))
  ) {
    return null;
  }

  if (ownerUid === userId) return { storeId, name, role: 'owner' };
  if (bantayUids.includes(userId)) return { storeId, name, role: 'bantay' };
  return null;
}

export function canManageStore(membership: StoreMembership | null): boolean {
  return membership?.role === 'owner';
}

export function buildStoreProductDocument(
  barcode: string,
  priceCentavos: number,
  updatedBy: string,
  mutationId: string,
  priceUpdatedAt = new Date().toISOString(),
): StoreProductDocument {
  const catalogProductId = normalizeScannedBarcode(barcode);
  if (!catalogProductId) throw new Error('A valid barcode is required.');
  if (!Number.isSafeInteger(priceCentavos) || priceCentavos < 0) {
    throw new Error('A non-negative price in centavos is required.');
  }
  if (!updatedBy.trim() || !mutationId.trim()) throw new Error('Write identity is required.');

  return {
    catalogProductId,
    priceCentavos,
    priceUpdatedAt,
    updatedBy: updatedBy.trim(),
    mutationId: mutationId.trim(),
  };
}

export function parseStoreProductDocument(
  barcode: string,
  value: unknown,
): StoreProductDocument | null {
  const normalizedBarcode = normalizeScannedBarcode(barcode);
  if (!normalizedBarcode || !isRecord(value)) return null;
  if (
    !hasOnlyKeys(value, [
      'catalogProductId',
      'priceCentavos',
      'priceUpdatedAt',
      'updatedBy',
      'mutationId',
      'serverUpdatedAt',
    ])
  ) {
    return null;
  }
  if (
    value.catalogProductId !== normalizedBarcode ||
    !Number.isSafeInteger(value.priceCentavos) ||
    (value.priceCentavos as number) < 0 ||
    typeof value.priceUpdatedAt !== 'string' ||
    !Number.isFinite(Date.parse(value.priceUpdatedAt)) ||
    typeof value.updatedBy !== 'string' ||
    !value.updatedBy.trim() ||
    typeof value.mutationId !== 'string' ||
    !value.mutationId.trim()
  ) {
    return null;
  }

  return {
    catalogProductId: normalizedBarcode,
    priceCentavos: value.priceCentavos as number,
    priceUpdatedAt: value.priceUpdatedAt,
    updatedBy: value.updatedBy.trim(),
    mutationId: value.mutationId.trim(),
  };
}

export function syncQueueId(
  kind: SyncKind,
  storeId: string | null,
  barcode: string,
): string {
  const normalizedBarcode = normalizeScannedBarcode(barcode);
  if (!normalizedBarcode) throw new Error('A valid barcode is required.');
  if (kind === 'catalog') return `catalog:${normalizedBarcode}`;
  if (!storeId?.trim()) throw new Error('A store is required for store product synchronization.');
  return `store_product:${storeId.trim()}:${normalizedBarcode}`;
}
