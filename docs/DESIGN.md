---
name: Супер-Апп
description: A serious regional marketplace on a phone; products, prices and stores carry the screen while the chrome stays quiet.
colors:
  ground: "#F2F3F6"
  card: "#FFFFFF"
  sunk: "#F2F3F6"
  ink: "#0B1A2E"
  ink-2: "#4E5A6B"
  ink-3: "#5E6876"
  line: "#E3E6EB"
  brand: "#1259F5"
  brand-deep: "#0C47CC"
  brand-soft: "#E9F0FF"
  sale: "#E5195E"
  ok: "#0E9F62"
  sale-soft: "#FFE8F0"
  sale-deep: "#B80C47"
  sale-line: "#F6C2D4"
  ok-soft: "#E3F6EC"
  wait: "#B26A00"
  wait-soft: "#FFF3DC"
  seg-track: "#E6E8EC"
  chevron: "#A3ABB8"
  switch-off: "#D5D9E0"
typography:
  wordmark:
    fontFamily: "Onest, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "19px"
    fontWeight: 800
    letterSpacing: "-0.03em"
  display:
    fontFamily: "Onest, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "26px"
    fontWeight: 800
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Onest, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "20px"
    fontWeight: 800
    letterSpacing: "-0.025em"
  title-group:
    fontFamily: "Onest, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Onest, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  price:
    fontFamily: "Onest, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "18px"
    fontWeight: 800
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  body:
    fontFamily: "Onest, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.35
  body-card:
    fontFamily: "Onest, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.35
  caption:
    fontFamily: "Onest, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "12.5px"
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: "0"
  label-button:
    fontFamily: "Onest, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "15px"
    fontWeight: 600
  label-tab:
    fontFamily: "Onest, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "10.5px"
    fontWeight: 500
  wordmark-desktop:
    fontFamily: "Onest, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "21px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.03em"
  title-drawer:
    fontFamily: "Onest, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "20px"
    fontWeight: 800
    letterSpacing: "-0.025em"
  count:
    fontFamily: "Onest, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "20px"
    fontWeight: 800
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  label-nav:
    fontFamily: "Onest, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "14.5px"
    fontWeight: 500
  label-field:
    fontFamily: "Onest, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 500
rounded:
  badge: "8px"
  sm: "12px"
  cta: "14px"
  md: "16px"
  lg: "20px"
  sheet: "24px"
  full: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "14px"
  xl: "16px"
  gutter: "20px"
  page-desktop: "32px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.card}"
    typography: "{typography.label-button}"
    rounded: "{rounded.cta}"
    height: "48px"
    padding: "0 16px"
  button-primary-active:
    backgroundColor: "{colors.brand-deep}"
  button-secondary:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.label-button}"
    rounded: "{rounded.cta}"
    height: "48px"
  button-soft-icon:
    backgroundColor: "{colors.brand-soft}"
    textColor: "{colors.brand}"
    rounded: "{rounded.cta}"
    size: "48px"
  button-cart:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.card}"
    rounded: "{rounded.sm}"
    size: "36px"
  button-cart-in:
    backgroundColor: "{colors.ok}"
    textColor: "{colors.card}"
  button-back:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    size: "36px"
  input-search:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "46px"
  input-field:
    backgroundColor: "{colors.sunk}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    height: "46px"
    padding: "12px 14px"
  chip:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
  chip-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.card}"
  badge-sale:
    backgroundColor: "{colors.sale}"
    textColor: "{colors.card}"
    rounded: "{rounded.badge}"
    padding: "2px 6px"
  card-product:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.lg}"
    padding: "10px 12px 12px"
  card-row:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.lg}"
    padding: "8px 14px 8px 8px"
  tab-bar:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink-3}"
    height: "64px"
  tab-bar-active:
    textColor: "{colors.brand}"
  admin-sidebar:
    backgroundColor: "{colors.card}"
    width: "256px"
  nav-item:
    textColor: "{colors.ink-2}"
    typography: "{typography.label-nav}"
    rounded: "{rounded.sm}"
    padding: "9px 10px"
  nav-item-active:
    backgroundColor: "{colors.brand-soft}"
    textColor: "{colors.brand}"
  nav-count:
    backgroundColor: "{colors.sale}"
    textColor: "{colors.card}"
    rounded: "{rounded.full}"
    height: "20px"
  segmented:
    backgroundColor: "{colors.seg-track}"
    rounded: "{rounded.sm}"
    padding: "3px"
  segmented-selected:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.badge}"
    padding: "7px 12px"
  button-admin:
    rounded: "{rounded.sm}"
    height: "42px"
    padding: "0 16px"
  button-danger:
    backgroundColor: "{colors.card}"
    textColor: "{colors.sale}"
    rounded: "{rounded.sm}"
    height: "42px"
  button-danger-hover:
    backgroundColor: "{colors.sale-soft}"
    textColor: "{colors.sale-deep}"
  button-ghost:
    textColor: "{colors.brand}"
    padding: "0 8px"
  button-ghost-hover:
    backgroundColor: "{colors.brand-soft}"
  badge-ok:
    backgroundColor: "{colors.ok-soft}"
    textColor: "{colors.ok}"
    rounded: "{rounded.badge}"
    height: "24px"
    padding: "0 8px"
  badge-wait:
    backgroundColor: "{colors.wait-soft}"
    textColor: "{colors.wait}"
    rounded: "{rounded.badge}"
    height: "24px"
  badge-bad:
    backgroundColor: "{colors.sale-soft}"
    textColor: "{colors.sale}"
    rounded: "{rounded.badge}"
    height: "24px"
  badge-off:
    backgroundColor: "{colors.sunk}"
    textColor: "{colors.ink-3}"
    rounded: "{rounded.badge}"
    height: "24px"
  badge-info:
    backgroundColor: "{colors.brand-soft}"
    textColor: "{colors.brand}"
    rounded: "{rounded.badge}"
    height: "24px"
  badge-deal:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.badge}"
    height: "24px"
  list-row:
    backgroundColor: "{colors.card}"
    padding: "12px 20px"
  summary-row:
    textColor: "{colors.ink}"
    typography: "{typography.count}"
    padding: "14px 20px"
  drawer:
    backgroundColor: "{colors.ground}"
    width: "560px"
  drawer-wide:
    width: "860px"
  panel:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.lg}"
    padding: "18px"
  switch:
    backgroundColor: "{colors.switch-off}"
    rounded: "{rounded.full}"
    width: "40px"
    height: "24px"
  switch-on:
    backgroundColor: "{colors.brand}"
  chip-value:
    backgroundColor: "{colors.sunk}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    height: "30px"
