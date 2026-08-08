# Bantay — Confirmed Product Intent

Status: Confirmed by the project owner on August 7, 2026.

## Outcome

Bantay will become the dependable digital memory of the family's sari-sari store. A family member should be able to scan a known product and see the selling price set by the store owner within about two seconds.

## User

Each store has one owner/admin. In the first deployment, this is Mama. The owner controls product registration and selling prices.

Trusted family members act as store attendants, or *bantay*. They can scan or search for products and check prices without changing owner-controlled data.

## Why Now

When Mama is unavailable, whoever is watching the store should not need to guess a price, search for a written list, or contact her while a customer waits.

## Success

- A trusted family member can scan a known product and confidently give the correct price within about two seconds.
- Previously saved products and prices remain available when the internet is unreliable.
- Scanning and searching are read-only and never record a sale or change inventory.
- The family no longer depends on Mama being physically present to answer routine price questions.

## Binding Constraints

- The first release is an Android mobile app for the phones the family already uses.
- The app will be built with React Native and Expo SDK 56.
- Multiple family members can use their own phones against one shared store catalog.
- Store data synchronizes through the cloud while known product information remains accessible offline.
- One owner/admin retains control over products and prices.
- Price lookup must remain the fastest and most prominent experience.

## Core Product Boundary

The MVP lookup flow is:

**Scan → View price**

Product search and manual barcode entry provide fallbacks when scanning is unavailable. Bantay only stores and identifies prices in this release.

## Out of Scope for the MVP

- Shopping carts or multi-item checkout
- Sales recording and sales history
- Stock and inventory tracking
- Purchase-cost tracking
- Payment processing
- Cash tendered and change calculation
- Full point-of-sale functionality
- iPhone and web applications
- Features needed only for commercial-scale rollout

## Product Direction

The first deployment should solve the family's real store problem through daily use. If it proves dependable there, Bantay can later evolve into a commercial product for other sari-sari stores across the Philippines.

The clearest promise remains:

> Kahit sino ang magbantay, alam ang presyo.
