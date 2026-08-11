# Implementation Plan: Onboarding, activation, and Answer Once

**Status:** Implemented and verified on 2026-08-11.

## Overview

Implement skippable first-run onboarding, remove implicit role assignment, add explicit owner or join-store activation, and let a linked Bantay request an unknown price from the owner. Preserve existing memberships, local prices, and the owner-only price-write boundary. Pricing and payment presentation are deferred so onboarding stays focused on Bantay’s distinctive value.

## Architecture decisions

- Authentication creates identity only; membership hydration never creates a store.
- **Create my store** is the only owner-creation action. Joiners remain unassigned until pairing succeeds.
- First-run onboarding is local, network-independent, and appears once per installation.
- Price requests live at `stores/{storeId}/price_requests/{barcode}` and deduplicate by barcode.
- Answering always uses the existing catalog/store-product save pipeline; a request cannot write a price.
- Owner receipt is realtime in-app with a pending count. OS push requires trusted backend delivery and is out of scope.
- Lottie assets are local, lightweight, license-cleared, and nonessential to comprehension.

## Phases

### Phase 1: Safe identity and onboarding state

- Add tested first-run preference behavior.
- Replace implicit store creation with read-only membership hydration.
- Add explicit owner creation and unassigned pairing activation.

### Checkpoint

- Fresh authentication has no role or store.
- Existing memberships hydrate unchanged, including offline cached membership.
- Both activation paths recover from Back, sign-out, network failure, and QR expiry.

### Phase 2: Answer Once contract

- Add strict request parsing and repository functions.
- Add store-scoped Firestore authorization.
- Add Bantay request submission for both missing and catalog-only products.

### Checkpoint

- Requests deduplicate by store/barcode.
- Bantays cannot write prices or answer requests.
- Existing saved-price behavior remains unchanged.

### Phase 3: Owner answer path

- Add owner pending count and request list.
- Prefill the existing product form from a request.
- Mark the request answered only after the price save succeeds.

### Checkpoint

- One owner answer reaches linked devices through existing realtime sync.
- Later scans resolve immediately.

### Phase 4: First-run UI and final quality

- Add three skippable Lottie scenes before authentication.
- Run the native accessibility, reduced-motion, dark-theme, offline, and authorization pass.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Existing users are sent to activation | Regression-test existing owner and Bantay hydration before UI changes. |
| Bantay escalates a request into a price write | Separate contracts and retain owner-only product rules. |
| Owner misses a request without push | Realtime pending count and prominent owner Home entry point. |
| Dirty worktree overlaps target files | Inspect target diffs before every edit and preserve unrelated changes. |
| Lottie causes accessibility/performance issues | Small local files, reduced-motion static state, text carries all meaning. |

## Out of scope

- Push, SMS, email, chat, and free-text messaging.
- Payments, trial enforcement, and dynamic pricing UI.
- Tingi/multiple selling units, sales, inventory, and POS behavior.

## Verification results

- Focused tests were run after each contract change.
- All 63 tests, TypeScript, and ESLint pass.
- Firestore rules compile in the local Firestore emulator on an isolated port.
- All three local Lottie JSON files parse successfully; device-level visual verification remains a release check.