---

# Design System: Супер-Апп

## Overview

**Creative North Star: "The Regional Counter"**

A light, cool marketplace in the Ozon canon, scaled to one region's real stores. The ground is a cool off-white; everything a buyer touches is a white card set on it with no border. Prices are the loudest type on any screen, set heavy and near-black. One saturated blue does every action and marks the active place in the app. A warm magenta-red appears only when something is on sale or new. The chrome (header, tab bar, back buttons) is white and quiet, so photos of products and storefronts carry the colour.

Density is marketplace-dense: a 2-column grid with an 8px gap, 20px side gutters, cards that open straight into photo, price, title. Stores read as real places. Their photo sits on top and their name and details sit on a white strip below it, never as white type over a darkened photo. Contact moves to a person: carts and favorites are grouped per store, and each group ends with its own manager button.

The world replaced a dark sapphire glass theme with glowing edges and decorative gradients. None of that comes back. Since October 2026 (stakeholder reference "MarketSpace") the counter also has a **deep-navy dark theme** and an **iOS-style Liquid Glass layer** on navigation and controls. Both are described in Themes & Liquid Glass below. Glass is a material for controls, not a decoration, and content stays solid.

The admin panel is the back office of the same counter, not a second world. It keeps the ground, the white borderless cards, Onest, the one blue and the hairline, and adds a laptop layer: a white left sidebar, a sticky title bar, dense row tables, and right-side editor drawers. Status is spoken by small tinted badges and counts in rows, never by coloured tiles. On a phone the sidebar becomes a drawer and tables become stacked rows.

**Key Characteristics:**
- Cool off-white ground with white borderless cards; depth from tone, not lines.
- Price first: 18px/800 tabular numerals above a 2-line title.
- One action blue; magenta-red is reserved for sale and "new" signals.
- Onest throughout, heavy (800) for headings and prices, regular for titles.
- Rounded but not soft: 12px controls, 20px cards, 24px sheets, pills only for chips.
- Sentence case everywhere; no tracked capitals.
- Admin: the same world on a laptop, with a white 256px sidebar, row tables with hairlines, and right-side drawers.
- Two themes, light and dark, follow the system by default; the user can pin one (Профиль → Оформление, or the header toggle).
- Liquid Glass only on the control layer: floating tab bar, header buttons, search, buttons over photos, bottom bars, admin sidebar, top bar and drawer chrome.

## Colors

Cool, low-chroma neutrals with one saturated blue for action and one hot accent for sale signals.

### Primary
- **Marketplace Blue** (brand): every primary action (cart button, manager CTA, "В витрину", Telegram, onboarding), the active tab, the search field's 2px border, the focus outline, links, the verified check and the first letter of the wordmark.
- **Pressed Blue** (brand-deep): the pressed and hover state of blue buttons only.
- **Blue Wash** (brand-soft): the background of a secondary icon button next to a primary CTA, and the "Официальный партнёр" tag on the store strip.

