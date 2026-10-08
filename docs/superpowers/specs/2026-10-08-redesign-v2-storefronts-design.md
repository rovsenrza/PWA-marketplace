# Redesign v2 and per-store storefronts — design spec

Date: 2026-10-08 · Branch: `redesign-v2` · Status: written while the developer was away (they asked for autonomous, multi-agent work); every decision below is open to correction.

## 1. What the customer said, and what we conclude

The developer showed screenshots of the current build to the three partners. Their answer, condensed:

| # | They said | We conclude |
|---|---|---|
| R1 | Screenshots are not enough; put it on free hosting so it is clickable. | `dist/` is already static with relative paths. Add a one-command deploy and a GitHub Pages workflow; the account to publish under is the developer's decision (§7). |
| R2 | "Only the fonts changed" compared to the template they made, and they do not like that template. They want a full, high-quality design so that they have no questions left. They are not mobile designers. | The October restyle kept their template's structure and only re-tokenised it (Ozon canon + Liquid Glass). Replace the visual world, not polish it: new palette, type, shapes, layouts and components on every screen (§2, §4). |
| R3 | "Maybe not whole pictures; pictures on half of a block." | Split panels become a core pattern: half photo, half colour field with words (promo, section tiles, store cards, storefront covers). |
| R4 | Each storefront should look like that store's own design. Building-mixture, kitchen and furniture/accessories stores differ, so their blocks and filters differ. Later stores will send technical specs and get blocks added or edited. | A storefront engine: one required skeleton + a block set per store type + a theme per store + filters per store, all editable in the admin (§3). |
| R5 | With a convincing prototype they will visit stores now and collect specs, so launch is faster. | The prototype must sell: three fully authored demo storefronts that look clearly different, and an admin designer that changes a storefront live in front of a store owner. |

From the written spec (`docs/тз.docx`), checked against the code:

- The storefront must contain: company info; facade photos with addresses (several for chains); a Google or Yandex map; opening hours; managers with phone, e-mail, MAX and TG; payment and delivery (payment goes through the manager, never the app); services (доставка, сборка, замер); its own catalogue with its own filter. **The admin already edits all of this (9 tabs) but the buyer storefront ignores it** and shows invented staff, hard-coded hours and the same six category tiles for every store. Fixing that is part of R4.
- Filters are per store ("у каждого магазина свой набор фильтров"); today they are per category, in-memory, and unused by the app.
- Stories: viewed stories must stop being highlighted (Instagram behaviour). Not implemented; the new story rings implement it.
- The spec's appendix with the filter example is missing (open question for the customer).

## 2. Visual direction: «Линейка» (the range)

Chosen through the impeccable new-work flow (seed `82a8d4a4`, code-led; contract in `.impeccable/surfaces/index-html.md`).

**Idea.** Every store in the region is one product in a single range. The app speaks the grammar of building-mixture packaging: a fixed panel system, one ink per store and per section, giant numerals for price and quantity, pictogram rows for services, technical tables for specs. A buyer reads a screen like a bag on a pallet: what, how much, from whom.

- **Palette.** White stock and process black. Signature ink Orange 021 `#FE5000` with black labels for the next action. A yellow promo sticker for sale. A fixed set of family inks for sections and stores. Neutrals snap to a numbered ten-step ramp. Dark theme = black stock with the same roles.
- **Type.** Sofia Sans Extra Condensed 800–900 caps for numerals, codes and names; Sofia Sans for text; fixed integer steps. Self-hosted (offline PWA, Russian audience).
- **Shape.** Square panels. One 45° chamfer on stickers, tags and the brand plate. Graphic devices at 45° or 90° only.
- **Grids.** Shared-rule cells that reflow by whole cells, not floating cards with gaps.
- **Store identity.** Each store has a *spine* (its ink band and name) shown in every product cell, story ring, cart group and favourites group, and a *cover* (its storefront).
- **Signature interaction.** Spine to cover: tapping a store's spine grows its ink band into the storefront's cover.
- **Retired.** White cards on cool grey, the single blue, magenta sale, Liquid Glass and the floating capsule tab bar. Motion behaviours (push transitions, sheets, swipe to delete) stay.

