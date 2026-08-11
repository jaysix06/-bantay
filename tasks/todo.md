# Tasks: Onboarding, activation, and Answer Once

## Task 1: First-run preference ✅

- **Acceptance:** fresh, skipped, completed, and returning launches resolve deterministically.
- **Verify:** focused Vitest tests and type check.
- **Files:** `src/data/onboarding-preference.ts`, test, settings repository.

## Task 2: Unassigned authentication ✅

- **Acceptance:** new identities create no store; existing owner/Bantay membership is preserved.
- **Verify:** regression tests, full tests, type check.
- **Files:** auth provider, store repository, auth/store tests, root gate.

## Task 3: Explicit activation ✅

- **Acceptance:** no preselection; owner store is created only on confirmation; joiner stays unassigned until paired.
- **Verify:** routing/contract tests and Android Back/error checks.
- **Files:** activation screen, auth provider, store repository, root gate, rules.

## Task 4: Price-request contract ✅

- **Acceptance:** strict bounded parsing, barcode deduplication, valid pending/answered states.
- **Verify:** failing-then-passing focused tests.
- **Files:** `src/data/price-request.ts` and test.

## Task 5: Price-request repository and rules ✅

- **Acceptance:** linked Bantay creates/refreshes pending request; members read; owner answers only after price exists.
- **Verify:** repository tests where feasible and Firestore validation.
- **Files:** repository, Firestore rules.

## Task 6: Bantay request UI ✅

- **Acceptance:** missing-price states show **Ask the owner** only to Bantays with loading, sent, offline, duplicate, and error feedback.
- **Verify:** state/navigation tests and type check.
- **Files:** product-result screen and tests.

## Task 7: Owner inbox and answer ✅

- **Acceptance:** owner sees pending count/list; answer form is prefilled; successful save marks answered; failure remains pending.
- **Verify:** tests and two-account manual flow if environment permits.
- **Files:** request screen/route, Home, product form, repository.

## Task 8: First-run onboarding UI ✅

- **Acceptance:** three scenes appear once before auth; Skip/complete persist; system Back and reduced motion work.
- **Verify:** routing/preference tests and Android layout check.
- **Files:** onboarding screen, root gate, local Lottie assets.

## Task 9: Final gate ✅

- **Acceptance:** all spec criteria pass with no scan, search, price edit, pairing, auth, or sync regressions.
- **Verify:** full test, type check, lint, final diff and security review.
