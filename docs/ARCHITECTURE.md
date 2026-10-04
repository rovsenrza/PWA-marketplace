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
│ src/app/features/*.ts          new code: TypeScript modules, typed                                      │
│ src/app/legacy/*.js            prototype code: classic scripts, global functions                       │
├──────────────────────────────── bridge: src/shared/legacy/globals.d.ts ────────────────────────────────┤
│ src/shared/domain              entity types (Product, Shop, Story, CartItem, StoreOrder…)               │
│ src/shared/storage             storage key registry + safe access                                      │
│ src/shared/legacy/seed.js      one set of starting data for app and admin                              │
│ src/shared/legacy/data.js      admin data layer (load/save, cross-tab sync)                            │
└──────────────────────────────────────────── localStorage (→ API later) ───────────────────────────────┘
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
- The app overlays localStorage on the seed (`loadAllData` in `app-core.js`); the admin works through `data.js`.
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

### Data: one store per domain

`CartStore` (`app/features/cart/cart-store.ts`) owns the cart lines and the orders and persists them through
`CartRepository` / `MarketplaceRepository` (`shared/data/repositories.ts`, localStorage implementation over the
old keys `meb_cart`, `meb_marketplace`). For legacy code it installs accessors: `state.cart` and the global
`marketplace` read from and write to the same store, so there are no two copies. A backend means a new
repository implementation; the store and the screens stay as they are.

### Already ported to modules

| Was (legacy) | Now | Tests |
|---|---|---|
| `core/format.js`: prices, badges | `shared/format/price.ts`, `app/ui/product-badges.ts` | unit + e2e |
| store order rules from `core/cart.js` (statuses, recalculation, SLA, total) | `shared/orders/store-order.ts` | unit (all transitions) + e2e checkout |
| cart state and operations, checkout, cart and order storage from `core/cart.js` | `shared/orders/cart.ts`, `shared/orders/checkout.ts`, `shared/data/repositories.ts`, `app/features/cart/` (CartStore + actions) | unit (operations, checkout, store with an in-memory repository) + e2e (reload, lifehack estimate) |
| function overwriting in `features/boot.js` | events `app:cart-changed` / `app:favorites-changed` | e2e |
| motion, swipe to delete, notifications, tab lens, SW registration | `app/features/*` | e2e |

## Rules for new code

1. New features are written in **TypeScript** in `src/app/features/<feature>/`, with an `initX()` called from `main.ts`.
2. A legacy dependency is first declared in `src/shared/legacy/globals.d.ts`, so the list of what is left
   to port stays visible.
3. If the markup needs a function from a module, it goes on `window` explicitly in the module (as with
   `openNotifications`) and is declared in `globals.d.ts`.
4. Storage only through `StorageKeys` + `local-store.ts`. Entity types only from `shared/domain/types.ts`.
5. Colours only through tokens (`--mk-*` in the app, plain names in `admin.css`). Never a raw colour that
   could appear in both themes.
6. Business rules are pure functions in `src/shared/<domain>/` with unit tests (`tests/unit`, Vitest);
   screen behaviour is covered by browser tests (`tests/e2e`, Playwright). `npm test` runs both.
7. Domains don't overwrite each other's functions: notify through `src/shared/events.ts`.

## Roadmap

**Stage 1 — done.** Vite + TypeScript + compiled Tailwind; CSS and JS moved out of the HTML; dead files
(~16 MB) removed; one seed for app and admin; storage key registry; typed motion, gesture and notification
modules; service worker built from the real output; Playwright tests.

**Stage 2a — done.** `app-core.js` (540 KB) and `app-features.js` (100 KB) are split by domain into
`src/app/legacy/core/` and `src/app/legacy/features/`, with acorn checking that every statement is kept.
Three unreachable duplicate functions removed. Tests cover every directory section, the calculators,
the deeper screens and the in-app CRM.

**Stage 2b — in progress.** Domain logic moves into modules through the bridge, one domain at a time,
each with its tests (see the table above). Next: favorites, the product page, the store-side order actions (`so*`). Inline `onclick` handlers (≈550)
become `data-action` + one delegator domain by domain; then the domain's line in `legacy-bridge.ts` goes away.

**Stage 3 — data layer as a repository.** A `CatalogRepository` / `OrdersRepository` interface with a
localStorage implementation over today's keys; screens work only through it. Prices as numbers instead of
'57 240 ₽' strings; data validation on load.

**Stage 4 — backend.** A second repository implementation over HTTP (the API stack is not chosen yet);
authentication for stores and agencies; image uploads instead of URLs; product import from 1C/Excel on the server.

**Known issue — escaping.** Legacy renderers insert product, store and lifehack data into HTML without
escaping (`'<p>' + p.title + '</p>'`). Today the data comes from the seed and from the admin, but stores can
edit their cards, so this is an XSS risk. Fix it per domain as it moves to modules: rendering goes only through
`shared/ui/html.ts` (`esc`), with a test that an injection is printed as text. Do it before stores are given access.

**Separately:** compress `public/pc-arts` (7.4 MB of PNG) and `public/icons` (2.4 MB) to WebP/AVIF at the
right sizes; replace the 30 dead Unsplash photo links with real product photos.