## 3. Storefront engine

### 3.1 Data

Added to `src/shared/domain/types.ts` (shops stay keyed by name):

```ts
type StoreKind = 'mixtures' | 'kitchens' | 'furniture' | 'general';
interface StorefrontTheme { ink: string; ground: 'stock' | 'tint' | 'black'; voice: 'industrial' | 'modern' | 'classic'; cover: 'split' | 'full' | 'field' }
interface Storefront { kind: StoreKind; theme: StorefrontTheme; blocks: StorefrontBlock[]; filters: StoreFilterDef[] }
interface StoreFilterDef { key: string; label: string; type: 'chips' | 'range'; unit?: string }
Shop.storefront?: Storefront
Product.attrs?: Record<string, string | number>   // filter values: 'Основа': 'гипс', 'Фасовка, кг': 30 …
```

Blocks (each `{ id, type, on, title? }` plus its own fields):

| Block | Content | Source |
|---|---|---|
| cover | split / full / field hero, title, line, image | storefront |
| services | pictogram row | admin «Услуги» (`shop.services`) |
| categories | the store's own sections | storefront (default: derived from its products) |
| catalog | products + this store's filters + sort | products, `storefront.filters` |
| lookbook | scene photo with numbered pins to products | storefront |
| steps | process (замер → проект → производство → монтаж) | storefront |
| swatches | facades, fabrics, colours | storefront |
| calculator | consumption: area × layer × rate → kg → bags | products' `attrs` |
| promo | split banner with sticker | storefront |
| gallery | showroom photos | `shop.gallery` |
| about | company text | `shop.description` |
| addresses | facades with addresses, map links, hours | admin «Адреса», «Карта», «Часы» |
| managers | named managers with MAX / TG / phone / e-mail | admin «Менеджеры» |
| terms | payment and delivery | admin «Оплата» |

