# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Buyer app: mobile-first PWA (portrait, standalone). On desktop it renders inside a phone-width frame; a full desktop layout for the buyer app is out of scope.

Admin panel (`admin.html`): laptop-first (sidebar, tables, side drawers) and usable on a phone. It holds three roles behind a switcher: administrator, store cabinet, agency cabinet.

## Users

- **Buyers** in the region who are building or renovating. They browse materials, furniture and services across many local stores, collect items in one cart, and contact each store's manager to buy.
- **Store owners/managers**, who keep a storefront and add products (1–5 at a time) that go through moderation.
- **The administrator** (the stakeholder), who runs stories, storefronts, sections, moderation and bulk imports (1C/Excel exports, 1,000–10,000 products per store).
- **Real estate agency managers**, who add listings after admin approval.

## Product Purpose

A regional construction and renovation super-app: one catalog of local stores, plus a directory of specialists, equipment rental, designers, companies, vacancies, landscaping, real estate, life hacks and renovation calculators. The app does not take payments. The cart groups items by store, and each group hands off to that store's manager in MAX or Telegram with the product details pre-filled.

Success: the app feels like a serious marketplace (Ozon/WB grade), not an AI-made sketch, and the admin panel is understandable to a non-technical owner.

## Positioning

Local, not national: real stores of one region with their storefront photos, addresses, map, hours and named managers. The buyer talks to a person at the store rather than paying a platform.

## Operating Context

- Buyers use it on a phone, often in short sessions, comparing prices across stores.
- Stories (per store, plus YouTube Shorts "Лайфхак" stories) last 24 hours and behave like Instagram's.
- Contact channels: MAX and Telegram, phone, e-mail.
- First launch requires a user agreement and cookie consent.

## Capabilities and Constraints

- Current implementation: one static `index.html` (~17.8k lines, Tailwind via `vendor/tailwindcss.js`, inline JS), `admin.html`, `data.js` (localStorage data), `sw.js`, `manifest.json`. There is no backend yet.
- The redesign restyles the existing app in place; every current function and screen must keep working.
- Sections: Главная, Каталог (товары, магазины, специалисты, спецтехника, дизайнеры, компании, вакансии, недвижимость, ландшафт, прочее, лайфхаки, калькуляторы), Корзина, Избранное, Профиль.
- Undecided: product import format (1C vs Excel), stock sync, backend stack.

## Brand Commitments

- Product name in the UI: **Супер-Апп** (confirmed). The "РемонтИК" image in the home banner is a promo asset, not the product name.
- Language: Russian.
- Binding visual reference from the stakeholder: Ozon-like (clean, serious marketplace); WB as a secondary reference.

## Evidence on Hand

- Store data and product photos in `data.js` (Unsplash placeholders), banners in `shops-banners/`, calculator art in `pc-arts/`, renovation before/after images in `assets/`.
- No real reviews, ratings or sales figures exist. Do not invent them.

## Product Principles

1. Marketplace clarity first: price, store and the next action are always obvious.
2. One system everywhere: every section reads as part of the same app.
3. The store is a real place: show address, photos, hours and a named manager.
4. The admin side must be usable by a non-technical owner.
