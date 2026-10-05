# Architecture

## Starting point and goal

The prototype was a single `index.html` of 2.2 MB: 1.7 MB of inline JS (~770 global functions), 186 KB of CSS,
1 MB of base64 banners, and Tailwind as a 400 KB compiler running in the browser. The app and the admin kept
**different** starting data, so the admin saw 6 products out of 67.

The goal is a structure that grows by modules and makes it possible to swap localStorage for an API
without rewriting screens. We get there in stages; **every screen works at every stage** (Playwright checks this).

## Layers

```
┌───────────────────────── pages: index.html / admin.html (markup, inline onclick) ─────────────────────────┐
│ src/app/features/*.ts          new code: TypeScript modules, typed                                        │
│ src/admin/features/*.ts        admin modules (the import wizard)                                          │
│ src/app/legacy/*.js            prototype code: classic scripts, global functions                          │
├──────────────────────────────── bridge: src/shared/legacy/globals.d.ts ───────────────────────────────────┤
│ src/shared/domain              entity types (Product, Shop, Story, CartItem, StoreOrder…)                 │
│ src/shared/data, orders, …     stores, repositories, business rules (pure functions + tests)              │
│ src/shared/import              1C / Excel / CommerceML import: read, map, plan, photos                    │
│ src/shared/storage             storage key registry + safe access                                         │
│ src/shared/legacy/seed.js      one set of starting data for app and admin                                 │
└──────────────────────────────────────────── localStorage (→ API later) ───────────────────────────────────┘
```

### Load order (it matters)

1. `<head>`: `theme-bootstrap.js` sets the theme before the first paint (no light flash in dark mode).
2. Start of `<body>`: `image-fallback.js` catches broken images before they render.
3. Classic scripts stay where the inline blocks used to be: `promo-slider`, `home-banner`, then
   `seed.js` → `core/*.js` (25 domains + `boot.js`) → `assistant.js` → `features/*.js` (5 domains + `boot.js`) → `pwa-install.js`.
   Domain files hold only declarations; everything that runs at load time sits in that group's `boot.js`,
   which comes last. So the order of the domain files doesn't matter, and the build joins each group into
   one file (`app-core`, `app-features`) without changing behaviour.
4. `src/app/main.ts` (module, deferred) loads styles and starts the features once all the legacy code has run.

Legacy scripts stay **classic** on purpose: their top-level functions are called from the markup's inline
`onclick` handlers, and modules would hide them. The `legacy-scripts` plugin in `vite.config.ts` serves them
as-is in dev; in the build it collapses whitespace without renaming identifiers and hashes the file names.

### Styles

`main.ts` connects the layers in the prototype's cascade order:
`base.css` (original screens) → `market.css` (`--mk-*` tokens, Tailwind class mapping) → `glass.css`
(light and dark themes, Liquid Glass) → `motion.css` (gestures, sheet) → `tailwind.css` (compiled at build time).
Tailwind comes last because the Play CDN used to inject its CSS after the inline styles. A check on 23 screens
found no class from the old runtime missing from the build.

### Data

- `seed.js` is the only source of starting data. `SEED.products()` and friends return a fresh copy each time.
- The app and the admin overlay localStorage on the seed through the same `CatalogStore` (below).
- Every storage key is listed in `src/shared/storage/keys.ts`. New code reads and writes only through
  `local-store.ts`: it doesn't crash in private mode and can subscribe to changes from other tabs.

### PWA

`src/sw/sw.js` is a template. The build fills in the build id and the list of hashed files: `assets/*` are
cache-first, pages network-first with an offline fallback, the rest stale-while-revalidate. A new deploy means
a new cache name, and the old cache is deleted on activation.

### Bridges between modules and legacy code

- **`exposeToLegacy`** (`src/shared/legacy/expose.ts`, list in `src/app/legacy-bridge.ts`): a module
  publishes functions and constants that the markup and the remaining classic scripts call by name.
  Condition: nobody calls them while the page is parsing (modules run later, but before
  `DOMContentLoaded` and `window.onload`). Collisions produce a console warning.
