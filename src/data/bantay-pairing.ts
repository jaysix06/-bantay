export const BANTAY_PAIRING_TTL_MS = 5 * 60 * 1000;

const FIRESTORE_AUTO_ID_PATTERN = /^[A-Za-z0-9]{20}$/;
const BANTAY_PAIRING_PAYLOAD_PATTERN = /^bantay:\/\/pair\?v=1&code=([A-Za-z0-9]{20})$/;

export function buildBantayPairingPayload(token: string): string {
  if (!FIRESTORE_AUTO_ID_PATTERN.test(token)) {
    throw new Error('Pairing token must be a Firestore auto-ID.');
  }
  return `bantay://pair?v=1&code=${token}`;
}

export function parseBantayPairingPayload(payload: string): string | null {
  return BANTAY_PAIRING_PAYLOAD_PATTERN.exec(payload.trim())?.[1] ?? null;
}

export function parseClaimedBantayStoreId(value: unknown, bantayUid: string): string | null {
  if (typeof value !== 'object' || value === null || !bantayUid.trim()) return null;
  const data = value as { bantayUid?: unknown; claimedByStoreId?: unknown };
  if (data.bantayUid !== bantayUid || typeof data.claimedByStoreId !== 'string') return null;
  return data.claimedByStoreId.trim() || null;
}

export function isBantayPairingExpired(expiresAtMs: number, nowMs = Date.now()): boolean {
  return !Number.isFinite(expiresAtMs) || expiresAtMs <= nowMs;
}
