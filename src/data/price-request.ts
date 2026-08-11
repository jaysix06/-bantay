import { normalizeBarcode, type ProductDraft, type ProductSource } from '@/domain/product';

export type PriceRequestStatus = 'pending' | 'answered';

export type PriceRequest = {
  barcode: string;
  name: string | null;
  brand: string | null;
  quantity: string | null;
  source: ProductSource;
  imageUrl: string | null;
  requestedBy: string;
  requestedAt: Date;
  status: PriceRequestStatus;
  answeredAt: Date | null;
};

export type PriceRequestDraft = Pick<
  PriceRequest,
  'barcode' | 'name' | 'brand' | 'quantity' | 'source' | 'imageUrl' | 'requestedBy'
>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cleanOptional(value: unknown, maxLength: number): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return null;
  return value.trim().slice(0, maxLength) || null;
}

function readTimestamp(value: unknown): Date | null {
  if (!isRecord(value) || typeof value.toDate !== 'function') return null;
  const date = value.toDate();
  return date instanceof Date && Number.isFinite(date.getTime()) ? date : null;
}

export function priceRequestId(barcode: string): string {
  const normalized = normalizeBarcode(barcode);
  if (!normalized) throw new Error('A valid barcode is required.');
  return normalized;
}

export function buildPriceRequestDraft(
  product: ProductDraft,
  requestedBy: string,
): PriceRequestDraft {
  const barcode = priceRequestId(product.barcode);
  const requester = requestedBy.trim();
  if (!requester) throw new Error('A requester is required.');
  return {
    barcode,
    name: cleanOptional(product.name, 120),
    brand: cleanOptional(product.brand, 80),
    quantity: cleanOptional(product.quantity, 40),
    source: product.source,
    imageUrl:
      typeof product.imageUrl === 'string' && product.imageUrl.startsWith('https://')
        ? product.imageUrl.slice(0, 2048)
        : null,
    requestedBy: requester,
  };
}

export function parsePriceRequestDocument(
  barcode: string,
  value: unknown,
): PriceRequest | null {
  const normalized = normalizeBarcode(barcode);
  if (!normalized || !isRecord(value)) return null;
  const allowed = ['barcode', 'name', 'brand', 'quantity', 'source', 'imageUrl', 'requestedBy', 'requestedAt', 'status', 'answeredAt'];
  if (!Object.keys(value).every((key) => allowed.includes(key))) return null;
  if (value.barcode !== normalized || typeof value.requestedBy !== 'string' || !value.requestedBy.trim()) return null;
  if (value.status !== 'pending' && value.status !== 'answered') return null;
  if (value.source !== 'manual' && value.source !== 'open_food_facts') return null;
  const requestedAt = readTimestamp(value.requestedAt);
  const answeredAt = value.answeredAt === null ? null : readTimestamp(value.answeredAt);
  if (!requestedAt) return null;
  if ((value.status === 'pending' && answeredAt) || (value.status === 'answered' && !answeredAt)) return null;
  for (const key of ['name', 'brand', 'quantity', 'imageUrl'] as const) {
    if (value[key] !== null && typeof value[key] !== 'string') return null;
  }
  if (typeof value.name === 'string' && value.name.length > 120) return null;
  if (typeof value.brand === 'string' && value.brand.length > 80) return null;
  if (typeof value.quantity === 'string' && value.quantity.length > 40) return null;
  if (typeof value.imageUrl === 'string' && (!value.imageUrl.startsWith('https://') || value.imageUrl.length > 2048)) return null;
  return {
    barcode: normalized,
    name: cleanOptional(value.name, 120),
    brand: cleanOptional(value.brand, 80),
    quantity: cleanOptional(value.quantity, 40),
    source: value.source,
    imageUrl: cleanOptional(value.imageUrl, 2048),
    requestedBy: value.requestedBy.trim(),
    requestedAt,
    status: value.status,
    answeredAt,
  };
}