### Secondary
- **Sale Magenta** (sale): sale and "new" badges, a discounted price, the onboarding badge. (Since the 2026 redesign the cart-count badge and a saved heart are Marketplace Blue, as in the stakeholder reference.) Nothing else in the buyer app. In the admin it is the problem colour (see The Sale-Only Magenta Rule).
- **Problem Wash** (sale-soft): the ground of the "bad" badge, a problem row icon and the danger button's hover.
- **Pressed Magenta** (sale-deep): the text of the danger button and the delete icon button on hover.
- **Pink Hairline** (sale-line): the 1px inset ring on the danger secondary button.

### Tertiary
- **In-Cart Green** (ok): the single state change of the product cart button once the item is in the cart. In the admin it marks the published state: Опубликован, Активна, В приложении.
- **Published Wash** (ok-soft): the ground of the "ok" badge.
- **Pending Amber** (wait): text and dot of the "wait" badge (На проверке), the icon in a warning note and a pending attention row. Admin only.
- **Pending Wash** (wait-soft): the ground of the "wait" badge and of a warning note.

### Neutral
- **Cool Ground** (ground): the page behind everything. The same value is reused as **Sunk** (sunk) for photo wells, input fields, quantity steppers and small close buttons inside white cards.
- **Card White** (card): every card, the header, the tab bar, the back button, white info strips, secondary buttons.
- **Deep Ink** (ink): headings, prices, product titles, selected chips.
- **Slate** (ink-2): secondary copy such as store subtitles, company names, "Итого по магазину".
- **Muted Slate** (ink-3): captions, store names under products, old prices, placeholders, the "Очистить всё" text action.
- **Hairline** (line): the only divider: between a cart or favorites group header, its items and its footer, under the header, and as a 1px inset ring on white secondary buttons. In the admin it separates table rows, summary rows and the sidebar from the content.
- **Segment Track** (seg-track): the track behind a segmented control (the role switcher). Admin only.
- **Chevron Grey** (chevron): row chevrons and the mapping arrow in the import table.
- **Switch Off** (switch-off): the off state of a switch, and the ring of an expired story.

### Named Rules
**The One Blue Rule.** Blue is the only action colour. Third-party brand colours are mapped onto the system: Telegram becomes Marketplace Blue, Max becomes a white secondary button. If two buttons in a group would both be blue, one of them is secondary.

**The Sale-Only Magenta Rule.** Magenta-red means "price signal or saved": sale, new, discounted price, cart count, saved heart. It is never a decorative accent, a heading colour or a second action colour. In the admin it also means "needs fixing": the moderation count in the sidebar, the "bad" badge (Отклонён, Нет фото), reject reasons, a non-zero rejected count and the Отклонить button's text. It is still never a fill for a primary action.

**The Published Green Rule.** Green (ok) means the item is live for buyers: in the buyer app, "in cart"; in the admin, the published state only (Опубликован, Активна, В приложении). Pending is amber, problems are magenta, neutral facts are grey or white. Green is not a general "success" colour.

