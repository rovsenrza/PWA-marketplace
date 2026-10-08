---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: []
---

# Surface: buyer app (index.html)

Scope: whole buyer PWA — Главная, Каталог and all subviews, витрины магазинов, карточка товара, Корзина, Избранное, Профиль, first launch. Mode: Operate. Users: regional buyers comparing goods and stores on a phone; second audience: store owners being shown the prototype ("this is your storefront"). Constraint: every current function keeps working. Brand name: Супер-Апп. Quality bar from the customer's spec: Avito / WB / Ozon grade conventions, but its own look (October 2026 feedback: the previous restyle read as "our template with new fonts").

Redesign (replacement world, 2026-10-08). The Ozon-clone look (white cards on cool grey, one blue, magenta sale) and the Liquid Glass layer are retired; the old look is evidence, not authority.

Storefront strategy: one skeleton the spec requires for every store (about, facades with addresses, map, hours, managers with phone/e-mail/MAX/TG, payment and delivery, services, own catalogue with its own filters), plus a block set and a theme per store type (строительные смеси, кухни, мебель и аксессуары, general). Each store owns one ink, a voice (type), a ground and a cover style; the admin edits them. Demo stores: Постройка (смеси), Кухни Дриада (кухни), Любимый Дом (мебель).

Unresolved: the spec's missing appendix (filter example); hosting account; whether stores may edit blocks themselves (customer: "в будущем").

## Direction contract

THESIS: Every store in the region is one product in a single range. The app speaks the grammar of building-mixture packaging: a fixed panel system, one ink per store and per section, giant numerals for price and quantity, pictogram rows for services, technical tables for specs. A buyer reads a screen like a bag on a pallet: what, how much, from whom. Refuses the Ozon clone (floating white cards on grey, one blue) and its predictable opposite, dark glass.

OWN-WORLD: White stock and process black. Signature ink Orange 021 (#FE5000) with black labels for the next action; a yellow promo sticker for sale; a fixed set of family inks for sections and stores. Neutrals snap to a numbered ten-step ramp (raise from the exposure record: no ad-hoc greys). Sofia Sans Extra Condensed 800–900 caps for numerals, codes and names, Sofia Sans for text, set in fixed integer steps (raise from the bitmap specimen). Square panels; one 45° chamfer on stickers, tags and the brand plate; every graphic device at 45° or 90° only (raise from the transit diagram). Grids are shared-rule cells that reflow by whole cells, never floating cards with gaps (raise from the Crouwel grid). Each store has a spine — its ink band and name — carried into every product cell, story ring, cart and favourites group, and a cover — its storefront (raises from the j-card and the character roster: one ribbon ink per member of a finite roster, the same plate in the same place everywhere).

STORY: The buyer recognises stores by colour before reading names, compares prices set like weight blocks, opens a store and lands in that store's own branded pack (its ink, type voice and blocks), filters its catalogue by that trade's own filters, collects goods from several stores, and sends each store's list to a named manager.

FIRST VIEWPORT: Home at 390×844. A white 56px top row: wordmark as a pack label (СУПЕР in ink ExtraCond 900 caps, АПП knocked out of an orange chamfered plate), three 44px icon keys right. A 48px search field framed in 2px ink, square, with a black square filter key. Stories: 64px circles ringed in each store's own ink (viewed: thin grey). The hero pack slider, full-bleed: left half the store's ink field with its name at 40px ExtraCond caps, one line, a «В витрину» key; right half the photo; index 01/03. Then family-ink section tiles (half colour field with pictogram, half photo), then the shared-rule product grid: photo, 28px price, two-line title, the store spine at the cell foot. Tab bar: solid white, 2px ink top rule, active item marked by an orange block.

FORM: Building-mixture packaging grammar, position 3 on the ordered list of seven grounded candidates; code-led (no image generation). Seed key 82a8d4a4. Signature interaction: spine to cover — tapping any store spine grows its ink band into the storefront's cover.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
