# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Users

Bantay serves a sari-sari store owner and the trusted family members who watch the store when the owner is unavailable.

Each store has one owner/admin. The owner registers products, sets and updates prices, and invites trusted bantay accounts. Bantay users scan or search for products and confidently answer customers without changing owner-controlled prices.

The first deployment is the project owner's family store. The product may expand to other sari-sari stores only after the family workflow proves dependable in daily use.

## Product Purpose

Bantay is the digital memory of the sari-sari store. It lets any trusted family member scan a known product and see the correct owner-set price within about two seconds, without guessing, searching a written list, or contacting the owner while a customer waits.

Price lookup is read-only and consequence-free. Success means the family can answer routine price questions confidently even when the owner is away and the internet is unreliable.

## Positioning

Bantay is not an inventory dashboard or a point-of-sale system. Its distinctive promise is owner-set price memory for the person currently watching a sari-sari store:

> Kahit sino ang magbantay, alam ang presyo.

## Operating Context

- Several family members use their own Android phones against one shared store catalog.
- Store data synchronizes through the cloud; previously saved products and prices remain available offline.
- The primary flow is **Scan → View price**.
- Known barcodes resolve from Bantay's own database first.
- Unknown barcodes fall back to Open Food Facts for general product details, then require the owner to enter the store's selling price.
- Successful Open Food Facts responses are cached in a shared Firestore catalog even when the user does not save a store price, so later scans can avoid another external request.
- If external lookup fails or the internet is unavailable, the user can register the product manually or enter its barcode manually.
- Product search provides a fallback when a barcode cannot be scanned.

## Capabilities and Constraints

- React Native with Expo SDK 56, targeting Android first.
- One owner account invites trusted bantay accounts into the same store.
- Barcode scanning, manual barcode entry, instant price lookup, product registration, product search, and owner price editing.
- Local-first lookup and offline access for previously saved products.
- Cloud synchronization across family devices.
- Barcode values uniquely identify product/package-size records and must not create duplicates.
- Imported general product data remains separate from the store-specific selling price.
- Firestore catalog documents retain the complete bounded Open Food Facts payload requested by Bantay, its provenance, and fetch timestamp.
- External data never overwrites owner-entered prices or other store-specific values.
- Price-update timestamps and imported-data provenance are retained.
- Sales recording, stock and inventory tracking, purchase cost, carts, payment processing, cash/change calculation, full POS behavior, iPhone, web, and commercial-scale features are outside the MVP.

## Brand Commitments

- The product name is **Bantay**.
- Voice is friendly, helpful, playful, dependable, familiar, Filipino, and never overly corporate.
- Interface language is clear, natural English. Avoid forced Tagalog or Taglish interface terms.
- The established mascot is a friendly cream-and-tan cartoon puppy representing watchfulness, loyalty, and companionship.
- The supplied warm orange-and-cream palette and Montserrat interface typeface are binding identity inputs for later design work.
- The English product promise is **“Scan it. Know the price.”**

## Evidence on Hand

- Confirmed product intent: `docs/intent/bantay.md`
- Detailed original product brief: `C:/Users/Administrator/.codex/attachments/b11da885-0ce5-443d-af3c-ec084ef1d107/pasted-text.txt`
- Supplied mascot concept: `C:/Users/Administrator/Downloads/ChatGPT Image Aug 7, 2026, 01_48_25 AM.png`
- No testimonials, usage benchmarks, customer counts, pricing evidence, or commercial claims have been established; future work must not fabricate them.

## Product Principles

1. Price lookup comes first and must feel immediate.
2. Scanning and searching are read-only and never create a sale or change inventory.
3. The owner decides store truth; external catalogs only assist with general product details.
4. Unreliable connectivity must not prevent known-product price checking.
5. Daily family-store usefulness comes before commercial breadth.

## Accessibility & Inclusion

- Use plain English labels that are understandable without technical knowledge.
- Support older family members with readable text, strong contrast, generous touch targets, clear feedback, and minimal cognitive load.
- Do not rely on color alone for error, sync, or product states.
- Preserve Android accessibility semantics and accommodate system text scaling.
