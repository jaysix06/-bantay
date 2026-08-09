---
name: Bantay
description: Scan it. Know the price.
colors:
  bantay-gold: "hsl(35, 100%, 71%)"
  bantay-cream: "hsl(35, 100%, 90%)"
  bantay-accent: "hsl(35, 100%, 85%)"
  daylight: "#ffffff"
  warm-ink: "hsl(24, 65%, 15%)"
  night: "hsl(35, 40%, 5%)"
  night-surface: "hsl(35, 40%, 8%)"
  night-ink: "hsl(35, 100%, 95%)"
  light-border: "hsl(35, 40%, 85%)"
  night-border: "hsl(35, 30%, 20%)"
typography:
  display:
    fontFamily: "Montserrat, sans-serif"
    fontSize: "48sp"
    fontWeight: 800
    lineHeight: 1
  headline:
    fontFamily: "Montserrat, sans-serif"
    fontSize: "28sp"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Montserrat, sans-serif"
    fontSize: "16sp"
    fontWeight: 500
    lineHeight: 1.5
  label:
    fontFamily: "Montserrat, sans-serif"
    fontSize: "14sp"
    fontWeight: 700
    lineHeight: 1.25
rounded:
  control: "12dp"
  surface: "16dp"
  price-label: "24dp"
spacing:
  xs: "4dp"
  sm: "8dp"
  md: "16dp"
  lg: "24dp"
  xl: "32dp"
components:
  button-primary:
    backgroundColor: "{colors.bantay-gold}"
    textColor: "{colors.warm-ink}"
    rounded: "{rounded.control}"
    height: "56dp"
  price-label:
    backgroundColor: "{colors.bantay-cream}"
    textColor: "{colors.warm-ink}"
    rounded: "{rounded.price-label}"
    padding: "24dp"
---

# Design System: Bantay

<!--
THESIS: The correct price should feel as unmistakable as a freshly written shelf label; refuse generic inventory dashboards and card grids.
OWN-WORLD: Warm orange, cream, and dark brown form one high-contrast label system, expressed through Material 3 controls and Montserrat.
STORY: A family member scans or searches, recognizes the product, and reads the owner-set price with confidence.
FIRST VIEWPORT: The scanner owns the canvas; its centered reticle and one lower action panel make the next action obvious.
FORM: Living Price Label, third grounded direction, staged as one full-scale active product surface; seed 712841fb.
-->

## Overview

**Creative North Star: “The Living Price Label.”**

Bantay turns the humble store price label into a dependable digital instrument. The interface is warm and familiar, but working screens remain disciplined: one product, one price, one next action. The puppy supplies companionship only when guidance is useful.

**Key characteristics:** price-first hierarchy, calm native structure, generous touch targets, restrained mascot use, and equal craft in light and dark modes.

## Colors

Orange signals primary action and recognition. Cream supplies warmth in light mode; deep warm brown surfaces carry dark mode without losing the brand.

**The Price Contrast Rule.** The selling price always meets strong contrast and never sits over photography or camera imagery.

Light and dark themes use semantic roles. Raw palette values must not be selected inside screen components.

## Typography

**Display and UI Font:** Montserrat with the system sans-serif fallback.

Montserrat’s sturdy geometry makes prices, product names, and controls readable under hurried store conditions. Material type roles govern scale; display weight is reserved for the selling price.

- **Display:** the selling price only.
- **Headline:** screen and product titles.
- **Body:** descriptions, timestamps, and product metadata.
- **Label:** buttons, fields, status, and compact navigation.

## Layout

The camera or search surface owns the screen. Results use a single dominant price label followed by plain metadata rows and focused actions. Spacing follows a 4dp base rhythm, respects system insets, and keeps primary actions reachable with one hand. Compact Android widths use a navigation bar; expanded widths adapt to a navigation rail and centered working pane.

## Elevation & Depth

Depth is primarily tonal. Shadows are reserved for the active price label or a floating primary action and remain soft; routine sections stay flat.

## Shapes

Controls use 12dp corners, supporting surfaces use 16dp, and the signature price label uses 24dp with a subtle tag-notch detail. Do not apply the largest radius to every container.

## Components

### Buttons

Primary buttons are 56dp tall, gold, dark-ink, and semibold. Pressed state deepens tonally and scales only subtly. Secondary actions use tonal or outlined Material treatments.

### Price Label

The branded puppy header introduces a full gold merchandise-tag silhouette. Brand, product name, and package size anchor the top; the price dominates the center; and a contrasting barcode/source strip plus timestamp closes the label. Plain scan and search rows follow beneath it. The composition must remain equivalent in light and dark themes and never become decorative chrome around unrelated content.

### Inputs

Search and product fields use filled tonal surfaces, visible labels, 48dp minimum touch height, clear focus treatment, and text—not color alone—for errors.

### Navigation

Use Material 3 navigation patterns, Android system Back, edge-to-edge insets, and role-appropriate destinations. Scan remains the default destination for bantay accounts.

## Do's and Don'ts

### Do:

- **Do** make the price the first readable fact after a successful lookup.
- **Do** preserve the same hierarchy and contrast in both themes.
- **Do** use the puppy for onboarding, guidance, and empty states.
- **Do** keep scanning and searching read-only.

### Don't:

- **Don't** create dashboard-card mosaics.
- **Don't** place routine UI over decorative gradients.
- **Don't** use forced Tagalog or Taglish labels.
- **Don't** introduce sales, inventory, payment, or checkout controls.
