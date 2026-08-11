# Spec: First-run onboarding and explicit account activation

## Status

Proposed for product review. No implementation should begin until this spec is approved.

## Assumptions

1. Bantay serves mixed-experience family users on Android, including people who are not comfortable with business software.
2. The first product value, or “aha” moment, is seeing the correct owner-set price immediately after scanning a known product.
3. A person can own one store or join one store in the MVP; multi-store and role switching remain out of scope.
4. Store owners, not Bantay attendants, are the paying customer.
5. “LottieFiles animations” means local, bundled Lottie JSON played with the existing `lottie-react-native` dependency. Assets must be original or have a license suitable for commercial redistribution.
6. Existing authenticated store memberships must be preserved during migration.

## Objective

Replace implicit store-owner creation with two deliberate activation paths and add a concise first-run introduction before authentication.

The experience should help a new user understand Bantay in under 30 seconds, create an identity, and then either:

- set up a store and become its owner; or
- wait unassigned until an existing owner links the account as a Bantay.

The experience must reinforce the promise “Scan it. Know the price.” without turning onboarding into a feature tour.

## Product decision

### Do not ask users to choose a technical role

Use intent-based choices:

- **Set up my store** — “Add products, set prices, and invite family.”
- **Join a family store** — “Scan products and check prices set by the owner.”

“Owner” and “Bantay” appear as supporting labels, not as unexplained role names. No role is assigned at Firebase account creation or first Google sign-in.

### Activation rules

| Account state | Destination | Membership effect |
| --- | --- | --- |
| Signed out, first app launch | Intro onboarding | None |
| Signed out, returning launch | Sign in | None |
| Signed in with existing membership | Role-appropriate app | Preserve current membership |
| Signed in without membership | Account activation choice | None |
| Chooses “Set up my store” and confirms store name | Owner setup | Create store and owner membership |
| Chooses “Join a family store” | Bantay pairing screen | Remain unassigned until owner claims QR |
| Owner claims account QR | Pairing success, then scanner | Add Bantay membership |

Closing the app, losing connectivity, or backing out of activation must never silently create a store.

## Experience specification

### 1. First-run introduction before sign in

Show once per app installation. Persist completion or skip locally with AsyncStorage. Returning users and users who already completed it go directly to authentication.

The introduction has three horizontally paged scenes, a visible progress indicator, a persistent **Skip** action, and one primary action.

1. **Scan it. Know the price.**
   - Copy: “Point your camera at a product and see the price your store trusts.”
   - Motion: barcode enters a warm price-label frame and resolves to a clear price.
2. **One price book for the family.**
   - Copy: “The owner sets prices once. Every linked Bantay sees the same answer.”
   - Motion: one owner phone links to two family phones; reuse or adapt the existing pairing visual language.
3. **Ready even when the signal is not.**
   - Copy: “Previously saved prices stay available when your connection is weak.”
   - Motion: a cloud signal fades while the price label stays present.

Actions:

- Scenes 1–2: **Next**
- Scene 3: **Get started**
- **Skip** on every scene leads to sign in and records onboarding as seen.
- Android system Back moves to the previous scene; Back on scene 1 exits normally.
- Respect reduced-motion settings by showing the final animation frame without autoplay.

Animations are illustrative and non-interactive. Essential meaning must also exist in text and accessibility labels.

### 2. Authentication

Keep sign-in and account creation focused on identity only. Update account-creation copy so it does not imply a store or role has already been selected.

Email/password and Google authentication must behave identically after success: existing members enter the app; accounts without membership enter activation.

### 3. Account activation

Heading: **How will you use Bantay?**

Supporting copy: “Choose what you need today. A store owner can link you later if you’re joining as a Bantay.”

Present two full-width Material 3 selection surfaces with distinct icons, concise descriptions, and 48dp minimum targets. Do not preselect either choice.

#### Set up my store

1. Explain owner capabilities and the trial in one compact summary.
2. Ask only for the store name.
3. The confirmation action **Create my store** is the first point that creates the Firestore store and owner membership.
4. Continue to a useful empty state prompting the owner to scan or add the first product.

#### Join a family store