**The Story Ring Exception.** The only gradient in the system is the story ring: blue to magenta for store stories, amber to orange (#FFB800 to #FF6B00) for "Лайфхак" stories. It identifies the stories feature. It is not available to banners, buttons or backgrounds.

## Themes & Liquid Glass

### Theme switching
- Preference key `localStorage['ui-theme']` = `system | light | dark`, shared by the app and the admin. A `<head>` script sets `html[data-theme]` before paint, follows `prefers-color-scheme` in `system` mode, and updates `theme-color`.
- Buyer app: header moon/sun button (toggles light/dark) and the Система / Светлая / Тёмная segmented control at the top of Профиль. Admin: moon/sun icon button in the top bar.
- Every colour is a token (`--mk-*` in the app, plain names in `admin.css`). Dark redefines the same tokens; Tailwind classes from the prototype (`bg-white`, `text-slate-*`, `border-slate-*`…) are mapped onto tokens under `html[data-theme="dark"]`.

### Dark palette (same roles as light)
| Role | Light | Dark |
|---|---|---|
| ground / page | #F3F5FA (admin #F2F3F6) | #0A0F1C |
| card | #FFFFFF | #131B2E |
| sunk | #EEF1F6 | #0F1627 |
| raised (rail and grid cards) | #FFFFFF | #172138 |
| ink / ink-2 / ink-3 | #0B1A2E / #4E5A6B / #5E6876 | #F2F5FB / #B3BCCE / #8D98AE |
| line | #E3E6EB | rgba(255,255,255,.08) |
| brand / brand-deep | #1259F5 / #0C47CC | #3A70FF / #2C5BE0 |
| brand-soft | #E9F0FF | rgba(58,112,255,.18) |
| sale / ok | #E5195E / #0E9F62 | #FF3D7A / #22C17E |

In dark, depth comes from a lighter surface (page → card → raised) plus a 1px white-4% ring, never from black shadows on cards.

### The glass recipe (`.lg`, `src/app/styles/glass.css`)
Translucent tint (`--glass-tint`, ~62% white / ~55% navy) + `backdrop-filter: blur(18px) saturate(180%)`, a 1px bright inner top rim and a faint bottom rim, a 0.5px edge ring, a soft outer shadow, and a `::before` specular sheen (light top-left, reflection bottom-right). Pressed: scale .94 on a spring curve. `prefers-reduced-transparency` swaps glass for opaque card surfaces.

**Rims.** A layered stack of inset shadows (`--lg-rims`, small variant `--lg-rims-sm`) draws the lit top-left edge, the darker inner bottom edge and the soft drop. Two knobs set its strength per theme: `--glass-reflex-light` (1 light, .3 dark) and `--glass-reflex-dark` (1 light, 2 dark). This part works in every browser, iPhone included.

**Refraction (Chromium only).** `backdrop-filter: blur(8px) url(#lg-tab) saturate()` on the tab bar, and `url(#lg-circle)` on glass buttons over photos. The filters are `feImage` + `feDisplacementMap` with a displacement map computed for the exact shape (rounded-rect distance field, convex bezel profile, flat neutral centre), so content bends at the rim like a lens. Regenerate the maps with `tools/lg-displacement-map.py` when a shape changes. Safari ignores `url()` in `backdrop-filter`, and every iOS browser is WebKit, so on iPhone the glass is blur + rims only. Real Apple refraction on iOS needs a native shell (UIKit/SwiftUI tab bar over a WKWebView).

**Tab lens.** The active tab sits on a glass pill (`.tab-lens`) that slides between tabs and stretches 1.22× in the direction of travel.

Variants: `.lg--circle` (40px icon buttons), `.lg--pill` (search, chips), `.lg--tinted` (blue glass). The tab bar is a floating 66px capsule inset 12px from the edges with a translucent blue "lens" behind the active tab.

### Named Rules
**The Glass-Is-Chrome Rule.** Glass goes only where SwiftUI would put `.glassEffect()`: tab bar, header controls, search field, buttons floating over photos (favourite, back, share, gallery arrows), the product bottom bar, and the admin top bar, sidebar and drawer chrome. Cards, banners, lists, tables and form fields are always solid.

**The Two-Theme Rule.** Never write a raw colour in a rule that can appear in both themes. Use a token, or a token with a light fallback (`var(--mk-card, #fff)`). White on a photo or on the brand fill is the only fixed colour.

## Motion & Gestures

All motion lives in `src/app/features/` (`motion/transitions.ts`, `swipe-to-delete.ts`, `notifications/`, `tab-lens.ts`). It watches `hidden` class changes, so app code keeps calling its usual open/close functions. Easing is the iOS navigation curve `cubic-bezier(.32,.72,0,1)`. Durations: 380–420 ms in, 300–340 ms out. `prefers-reduced-motion` reduces everything to a 120 ms fade.

- **Pages:** switching tabs fades the page in and lifts it 10px. Going deeper (subviews, the category page) pushes in from the right, and going back slides in from the left.
- **Overlays:** full-screen pages (product, store showcase, company, assistant…) push from the right while the page behind shifts back. Bottom sheets rise over a fading scrim. Centred dialogs scale from .9 on a spring. The lightbox zooms.
- **Closing:** the app closes instantly, as before. A visual copy of the overlay (`[data-lg-ghost]`, ids kept, scroll position kept, media removed) plays the exit animation and deletes itself, so no app logic waits on an animation.
- **Stories:** open by zooming out of the tapped bubble (from a circle to the full screen) and close back into it.
- **Swipe to delete** (SwiftUI `List.onDelete`): any row with `data-swipe-fn="fn" data-swipe-arg="id"` gets a red «Удалить» behind it. A partial swipe snaps open; a swipe past half the row width deletes immediately. Used on cart items (`removeFromCart`), favourites (`toggleFavorite`) and notifications.
- **Notifications sheet** (SwiftUI `.sheet` with `[.medium, .large]` detents): a glass sheet with a grabber, «Очистить» / «Готово», drag to resize or dismiss, and scroll-wheel expansion. At the large detent the page behind scales to .94 with rounded corners. Content comes only from real app events: the buyer's orders, the cart, and published stories. Dismissed and seen ids live in localStorage.

## Typography

**Display Font:** Onest (with system-ui, -apple-system, Segoe UI, sans-serif)
**Body Font:** Onest (same stack)

**Character:** One Cyrillic-native grotesque does every job; hierarchy comes from weight (800 for headings and prices, 700 for card names, 400 for titles and copy) and tight negative tracking on large sizes.

### Hierarchy
- **Wordmark** (800, 19px, -0.03em): "Супер-Апп" in the header, ink with a blue first letter.
- **Display** (800, 26px, -0.03em): page titles: Каталог, Корзина, Избранное. 22px/800 for sub-page titles (category goods, landscape), 24px/800 for the store name on its white strip, 22px/800 for the cart total.
- **Headline** (800, 20px, -0.025em): home section heads ("Рекомендуем для вас") and sheet titles.
- **Group title** (700, 18px, -0.015em): headings inside a page ("О компании", "Ресурсы", "Оформление", "Мои заказы") and empty-state titles.
- **Title** (700, 15–17px, -0.01 to -0.015em): names in tiles, store groups, company and vacancy cards, the promo name. Row titles in lists use 600.
- **Price** (800, 18px, -0.02em, tabular numerals): product card price. 16px in compact cards, cart lines and favorites; 17px for a salary.
- **Body** (400, 13–15px, 1.3–1.35): product titles (13px, clamped to two lines in cards), cart line titles (14px), field text (15px).
- **Caption** (500 or 400, 12–12.5px, 0 tracking, sentence case): store under a product, descriptions, counts, notes, in Muted Slate.
- **Button label** (600, 14–16px): 15px on in-card CTAs, 16px on full-width CTAs.
- **Tab label** (500, 10.5px; 600 when active).

Admin (desktop) sizes, same family and weights:
- **Wordmark** (800, 21px, -0.03em) at the top of the sidebar, with a 12.5px/500 Muted Slate "Управление" below.
- **Page title** (800, 26px, -0.03em) in the top bar, 22px on phones, with a 13px Muted Slate subline.
- **Store name** (800, 22px, -0.025em) on the store cabinet's home card.
- **Drawer title** (800, 20px, -0.025em), set as an h2.
- **Card head** (700, 18px, -0.015em): the group title from the buyer app.
- **Titles** (700, 16–17px): panel heads in drawers (16px), storefront card names and the drop zone title (17px), empty-state titles (16px).
- **Count** (800, 20px, -0.02em, tabular numerals) in summary rows. Moderation prices keep the 18px/800 price.
- **Nav item** (500, 14.5px; 600 when active), row names 14.5px/600, field labels 13px/500 Slate, table column heads 12.5px/500 Muted Slate in sentence case.

### Named Rules
**The Price-First Rule.** In any product unit the price comes before the title, heavier and larger than anything else in the card, in tabular numerals. The old price follows on the same baseline at 12px Muted Slate, struck through.

**The Sentence-Case Rule.** Labels and headings are sentence case with no added tracking. A small caption is 12.5px/500 Muted Slate; a section label is an 18px/700 ink heading. No tracked uppercase labels above headings.

## Layout

A single phone-width column (the app renders inside a phone frame on desktop). Side gutter 20px. Product, recommendation, catalog-tile and room-picker grids are 2 columns with an 8px gap. Stacked lists (catalog rows, sub-category rows) use an 8px gap; stacked store groups in cart and favorites use 10px. Page heads sit 14px above their content. Card internals use 10–14px padding; sheets use 20px top, 16px sides, 28px bottom.

The first screen order is fixed by the product: white header (wordmark, feedback, assistant, bell), full-width search with a square blue filter button, stories row, one promo slide, then the product grid. The bottom tab bar is 64px with five items.

### Admin (laptop-first)
The admin is a fixed white sidebar (256px) with a 1px Hairline right edge, and a main column with 32px side padding and content capped at 1280px. The sidebar holds the wordmark, then nav groups (Каталог, Магазины, Разделы, Доступы) under 12px/500 Muted Slate sentence-case labels, and a footer with the user and an "Открыть приложение" link. The top bar is sticky on Cool Ground: the page title and subline on the left, the segmented role switcher on the right. The overview is two columns (1.25fr and 1fr, 16px gap): the attention list on the left, quick actions and the store table on the right. Card grids (moderation, storefronts, agencies) use auto-fill columns of 280–300px minimum with a 12px gap.

At 1080px the overview and the sections screen drop to one column. At 860px the sidebar becomes an off-canvas drawer behind a menu button and a dark scrim, the role switcher spans the full width, table heads hide, and each table row stacks into the name on top with status and actions below. Drawers go full width.

**The Two Densities Rule.** The catalog root shows sections as a 2-column tile grid (name and 2-line description top-left, a photo cropped into the bottom-right corner, 148px minimum height). Every deeper level shows a single-column list of rows (64px photo, name, description, chevron). Tiles are for the first choice, rows are for scanning.

**The Rows Not Tiles Rule.** Admin numbers live in rows: summary rows (count, label, an optional ghost action) and table cells. There are no coloured stat tiles. A count turns magenta only when it is a problem to fix.

## Elevation & Depth

The system is tonal and flat by default. A white card on Cool Ground is the main way it shows layers, and grid and list items (product cards, recommendation cards, catalog rows and tiles, company and vacancy cards, cart and favorites groups) have no shadow and no border. Shadows are kept for things that sit above the scroll: the tab bar and product bottom bar (cast upward), modal sheets, and the floating assistant button. A low ambient shadow remains on the promo slide and on general-purpose white container cards.

### Shadow Vocabulary
- **Ambient** (`box-shadow: 0 1px 2px rgba(11,26,46,.04), 0 4px 14px rgba(11,26,46,.06)`): the promo slide and general white containers.
- **Bar Up** (`box-shadow: 0 -1px 0 rgba(11,26,46,.06), 0 -6px 18px rgba(11,26,46,.05)`): the tab bar and the product page's bottom action bar.
- **Sheet** (`box-shadow: 0 -8px 32px rgba(11,26,46,.16)`): bottom sheets.
- **Float** (`box-shadow: 0 2px 6px rgba(11,26,46,.08), 0 8px 20px rgba(11,26,46,.14)`): the round assistant button floating above the tab bar.
- **Hairline** (`box-shadow: 0 1px 0 #E3E6EB`): the bottom edge of the header and the store info strip. In the admin, the sidebar's right edge, the drawer head and the drawer foot.
- **Drawer** (`box-shadow: -12px 0 40px rgba(11,26,46,.14)`): right-side editor drawers, and the sidebar when it opens as a drawer on phones. Behind it sits a scrim of rgba(11,26,46,.38).
- **Pop** (`box-shadow: 0 2px 6px rgba(11,26,46,.06), 0 10px 28px rgba(11,26,46,.12)`): the toast and small labels floating over a map.
- **Segment** (`box-shadow: 0 1px 3px rgba(11,26,46,.1)`): the selected segment of a segmented control.

### Named Rules
**The Flat Card Rule.** Cards in a feed or list never carry a border or a shadow. Contrast between Card White and Cool Ground does the work. If a card seems to need a border to stand out, the problem is the ground behind it. Admin tables, summary rows, panels and storefront cards follow the same rule.

## Shapes

Corners are rounded but firm, and they step up with the size of the object: 8px badges, 10px small photos in lists, 12px controls (cart button, back button, close buttons, small CTAs, thumbnails, input fields), 14px full-width CTAs, 16px search field and info buttons, 20px cards, 24px top corners on bottom sheets. Pills (999px) are only for chips and round avatars or story rings. A product card's photo well shares the card's top corners and runs edge to edge. On a catalog tile the photo is cropped into the bottom-right corner with only its top-left corner rounded (14px). Icons are the existing stroke SVGs at 1.75 stroke. The verified mark is a filled blue circle with a white check, drawn as SVG.

## Components

### Buttons
Solid, quiet and full of colour, with no gradients or glows.
- **Shape:** 14px on full-width and paired CTAs (48–50px tall), 12px on compact CTAs (40px) and icon buttons (36px).
- **Primary:** Marketplace Blue with a white 600 label. "Отправить заказ менеджеру", "Оформить по магазинам", "Написать в Telegram", "В витрину".
- **Pressed:** Pressed Blue fill. Tappable cards scale to 0.985 over 200ms on the system ease.
- **Secondary:** Card White with a 1px Hairline inset ring and an ink 600 label ("Написать в Max", "Показать телефонный номер").
- **Soft icon:** 48px Blue Wash square with a blue icon, placed beside a primary CTA (chat with manager).
- **Text action:** 13px/500 Muted Slate with no background ("Очистить всё"), or 13px/600 blue for "go" links.
- **Focus:** 2px Marketplace Blue outline, 2px offset.

- **Admin size:** 42px tall, 12px corners, 14.5px/600 labels; 34px small and 50px large (14px corners). Pressed scales to 0.98.
- **Approve / reject:** Одобрить is the brand primary. Отклонить is the danger secondary: Card White, Sale Magenta text, a 1px Pink Hairline inset ring; on hover it fills with Problem Wash and the text goes to Pressed Magenta. Paired, they share the width equally.
- **Ghost:** blue text with no fill, 8px side padding; on hover a Blue Wash fill. Used for "Смотреть", "Исправить", "Принять все", "Добавить".

### Chips
- **Style:** pill, Card White with a Hairline inset ring, ink 500 label.
- **Selected:** Deep Ink fill with a white label. Selection in a filter row is ink, not blue, so it doesn't compete with the blue actions next to it.

### Badges
- **Sale / new:** Sale Magenta fill, white 11px/700, 8px radius (6px in compact favorites rows), top-left over the photo.
- **Cart count:** Sale Magenta dot on the cart tab with a 2px white ring.
- **Admin status:** 24px tall, 8px corners, 12px/600 with a 6px dot in the text colour. ok (Published Wash and green) for published only; wait (Pending Wash and amber) for pending only; bad (Problem Wash and magenta) for rejected or missing photo; off (Sunk and Muted Slate) for skipped or inactive; info (Blue Wash and blue) for the store role. The deal type (Продажа, Аренда) is a neutral white badge with a Hairline ring and no dot.

### Cards / Containers
- **Corner Style:** 20px.
- **Background:** Card White on Cool Ground; photo wells and inner fields in Sunk.
- **Shadow Strategy:** none for feed and list cards (see The Flat Card Rule).
- **Border:** none. Hairline dividers only inside grouped cards.
- **Internal Padding:** 10px 12px 12px on product bodies, 14px on group cards and company cards, 16px on form cards.

### Product Card (signature)
A square or 176px photo well in Sunk (the photo is multiplied onto it), a heart top-right (white with a soft drop shadow; magenta and filled when saved), the price row (18px/800 tabular; old price 12px struck through), a 13px/400 title clamped to two lines, a 12px Muted Slate store line, and a 36px Marketplace Blue square cart button with 12px corners in the bottom-right corner of the photo or body. The button turns In-Cart Green once the item is added. A compact variant uses a 140px photo and a 16px price.

### Store Groups (cart and favorites)
One white 20px card per store. Favorites: storefront photo (84px) on top, then the store name (17px/700 ink) with an item count caption on white, item rows separated by Hairlines (photo, price, title, chevron), and a footer with "Итого по магазину" and the store total (18px/800), then the soft chat button plus the primary "Отправить заказ менеджеру". Cart: a store header row with a note and a 28px Sunk remove button, a Hairline, then lines with a 72px photo, title, variant, a Sunk quantity stepper (32px, 10px radius) and the line sum (16px/800 tabular). The checkout card collects contact fields in Sunk inputs and ends in a full-width primary CTA.

### Promo Slide and Store Header
Both put the photo on top and the words on white below it. Promo slide: photo, then a white strip with the name (17px/700, one line), a 12.5px description and a compact 40px blue "В витрину" button, with Ambient shadow and 20px corners. Store header: storefront photo, then a white info strip (14px 20px 16px padding, Hairline bottom edge) with the store name at 24px/800 ink, a Blue Wash "Официальный партнёр" tag (8px radius) and the description in Slate.

### Company and Vacancy Cards
White 20px cards, flat. A 112px square photo (12px radius) and a 14px body with the title (16px/700), salary (17px/800), company (13px/500 Slate), a description clamped to two lines (12.5px Muted Slate) and a 13px/600 blue "go" link. Verified companies get a 17px blue verified SVG check right after the name, 6px gap.

### Row Tables (admin)
A white 20px list card. Each row is a grid with 14px gaps, 12px 20px padding and a 1px Hairline above it (none on the first). The head row is 12.5px/500 Muted Slate in sentence case. The name cell has a 48px thumbnail (12px corners, round for people) with a 14.5px/600 name and a 12.5px Muted Slate subline, both truncated. Actions sit right as 36px icon buttons. On hover a row tints to #FAFBFC. On phones the head hides and rows stack: name on the full width, status and actions below.

### Summary Rows (admin)
A white 20px card of rows divided by Hairlines. Each row has a 20px/800 tabular count (64px minimum width), a 14px Slate label, and an optional ghost action at the end. A problem count turns Sale Magenta. A flat variant sits inside another card with no fill.

### Editor Drawers (admin)
Editors slide in from the right over a dark scrim: 560px, or 860px for the storefront editor. The drawer ground is Cool Ground. A white head with a Hairline holds the h2 title and a close button. The storefront editor adds a white tab row: 14px/500 Muted Slate tabs, the active tab ink 600 with a 2px blue underline. The body (20px 24px) stacks white 20px panels (18px padding, a 16px/700 head, a 13px Muted Slate note). A white foot holds 48px buttons sharing the width.

### Import Stepper and Drop Zone (admin)
The stepper is a row of white pills (38px) with a 26px numbered disc: Sunk for future steps, blue with white numerals for the current step, Published Wash for finished ones. The drop zone is a 2px dashed #C9CFD8 border with 20px corners on #FAFBFC, a 34px blue upload icon and a 17px/700 title. On hover or drag-over it turns blue on Blue Wash. A chosen file shows as a Sunk pill with its name, row count and a ghost "replace" action.

### Inputs / Fields
- **Search:** Card White, 2px Marketplace Blue border, 16px radius, 46px tall, 15px text, Muted Slate icon and placeholder, paired with a 46px blue square filter button.
- **Form field:** Sunk fill, transparent 1px border, 12px radius, 46px minimum height, 15px text.
- **Focus:** the border turns Marketplace Blue (form fields also go white), plus a 3–4px blue ring at 14% opacity. The caret is blue.
- **Admin fields:** a 13px/500 Slate label always sits above the field, and a 12.5px Muted Slate hint can sit below. Placeholders never replace labels. Fields are 44px tall with 14.5px text. Selects use a Muted Slate chevron.
- **Switch:** 40x24 pill, Switch Off when off, Marketplace Blue when on, with an 18px white knob.
- **Filter values:** 30px Sunk pills with a 13px/500 label and a small remove button that turns magenta on hover. "Add value" is a dashed #C9CFD8 pill with a blue label.

### Navigation
- **Header:** sits on the page colour with no edge. A two-tone wordmark (Супер in ink, -Апп in Marketplace Blue, 25px/800) over the tagline «Больше, чем покупки» (12.5px/500 Muted Slate). Right: three 40px glass circles (theme, assistant, bell with a blue dot). «Обратная связь» lives in Профиль.
- **Home order:** glass search field (filter icon inside) → category tiles (64×56, 16px corners; «Все» filled blue, the rest from categories that have published goods) → stories → full-bleed promo photo with a left navy veil, white 21px/800 title, blue subline and a white pill «Смотреть» → «Рекомендуем для вас» horizontal rail (152px raised cards, glass heart, round blue + button) → promo strip with a glass arrow → product grid.
- **Tab bar:** floating glass capsule (see Themes & Liquid Glass), 24px stroke icons at 1.75, 10.5px labels. Inactive items are Slate; the active item is Marketplace Blue on a blue glass lens. The cart count badge is blue.
- **Back:** a 36px white square with 12px corners and an ink chevron, set before the page title. Pressed, it fills with Hairline.
- **Page head text action:** right-aligned Muted Slate text.
- **Admin sidebar:** white, 256px, nav items 14.5px/500 Slate with a 20px stroke icon, 12px corners, 9px 10px padding. Hover fills with Sunk. The active item is Blue Wash with a blue 600 label. A count pill (20px, Sale Magenta, white 11.5px/700) sits at the right end of an item that has items needing attention.
- **Role switcher:** a segmented control on a Segment Track (3px padding, 12px corners). Segments are 13.5px/500 Slate; the selected one is Card White, ink 600, 8px corners, with the Segment shadow.

## Do's and Don'ts

### Do:
- **Do** put the price before the title in every product unit, at 18px/800 with tabular numerals.
- **Do** set every card as Card White on Cool Ground with 20px corners and no border.
- **Do** group cart and favorites by store, and end each group with its own manager CTA.
- **Do** put store and promo words on a white strip under the photo.
- **Do** map third-party channel colours to the system: Telegram is the primary blue button, Max is the white secondary button.
- **Do** use the blue SVG verified check after a verified company's name.
- **Do** turn any section label into an 18px/700 sentence-case ink heading or a 12.5px/500 Muted Slate caption.
- **Do** use the 2-column tile grid at the catalog root and single-column rows below it.
- **Do** build admin screens from the sidebar, the sticky title bar, row tables and right-side drawers on Cool Ground.
- **Do** show admin counts as summary rows or table cells, with a 20px/800 tabular count.
- **Do** keep a visible label above every admin field.
- **Do** pair Одобрить (brand primary) with Отклонить (danger secondary) at equal width.

### Don't:
- **Don't** bring back the dark sapphire glass, glowing edges, aurora backgrounds or decorative gradients. The story ring is the only gradient.
- **Don't** use Sale Magenta for anything other than sale, new, discounted price, cart count and saved heart.
- **Don't** add a second action colour, or paint Telegram cyan or Max violet.
- **Don't** put borders or shadows on feed or list cards.
- **Don't** set tracked uppercase labels or eyebrows above headings.
- **Don't** set white text over a darkened photo for store names. The home promo slide is the one exception: white title over a navy left-side veil, per the stakeholder reference.
- **Don't** put glass on content (cards, banners, tables, fields), and don't stack glass on glass.
- **Don't** use coloured stat tiles in the admin.
- **Don't** use green for anything other than "in cart" and the published state.
- **Don't** fill a primary action with Sale Magenta; rejecting is a secondary button.
