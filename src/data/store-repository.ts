import {
  arrayRemove,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

import { requireFirestore } from '@/data/firebase';
import { classifyRealtimeSnapshot, type RealtimeSnapshotSource } from '@/data/realtime-sync';
import { cleanStoreName } from '@/data/account-activation';
import { parseStoreDocument, type StoreMembership } from '@/data/store-sync';

export type StoreRecord = {
  membership: StoreMembership;
  ownerUid: string;
  bantayUids: string[];
};

function readStoreRecord(
  storeId: string,
  value: unknown,
  userId: string,
): StoreRecord | null {
  const membership = parseStoreDocument(storeId, value, userId);
  if (!membership || typeof value !== 'object' || value === null) return null;
  const data = value as { ownerUid?: unknown; bantayUids?: unknown };
  if (typeof data.ownerUid !== 'string' || !Array.isArray(data.bantayUids)) return null;
  return {
    membership,
    ownerUid: data.ownerUid,
    bantayUids: data.bantayUids.filter((uid): uid is string => typeof uid === 'string'),
  };
}

async function findStoreByField(
  userId: string,
  field: 'ownerUid' | 'bantayUids',
): Promise<StoreRecord | null> {
  const db = requireFirestore();
  const constraint = field === 'ownerUid' ? where(field, '==', userId) : where(field, 'array-contains', userId);
  const snapshot = await getDocs(query(collection(db, 'stores'), constraint, limit(1)));
  const match = snapshot.docs[0];
  return match ? readStoreRecord(match.id, match.data(), userId) : null;
}

export async function findStoreForUser(userId: string): Promise<StoreRecord | null> {
  return (await findStoreByField(userId, 'bantayUids')) ?? findStoreByField(userId, 'ownerUid');
}

export async function createStoreForOwner(
  userId: string,
  requestedName: string,
): Promise<StoreRecord> {
  const existing = await findStoreForUser(userId);
  if (existing) return existing;

  const db = requireFirestore();
  const storeId = userId;
  const name = cleanStoreName(requestedName);
  if (!name) throw new Error('Enter a store name.');
  await setDoc(doc(db, 'stores', storeId), {
    name,
    ownerUid: userId,
    bantayUids: [],
    lastPairingCode: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return {
    membership: { storeId, name, role: 'owner' },
    ownerUid: userId,
    bantayUids: [],
  };
}

export async function refreshStoreRecord(
  storeId: string,
  userId: string,
): Promise<StoreRecord | null> {
  const snapshot = await getDoc(doc(requireFirestore(), 'stores', storeId));
  return snapshot.exists() ? readStoreRecord(snapshot.id, snapshot.data(), userId) : null;
}

export function subscribeToStoreRecord(
  storeId: string,
  userId: string,
  onSnapshotSource: (source: RealtimeSnapshotSource) => void,
  onRecord: (record: StoreRecord | null) => void,
  onError: (error: unknown) => void,
): () => void {
  return onSnapshot(
    doc(requireFirestore(), 'stores', storeId),
    { includeMetadataChanges: true },
    (snapshot) => {
      const source = classifyRealtimeSnapshot(snapshot.metadata);
      onSnapshotSource(source);
      if (source !== 'server') return;
      onRecord(snapshot.exists() ? readStoreRecord(snapshot.id, snapshot.data(), userId) : null);
    },
    onError,
  );
}

export async function removeBantay(storeId: string, userId: string): Promise<void> {
  await updateDoc(doc(requireFirestore(), 'stores', storeId), {
    bantayUids: arrayRemove(userId),
    updatedAt: serverTimestamp(),
  });
}