**Required skeleton** (the spec's "единый шаблон"): cover, about, services, catalog, addresses, managers, terms are always present; the admin can reorder them but not delete them. Type blocks (categories, lookbook, steps, swatches, calculator, promo, gallery) are optional.

### 3.2 Presets per store type

`storeKindOf(shop)` uses `storefront.kind`, else the shop category (Кухни → kitchens; Мебель, Товары для дома, Декор, Свет → furniture; Стройматериалы, Отделка, Сухие смеси → mixtures; else general). `resolveStorefront(shop, products)` = saved storefront over the preset, skeleton guaranteed.

| Kind | Default blocks | Filters | Theme |
|---|---|---|---|
| mixtures | cover(field) · services · categories · calculator · catalog · promo · addresses · managers · terms · about | Тип, Основа, Фасовка (кг), Применение, Бренд, Цена | industrial voice, stock ground |
| kitchens | cover(full) · steps · lookbook · swatches · catalog · gallery · services · addresses · managers · terms · about | Планировка, Стиль, Фасады, Длина (м), Цена | modern voice, black ground |
| furniture | cover(split) · categories · lookbook · catalog · promo · services · gallery · addresses · managers · terms · about | Комната, Тип, Материал, Цвет, Ширина (см), Цена | classic voice, tint ground |
| general | cover(split) · catalog · services · gallery · addresses · managers · terms · about | Цена | modern voice, stock ground |

Every goods store gets a resolved storefront, so all 35 change at once. Stores without a saved ink get a stable ink from the family set (hash of the name). Landscape and real-estate stores keep their own screens.

### 3.3 Demo stores (authored in `seed.js`, marked `demo: true`)

- **Постройка** — mixtures. Ink: its yellow plate; industrial voice. 9–10 products (cement, plasters, putty, tile adhesive, primer, self-levelling floor) with `attrs` for the filters and the calculator.
- **Кухни Дриада** — kitchens. Black ground, bronze ink, modern voice. 6–8 kitchens with layout, style, facade and length; lookbook, steps, facade swatches.
- **Любимый Дом** — furniture and accessories. Green ink, tint ground, classic voice. 8–10 items across rooms; lookbook, room categories, promo.

Authored content that a buyer could take for a real claim (services, terms, promo) is example content: the admin shows it as «Пример», and the hand-off lists everything to replace with the store's real data. No invented ratings, reviews or sales figures.

### 3.4 Buyer app

`src/app/features/storefront/`: open (routes every existing entry point to the new storefront, plays spine-to-cover), render (one renderer per block, through `html`…``), theme (CSS variables on the storefront root: ink, on-ink, ground, voice font), filters UI (chip bar + sheet; values and counts from the store's products), lookbook pins, calculator. Pure logic lives in `src/shared/storefront/` with unit tests: kind, presets, resolve, filters, calculator, colour contrast (`onInk`).

### 3.5 Admin

The shop editor gains **«Оформление»** (store type preset, ink with family swatches and a custom hex, ground, voice, cover style, live mini preview) and **«Блоки»** (toggle, reorder, edit fields, add from the library, delete optional blocks); **«Фильтры»** becomes the per-store filter list seeded from the preset. Everything saves into `shop.storefront` through the existing `saveShop` → `DB_save`. The admin restyle beyond these tabs is token-level only (palette, type, radii) in this round.

## 4. Platform restyle scope

Header, search, stories (store-ink rings, viewed state), home promo (split pack slides, real store links), section tiles (half photo / half ink), product cell (one renderer used everywhere), store cards and lists, catalogue root and subviews, category goods page and filter sheet, product page (price block, spec table, store spine, manager actions), cart and favourites (store-ink group headers), profile, notifications sheet, first launch, stories viewer, assistant, tab bar (solid, orange active block). Light and dark themes. The desktop stage around the phone frame.

Out of this round: porting remaining legacy screens to modules beyond what the restyle needs; YouTube Shorts playback in stories; the landscape «План зон» replacement; backend.

## 5. Architecture of the change

- New CSS layer `src/app/styles/range/` loaded last in `main.ts`: `tokens.css` (new tokens; the old `--mk-*` names remapped so untouched rules follow), `fonts.css`, then one file per area (`chrome`, `cells`, `home`, `catalog`, `product`, `cart`, `profile`, `storefront`, `sheets`). `glass.css` leaves the cascade; what it still provides (dark tokens, header layout) moves into the new layer.
- One product cell renderer (`src/app/ui/product-cell.ts`, exposed to legacy) replaces the inline card markup in every legacy renderer.
- Work split for parallel agents by file ownership (see the plan); `index.html` edits are confined to each agent's own regions.

## 6. Testing

`npm test` must stay green: typecheck, Vitest, Playwright. Unit tests for every pure storefront function. E2E: each demo storefront opens from home, catalogue and a product page; its filters narrow the list; the calculator returns bags; admin theme and block changes reach the app after reload; the existing suites still pass (selectors updated where markup changed). Visual check: the baseline screenshot script rerun at 390×844, light and dark.

## 7. Deployment

Static `dist/` on a free host. Prepared: `npm run build`, a GitHub Pages workflow, and a README section with Netlify Drop and Cloudflare Pages steps. Publishing needs the developer's account and is an outward-facing step, so it waits for their go-ahead.

## 8. Risks and open questions

- Direction risk: chosen without the customer's sign-off. Mitigation: the storefront engine and data are independent of the platform look; a re-skin is token- and CSS-level.
- Family inks can look childish if proportions slip; the rule is fixed positions and sizes for every ink field.
- Real store brands are used for demo storefronts; their real data must replace the example content before anyone outside the team sees them as live stores.
- Ask the customer for the spec's appendix (filter example) and whether stores will edit blocks themselves or only through the admin.