- **Events** (`src/shared/events.ts`): domains notify each other with `app:*` CustomEvents on `document`
  instead of overwriting each other's functions. `app:cart-changed` comes from `refreshCartSurfaces`
  (every cart mutation), `app:favorites-changed` from `toggleFavorite`.

### Data: stores and repositories

- **Catalogue** (`shared/data/catalog*.ts`): products, stores, stories, promo, directory, vacancies,
  onboarding, showcase requests, lifehacks. One `CatalogStore` per page (app and admin) with **one set of
  merge rules** «saved wins, seed fills the gaps» (`catalog.ts`, unit tests) and a `CatalogRepository`
  (localStorage over the old keys). Each part is saved independently; after saving there's the
  `meb_updated` stamp, from which the open admin tab reloads the data.
- **Seed** (`shared/legacy/seed.js`): all starting data in one place. That's also the initial database
  content for a server.
- **Cart and orders** (`CartStore`), **favourites** (`FavoritesStore`), **profile** (`BuyerStore`):
  the same pattern, each with its own repository.
- **Import** (`shared/import/`, pure TypeScript with tests): files → table (CSV in UTF-8 or Windows-1251,
  Excel through SheetJS, CommerceML from 1C, a zipped export) → column mapping → drafts with errors →
  a plan against the catalogue (by article within the store: only price and stock change; barcode twins in
  other stores) → photos matched by article or by the path from the file → the catalogue after the import.
  `ImportRepository` remembers the mapping per store and file layout and keeps the history
  (`meb_import_mappings`, `meb_imports`). The admin's wizard is `admin/features/import/`.
- **All or nothing:** `CatalogStore.save(parts, { strict: true })` never falls back to saving without photos:
  if the import doesn't fit the browser's storage, the stored catalogue stays as it was and the admin is told
  why. The ordinary save still falls back, and a published product that loses its only photo that way goes
  to drafts, so buyers never see an empty card.
- **Legacy access:** the old globals (`productsDb`, `storiesData`, `state.cart`, `buyerProfile`, …) are
  accessors onto the stores. Catalogue ones return the live object (legacy mutates it in place); none of them
  is declared with `let` in legacy any more.

### Already ported to modules

