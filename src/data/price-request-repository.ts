import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { requireFirestore } from '@/data/firebase';
import {
  buildPriceRequestDraft,
  parsePriceRequestDocument,
  priceRequestId,
  type PriceRequest,
} from '@/data/price-request';
import type { ProductDraft } from '@/domain/product';

export async function submitPriceRequest(
  storeId: string,
  userId: string,
  product: ProductDraft,
): Promise<void> {
  const request = buildPriceRequestDraft(product, userId);
  await setDoc(
    doc(requireFirestore(), 'stores', storeId, 'price_requests', request.barcode),
    {
      ...request,
      requestedAt: serverTimestamp(),
      status: 'pending',
      answeredAt: null,
    },
  );
}

export function subscribeToPendingPriceRequests(
  storeId: string,
  onRequests: (requests: PriceRequest[]) => void,
  onError: (error: unknown) => void,
): () => void {
  return onSnapshot(
    collection(requireFirestore(), 'stores', storeId, 'price_requests'),
    (snapshot) => {
      const requests = snapshot.docs
        .map((item) => parsePriceRequestDocument(item.id, item.data()))
        .filter((item): item is PriceRequest => item?.status === 'pending')
        .sort((left, right) => right.requestedAt.getTime() - left.requestedAt.getTime());
      onRequests(requests);
    },
    onError,
  );
}

export async function markPriceRequestAnswered(storeId: string, barcode: string): Promise<void> {
  await updateDoc(
    doc(requireFirestore(), 'stores', storeId, 'price_requests', priceRequestId(barcode)),
    { status: 'answered', answeredAt: serverTimestamp() },
  );
}