1. Create a temporary account QR using the existing Bantay pairing system.
2. Explain: “Ask the store owner to scan this QR from their Bantay app.”
3. Watch for the claim and automatically continue to the scanner on success.
4. Allow QR refresh, retry, sign out, and returning to the choice screen.
5. Do not call the unlinked account a Bantay until pairing succeeds.

## Monetization recommendation

### Recommended model

Charge per store, never per person or per device. Bantay attendants remain free.

- **Starter — Free**
  - 1 store
  - up to 50 saved products
  - owner + 1 linked Bantay
  - scanning, search, and offline access to saved prices
- **Family — ₱99/month or ₱999/year**
  - 30-day free trial, no card required
  - unlimited saved products under normal-use safeguards
  - owner + up to 10 linked Bantays
  - cloud sync and priority recovery/support

Pricing should be treated as a launch hypothesis, not established product truth. Validate it with at least 10 target store owners before enabling payment. The initial implementation may show honest trial messaging and store entitlement fields, but payment collection should remain disabled behind a feature flag until validation and Google Play Billing are ready.

### Dynamic pricing configuration

Displayed pricing and plan limits must not be hard-coded in screens. Read them from the signed-in, read-only Firestore document `public_config/pricing`, which can be edited from the Firebase Console without publishing a new app build.

Use integer minor units to avoid floating-point currency errors:

```ts
type PricingConfig = {
  currency: 'PHP';
  familyMonthlyPriceMinor: number; // 9900 displays as ₱99
  familyAnnualPriceMinor: number; // 99900 displays as ₱999
  trialDays: number;
  starterProductLimit: number;
  starterBantayLimit: number;
  familyBantayLimit: number;
};
```

The app ships with the proposed values as validated fallbacks for offline or missing configuration. Invalid remote values are rejected field-by-field or as a complete payload according to the repository contract, and the last known valid configuration is cached locally. Firestore rules allow signed-in users to read this single public configuration document and never allow client writes.

When payments are enabled, Google Play Billing product details are the authority for the actual charged and localized price. Firestore configuration may control plan messaging, limits, and trial presentation, but must not contradict or override the checkout amount returned by Google Play.

### Trial behavior

- Start the 30-day Family trial only when **Create my store** succeeds, not when the identity account is created.
- Show the exact trial end date in the owner profile.
- Send reminders at 7 days and 1 day before expiry only after notification consent.
- At expiry, fall back to Starter; never delete products or block read-only access to existing prices.
- If the store exceeds Starter limits, prevent new additions or new links while preserving lookup, export/recovery, and unlinking.

### Why this model

The Philippine small-business comparison set makes a high upfront subscription risky: Peddlr advertises a broad POS and inventory product as free, while Loyverse keeps its core POS free and charges per-store for optional add-ons with a 14-day no-card trial. Bantay is intentionally narrower, so a low per-store price and a useful permanent free tier are more credible than charging every family member or forcing payment before first value.

Research references:

- Peddlr pricing and product FAQ: https://www.peddlr.io/en/faqs
- Loyverse pricing: https://loyverse.com/pricing
- Google Play subscription offers and trials: https://support.google.com/googleplay/android-developer/answer/12154973

## Data and authorization changes

1. Replace implicit `findOrCreateStoreForUser` during auth hydration with a read-only membership lookup.
2. Add an explicit `createStoreForOwner(userId, storeName)` repository operation.
3. Represent “authenticated, no membership” as a normal activation state, not an error.
4. Preserve existing owner and Bantay memberships.
5. Extend store records and Firestore rules only if trial scaffolding is included:
   - `plan: 'starter' | 'family_trial' | 'family'`
   - `trialStartedAt`
   - `trialEndsAt`
6. The client may request activation, but Firestore rules must continue to enforce self-owned store creation and owner-only membership changes.
7. Local store context is written only after a real membership exists.

## Tech stack

- Expo SDK 56 and Expo Router
- React Native 0.85 with TypeScript
- Firebase Authentication and Firestore
- AsyncStorage for installation-local onboarding completion
- `lottie-react-native` for bundled animations
- Vitest for pure state, routing, and repository behavior tests