| Was (legacy) | Now | Tests |
|---|---|---|
| `core/format.js`: prices, badges | `shared/format/price.ts`, `app/ui/product-badges.ts` | unit + e2e |
| store order rules from `core/cart.js` (statuses, recalculation, SLA, total) | `shared/orders/store-order.ts` | unit (all transitions) + e2e checkout |
| favourites screen and «Отправить менеджеру»: `core/favorites.js` (deleted) | `shared/catalog/favorites.ts` (groups, message), `app/features/favorites/render.ts` | unit + e2e (injection, Telegram link, clicks) |
| cart, «Мои заказы» and store-order rendering: `core/cart.js` (deleted) | `app/features/cart/render.ts` through `html`…``, buttons through `data-action` (`ui-actions.ts`) | unit (`html`, order selection) + e2e (markup injection, real clicks) |
| catalogue data layer: `persistence.js` (`saveAllData`/`loadAllData`) and admin `data.js` (deleted) | `shared/data/catalog.ts`, `catalog-repository.ts`, `catalog-store.ts`; app `app/data/catalog.ts`, admin `admin/main.ts` | unit (merging, per-part saving, quota) + e2e (admin edit in the app, live sync) |
| uploads in the in-app CRM and the lifehack editor (7 `FileReader` handlers) | `shared/media/` (MediaStore, compression), `app/features/media.ts`; retry saving without photos in `catalog-repository.ts` | unit (sizes, embedded-file removal, saving without photos) + e2e (4000×3000 photo → 1600 px, after reload; video refusal) |
| sign-in and registration `core/auth.js` (deleted), demo logins from `core/data.js` | `shared/auth/` (AuthService, Session, validation, **DemoAuthService**), `app/features/auth/auth-ui.ts` | unit (mask, rules, demo roles) + e2e (dashboards by role, sign-out, password button) |
| buyer profile `core/buyer.js` (entire file) | `app/features/buyer/` (BuyerStore + card and editor), `BuyerRepository` | unit + e2e (editor, reload, registration through auth.js) |
| order actions `so*` from `core/cart.js`: store answers, new price, invoice, payment, cancel, return to cart | `shared/orders/store-order-actions.ts` (rules + guards), `app/features/orders/actions.ts` | unit (every transition and refusal) + e2e (full cycle) |
| favourites from `core/favorites.js`: state, toggle, clear, remove a store | `shared/catalog/favorites.ts`, `app/features/favorites/` (store + actions, one `commit()` for every change) | unit + e2e (reload, hearts after «очистить» and «убрать магазин») |
| cart state and operations, checkout, cart and order storage from `core/cart.js` | `shared/orders/cart.ts`, `shared/orders/checkout.ts`, `shared/data/repositories.ts`, `app/features/cart/` (CartStore + actions) | unit (operations, checkout, store with an in-memory repository) + e2e (reload, lifehack estimate) |
| function overwriting in `features/boot.js` | events `app:cart-changed` / `app:favorites-changed` | e2e |
| motion, swipe to delete, notifications, tab lens, SW registration | `app/features/*` | e2e |
| admin import mock-up (`IMP_*`, `IMPORT_STEPS`, invented numbers and history) | `shared/import/` (reading, mapping, plan, photos, zip, memory), `admin/features/import/` (wizard), strict save in `catalog-repository.ts` | unit (1C CSV, Excel, CommerceML 2.05/2.08, zip with CP866 names, plan, photos, memory, strict save) + e2e (1C file → run, re-import, refusal when it doesn't fit, CommerceML zip with photos, injection) |

### Rendering and buttons

- **`html`…``** (`shared/ui/html.ts`): a template that escapes every interpolation by default. Only the
  result of another `html`…`` or an explicit `raw()` (for the code's own markup: icons, constants)
  goes in unescaped. New renderers write only this way.
- **`data-action`** (`shared/ui/actions.ts`): a button carries `data-action="name"` and `data-*`
  parameters; one delegated listener calls the registered handler. No `onclick="fn('…')"`: data
  doesn't pass through JavaScript strings in attributes.

### Sign-in

`AuthService` (`shared/auth/types.ts`): `signIn`, `register`, `signOut`, `current`, `onChange`; the session
carries the role (`buyer` · `store` · `agency` · `admin`) and, for a store, `storeId`. Today the implementation
is **`DemoAuthService`**, the prototype's behaviour **without any password checks** (see the file header).
It can't be protected in the browser; a server implementation replaces it (that's the server decision).
Screens see only the interface; the legacy `state.userRole` / `state.currentShop` are synced from the session.

### Files (photos and video)

`MediaStore.upload(file, purpose)` (`shared/media/types.ts`): editors know only it. Without a server it's
`LocalMediaStore`: photos are compressed on the device (to 512–1920 px depending on purpose, JPEG/WebP),
the result is embedded in the data as a data: URL; videos only up to 2.5 MB. If a part with photos doesn't fit
the browser's storage, the repository saves it without the embedded photos (the edits are kept, the user is
warned). With a server, an implementation that puts the file in object storage and returns a URL.

## Rules for new code

1. New features are written in **TypeScript** in `src/app/features/<feature>/` (the admin's in
   `src/admin/features/<feature>/`), with an `initX()` called from that page's `main.ts`.
2. A legacy dependency is first declared in `src/shared/legacy/globals.d.ts`, so the list of what is left
   to port stays visible.
