# Spec: Answer Once price requests

## Status

Approved by the user for implementation together with first-run onboarding and explicit account activation.

## Objective

When a linked Bantay scans a product without a store price, let them ask the store owner inside Bantay. The owner answers once, the normal store-price synchronization distributes the answer, and every later scan resolves immediately.

## Assumptions

1. “Owner receives” means a realtime in-app request and visible pending count in this release. Operating-system push notifications require a trusted notification sender and device-token lifecycle, so they are a follow-up rather than an insecure client-side shortcut.
2. One open request per store and barcode is sufficient. Repeated requests update the latest requester and timestamp without creating duplicates.
3. Requests may include barcode plus bounded catalog information already known to the client: name, brand, quantity, and HTTPS image URL.
4. Only linked Bantays may create requests, only that store’s owner may answer them, and all store members may read request status for the requested barcode.
5. Answering uses the existing owner-only product/price save path so offline storage and realtime synchronization remain the source of truth.

## User flow

1. A Bantay scans an unknown product or a known catalog product without a store price.
2. The result screen shows **Ask the owner**.
3. Submitting creates or refreshes `stores/{storeId}/price_requests/{barcode}` with status `pending`.
4. The result screen confirms: **Request sent. The owner only needs to answer once.**
5. The owner sees a pending-request entry point and opens a structured request.
6. The owner confirms product details, enters the price, and saves.
7. The normal catalog and store-product write succeeds, then the request becomes `answered` with its answer timestamp.
8. Realtime store sync makes the price available on every linked device; future scans use the existing saved-price path.

## Price request contract

```ts
type PriceRequestDocument = {
  barcode: string;
  name: string | null;
  brand: string | null;
  quantity: string | null;
  source: 'manual' | 'open_food_facts';
  imageUrl: string | null;
  requestedBy: string;
  requestedAt: Timestamp;
  status: 'pending' | 'answered';
  answeredAt: Timestamp | null;
};
```

The document ID is the normalized barcode. Firestore server timestamps are authoritative. Client parsing rejects unknown fields, malformed barcodes, oversized text, non-HTTPS images, and invalid state combinations.

## Authorization

- Store members may read price requests in their store.
- A linked Bantay may create a pending request whose `requestedBy` equals their authenticated UID.
- A linked Bantay may refresh only the request metadata and must leave status pending.
- The owner may mark a pending request answered only after the corresponding store product exists after the write.
- Clients cannot delete requests in this release.
- Request creation never grants price-write permission to a Bantay.

## Interface behavior

### Bantay result

- Show **Ask the owner** only when membership is Bantay and no saved store price exists.
- Disable duplicate submission while saving.
- After success, replace the action with a calm pending state and **Scan another**.
- If the owner answers while the screen remains open, the existing realtime price revision should transition to the saved result.
- Offline submission explains that a connection is required; price lookup remains usable for already saved products.

### Owner requests

- Add a focused owner-only **Price requests** destination from Home, showing the pending count.
- Each row prioritizes product name if known, barcode, requester-neutral copy, and time requested.
- Selecting a request opens the existing product form with request data prefilled.
- Successful price save marks the request answered and returns to the request list.
- Empty state: **No prices waiting. Your Bantays have answers for everything they scanned.**

## Testing strategy

- Pure tests cover parsing, deduplication identity, pending/answered transitions, and bounded metadata.
- Navigation tests cover Bantay unknown result → sent state and owner request → prefilled price form.
- Existing owner-only store-product tests remain unchanged and must pass.
- Firestore rules are validated with emulator tests if the repository has an emulator test harness; otherwise compile/deploy validation is reported explicitly.

## Boundaries

### Always

- Use the existing store-product write and sync pipeline for the final answer.
- Preserve read-only Bantay permissions.
- Deduplicate by store and barcode.
- Keep request metadata bounded and non-sensitive.

### Ask first

- Add push notifications, SMS, or email.
- Add chat, free-text conversations, or attachments.
- Allow Bantays to suggest or enter prices.

### Never

- Treat an external catalog price as store truth.
- Let request creation modify a store price.
- Claim that a request was delivered outside the app.
- Record a sale or change inventory.

## Success criteria

- A linked Bantay can submit one request for an unknown scanned barcode.
- Repeating the request does not create duplicate documents.
- The store owner sees the request in realtime and can answer through the existing price form.
- Only the owner can save the price or mark the request answered.
- The answer synchronizes through the existing product pipeline and later scans resolve immediately.
- Loading, empty, pending, answered, offline, and error states are accessible and recoverable.
