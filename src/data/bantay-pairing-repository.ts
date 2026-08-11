import {
  Timestamp,
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import {
  BANTAY_PAIRING_TTL_MS,
  buildBantayPairingPayload,
  isBantayPairingExpired,
  parseClaimedBantayStoreId,
  parseBantayPairingPayload,
} from '@/data/bantay-pairing';
import { requireFirestore } from '@/data/firebase';

export type BantayPairingCode = {
  token: string;
  payload: string;
  expiresAt: Date;
};

type PairingDocument = {
  bantayUid?: unknown;
  expiresAt?: unknown;
  claimedByStoreId?: unknown;
};

export class BantayPairingError extends Error {
  constructor(
    public readonly code: 'invalid' | 'expired' | 'used' | 'self' | 'forbidden',
    message: string,
  ) {
    super(message);
    this.name = 'BantayPairingError';
  }
}

export async function createBantayPairingCode(bantayUid: string): Promise<BantayPairingCode> {
  const db = requireFirestore();
  const pairingRef = doc(collection(db, 'bantay_pairing_codes'));
  const expiresAt = new Date(Date.now() + BANTAY_PAIRING_TTL_MS);

  await setDoc(pairingRef, {
    bantayUid,
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromDate(expiresAt),
    claimedByStoreId: null,
    claimedAt: null,
  });

  return {
    token: pairingRef.id,
    payload: buildBantayPairingPayload(pairingRef.id),
    expiresAt,
  };
}

export function watchBantayPairingClaim(
  token: string,
  bantayUid: string,
  onClaimed: (storeId: string) => void,
  onError: () => void,
): () => void {
  let reportedStoreId: string | null = null;
  return onSnapshot(
    doc(requireFirestore(), 'bantay_pairing_codes', token),
    (snapshot) => {
      if (!snapshot.exists()) return;
      const storeId = parseClaimedBantayStoreId(snapshot.data(), bantayUid);
      if (!storeId || storeId === reportedStoreId) return;
      reportedStoreId = storeId;
      onClaimed(storeId);
    },
    onError,
  );
}

export async function claimBantayPairingCode(
  storeId: string,
  ownerUid: string,
  payload: string,
): Promise<string> {
  const token = parseBantayPairingPayload(payload);
  if (!token) throw new BantayPairingError('invalid', 'This is not a Bantay account QR code.');

  const db = requireFirestore();
  const pairingRef = doc(db, 'bantay_pairing_codes', token);
  const storeRef = doc(db, 'stores', storeId);

  return runTransaction(db, async (transaction) => {
    const [pairingSnapshot, storeSnapshot] = await Promise.all([
      transaction.get(pairingRef),
      transaction.get(storeRef),
    ]);

    if (!pairingSnapshot.exists()) {
      throw new BantayPairingError('invalid', 'This pairing code no longer exists.');
    }
    const pairing = pairingSnapshot.data() as PairingDocument;
    const expiresAt = pairing.expiresAt instanceof Timestamp ? pairing.expiresAt.toMillis() : Number.NaN;
    if (isBantayPairingExpired(expiresAt)) {
      throw new BantayPairingError('expired', 'This pairing code expired. Ask the bantay to show a new one.');
    }
    if (pairing.claimedByStoreId !== null) {
      throw new BantayPairingError('used', 'This pairing code has already been used.');
    }
    if (typeof pairing.bantayUid !== 'string' || !pairing.bantayUid) {
      throw new BantayPairingError('invalid', 'This pairing code is invalid.');
    }
    if (pairing.bantayUid === ownerUid) {
      throw new BantayPairingError('self', 'The store owner cannot be linked as their own bantay.');
    }
    if (!storeSnapshot.exists() || storeSnapshot.data().ownerUid !== ownerUid) {
      throw new BantayPairingError('forbidden', 'Only this store owner can link bantays.');
    }

    transaction.update(storeRef, {
      bantayUids: arrayUnion(pairing.bantayUid),
      lastPairingCode: token,
      updatedAt: serverTimestamp(),
    });
    transaction.update(pairingRef, {
      claimedByStoreId: storeId,
      claimedAt: serverTimestamp(),
    });
    return pairing.bantayUid;
  });
}