## Commands

- Install: `npm install`
- Start: `npm run start`
- Android: `npm run android`
- Test: `npm run test`
- Type check: `npm run typecheck`
- Lint: `npm run lint`

## Project structure

- `src/app/_layout.tsx` — authentication, onboarding, activation, and application gates
- `src/auth/auth-provider.tsx` — identity and membership state orchestration
- `src/data/store-repository.ts` — explicit store lookup and creation
- `src/data/settings-repository.ts` — local first-run completion setting or precedent for a focused onboarding repository
- `src/data/pricing-config.ts` — validated fallback configuration and currency formatting
- `src/data/pricing-config-repository.ts` — Firestore read and local cache for editable display pricing
- `src/screens/onboarding/` — first-run introduction
- `src/screens/account-activation/` — intent choice, store setup, and unassigned pairing flow
- `assets/animations/` — bundled, license-cleared Lottie JSON
- `firestore.rules` — store creation and membership authorization
- `src/**/*.test.ts` — colocated behavior tests

## Code style

Follow the existing named React function component and semantic-theme pattern:

```tsx
export function ActivationChoiceScreen({ onChoose }: ActivationChoiceScreenProps) {
  const theme = useAppTheme();

  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <AppButton label="Set up my store" onPress={() => onChoose('owner')} />
    </View>
  );
}
```

- Use semantic colors from `useAppTheme`; no raw palette values in screens.
- Use Montserrat roles already established in the app.
- Keep working screens focused on one decision and one primary action.
- Use plain English and explain consequences before commitment.

## Testing strategy

Write behavior tests before implementation for:

1. first launch versus returning launch routing;
2. skip and completion persistence;
3. new email and Google accounts remaining unassigned;
4. existing owner/Bantay memberships remaining unchanged;
5. explicit store creation producing owner membership only after confirmation;
6. pairing an unassigned account producing Bantay membership;
7. cancellation, offline, expired QR, and retry paths;
8. trial dates and safe Starter fallback if trial scaffolding is approved.
9. valid, invalid, missing, cached, and offline dynamic pricing configuration.

Run tests, type check, and lint after each vertical slice. Verify the native flow on compact Android width, large font scale, light/dark themes, TalkBack semantics, system Back, and reduced motion.

## Boundaries

### Always

- Preserve existing memberships and locally cached price data.
- Keep scanning/searching read-only for Bantay members.
- Make onboarding skippable and show it only once per installation.
- Keep existing prices readable after any trial expiry.
- Use original or commercially redistributable animation assets.

### Ask first

- Add or change Firestore billing/trial fields.
- Add Google Play Billing or another payment provider.
- Change the fallback price, trial length, or free-tier limits shipped in the app.
- Introduce multi-store accounts or role switching.

### Never

- Assign owner or Bantay solely because authentication succeeded.
- Put a paywall before a user sees the product’s value.
- Charge Bantay attendants per seat or per device.
- Delete or hide existing price data because a trial ended.
- fabricate adoption, savings, testimonial, or pricing claims.

## Success criteria

- A fresh install shows the three-scene introduction before sign in.
- Skip and completion both prevent the introduction from appearing again on that installation.
- A newly authenticated account has no role and no store document until activation is completed.
- “Set up my store” creates owner membership only after explicit confirmation.
- “Join a family store” leaves the account unassigned until a store owner links it.
- Existing accounts retain their current role and bypass activation.
- Onboarding is completable in under 30 seconds and activation requires no more than one decision plus one store-name field or one pairing action.
- All new routing and state behaviors have automated tests; tests, type check, and lint pass.
- The UI meets 48dp touch targets, works with system Back and large text, supports light/dark themes, and does not rely on animation or color alone.

## Open questions for approval

1. Approve the two intent choices and the rule that accounts stay unassigned until activation?
2. Approve the launch pricing hypothesis and remote configuration contract: Starter free, Family ₱99/month or ₱999/year, 30-day no-card trial?
3. Should trial entitlement fields be implemented now, or should this first release show no pricing until interviews validate it?
4. Is the first-install-only introduction correct, with a replay option added later under Profile > Help?