3. If the markup needs a function from a module, it goes on `window` explicitly in the module (as with
   `openNotifications`) and is declared in `globals.d.ts`.
4. Storage only through `StorageKeys` + `local-store.ts`. Entity types only from `shared/domain/types.ts`.
5. Rendering through `html`…``, buttons through `data-action`. No `innerHTML = '…' + data`,
   no new inline `onclick`. When editing legacy code: data into HTML only through `escHtml(…)`, into
   a JS string inside an attribute through `escJsArg(…)`. The XSS sweep checks this.
6. Colours only through tokens (`--mk-*` in the app, plain names in `admin.css`). Never a raw colour that
   could appear in both themes.
7. Business rules are pure functions in `src/shared/<domain>/` with unit tests (`tests/unit`, Vitest);
   screen behaviour is covered by browser tests (`tests/e2e`, Playwright). `npm test` runs both.
8. Domains don't overwrite each other's functions: notify through `src/shared/events.ts`.

## Roadmap

**Stage 1 — done.** Vite + TypeScript + compiled Tailwind; CSS and JS moved out of the HTML; dead files
(~16 MB) removed; one seed for app and admin; storage key registry; typed motion, gesture and notification
modules; service worker built from the real output; Playwright tests.

**Stage 2a — done.** `app-core.js` (540 KB) and `app-features.js` (100 KB) are split by domain into
`src/app/legacy/core/` and `src/app/legacy/features/`, with acorn checking that every statement is kept.
Three unreachable duplicate functions removed. Tests cover every directory section, the calculators,
the deeper screens and the in-app CRM.

**Stage 2b — the purchase flow is done.** Ported to modules: prices and badges, the cart and checkout,
store orders and their actions, favourites, the buyer profile, sign-in, uploads (see the table above);
`core/cart.js`, `favorites.js`, `buyer.js`, `auth.js`, `persistence.js` (save/load) and admin `data.js`
are deleted. The remaining screens are the parallel track below.

**Stage 3 — done.** All persisted data behind repositories: the catalogue (one set of merge rules for the
app and the admin, per-part saving), cart and orders, favourites, the profile, lifehack reactions (device
state and community totals separately). Sign-in behind `AuthService`, files behind `MediaStore`. The app
starts at `DOMContentLoaded`. Browser tests are hermetic (no internet).

**Import from 1C / Excel — done for the browser (decided: in the first release).** The admin reads a real
file, maps columns (remembered per store), shows the report (updates, new products, barcode twins, rows with
errors and why), attaches photos and applies the import to the catalogue. Measured: 10,000 products without
photos take about 3.7 of the browser's ~5 million characters and every step takes under a second; photos are
the limit (compressed to 800 px and ≤ 50 KB, a few dozen fit). The server runs the same `shared/import`
as a background job and stores photos in object storage.

**Stage 4 — backend: waiting for a decision.** What the server must provide, the constraints (personal data
of Russian users must be stored in Russia), the options and the recommendation: [`BACKEND.md`](BACKEND.md).
Each phase is a new implementation behind an interface that already exists.

**In parallel, independent of the server:** porting the remaining screens from `legacy/` to modules (the product
page, the store showcase, the directory, lifehacks, the CRM), replacing inline `onclick` with `data-action`.

**Escaping — closed and guarded.** Every renderer of the buyer app escapes data: modules through
`html`…``, legacy code through the `escHtml` / `escJsArg` globals (the latter for values inside
`onclick="fn('…')"`). The admin panel escapes too. Two sweeps in `tests/e2e/xss-sweep.spec.ts` and
`admin-xss.spec.ts` put a payload into every string field of every entity and visit every screen, every
admin page and editor; a renderer that inserts data unescaped fails the test.

**Separately:** compress `public/pc-arts` (7.4 MB of PNG) and `public/icons` (2.4 MB) to WebP/AVIF at the
right sizes; replace the 30 dead Unsplash photo links with real product photos.
