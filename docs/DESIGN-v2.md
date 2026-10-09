---
name: Супер-Апп — Линейка (V2)
description: A regional marketplace using building-mixture packaging grammar, with a distinct ink, cover and typographic voice for each store.
colors:
  paper: "#FFFFFF"
  well: "#F4F4F2"
  ink: "#111110"
  line: "#D6D6D1"
  brand: "#FE5000"
  brand-text: "#B83A00"
  sale: "#FFDD00"
typography:
  body:
    fontFamily: "Sofia Sans"
  display:
    fontFamily: "Sofia Sans Extra Condensed"
    fontWeight: 900
  modern:
    fontFamily: "Unbounded"
  classic:
    fontFamily: "Prata"
---

# Супер-Апп — «Линейка»

V2 uses the grammar of construction-mixture packaging: square panels, ruled product cells, large prices and a store-coloured spine. The app is Russian-language and mobile first. The desktop stage places the same phone experience beside a wordmark and a QR code of the current page.

V1 is preserved separately in `main` at `76dc1b8`; its design is documented in [DESIGN-v1.md](DESIGN-v1.md). Each published version has its own origin and browser storage.

## Colour

The light neutral ramp is `#FFFFFF`, `#F4F4F2`, `#E9E9E6`, `#D6D6D1`, `#ADADA7`, `#6B6B66`, `#4A4A46`, `#333331`, `#1F1F1D`, `#111110`. Dark mode reverses the roles with its own ramp, from `#121211` to `#F6F6F2`.

Orange 021 (`#FE5000`, dark `#FF6526`) identifies the next primary action and carries black labels. Orange text uses the separate accessible token (`#B83A00`, dark `#FF8A57`). Sale stickers are yellow (`#FFDD00`) with black copy. Store inks and section inks identify content; they do not replace the app's action colour.

All reusable UI colours read `--r-*` tokens from `src/app/styles/range/tokens.css`. Legacy `--mk-*` aliases keep existing screens in the same palette. Store pages derive `--sf-*` from the saved theme with contrast-aware foregrounds and theme-aware tinted grounds.

## Type and shape

Self-hosted Sofia Sans supplies body text; Sofia Sans Extra Condensed supplies prices, numerals, store names and section headings. Modern store pages use Unbounded; classic pages use Prata. The font licence ships in `public/fonts/OFL.txt`.

Panels, controls, inputs, chips and product cells have square corners. Avatars, story rings and switches may be circular. A 45-degree chamfer belongs to stickers and the brand plate. Separation uses neutral hairlines and 2px ink rules. Decorative gradients, glass and content drop shadows are retired.

## Product and store identity

Every product unit shares `src/app/ui/product-cell.ts`. The order is photo, price, title, store spine. Cart and favourites group goods by store and carry that store's ink into the group header. Product detail leads to the same store page as home promos and catalogue store rows.

Storefronts resolve a required skeleton with optional blocks. A store's theme defines ink, ground (`stock`, `tint`, `black`), voice (`industrial`, `modern`, `classic`) and cover (`field`, `split`, `full`). The admin edits theme, ordered blocks and per-store filters. Invalid saved fields are repaired by the shared resolver.

Demo storefronts: Постройка uses an industrial yellow field; Кухни Дриада uses a dark ground and a modern voice; Любимый Дом uses a classic voice. Authored sample content is labelled as an example. Facets only appear when they can narrow the actual store catalogue. Calculator quantities use the selected product's mix specification with 10% reserve.

## Motion and interaction

Opening a store from a spine expands the source ink to the store cover over 420ms and dissolves the layer over 180ms. Reduced-motion users receive a direct opening. Store URLs use `#store=` and preserve browser back navigation. Controls have visible keyboard focus, and filter sheets return focus to their opener.

First launch ends with two consent checkboxes and a project agreement sheet; acceptance is stored on the device. Orders and payment terms direct buyers to the store manager; the prototype does not process payments.

## Implementation and verification

The final CSS layer is `src/app/styles/range/`, loaded after the legacy layers. New renderers use `html` templates and `data-action` handlers. Entity and storage definitions remain shared between buyer and admin.

Validation covers TypeScript, unit logic, production builds and Chrome browser flows. Mobile and desktop evidence is stored in `.impeccable/review/stakeholder/`. Hosting and the final check results are recorded in `docs/STAKEHOLDER.md`.
