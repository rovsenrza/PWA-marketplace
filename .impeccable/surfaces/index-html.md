---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: []
---

# Surface: buyer app (index.html)

Scope: whole buyer PWA — Главная, Каталог/справочник and all subviews, витрины магазинов, карточка товара, Корзина, Избранное, Профиль, onboarding. Mode: Operate. Users: regional buyers comparing products and stores on a phone. Constraint: restyle in place, every function keeps working. Brand name: Супер-Апп. Reference pinned by the user: Ozon (canon taken at full fidelity), WB secondary.

## Direction contract

THESIS: A serious regional marketplace on a phone. Products, prices and stores carry the screen; chrome stays quiet. Refuses the old dark sapphire glass, glowing edges and decorative gradients.

OWN-WORLD: Light. Cool off-white page (#F2F3F7-ish) with white cards on it, no borders, a soft shadow only on raised sheets. One saturated marketplace blue for actions and selection; a warm magenta-red only for discount and "new" badges; prices in heavy near-black. Onest typeface (Cyrillic-native workhorse), weights 400/500/700/800. Radii 12/16/20, pills for chips. Icons: existing stroke SVGs at 1.75 stroke.

STORY: The buyer sees stories, a search bar and a dense 2-column product grid within the first screen; taps a store to see a real place (photos, address, manager); collects items across stores; contacts each manager from the cart.

FIRST VIEWPORT: White top bar with the app name and bell; a large rounded search field with filter button full-width; stories row; one promo banner; then the product grid begins with price-first cards. Bottom tab bar white with blue active state and cart count badge.

FORM: Ozon-grade marketplace canon (user-pinned; overrides roll candidate 3). Seed key 48a3654f.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance


## Revision 2026-10-05 — stakeholder reference "MarketSpace"

The stakeholder supplied a new reference: a deep-navy dark UI with iOS 26 Liquid Glass on the control layer. It supersedes the line in THESIS that rejected dark glass, but only for the chrome. Content stays solid and price-first.

- Themes: light (unchanged canon) and dark (#0A0F1C ground, #131B2E cards, #3A70FF brand). Follows the system; it can be pinned in Профиль or with the header toggle. The key `ui-theme` is shared with the admin.
- Glass: floating capsule tab bar with an active lens, glass header buttons, glass search, glass buttons over photos, glass product bottom bar. Refraction runs in Chromium only.
- Home: two-tone wordmark with the tagline «Больше, чем покупки», category tiles, full-bleed promo with a white pill CTA, a horizontal rail of recommendations. The name stays Супер-Апп. No invented ratings: the rail shows category and store instead of stars.
