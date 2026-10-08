# Redesign v2 («Линейка») and per-store storefronts — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the buyer app's visual world with «Линейка» (building-mixture packaging grammar) on every screen, and add a storefront engine that gives each store its own theme, blocks and filters, editable in the admin; prepare a free static deploy.

**Architecture:** A new CSS layer `src/app/styles/range/` loaded last remaps the old `--mk-*` tokens and restyles every screen; one TypeScript product-cell renderer replaces the legacy card builders. Pure storefront logic (presets, resolve, filters, calculator, colour) lives in `src/shared/storefront/` with unit tests; the buyer storefront UI lives in `src/app/features/storefront/`; the admin gets design/blocks/filters tabs in `src/admin/features/storefront-designer/`.

**Tech Stack:** Vite 6, TypeScript 5.9, Tailwind 3 (compiled), legacy classic scripts, Vitest 3, Playwright (system Chrome).

**Spec:** `docs/superpowers/specs/2026-10-08-redesign-v2-storefronts-design.md`. Visual direction contract: `.impeccable/surfaces/index-html.md` (read it before any UI task).

## Global Constraints

- Every existing function and screen keeps working; `npm test` (typecheck + Vitest + build + Playwright) is green at the end of every task.
- Colours only through tokens. Never a raw colour in a rule that can appear in both themes, except white/black on a store ink or on the brand fill.
- Signature ink Orange 021 `#FE5000` (dark theme `#FF6526`) with **black** labels (`#111110`); orange as text uses `--r-orange-text` (`#B83A00` light, `#FF8A57` dark). Sale = yellow sticker `#FFDD00` with black text.
- Neutrals only from the numbered ramp `--r-n0…--r-n9`.
- Type: `Sofia Sans` for text, `Sofia Sans Extra Condensed` 800–900 for numerals, prices, codes and names (caps where the brief says caps); self-hosted woff2 in `public/fonts/`, no Google Fonts link. Storefront voices: `Unbounded` (modern), `Prata` (classic), Extra Condensed (industrial).
- Square corners (radius 0) on panels, buttons, inputs, chips; circles only for avatars, story rings, dots and switches. One 45° chamfer (`clip-path`) only on stickers, tags and the brand plate.
- No soft drop shadows on content; separation by rules (`--r-rule` hairlines, `--r-band` 2px ink bands). No glass, no blur, no gradients (the story ring is now a solid store ink).
- Banned by the craft floor: eyebrow/kicker labels above headings; section numbers unless the sequence is information (steps, pager); coloured `border-left/right` > 1px on cards or rows; hard offset shadows; emoji or Unicode glyphs as icons (`×`, `−`, `+`, `✕`, `★` must be SVG); gradient text.
- Secondary text on a coloured field is the field's on-ink colour at reduced opacity, never grey.
- Rendering in new code through `html`…`` (`src/shared/ui/html.ts`), buttons through `data-action` (`src/shared/ui/actions.ts`); no new inline `onclick`. Legacy edits escape data with `escHtml` / `escJsArg`.
- Storage keys only through `src/shared/storage/keys.ts` + `local-store.ts`. Entity types only from `src/shared/domain/types.ts`.
- No invented ratings, reviews or sales figures. Authored demo content that a buyer could read as a claim carries `example: true`.
- Russian UI copy, sentence case except where the brief sets caps (wordmark, store names on spines and fields, section heads, prices are numerals).
- Parallel worktrees run e2e with their own port: `E2E_PORT=<port> npx playwright test`. Worktrees symlink dependencies: `ln -s /Users/User/Desktop/mobpril/node_modules node_modules`.
- Design implementers read `/Users/User/.claude/skills/impeccable/reference/craft-floor.md` and the direction contract before editing UI.

## Review Focus

1. A store with no saved storefront, no services, no managers and one product must still open a complete, non-broken storefront (empty blocks hidden, skeleton intact) — test in Task 2 (resolve) and Task 7 (e2e on «Кровельщик»).
2. A saved storefront with garbage (bad hex, unknown block type, missing arrays) must not crash the app or the admin — test in Task 2 (`resolveStorefront` repair cases).
3. Filters on a store whose products lack the attribute: the facet disappears instead of showing one useless chip; a range bound excludes products without a value — test in Task 2 (filters).
4. Dark theme: every restyled screen readable (no white-on-light or black-on-black) — screenshot check in Tasks 1, 5, 6, 7 at `ui-theme=dark`.
5. Long Russian names (e.g. «Строительные материалы ТЦ ДОМ», «Мебельная фабрика ТриЯ») on spines, covers and promo fields must truncate or wrap without overflow at 360px width — e2e/visual check in Tasks 4, 5, 7.

## File ownership (parallel safety)

| Task | Owns (may edit) |
|---|---|
| 1 Foundation | `index.html` `<head>` and `#app-header`, `#app-tabbar`; `src/app/main.ts`; `src/app/styles/range/{index,tokens,fonts,base,chrome,components}.css`; `public/fonts/`; `src/shared/legacy/theme-bootstrap.js` |
| 2 Storefront core | `src/shared/storefront/*`; `src/shared/domain/types.ts`; `tests/unit/storefront.test.ts` |
| 3 Demo data | `src/shared/legacy/seed.js` only |
| 4 Product cell | `src/app/ui/product-cell.ts`, `src/app/features/storefront/store-theme.ts`, `src/app/styles/range/cells.css`, `src/app/legacy-bridge.ts`; card builders in `core/product.js` (`productCardHtml`, `pmMiniCard`), `features/home-sections.js` (rec card), `core/lifehacks.js` (`lhProductCardHtml`); grid container class attributes in `index.html`; `tests/unit/product-cell.test.ts`, `tests/e2e/cells.spec.ts` |
| 5 Home + catalogue | `index.html` `#view-catalog` (except grid container attrs from Task 4), `#view-directory` and all subviews, `#view-category-products`; `core/{stories,shops(renderHomeShopPromo only),catalog,directory,specialists,spectech,companies,landscape,other-services}.js`, `features/{home-sections,realestate-catalog,calculators}.js`, `core/lifehacks.js` (lists); `src/app/styles/range/{home,catalog}.css`; storage key for seen stories |
| 6 Detail screens | `index.html` `#product-modal`, `#pm-about-sheet`, `#view-cart`, `#view-favorites`, `#view-profile`, `#screen-onboarding`, `#story-viewer`, `#assistant-sheet`, other sheets/modals not owned above; `core/{product,onboarding}.js` (except Task 4 builders), `features/assistant-ui.js`, `src/app/features/{cart,favorites,buyer,auth,notifications}/*`; `src/app/styles/range/{product,cart,profile,sheets}.css` |
| 7 Storefront UI | `src/app/features/storefront/*` (except `store-theme.ts`), `src/app/styles/range/storefront.css`, `index.html` new `#storefront` overlay, `src/app/features/motion/transitions.ts` (overlay registration only), `src/app/main.ts` (one init line), `tests/e2e/storefront.spec.ts` |
| 8 Admin designer | `admin.html`, `src/admin/**`, `tests/e2e/admin-storefront.spec.ts` |
| 9 Deploy + stage | `.github/workflows/pages.yml`, `README.md` (Deploy section), `src/app/styles/range/stage.css`, `index.html` stage markup (`<body>` to `#phone-container` open tag), `package.json` (one dependency) |

Order: Tasks 1, 2, 3 in parallel (disjoint) → 4 → 5, 7, 8, 9 in parallel (disjoint) → 6 → 10. A task that must touch a file it does not own stops and reports `NEEDS_CONTEXT`.

---

### Task 1: Foundation — fonts, tokens, chrome, primitives

**Files:**
- Create: `public/fonts/sofia-sans-{cyrillic,latin}.woff2`, `public/fonts/sofia-sans-extra-condensed-{cyrillic,latin}.woff2`, `public/fonts/unbounded-{cyrillic,latin}.woff2`, `public/fonts/prata-{cyrillic,latin}.woff2`
- Create: `src/app/styles/range/index.css`, `tokens.css`, `fonts.css`, `base.css`, `chrome.css`, `components.css`, and empty placeholder files `cells.css`, `home.css`, `catalog.css`, `product.css`, `cart.css`, `profile.css`, `sheets.css`, `storefront.css`, `stage.css` (each with a one-line comment naming its owner task)
- Modify: `src/app/main.ts` (import `./styles/range/index.css` after `./styles/tailwind.css`)
- Modify: `index.html` `<head>` (drop the Onest `<link>` and both Google preconnects; add `<link rel="preload" href="/fonts/sofia-sans-cyrillic.woff2" as="font" type="font/woff2" crossorigin>`), `#app-header` wordmark markup, nothing else
- Modify: `src/shared/legacy/theme-bootstrap.js` (theme-color values: light `#FFFFFF`, dark `#121211`)

**Interfaces:**
- Produces CSS custom properties `--r-n0…--r-n9`, `--r-paper`, `--r-well`, `--r-sunk`, `--r-rule`, `--r-ink`, `--r-ink-2`, `--r-ink-3`, `--r-ink-4`, `--r-orange`, `--r-orange-press`, `--r-on-orange`, `--r-orange-text`, `--r-orange-wash`, `--r-sticker`, `--r-on-sticker`, `--r-ok`, `--r-ok-wash`, `--r-bad`, `--r-bad-wash`, `--r-wait`, `--r-wait-wash`, `--r-scrim`, `--r-font`, `--r-font-x`, `--r-font-modern`, `--r-font-classic`, `--r-band`, `--r-chamfer`, `--r-ease`, `--r-gutter`, all on `#phone-container[data-ui]`.
- Produces classes: `.r-x`, `.r-caps`, `.r-num`, `.r-head` (`__t`, `__a`), `.r-btn` (`--primary`, `--ink`, `--line`, `--sm`, `--block`), `.r-chip` (`.is-on` / `[aria-pressed=true]`), `.r-sticker` (`--new`), `.r-spine` (reads `--spine`, `--on-spine`), `.r-price` (`b`, `i`, `s`), `.r-input`, `.r-pict` (`> i`), `.r-back`, `.r-plate`.

- [ ] **Step 1: Download the fonts.** For each family, fetch Google's CSS with a modern UA and download the `cyrillic` and `latin` woff2 into the fixed names above; keep each block's `unicode-range` for fonts.css.

```bash
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
for fam in 'Sofia+Sans:wght@400..900' 'Sofia+Sans+Extra+Condensed:wght@600..900' 'Unbounded:wght@500..800' 'Prata'; do
  curl -s -A "$UA" "https://fonts.googleapis.com/css2?family=$fam&display=swap"; echo; done > /tmp/range-fonts.css
# then curl -o each /* cyrillic */ and /* latin */ src url into public/fonts/<family>-<subset>.woff2
```

- [ ] **Step 2: Write `fonts.css`** — eight `@font-face` blocks, `font-display: swap`, variable weight ranges as fetched (`font-weight: 400 900` etc.), `src: url('/fonts/…woff2') format('woff2')`, each with the `unicode-range` copied from Google's CSS. Families: `'Sofia Sans'`, `'Sofia Sans Extra Condensed'`, `'Unbounded'`, `'Prata'`. Paths are root-relative in CSS source; Vite rewrites them for `base: './'` — verify in `dist/assets/*.css` after build that the font URLs resolve (copy fonts under `public/fonts/`, reference as `/fonts/...`).

- [ ] **Step 3: Write `tokens.css`** exactly:

```css
/* «Линейка» (redesign v2): tokens. Loaded last; the old --mk-* names are remapped here so rules
   nobody has restyled yet already follow the new world. Neutrals come only from the n0–n9 ramp. */
#phone-container[data-ui] {
  --r-n0: #FFFFFF; --r-n1: #F4F4F2; --r-n2: #E9E9E6; --r-n3: #D6D6D1; --r-n4: #ADADA7;
  --r-n5: #6B6B66; --r-n6: #4A4A46; --r-n7: #333331; --r-n8: #1F1F1D; --r-n9: #111110;

  --r-paper: var(--r-n0);
  --r-well: var(--r-n1);
  --r-sunk: var(--r-n2);
  --r-rule: var(--r-n3);
  --r-ink: var(--r-n9);
  --r-ink-2: var(--r-n6);
  --r-ink-3: var(--r-n5);
  --r-ink-4: var(--r-n4);

  --r-orange: #FE5000;
  --r-orange-press: #E04600;
  --r-on-orange: #111110;
  --r-orange-text: #B83A00;
  --r-orange-wash: #FFE9DE;
  --r-sticker: #FFDD00;
  --r-on-sticker: #111110;
  --r-ok: #0B7A43;
  --r-ok-wash: #E2F3E9;
  --r-bad: #D0281E;
  --r-bad-wash: #FDE7E5;
  --r-wait: #9A5B00;
  --r-wait-wash: #FFF1D6;
  --r-scrim: rgba(17, 17, 16, .48);

  --r-font: 'Sofia Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --r-font-x: 'Sofia Sans Extra Condensed', 'Sofia Sans', system-ui, sans-serif;
  --r-font-modern: 'Unbounded', 'Sofia Sans', system-ui, sans-serif;
  --r-font-classic: 'Prata', Georgia, serif;
  --r-band: 2px;
  --r-chamfer: 10px;
  --r-ease: cubic-bezier(.32, .72, 0, 1);
  --r-gutter: 16px;

  --mk-page: var(--r-paper);
  --mk-card: var(--r-paper);
  --mk-raised: var(--r-paper);
  --mk-sunk: var(--r-well);
  --mk-well: var(--r-well);
  --mk-cat: var(--r-paper);
  --mk-ink: var(--r-ink);
  --mk-ink-2: var(--r-ink-2);
  --mk-ink-3: var(--r-ink-3);
  --mk-line: var(--r-rule);
  --mk-chevron: var(--r-ink-3);
  --mk-brand: var(--r-ink);
  --mk-brand-2: var(--r-n7);
  --mk-brand-soft: var(--r-well);
  --mk-on-brand: var(--r-paper);
  --mk-sale: var(--r-bad);
  --mk-sale-soft: var(--r-bad-wash);
  --mk-ok: var(--r-ok);
  --mk-ok-soft: var(--r-ok-wash);
  --mk-warn: var(--r-wait);
  --mk-r-sm: 0px;
  --mk-r-md: 0px;
  --mk-r-lg: 0px;
  --mk-shadow: 0 0 0 1px var(--r-rule);
  --mk-shadow-up: 0 calc(-1 * var(--r-band)) 0 var(--r-ink);
  --mk-sheet: 0 calc(-1 * var(--r-band)) 0 var(--r-ink);
  --mk-ease: var(--r-ease);
  --font-sans: var(--r-font);

  background: var(--r-paper) !important;
  color: var(--r-ink);
  caret-color: var(--r-orange);
  accent-color: var(--r-orange);
}

html[data-theme="dark"] #phone-container[data-ui] {
  --r-n0: #121211; --r-n1: #1B1B1A; --r-n2: #252523; --r-n3: #363632; --r-n4: #5E5E59;
  --r-n5: #A09F99; --r-n6: #C4C3BD; --r-n7: #DCDBD6; --r-n8: #ECECE8; --r-n9: #F6F6F2;
  --r-orange: #FF6526;
  --r-orange-press: #FF7B45;
  --r-orange-text: #FF8A57;
  --r-orange-wash: #3A1E12;
  --r-ok: #34C27A;
  --r-ok-wash: #12301F;
  --r-bad: #FF5A4E;
  --r-bad-wash: #3A1714;
  --r-wait: #F2B14C;
  --r-wait-wash: #33260F;
  --r-scrim: rgba(0, 0, 0, .62);
}
```

- [ ] **Step 4: Write `base.css`** (global transforms and browser surfaces):

```css
/* Global transforms: one type family, square corners, rules instead of soft shadows, themed browser surfaces. */
#phone-container[data-ui],
#phone-container[data-ui] * { font-family: var(--r-font) !important; }
#phone-container[data-ui] :is(.r-x, .r-x *) { font-family: var(--r-font-x) !important; }
#phone-container[data-ui] .r-caps { text-transform: uppercase; }
#phone-container[data-ui] .r-num { font-variant-numeric: tabular-nums lining-nums; }

#phone-container[data-ui] :is(.rounded, .rounded-sm, .rounded-md, .rounded-lg, .rounded-xl, .rounded-2xl, .rounded-3xl,
  [class*="rounded-["], [class*="rounded-t-"], [class*="rounded-b-"], [class*="rounded-l-"], [class*="rounded-r-"],
  [class*="rounded-tl-"], [class*="rounded-tr-"], [class*="rounded-bl-"], [class*="rounded-br-"]) { border-radius: 0 !important; }
#phone-container[data-ui] :is(.shadow-sm, .shadow, .shadow-md, .shadow-lg, .shadow-xl, .shadow-2xl) { box-shadow: 0 0 0 1px var(--r-rule) !important; }

#phone-container[data-ui] ::selection { background: var(--r-orange); color: var(--r-on-orange); }
#phone-container[data-ui] :focus-visible { outline: 2px solid var(--r-orange) !important; outline-offset: 2px !important; }
#phone-container[data-ui] * { scrollbar-width: thin; scrollbar-color: var(--r-n4) transparent; }
#phone-container[data-ui] a { text-underline-offset: 3px; text-decoration-thickness: 1px; }

/* the Liquid Glass layer is retired: controls are solid */
#phone-container[data-ui] .lg { background: transparent !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; box-shadow: none !important; border-radius: 0 !important; }
#phone-container[data-ui] .lg::before { content: none !important; }
#phone-container[data-ui] .home-aurora { display: none !important; }

/* legacy primary fills become the orange next action; legacy brand text becomes orange text */
#phone-container[data-ui] :is(.bg-\[\#1e6091\], .bg-\[\#1c3a34\], .bg-blue-600, .bg-blue-500) { background: var(--r-orange) !important; color: var(--r-on-orange) !important; }
#phone-container[data-ui] :is(.bg-\[\#1e6091\], .bg-\[\#1c3a34\], .bg-blue-600, .bg-blue-500) :is(.text-white, svg) { color: var(--r-on-orange) !important; }
#phone-container[data-ui] :is(.text-\[\#1e6091\], .text-blue-600, .text-blue-500) { color: var(--r-orange-text) !important; }
```

Before writing the `.lg::before` rule, read `src/app/styles/glass.css` and confirm which pseudo-elements the glass recipe uses; neutralise exactly those and nothing that another component relies on. Read `market.css:146-245` and `glass.css:499-573`; add to the legacy block any old brand class not listed above.

- [ ] **Step 5: Write `chrome.css`** (header, search, tab bar):

```css
#phone-container[data-ui] #app-header { background: var(--r-paper) !important; border-bottom: 0 !important; box-shadow: none !important; padding-bottom: 10px !important; }
#phone-container[data-ui] .lg-brand { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
#phone-container[data-ui] .lg-wordmark { display: inline-flex; align-items: stretch; font-family: var(--r-font-x) !important; font-weight: 900; font-size: 30px; line-height: 1; text-transform: uppercase; color: var(--r-ink); }
#phone-container[data-ui] .lg-wordmark b { margin-left: 4px; padding: 3px 12px 0 7px; background: var(--r-orange); color: var(--r-on-orange) !important; font-weight: 900; clip-path: polygon(0 0, calc(100% - var(--r-chamfer)) 0, 100% var(--r-chamfer), 100% 100%, 0 100%); }
#phone-container[data-ui] .lg-tagline { font-size: 12px; font-weight: 500; color: var(--r-ink-3); }
#phone-container[data-ui] #app-header .lg--circle { width: 44px; height: 44px; display: grid; place-items: center; color: var(--r-ink); background: transparent !important; }
#phone-container[data-ui] #app-header .lg--circle svg { width: 24px; height: 24px; }
#phone-container[data-ui] #app-header .lg--circle:active { background: var(--r-well) !important; }
#phone-container[data-ui] .lg-dot { position: absolute; top: 9px; right: 9px; width: 8px; height: 8px; border-radius: 0 !important; background: var(--r-orange) !important; box-shadow: 0 0 0 2px var(--r-paper) !important; }

#phone-container[data-ui] .lg-search { gap: 0 !important; }
#phone-container[data-ui] #search-input { height: 48px; padding-left: 44px !important; background: var(--r-paper) !important; border: 2px solid var(--r-ink) !important; border-right: 0 !important; border-radius: 0 !important; font-size: 16px !important; color: var(--r-ink) !important; box-shadow: none !important; }
#phone-container[data-ui] #search-input::placeholder { color: var(--r-ink-3) !important; }
#phone-container[data-ui] #search-input:focus { outline: none !important; border-color: var(--r-orange) !important; }
#phone-container[data-ui] .lg-search .absolute { color: var(--r-ink) !important; }
#phone-container[data-ui] .lg-search-filter { width: 48px !important; height: 48px !important; background: var(--r-ink) !important; color: var(--r-paper) !important; border-radius: 0 !important; }

#phone-container[data-ui] #app-tabbar { left: 0 !important; right: 0 !important; bottom: 0 !important; height: calc(60px + env(safe-area-inset-bottom)) !important; padding: 0 0 env(safe-area-inset-bottom) !important; margin: 0 !important; border-radius: 0 !important; background: var(--r-paper) !important; border-top: var(--r-band) solid var(--r-ink) !important; box-shadow: none !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; }
#phone-container[data-ui] #app-tabbar > button { color: var(--r-ink-3) !important; }
#phone-container[data-ui] #app-tabbar > button.text-blue-600 { color: var(--r-ink) !important; }
#phone-container[data-ui] #app-tabbar > button > span:not(#cart-badge) { font-size: 11px !important; font-weight: 600 !important; }
#phone-container[data-ui] #app-tabbar > button > svg { width: 24px; height: 24px; }
#phone-container[data-ui] #app-tabbar > button > svg path { stroke-width: 1.75; }
#phone-container[data-ui] #app-tabbar .tab-lens { position: absolute; top: calc(-1 * var(--r-band) - 1px); left: 0; height: 5px; background: transparent !important; box-shadow: none !important; border: 0 !important; border-radius: 0 !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; animation: none !important; transition: translate .38s var(--r-ease), width .38s var(--r-ease) !important; }
#phone-container[data-ui] #app-tabbar .tab-lens::after { content: ''; position: absolute; inset: 0 24%; background: var(--r-orange); }
#phone-container[data-ui] #cart-badge { border-radius: 0 !important; background: var(--r-orange) !important; color: var(--r-on-orange) !important; font-family: var(--r-font-x) !important; font-size: 12px !important; font-weight: 900 !important; min-width: 18px !important; height: 18px !important; }
```

Header markup: change the wordmark span to `<span class="lg-wordmark">Супер<b>Апп</b></span>` (no hyphen; the parent keeps `aria-label="Супер-Апп"`). Read `glass.css:144-179` and `glass.css:370-422` first and override any property they set that these rules do not cover (e.g. inset margins of the floating capsule).

- [ ] **Step 6: Write `components.css`** (primitives every later task uses):

```css
#phone-container[data-ui] .r-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; margin: 0 var(--r-gutter); padding: 12px 0 10px; border-top: var(--r-band) solid var(--r-ink); }
#phone-container[data-ui] .r-head__t { margin: 0; font-family: var(--r-font-x) !important; font-weight: 800; font-size: 26px; line-height: .95; text-transform: uppercase; color: var(--r-ink); }
#phone-container[data-ui] .r-head__a { display: inline-flex; align-items: center; gap: 4px; min-height: 32px; font-size: 14px; font-weight: 600; color: var(--r-ink); }

#phone-container[data-ui] .r-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 48px; padding: 0 20px; border: 0; border-radius: 0 !important; font-size: 16px; font-weight: 700; line-height: 1; white-space: nowrap; cursor: pointer; transition: background-color .15s var(--r-ease), transform .15s var(--r-ease); }
#phone-container[data-ui] .r-btn:active { transform: translateY(1px); }
#phone-container[data-ui] .r-btn--primary { background: var(--r-orange); color: var(--r-on-orange); }
#phone-container[data-ui] .r-btn--primary:active { background: var(--r-orange-press); }
#phone-container[data-ui] .r-btn--primary:focus-visible { outline-color: var(--r-ink) !important; }
#phone-container[data-ui] .r-btn--ink { background: var(--r-ink); color: var(--r-paper); }
#phone-container[data-ui] .r-btn--line { background: var(--r-paper); color: var(--r-ink); box-shadow: inset 0 0 0 2px var(--r-ink); }
#phone-container[data-ui] .r-btn--sm { height: 40px; padding: 0 14px; font-size: 14px; }
#phone-container[data-ui] .r-btn--block { display: flex; width: 100%; }
#phone-container[data-ui] .r-btn:disabled { background: var(--r-sunk); color: var(--r-ink-4); box-shadow: none; cursor: default; }

#phone-container[data-ui] .r-chip { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 12px; border: 0; border-radius: 0 !important; background: var(--r-paper); color: var(--r-ink); box-shadow: inset 0 0 0 1px var(--r-ink); font-size: 14px; font-weight: 600; white-space: nowrap; cursor: pointer; }
#phone-container[data-ui] :is(.r-chip.is-on, .r-chip[aria-pressed="true"]) { background: var(--r-ink); color: var(--r-paper); }
#phone-container[data-ui] .r-chip small { font-size: 12px; font-weight: 500; opacity: .72; }

#phone-container[data-ui] .r-sticker { display: inline-flex; align-items: center; height: 22px; padding: 1px 12px 0 6px; background: var(--r-sticker); color: var(--r-on-sticker); font-family: var(--r-font-x) !important; font-weight: 900; font-size: 16px; line-height: 1; clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%); }
#phone-container[data-ui] .r-sticker--new { background: var(--r-ink); color: var(--r-paper); }

#phone-container[data-ui] .r-spine { display: flex; align-items: center; gap: 6px; min-height: 26px; padding: 0 10px; border: 0; background: var(--spine, var(--r-ink)); color: var(--on-spine, var(--r-paper)); font-family: var(--r-font-x) !important; font-weight: 800; font-size: 14px; line-height: 1; text-transform: uppercase; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

#phone-container[data-ui] .r-price { display: flex; align-items: baseline; flex-wrap: wrap; gap: 0 6px; font-family: var(--r-font-x) !important; font-variant-numeric: tabular-nums lining-nums; color: var(--r-ink); }
#phone-container[data-ui] .r-price b { font-weight: 900; font-size: 28px; line-height: 1; }
#phone-container[data-ui] .r-price i { font-style: normal; font-weight: 800; font-size: 20px; }
#phone-container[data-ui] .r-price s { font-weight: 700; font-size: 16px; color: var(--r-ink-3); text-decoration-thickness: 1.5px; }

#phone-container[data-ui] .r-input { width: 100%; height: 48px; padding: 0 14px; background: var(--r-paper); color: var(--r-ink); border: 2px solid var(--r-ink); border-radius: 0 !important; font-size: 16px; }
#phone-container[data-ui] .r-input:focus { outline: none; border-color: var(--r-orange); }
#phone-container[data-ui] .r-input::placeholder { color: var(--r-ink-3); }

#phone-container[data-ui] .r-pict { display: grid; justify-items: center; align-content: start; gap: 6px; text-align: center; font-size: 12px; font-weight: 600; line-height: 1.2; color: var(--r-ink); }
#phone-container[data-ui] .r-pict > i { display: grid; place-items: center; width: 48px; height: 48px; box-shadow: inset 0 0 0 1.5px currentColor; }
#phone-container[data-ui] .r-pict svg { width: 26px; height: 26px; }

#phone-container[data-ui] .r-back { display: inline-grid; place-items: center; width: 40px; height: 40px; border: 0; border-radius: 0 !important; background: var(--r-paper); color: var(--r-ink); box-shadow: inset 0 0 0 2px var(--r-ink); }
#phone-container[data-ui] .r-plate { display: inline-flex; align-items: center; padding: 2px 12px 0 7px; background: var(--r-orange); color: var(--r-on-orange); font-family: var(--r-font-x) !important; font-weight: 900; text-transform: uppercase; clip-path: polygon(0 0, calc(100% - var(--r-chamfer)) 0, 100% var(--r-chamfer), 100% 100%, 0 100%); }
```

- [ ] **Step 7: Wire the layer.** `range/index.css` imports in order: `tokens.css`, `fonts.css`, `base.css`, `chrome.css`, `components.css`, `cells.css`, `home.css`, `catalog.css`, `product.css`, `cart.css`, `profile.css`, `sheets.css`, `storefront.css`, `stage.css`. Add `import './styles/range/index.css';` as the last style import in `src/app/main.ts`.

- [ ] **Step 8: Verify.** `npm run build` (fonts present in `dist/fonts/`, CSS URLs resolve), `npm test` green. Capture 390×844 light and dark screenshots of home and catalogue with the baseline script (`/private/tmp/claude-501/-Users-User-Desktop-mobpril/18df559a-69a2-458c-9120-d23ed05140f0/scratchpad/baseline/`); confirm: Sofia Sans everywhere, wordmark plate, square search with black key, solid tab bar with 2px ink rule and the orange marker under the active tab moving between tabs, no glass anywhere, dark theme readable.

- [ ] **Step 9: Commit** `Foundation of «Линейка»: self-hosted Sofia Sans, tokens, solid chrome, primitives`.

---

### Task 2: Storefront core (pure TypeScript, TDD)

**Files:**
- Create: `src/shared/storefront/types.ts`, `color.ts`, `kind.ts`, `presets.ts`, `resolve.ts`, `filters.ts`, `calculator.ts`, `index.ts`
- Modify: `src/shared/domain/types.ts` (Product `attrs`, Shop `storefront`; re-export storefront types)
- Test: `tests/unit/storefront.test.ts`

**Interfaces (produced, exact):**

```ts
// types.ts
export type StoreKind = 'mixtures' | 'kitchens' | 'furniture' | 'general';
export type StoreGround = 'stock' | 'tint' | 'black';
export type StoreVoice = 'industrial' | 'modern' | 'classic';
export type CoverStyle = 'split' | 'full' | 'field';
export interface StorefrontTheme { ink: string; ground: StoreGround; voice: StoreVoice; cover: CoverStyle }
export interface StoreFilterDef { key: string; label: string; type: 'chips' | 'range'; unit?: string }
export type BlockType = 'cover' | 'services' | 'categories' | 'catalog' | 'lookbook' | 'steps' | 'swatches'
  | 'calculator' | 'promo' | 'gallery' | 'about' | 'addresses' | 'managers' | 'terms';
interface BlockBase<T extends BlockType> { id: string; type: T; on: boolean; title?: string; example?: boolean }
export interface CategoryItem { label: string; key: string; value: string; image?: string }
export interface LookbookPin { x: number; y: number; productId: string }
export interface StepItem { title: string; text: string }
export interface SwatchItem { name: string; color?: string; image?: string; note?: string }
export type CoverBlock = BlockBase<'cover'> & { line?: string; image?: string };
export type CategoriesBlock = BlockBase<'categories'> & { items: CategoryItem[] };
export type LookbookBlock = BlockBase<'lookbook'> & { image: string; text?: string; pins: LookbookPin[] };
export type StepsBlock = BlockBase<'steps'> & { items: StepItem[] };
export type SwatchesBlock = BlockBase<'swatches'> & { items: SwatchItem[] };
export type PromoBlock = BlockBase<'promo'> & { text: string; image?: string; sticker?: string; productId?: string };
export type AboutBlock = BlockBase<'about'> & { text?: string };
export type PlainBlock = BlockBase<'services' | 'catalog' | 'calculator' | 'gallery' | 'addresses' | 'managers' | 'terms'>;
export type StorefrontBlock = CoverBlock | CategoriesBlock | LookbookBlock | StepsBlock | SwatchesBlock | PromoBlock | AboutBlock | PlainBlock;
export interface Storefront { kind: StoreKind; theme: StorefrontTheme; blocks: StorefrontBlock[]; filters: StoreFilterDef[]; demo: boolean }
export interface SavedStorefront { kind?: StoreKind; theme?: Partial<StorefrontTheme>; blocks?: unknown[]; filters?: unknown[]; demo?: boolean }
export interface ShopLike { name: string; category?: unknown; storefront?: SavedStorefront | null; [field: string]: unknown }
export interface ProductLike { id: string; store?: string; category?: unknown; price?: string | number; badge?: unknown; brand?: unknown; attrs?: Record<string, string | number>; [field: string]: unknown }
```

```ts
// color.ts
export const INK_DARK = '#111110';
export const INK_LIGHT = '#FFFFFF';
export const FAMILY_INKS: readonly { name: string; hex: string }[];
export function normalizeHex(input: unknown): string | null;
export function relativeLuminance(hex: string): number;
export function contrastRatio(a: string, b: string): number;
export function onInk(hex: string): string;
export function mixHex(a: string, b: string, t: number): string;
export function inkFor(name: string): string;
// kind.ts
export const STORE_KINDS: readonly StoreKind[];
export function isStoreKind(v: unknown): v is StoreKind;
export function storeKindOf(shop: { category?: unknown; storefront?: { kind?: unknown } | null }): StoreKind;
// presets.ts
export const BLOCK_TYPES: readonly BlockType[];
export const REQUIRED_BLOCKS: readonly BlockType[];
export const KIND_LABELS: Record<StoreKind, string>;
export const BLOCK_LABELS: Record<BlockType, string>;
export function presetFilters(kind: StoreKind): StoreFilterDef[];
export function presetTheme(kind: StoreKind, storeName: string): StorefrontTheme;
export function newBlock(type: BlockType, id?: string): StorefrontBlock;
export function presetBlocks(kind: StoreKind): StorefrontBlock[];
// resolve.ts
export function normalizeBlock(raw: unknown): StorefrontBlock | null;
export function resolveStorefront(shop: ShopLike, products?: readonly ProductLike[]): Storefront;
// filters.ts
export interface FacetValue { value: string; count: number }
export type Facet = { def: StoreFilterDef; type: 'chips'; values: FacetValue[] } | { def: StoreFilterDef; type: 'range'; min: number; max: number };
export type RangeSel = { min?: number; max?: number };
export type FilterState = Record<string, string[] | RangeSel>;
export type SortKey = 'popular' | 'cheap' | 'expensive' | 'new';
export function toNumber(v: unknown): number | null;
export function productValue(p: ProductLike, key: string): string | number | undefined;
export function buildFacets(products: readonly ProductLike[], defs: readonly StoreFilterDef[]): Facet[];
export function applyFilters<T extends ProductLike>(products: readonly T[], defs: readonly StoreFilterDef[], state: FilterState): T[];
export function activeCount(state: FilterState): number;
export function sortProducts<T extends ProductLike>(products: readonly T[], key: SortKey): T[];
// calculator.ts
export const ATTR_RATE = 'Расход, кг/м²·мм';
export const ATTR_BAG = 'Фасовка, кг';
export interface MixSpec { rate: number; bagKg: number }
export function mixSpecOf(p: ProductLike): MixSpec | null;
export function calcBags(areaM2: number, layerMm: number, spec: MixSpec, reservePct?: number): { kg: number; bags: number };
```

- [ ] **Step 1: Write the failing tests** — `tests/unit/storefront.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  FAMILY_INKS, INK_DARK, INK_LIGHT, contrastRatio, inkFor, mixHex, normalizeHex, onInk,
  storeKindOf, REQUIRED_BLOCKS, presetBlocks, presetFilters, presetTheme, newBlock,
  resolveStorefront, normalizeBlock, buildFacets, applyFilters, activeCount, sortProducts, productValue, toNumber,
  mixSpecOf, calcBags,
} from '../../src/shared/storefront';
import type { ProductLike, StoreKind } from '../../src/shared/storefront';

describe('colour', () => {
  it('normalises hex', () => {
    expect(normalizeHex('#ffc20e')).toBe('#FFC20E');
    expect(normalizeHex('abc')).toBe('#AABBCC');
    expect(normalizeHex(' #0F6A3C ')).toBe('#0F6A3C');
    for (const bad of ['', 'red', '#12', '#GGGGGG', null, 42]) expect(normalizeHex(bad)).toBeNull();
  });
  it('picks black text on yellow and white text on deep green', () => {
    expect(onInk('#FFC20E')).toBe(INK_DARK);
    expect(onInk('#0F6A3C')).toBe(INK_LIGHT);
  });
  it('every family ink reads at AA with its on-ink colour', () => {
    for (const { hex } of FAMILY_INKS) expect(contrastRatio(hex, onInk(hex))).toBeGreaterThanOrEqual(4.5);
  });
  it('family inks never include the platform orange', () => {
    expect(FAMILY_INKS.map((i) => i.hex)).not.toContain('#FE5000');
  });
  it('mixes linearly', () => {
    expect(mixHex('#000000', '#FFFFFF', 0)).toBe('#000000');
    expect(mixHex('#000000', '#FFFFFF', 1)).toBe('#FFFFFF');
    expect(mixHex('#000000', '#FFFFFF', 0.5)).toBe('#808080');
  });
  it('gives a stable ink from the family set', () => {
    expect(inkFor('Постройка')).toBe(inkFor('  постройка '));
    expect(FAMILY_INKS.map((i) => i.hex)).toContain(inkFor('Кровельщик'));
    const inks = new Set(['Кровельщик', 'Рио+', 'Дары леса', 'Самоделкин', 'Вудстул', 'Мир Плитки', 'Дом сантехники', 'Hess stroy'].map(inkFor));
    expect(inks.size).toBeGreaterThanOrEqual(4);
  });
});

describe('store kind', () => {
  it.each<[string, StoreKind]>([
    ['Кухни', 'kitchens'], ['Мебель', 'furniture'], ['Товары для дома', 'furniture'],
    ['Стройматериалы', 'mixtures'], ['Отделка', 'mixtures'], ['Сантехника', 'mixtures'], ['Двери', 'mixtures'],
    ['Строительство', 'mixtures'], ['Ландшафт', 'general'], ['', 'general'],
  ])('%s → %s', (category, kind) => expect(storeKindOf({ category })).toBe(kind));
  it('a saved kind wins over the category', () => {
    expect(storeKindOf({ category: 'Мебель', storefront: { kind: 'kitchens' } })).toBe('kitchens');
    expect(storeKindOf({ category: 'Мебель', storefront: { kind: 'boats' } })).toBe('furniture');
  });
});

describe('presets', () => {
  it.each<StoreKind>(['mixtures', 'kitchens', 'furniture', 'general'])('%s preset holds the whole skeleton', (kind) => {
    const types = presetBlocks(kind).map((b) => b.type);
    for (const t of REQUIRED_BLOCKS) expect(types).toContain(t);
    expect(types[0]).toBe('cover');
    expect(presetFilters(kind).slice(-1)[0]).toEqual({ key: 'price', label: 'Цена', type: 'range', unit: '₽' });
  });
  it('kitchens get example process steps', () => {
    const steps = presetBlocks('kitchens').find((b) => b.type === 'steps');
    expect(steps && steps.type === 'steps' && steps.items.length).toBe(4);
    expect(steps?.example).toBe(true);
  });
  it('themes per kind', () => {
    expect(presetTheme('kitchens', 'X')).toMatchObject({ ground: 'black', voice: 'modern', cover: 'full' });
    expect(presetTheme('mixtures', 'X')).toMatchObject({ ground: 'stock', voice: 'industrial', cover: 'field' });
    expect(presetTheme('furniture', 'X')).toMatchObject({ ground: 'tint', voice: 'classic', cover: 'split' });
    expect(presetTheme('general', 'X').ink).toBe(inkFor('X'));
  });
  it('new blocks carry empty content arrays', () => {
    expect(newBlock('lookbook')).toEqual({ id: 'lookbook-1', type: 'lookbook', on: true, image: '', pins: [] });
    expect(newBlock('promo', 'p9')).toEqual({ id: 'p9', type: 'promo', on: true, text: '' });
  });
});

describe('resolveStorefront', () => {
  const products: ProductLike[] = [
    { id: 'a', store: 'Тест', category: 'спальня', price: '10 000 ₽' },
    { id: 'b', store: 'Тест', category: 'гостиная', price: '20 000 ₽' },
    { id: 'c', store: 'Другой', category: 'кухня', price: '5 ₽' },
  ];
  it('a shop without a storefront gets its kind preset', () => {
    const sf = resolveStorefront({ name: 'Тест', category: 'Мебель' }, products);
    expect(sf.kind).toBe('furniture');
    expect(sf.blocks.map((b) => b.type)).toEqual(presetBlocks('furniture').map((b) => b.type));
    expect(sf.demo).toBe(false);
  });
  it('derives categories from the store\'s own products only', () => {
    const sf = resolveStorefront({ name: 'Тест', category: 'Мебель' }, products);
    const cat = sf.blocks.find((b) => b.type === 'categories');
    expect(cat && cat.type === 'categories' && cat.items).toEqual([
      { label: 'Спальня', key: 'category', value: 'спальня' },
      { label: 'Гостиная', key: 'category', value: 'гостиная' },
    ]);
  });
  it('repairs a garbage theme field by field', () => {
    const sf = resolveStorefront({ name: 'Тест', category: 'Мебель', storefront: { theme: { ink: 'nope', ground: 'black', voice: 'loud' as never, cover: 'split' } } });
    expect(sf.theme).toEqual({ ink: inkFor('Тест'), ground: 'black', voice: 'classic', cover: 'split' });
  });
  it('re-adds missing required blocks, forces them on and puts the cover first', () => {
    const sf = resolveStorefront({ name: 'Тест', storefront: { blocks: [
      { id: 'g', type: 'gallery', on: false },
      { id: 'm', type: 'managers', on: false },
      { id: 'c', type: 'cover', on: false },
      { id: 'x', type: 'teleport', on: true },
      'junk',
    ] } });
    const types = sf.blocks.map((b) => b.type);
    expect(types[0]).toBe('cover');
    for (const t of REQUIRED_BLOCKS) expect(types).toContain(t);
    expect(types).not.toContain('teleport' as never);
    expect(sf.blocks.find((b) => b.type === 'managers')?.on).toBe(true);
    expect(sf.blocks.find((b) => b.type === 'cover')?.on).toBe(true);
    expect(sf.blocks.find((b) => b.type === 'gallery')?.on).toBe(false);
  });
  it('makes duplicate ids unique', () => {
    const sf = resolveStorefront({ name: 'Тест', storefront: { blocks: [
      { id: 'p', type: 'promo', on: true, text: 'a' }, { id: 'p', type: 'promo', on: true, text: 'b' },
    ] } });
    const ids = sf.blocks.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('fills missing content arrays instead of crashing', () => {
    expect(normalizeBlock({ id: 'l', type: 'lookbook' })).toEqual({ id: 'l', type: 'lookbook', on: true, image: '', pins: [] });
    expect(normalizeBlock({ type: 'steps', on: 'yes' })).toMatchObject({ type: 'steps', on: true, items: [] });
    expect(normalizeBlock({ id: 1, type: 'about', on: false })).toMatchObject({ id: 'about-1', type: 'about', on: false });
    expect(normalizeBlock(null)).toBeNull();
  });
  it('uses saved filters when valid, the preset otherwise', () => {
    const own = [{ key: 'Цвет', label: 'Цвет', type: 'chips' as const }];
    expect(resolveStorefront({ name: 'Тест', category: 'Мебель', storefront: { filters: own } }).filters).toEqual(own);
    expect(resolveStorefront({ name: 'Тест', category: 'Мебель', storefront: { filters: [{ key: 1 }] } }).filters).toEqual(presetFilters('furniture'));
  });
});

describe('filters', () => {
  const items: ProductLike[] = [
    { id: '1', price: '520 ₽', attrs: { 'Тип': 'Штукатурка', 'Основа': 'гипс', 'Фасовка, кг': 30 } },
    { id: '2', price: '430 ₽', attrs: { 'Тип': 'Штукатурка', 'Основа': 'цемент', 'Фасовка, кг': 25 } },
    { id: '3', price: '760 ₽', badge: 'new', attrs: { 'Тип': 'Шпаклёвка', 'Основа': 'полимер', 'Фасовка, кг': 20 } },
    { id: '4', price: 'договорная', attrs: { 'Тип': 'Грунтовка' } },
  ];
  const defs = [
    { key: 'Тип', label: 'Тип', type: 'chips' as const },
    { key: 'Фасовка, кг', label: 'Фасовка', type: 'chips' as const, unit: 'кг' },
    { key: 'Бренд', label: 'Бренд', type: 'chips' as const },
    { key: 'price', label: 'Цена', type: 'range' as const, unit: '₽' },
  ];
  it('reads values: price, store, category, attrs, imported brand', () => {
    expect(productValue(items[0], 'price')).toBe(520);
    expect(productValue(items[3], 'price')).toBeUndefined();
    expect(productValue({ id: 'x', store: 'S', category: 'c' }, 'store')).toBe('S');
    expect(productValue({ id: 'x', brand: 'Волма' }, 'Бренд')).toBe('Волма');
    expect(toNumber('1,5')).toBe(1.5);
    expect(toNumber('abc')).toBeNull();
  });
  it('builds facets, dropping one-value chips and flat ranges', () => {
    const facets = buildFacets(items, defs);
    expect(facets.map((f) => f.def.key)).toEqual(['Тип', 'Фасовка, кг', 'price']);
    const type = facets[0];
    expect(type.type === 'chips' && type.values[0]).toEqual({ value: 'Штукатурка', count: 2 });
    const pack = facets[1];
    expect(pack.type === 'chips' && pack.values.map((v) => v.value)).toEqual(['20', '25', '30']);
    expect(facets[2]).toMatchObject({ type: 'range', min: 430, max: 760 });
  });
  it('applies chips, ranges and keys outside the defs', () => {
    expect(applyFilters(items, defs, { 'Тип': ['Штукатурка'] }).map((p) => p.id)).toEqual(['1', '2']);
    expect(applyFilters(items, defs, { price: { min: 500 } }).map((p) => p.id)).toEqual(['1', '3']);
    expect(applyFilters(items, defs, { price: {} }).map((p) => p.id)).toEqual(['1', '2', '3', '4']);
    expect(applyFilters(items, defs, { 'Основа': ['гипс'] }).map((p) => p.id)).toEqual(['1']);
    expect(applyFilters(items, defs, { 'Тип': [] }).length).toBe(4);
    expect(activeCount({ 'Тип': ['a'], price: { max: 3 }, 'Цвет': [], x: {} })).toBe(2);
  });
  it('sorts; unknown prices go last', () => {
    expect(sortProducts(items, 'cheap').map((p) => p.id)).toEqual(['2', '1', '3', '4']);
    expect(sortProducts(items, 'expensive').map((p) => p.id)).toEqual(['3', '1', '2', '4']);
    expect(sortProducts(items, 'new').map((p) => p.id)).toEqual(['3', '1', '2', '4']);
    expect(sortProducts(items, 'popular').map((p) => p.id)).toEqual(['1', '2', '3', '4']);
  });
});

describe('calculator', () => {
  it('reads a mix spec only when both numbers are there', () => {
    expect(mixSpecOf({ id: 'a', attrs: { 'Расход, кг/м²·мм': '0,9', 'Фасовка, кг': 30 } })).toEqual({ rate: 0.9, bagKg: 30 });
    expect(mixSpecOf({ id: 'b', attrs: { 'Фасовка, кг': 30 } })).toBeNull();
    expect(mixSpecOf({ id: 'c' })).toBeNull();
  });
  it('20 m² × 10 mm of gypsum plaster at 0.9 kg with 10% reserve → 198 kg → 7 bags of 30 kg', () => {
    expect(calcBags(20, 10, { rate: 0.9, bagKg: 30 })).toEqual({ kg: 198, bags: 7 });
    expect(calcBags(20, 10, { rate: 0.9, bagKg: 30 }, 0)).toEqual({ kg: 180, bags: 6 });
  });
  it('nonsense input gives zero, not NaN', () => {
    for (const [a, l] of [[0, 10], [-5, 10], [Number.NaN, 10], [10, 0]]) expect(calcBags(a, l, { rate: 1, bagKg: 25 })).toEqual({ kg: 0, bags: 0 });
  });
});
```

- [ ] **Step 2: Run** `npx vitest run tests/unit/storefront.test.ts` — expect FAIL (module not found).

- [ ] **Step 3: Implement.** Use exactly these data and behaviours:

`color.ts`:
```ts
export const INK_DARK = '#111110';
export const INK_LIGHT = '#FFFFFF';
/** Store and section inks. Orange 021 (#FE5000) is the platform's own ink and is not part of this set. */
export const FAMILY_INKS: readonly { name: string; hex: string }[] = [
  { name: 'Синий', hex: '#0067B1' }, { name: 'Зелёный', hex: '#00753A' }, { name: 'Жёлтый', hex: '#FFC20E' },
  { name: 'Красный', hex: '#D7261E' }, { name: 'Фиолетовый', hex: '#6D2C91' }, { name: 'Бирюзовый', hex: '#00A19A' },
  { name: 'Графит', hex: '#3A3A38' }, { name: 'Бронза', hex: '#A8803F' }, { name: 'Небесный', hex: '#3AA0DB' },
  { name: 'Малиновый', hex: '#C2185B' },
];
export function normalizeHex(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(input.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1];
  return `#${h.toUpperCase()}`;
}
function channels(hex: string): [number, number, number] {
  const h = normalizeHex(hex);
  if (!h) throw new Error(`not a colour: ${hex}`);
  return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}
export function relativeLuminance(hex: string): number {
  const [r, g, b] = channels(hex).map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
/** Text colour on a field of `hex`: process black or white, whichever reads better. */
export function onInk(hex: string): string {
  return contrastRatio(hex, INK_DARK) >= contrastRatio(hex, INK_LIGHT) ? INK_DARK : INK_LIGHT;
}
/** Linear mix: t = 0 → a, t = 1 → b. */
export function mixHex(a: string, b: string, t: number): string {
  const k = Math.min(1, Math.max(0, t));
  const ca = channels(a), cb = channels(b);
  return `#${ca.map((v, i) => Math.round(v + (cb[i] - v) * k).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}
/** A stable ink for a store that has none of its own: FNV-1a of the trimmed, lower-cased name. */
export function inkFor(name: string): string {
  let h = 0x811c9dc5;
  for (const ch of name.trim().toLowerCase()) { h ^= ch.codePointAt(0)!; h = Math.imul(h, 0x01000193) >>> 0; }
  return FAMILY_INKS[h % FAMILY_INKS.length].hex;
}
```

`kind.ts`: rules tested in order — `/кухн/i` → kitchens; `/мебел|товары для дома|декор|интерьер|освещ|текстил|матрас|штор/i` → furniture; `/строй|строит|смес|отделк|плитк|кровл|сантех|инструмент|пиломат|древес|обои|ламинат|двер|материал|лакокрас|вентиляц/i` → mixtures; else general. A valid `storefront.kind` wins.

`presets.ts`:
- `BLOCK_TYPES` in the order of `BlockType`; `REQUIRED_BLOCKS = ['cover', 'about', 'services', 'catalog', 'addresses', 'managers', 'terms']`.
- `KIND_LABELS`: mixtures «Строительные смеси и материалы», kitchens «Кухни», furniture «Мебель и аксессуары», general «Другое».
- `BLOCK_LABELS`: cover «Обложка», services «Услуги», categories «Разделы магазина», catalog «Каталог и фильтры», lookbook «Образ с товарами», steps «Как мы работаем», swatches «Материалы и цвета», calculator «Калькулятор расхода», promo «Акция», gallery «Фото и видео», about «О компании», addresses «Адреса, карта и часы», managers «Менеджеры», terms «Оплата и доставка».
- Filters (price last everywhere, `{ key: 'price', label: 'Цена', type: 'range', unit: '₽' }`): mixtures Тип, Основа, Фасовка (`key 'Фасовка, кг'`, chips, unit кг), Применение, Бренд; kitchens Планировка, Стиль, Фасады, Длина (`key 'Длина, м'`, range, unit м); furniture Комната, Тип, Материал, Цвет, Ширина (`key 'Ширина, см'`, range, unit см); general price only. Chips defs have `label` = key unless stated.
- Themes: mixtures stock/industrial/field; kitchens black/modern/full; furniture tint/classic/split; general stock/modern/split; ink `inkFor(storeName)`.
- Layouts: mixtures `cover services categories calculator catalog gallery about addresses managers terms`; kitchens `cover steps catalog gallery services about addresses managers terms`; furniture `cover categories catalog gallery services about addresses managers terms`; general `cover catalog gallery services about addresses managers terms`.
- `newBlock(type, id = `${type}-1`)`: categories `{items: []}`, lookbook `{image: '', pins: []}`, steps `{items: []}`, swatches `{items: []}`, promo `{text: ''}`, others no content; all `on: true`.
- Kitchen steps (`title: 'Как мы работаем', example: true`): «Замер» — «Специалист приезжает и снимает размеры помещения.»; «Проект» — «Планировка, фасады и встроенная техника под ваши размеры.»; «Производство» — «Кухню изготавливают по согласованному проекту.»; «Доставка и монтаж» — «Привозим и собираем кухню на месте.»

`resolve.ts`: `normalizeBlock` returns null for non-objects or unknown types; otherwise `{ ...newBlock(type, id), ...raw, id, type, on }` where `id` is the raw string id or `${type}-1`, `on` is `raw.on !== false && raw.on !== 'false'` coerced to boolean (`on: false` stays false), and array fields that are not arrays are replaced by the empty default. `resolveStorefront`: theme field by field (`normalizeHex(ink) ?? preset`, enum fields validated against their allowed values), blocks = normalized saved blocks if any survive else preset; unique ids (`-2`, `-3` suffix); append missing required types as `newBlock(type, `${type}-auto`)`; required types forced `on: true`; the first cover moved to index 0; categories with no items derived from the store's own products (`p.store === shop.name`), unique by lower-cased category in product order, label capitalised, `key: 'category'`, `value` = the original category; filters = saved valid defs (`key`/`label` strings, `type` chips|range) if any else preset; `demo = saved.demo === true`; never mutate the input (clone saved blocks with `structuredClone`).

`filters.ts`: `toNumber` accepts finite numbers and numeric strings with a comma decimal; `productValue` — `price` → `parsePrice` (from `../format/price`) if > 0 else undefined; `store`, `category` → trimmed non-empty strings; other keys → `attrs[key]` when not empty, and for `Бренд` fall back to a non-empty string `brand`. `buildFacets` — chips need ≥ 2 distinct values; values all numeric → ascending numeric order, else count desc then `localeCompare(…, 'ru')`; range needs numeric values with min < max. `applyFilters` iterates the state: a key not in `defs` is treated as chips (array) or range (object); chips with an empty array or a range without bounds don't filter; a range bound excludes products without a value. `activeCount` counts keys with a non-empty array or a range with a bound. `sortProducts` is stable; cheap/expensive by `productValue(p,'price')`, products without a price last; `new` puts `badge === 'new'` first.

`calculator.ts`: `mixSpecOf` needs `toNumber(attrs[ATTR_RATE]) > 0` and `toNumber(attrs[ATTR_BAG]) > 0`; `calcBags` returns zeros for non-finite or non-positive area/layer; `kg = round1(area × layer × rate × (1 + reserve/100))` with `reservePct = 10` default; `bags = ceil(kg / bagKg)`.

`index.ts` re-exports everything. In `src/shared/domain/types.ts` add to `Product`: `attrs?: Record<string, string | number>;` and to `Shop`: `storefront?: SavedStorefront;`, plus `export type * from '../storefront/types';`.

- [ ] **Step 4: Run** `npx vitest run tests/unit/storefront.test.ts` — expect PASS; then `npm run typecheck` and `npx vitest run`.
- [ ] **Step 5: Commit** `Storefront core: kinds, presets, resolve, filters, calculator, colour (pure, tested)`.

---

### Task 3: Demo storefront data (seed)

**Files:** Modify `src/shared/legacy/seed.js` only.

**Interfaces consumed:** the `SavedStorefront`, block and filter shapes from Task 2 (copy them; Task 2 may still be in flight). Product `attrs` keys exactly as in Task 2's presets (`'Тип'`, `'Основа'`, `'Фасовка, кг'`, `'Применение'`, `'Бренд'`, `'Расход, кг/м²·мм'`, `'Планировка'`, `'Стиль'`, `'Фасады'`, `'Длина, м'`, `'Комната'`, `'Материал'`, `'Цвет'`, `'Ширина, см'`). Admin-format shop fields as the admin editor saves them (`src/admin/legacy/admin.js:691-811`): `facades[{photo,address}]`, `mapYandex`, `mapGoogle`, `hours` (7 entries Mon→Sun `{from,to,off}`), `managers[{name,role,phone,email,max,tg}]`, `payment`, `delivery`, `services[{name,on,price}]`.

- [ ] **Step 1: Read** `seed.js` (shops at 88-152, products at 19-66) and the admin editor's field formats; read how `SEED.*()` returns copies.
- [ ] **Step 2: Products.** Keep every existing product and id. Add `attrs` to the existing products of the three demo stores and add new products (ids `prod-sf-<n>`), all `status: 'published'`, price as display text (`'520 ₽'`), `category` in the existing lowercase vocabulary (`стройматериалы`, `кухня`, `спальня`, `гостиная`, `декор`, `освещение`), `description` 1–2 factual sentences:
  - **Постройка** (+7): Штукатурка гипсовая 30 кг 520 ₽ {Тип Штукатурка, Основа гипс, Фасовка 30, Применение внутренние работы, Расход 0.9}; Штукатурка цементная фасадная 25 кг 430 ₽ {Штукатурка, цемент, 25, наружные работы, 1.6}; Шпаклёвка финишная полимерная 20 кг 760 ₽ badge new {Шпаклёвка, полимер, 20, внутренние работы, 1.1}; Клей для плитки усиленный 25 кг 390 ₽ {Плиточный клей, цемент, 25, универсальное, 1.4}; Наливной пол самовыравнивающийся 20 кг 610 ₽ {Наливной пол, цемент, 20, внутренние работы, 1.6}; Грунтовка глубокого проникновения 10 л 690 ₽ {Грунтовка, акрил, универсальное}; Пескобетон М300 40 кг 280 ₽ oldPrice 320 ₽ badge sale {Сухая смесь, цемент, 40, универсальное, 2.0}. Existing cement М500 50 кг → {Цемент, цемент, 50, универсальное}; drywall → {Тип Гипсокартон}; profile → {Тип Профиль}.
  - **Кухни Дриада** (+4, existing 3 get attrs): attrs {Планировка: прямая | угловая | П-образная | с островом, Стиль: современный | классика | неоклассика | минимализм, Фасады: МДФ эмаль | МДФ плёнка | шпон дуба | пластик, 'Длина, м': 2.4–6}; prices 140 000–420 000 ₽; spread the values so every facet has ≥ 2 values.
  - **Любимый Дом** (+6, existing 3 get attrs): a sofa, an armchair, a dining table, a nightstand, a mirror, decorative pillows (accessory); attrs {Комната: Спальня | Гостиная | Прихожая | Столовая, Тип: Кровать | Шкаф | Комод | Диван | Кресло | Стол | Тумба | Зеркало | Текстиль, Материал: массив сосны | МДФ | ЛДСП | велюр | рогожка | хлопок, Цвет: белый | дуб | серый | зелёный | бежевый, 'Ширина, см'}.
  - Images: `https://images.unsplash.com/photo-<id>?w=800&q=80&auto=format&fit=crop`. Every new URL must be verified: `curl -s -o /dev/null -w '%{http_code} %{content_type}' <url>` → `200 image/jpeg` (or webp), and open each image once to confirm it shows the product type (a bag/plaster/tiling scene for mixtures, a kitchen, the furniture piece). Prefer reusing image URLs already in seed.js where they fit.
- [ ] **Step 2b: Broken and wrong photos.** `prod-1` («Кухня "KT-01"») shows a house exterior — give it a kitchen photo. Check every image URL in seed.js (`curl -s -o /dev/null -w '%{http_code}'`); replace each one that does not return 200 (known: the banners of Дом сантехники, Белая Лилия, Центр Дом, an HR avatar, several product photos; `files.meb100.ru` does not resolve) with a verified photo of the same subject. List every replacement in the report.
- [ ] **Step 3: Storefronts and admin fields** (all authored text `example: true` on blocks; shop-level example fields are listed in the commit message):
  - **Постройка**: `storefront: { kind: 'mixtures', demo: true, theme: { ink: '#FFC20E', ground: 'stock', voice: 'industrial', cover: 'field' }, blocks: [cover(line «Центр строительных материалов», image banner), services, categories(items: Штукатурки→{key 'Тип', value 'Штукатурка'}, Шпаклёвки, Плиточный клей, Наливные полы, Грунтовки, Цемент и смеси→'Цемент', image = one product image each), calculator(title «Сколько мешков нужно»), catalog, promo(example, sticker '−12%', text «Пескобетон М300 по цене 280 ₽ за мешок при заказе от 20 мешков», productId of the пескобетон), gallery, about, addresses, managers, terms] }`; `hours` Пн–Сб 08:00–19:00, Вс 09:00–17:00; one manager «Иван Смирнов», role «Менеджер по продажам», phone '+7 (900) 000-00-11', email 'sales@postroyka.example', max '+79000000011', tg 'postroyka_demo'; `payment` «Наличными или картой при получении, безналичный расчёт для организаций — через менеджера магазина.»; `delivery` «Доставка по городу в день заказа, разгрузка манипулятором.»; `services` Доставка (от 500 ₽), Разгрузка, Расчёт материалов (бесплатно); `facades` [{photo: banner, address: the shop's existing address}].
  - **Кухни Дриада**: theme `{ ink: '#B08D57', ground: 'black', voice: 'modern', cover: 'full' }`; blocks cover(line «Кухни на заказ по вашим размерам», image banner), steps (example; saved blocks replace the preset, so write the four kitchen steps out in full with the same text as Task 2's preset), lookbook(example: image = one kitchen photo, text «Кухня из этой подборки», 2–3 pins x/y in % to its kitchens), swatches(example, title «Фасады», items: «Эмаль белая матовая» #ECEAE5, «Графит софт-тач» #3B3D40, «Дуб натуральный» #B4875A, «Оливковый» #6F7552, «Синий кобальт» #24395C, «Бетон» #8E8C88), catalog, gallery, services, about, addresses, managers, terms; manager «Мария Кузнецова», «Дизайнер-консультант», '+7 (900) 000-00-22', 'design@driada.example', '+79000000022', 'driada_demo'; hours Пн–Вс 10:00–20:00; payment «Предоплата после согласования проекта, остаток — после монтажа. Оплата через менеджера салона.»; delivery «Доставка и монтаж по городу и району.»; services Замер (бесплатно), Дизайн-проект (бесплатно), Доставка, Монтаж.
  - **Любимый Дом**: theme `{ ink: '#0F6A3C', ground: 'tint', voice: 'classic', cover: 'split' }`; blocks cover(line «Мебель для дома. Собственное производство», image banner), categories(items: Спальня, Гостиная, Столовая, Прихожая → key 'Комната'), lookbook(example: a bedroom photo, pins to bed, nightstand, pillows), catalog, promo(example, sticker '−15%', text «Спальни из коллекции «Прованс»», image a bedroom photo), services, gallery, about, addresses, managers, terms; manager «Елена Орлова», «Менеджер салона», '+7 (900) 000-00-33', 'salon@ldom.example', '+79000000033', 'ldom_demo'; hours Пн–Сб 09:00–19:00, Вс выходной; payment «Оплата при получении или по договору — через менеджера салона.»; delivery «Доставка и сборка по городу.»; services Доставка, Сборка, Замер.
- [ ] **Step 4: Verify** `npm run typecheck`, `npx vitest run`, `npm run build`, then `E2E_PORT=4191 npx playwright test` — every existing e2e passes (fix only seed-count expectations that changed because products were added, and say so in the report).
- [ ] **Step 5: Commit** `Demo storefronts: Постройка, Кухни Дриада, Любимый Дом with filterable goods (example content)`.

---

### Task 4: One product cell everywhere

**Files:** create `src/app/ui/product-cell.ts`, `src/app/features/storefront/store-theme.ts`, `src/app/styles/range/cells.css`, `tests/unit/product-cell.test.ts`, `tests/e2e/cells.spec.ts`; modify `src/app/legacy-bridge.ts` (expose), `core/product.js` (`productCardHtml`, `pmMiniCard` bodies delegate), `features/home-sections.js` (rec card delegates), `core/lifehacks.js` (`lhProductCardHtml` delegates), `index.html` (class attributes of `#product-grid`, `#cat-prod-grid`, `#catalog-product-grid`, `#recommendations-container`, and the product page «Похожие»/«Недавние» containers).

**Interfaces:**
- Consumes: `resolveStorefront`, `onInk` (Task 2); `.r-price`, `.r-sticker`, `.r-spine` (Task 1).
- Produces: `storeTheme(name: string): StorefrontTheme & { onInk: string }` (reads the shop from the app's catalogue store; unknown store → preset of `general`); `productCellHtml(p: Product, s: CellState, variant?: 'grid' | 'rail' | 'mini'): string` (pure); `productCell(p: Product, variant?): string` (reads cart, favourites, store theme, `productPassport(p).unitShort` when the legacy global exists); `initProductCells(): void` registering actions `cell-cart`, `cell-fav`, `open-store` and refreshing cell button states on `app:cart-changed` / `app:favorites-changed`; legacy global `productCellHtml` = `productCell`. `open-store` calls `window.openStorefront?.(name, el)` and falls back to `openShopCatalogModal(name)`.
- `CellState = { inCart: boolean; fav: boolean; ink: string; onInk: string; goods: boolean; unit?: string }`.

Markup contract (Tasks 5–7 style around it, never re-implement it):

```html
<article class="r-cell r-cell--grid" data-product="ID" style="--spine:#FFC20E;--on-spine:#111110">
  <div class="r-cell__media"><img src="…" alt="" loading="lazy" decoding="async">
    <span class="r-sticker">−10%</span>
    <button type="button" class="r-cell__fav" data-action="cell-fav" data-product="ID" aria-label="В избранное" aria-pressed="false">svg</button>
  </div>
  <div class="r-cell__body">
    <div class="r-price"><b>189 000</b><i>₽</i><s>210 000 ₽</s></div>
    <h3 class="r-cell__title"><button type="button" class="r-cell__open" data-action="open-product" data-product="ID">Кухня «KT-01»</button></h3>
  </div>
  <button type="button" class="r-cell__cart" data-action="cell-cart" data-product="ID" aria-label="В корзину">svg</button>
  <button type="button" class="r-spine r-cell__spine" data-action="open-store" data-store="Кухни Дриада">Кухни Дриада</button>
</article>
```

Rules: price text split by `/^([\d\s .,]+)\s*₽(.*)$/` into `<b>` and `<i>₽…</i>`, otherwise the whole text in `<b>`; sticker = `−N%` when `oldPrice` parses above `price`, else «Новинка» (`r-sticker--new`) for `badge 'new'`, «Хит» for `'hit'`; `.r-cell__open::after` stretches over the cell (`inset: 0`) so the whole cell opens the product while fav/cart/spine sit above it (`z-index: 1`); in cart the cart button is ink with a check icon and `aria-label="В корзине"`; icons are inline SVG at 1.75 stroke. Check whether `open-product` is already registered (favourites module) before registering; reuse it.

`cells.css`: `.r-grid` = 2 columns, `gap: 1px`, `background: var(--r-rule)`, top and bottom 1px rules, cells `background: var(--r-paper)`, edge to edge (no side gutter; `.r-grid--bleed` cancels a parent's 20px padding); cell media square on `--r-well`, image `object-fit: cover`; sticker top-left 8px; fav 40px square top-right (paper, ink heart, filled orange when on); body padding 10px 12px 8px; title 14px/500 two lines; cart button 40px square orange at the body's bottom-right (black icon), in-cart ink; spine at the foot, full width. `.r-rail` = horizontal scroll, 156px cells sharing rules, scroll-snap. `mini` = 120px media, price 20px.

- [ ] **Step 1:** unit tests for `productCellHtml` (escaping of a title with `<img onerror>`, sticker percent, `new`/`hit`, price split incl. 'от 450 ₽/м²', spine ink style, in-cart state, `goods: false` hides the cart button) → FAIL.
- [ ] **Step 2:** implement `store-theme.ts`, `product-cell.ts`, `cells.css`; delegate the four legacy builders; set container classes.
- [ ] **Step 3:** unit tests PASS; `tests/e2e/cells.spec.ts`: home grid renders `.r-cell` with a `.r-spine`; tapping a cell's title opens the product page; tapping the cart button marks it in-cart and updates the tab badge; tapping a spine opens that store; a 360px viewport shows no horizontal overflow on home.
- [ ] **Step 4:** `npm test` green (update selectors in existing specs that targeted `.pc-card`/`.rec-card`, listing each change in the report); screenshots of home grid light/dark.
- [ ] **Step 5: Commit** `One product cell for every grid and rail, with the store's spine`.

---

### Task 5: Home and catalogue

Owns the files listed in the ownership table. Read the direction contract FIRST VIEWPORT block; it is the acceptance test for home.

- **Home:** remove the `home-aurora` markup. Search panel `#quick-search-filters` → `.r-chip` / `.r-input` / `.r-btn`; fill `#filter-store-list` with store chips (the half-wired filter). Category tiles `#home-cats` (`renderHomeCategories`) → 112×96 tiles: top 48px family-ink field with the name in Extra Condensed 800 caps (on-ink), bottom 48px photo; «Все» tile ink. Stories (`renderStories`): 68px circles, 3px solid ring in the story's store ink (`storeTheme(name).ink`; lifehack `#FFC20E`), 2px paper gap; viewed → 1px `--r-rule` ring; add `storiesSeen` key to `src/shared/storage/keys.ts` (`meb_stories_seen`, array of ids) and mark on open; rings refresh on close; name 12px/600 one line. Arrows → 32px square paper keys with 1px ink ring. Promo (`renderHomeShopPromo`): demo stores first (`storefront.demo`), then others; each slide a split pack — left 52% store-ink field (name Extra Condensed 900 caps 34px, max 2 lines, auto-shrink to 26px; one line of description on-ink at 80%; `.r-btn--sm` paper button «В витрину»); right 48% photo; pager `01 / 03` Extra Condensed at the field's foot; tap → `open-store` with the field as the source element; remove the old dots/zones markup that the new pager replaces. «Рекомендуем для вас» and «Популярные товары» → `.r-head` with «Все» link; grids from Task 4. Brand banner strip square.
- **Catalogue root** (`#view-directory`, `.dir-row`): the shelf — each section a full-width row 96px: left 58% section-ink field (name Extra Condensed 900 caps 28px, one line description 13px on-ink 85%), right 42% photo; rows touch with a 1px paper gap; fixed section inks: Товары `#FE5000`, Магазины `#3A3A38`, Специалисты `#0067B1`, Спецтехника `#FFC20E`, Дизайнеры `#6D2C91`, Компании `#00A19A`, Вакансии `#00753A`, Недвижимость `#D7261E`, Ландшафт `#4C8C2B`, Прочее `#A8803F`, Лайфхаки `#FFDD00`, Калькуляторы `#3AA0DB` (text colour by `onInk`).
- **Subviews:** every list gets a `.r-head` page title with `.r-back`, rows on paper separated by `--r-rule` hairlines, 64px square thumbnails, `.r-chip` filters, `.r-btn` actions; Магазины list = store rows with a half-photo / half-ink split (name caps on the ink, category and address below). Real-estate, landscape, specialists, spectech, designers, companies, vacancies, other, lifehacks, calculators: restyle in place (structure kept), all icons SVG.
- **Category goods page** (`#view-category-products`): `.r-head` title + count; a filter bar using `buildFacets`/`applyFilters`/`sortProducts` from Task 2 with defs `[{key:'store',label:'Магазин',type:'chips'}, price]` and sort chips «Популярные · Дешевле · Дороже · Новинки»; grid `.r-grid`.
- Tests: update existing specs for changed markup; add e2e: story ring turns viewed after opening; category page store chip narrows the grid; promo slide opens a storefront. Screens light/dark at 390 and 360.
- Commit `Home and catalogue in «Линейка»: pack promo, shelf catalogue, store-ink stories`.

### Task 6: Detail screens

Owns the files listed in the ownership table.

- **Product page:** square gallery edge to edge with a `01 / 05` pager; price block `.r-price` at 44px with unit and sticker; title 20px/600; store spine band (full width, store ink, name caps, «В витрину →», `open-store`); «Характеристики» as a two-column technical table (hairlines, label 14px ink-3, value 14px/600); services of the store as `.r-pict` row when the shop has `services`; bottom bar: 52px square `.r-btn--line` heart + `.r-btn--primary` «В корзину» (in cart: ink «В корзине · N»); «Похожие»/«Недавние» rails from Task 4.
- **Cart and favourites:** each store group starts with a store-ink header field (44px, name caps, count) — no coloured side borders; lines: 72px square photo, title, variant, qty stepper of 36px squares with SVG minus/plus (replace `−`/`+`/`×` glyphs), line sum Extra Condensed 22px; group foot: «Итого по магазину» + Extra Condensed 28px sum, `.r-btn--primary` «Отправить заказ менеджеру», Telegram `.r-btn--ink`, MAX `.r-btn--line`; checkout fields `.r-input`; order cards and statuses with the ok/wait/bad washes.
- **Profile:** theme segmented control of square segments; forms `.r-input`/`.r-btn`; rows with hairlines.
- **First launch:** onboarding slides in the world; a final consent step: two checkboxes (пользовательское соглашение, cookies), the button enabled only when both are ticked, each link opening a sheet with a short factual summary (the app shows local stores' catalogues, takes no payments, keeps the cart and settings on the device, uses cookies/local storage for settings) titled «Проект соглашения» because the customer supplies the final text; store acceptance under a new key in `keys.ts`.
- **Stories viewer:** square white progress segments; header = store spine chip + «В витрину» for store stories (`open-store`).
- **Sheets** (notifications, assistant, about, compare): square top, `--r-band` ink top rule, square grabber 36×4, `--r-scrim`.
- Tests: update affected specs; add e2e for the consent gate on a fresh profile and for the product page spine opening the store. Screens light/dark.
- Commit `Detail screens in «Линейка»: product, cart, favourites, profile, first launch, stories, sheets`.

### Task 7: Storefront UI (buyer)

Owns the files listed in the ownership table.

- `open.ts`: `openStorefront(name: string, from?: Element | null): void` exposed as `window.openStorefront` and replacing `openShopCatalogModal` for goods stores (landscape and real-estate keep their screens); hash route `#store=<encodeURIComponent(name)>` opens it on load; back closes it. Register `#storefront` with the motion system's overlays.
- Spine to cover: when `from` has a rect, a full-size layer of the store ink inside `#phone-container` animates `clip-path: inset(<from rect>)` → `inset(0)` over 420ms on `--r-ease`, then the storefront fades in over 180ms and the layer is removed; `prefers-reduced-motion` → plain open.
- `theme.ts`: on the root set `--sf-ink`, `--sf-on-ink`, `--sf-ground` (stock → paper; tint → `mixHex(ink,'#FFFFFF',0.92)`, in dark `mixHex(ink,'#121211',0.88)`; black → `#121211`), `--sf-text`, `--sf-text-2` (text at 72%), `--sf-rule`, `--sf-head` font (industrial → `--r-font-x` caps; modern → `--r-font-modern`; classic → `--r-font-classic`), and `data-voice`, `data-ground`, `data-cover`.
- Blocks (each `<section class="sf-block sf-<type>">`, heading `.sf-h` in the voice; empty blocks render nothing): cover (field: 60% ink field with the name at 56–64px caps / 2 lines max + line, 40% photo; split: half ink field with name, line and a paper button «Каталог», half photo; full: 420px photo with a ground-coloured plate bottom-left holding name and line); under the cover a ruled facts strip: open-now status from `hours` («Открыто до 19:00» / «Закрыто до 09:00»), first address, product count; services (`.r-pict` grid, 3 per row, icon by keyword: доставка truck, сборка wrench, замер tape, монтаж drill, проект/дизайн pencil-ruler, разгрузка pallet, расчёт calculator, гарантия shield, default check; authored SVG at 1.75 stroke); categories (scroll of 140×120 tiles: image top, label on the ground; tap → sets that filter in the catalogue and scrolls to it); catalog (title + count, sticky bar with «Фильтры (n)» `.r-chip`, sort, and the first chips facet's values as quick chips; a sheet with every facet — chips groups and from/to inputs — and «Показать N товаров»; grid of Task 4 cells with the spine hidden inside the store's own page); lookbook (full-bleed image with numbered square pins in ink, list of the pinned products below, pin tap highlights its row); steps (big Extra Condensed numerals, title, text); swatches (square chips of colour or image with name and note); calculator (product select of mix products, area m², layer mm, result `N мешков · M кг` in big numerals, «Добавить N мешков в корзину» adds that quantity; hidden when no product has a mix spec); promo (split: sticker, text, image, button to the product or catalogue); gallery (horizontal square photos; tap → existing photo viewer); about (block text or shop description); addresses (facades with photo, address and «Маршрут» → `https://yandex.ru/maps/?text=<address>`, map buttons for `mapYandex`/`mapGoogle`, a 7-row hours table with today marked); managers (name in the voice, role, Telegram/MAX/phone/e-mail buttons; with no managers but `telegram`/`site` show those; with nothing render nothing); terms (payment, delivery, and always «Оплата — напрямую менеджеру магазина, приложение платежи не принимает»).
- Sticky dock: «Написать менеджеру» in the store ink (opens the first manager's Telegram, else MAX, else scrolls to managers) and the cart button with this store's count.
- `tests/e2e/storefront.spec.ts`: each demo store opens from home promo, catalogue → магазины and the product page; its look differs (computed `--sf-ink` and `data-voice` differ across the three); Постройка «Тип: Штукатурка» narrows the grid; the calculator returns 7 bags for 20 m² × 10 mm of the 30 kg gypsum plaster and adds 7 to the cart; Дриада lookbook pin opens/highlights a product; «Кровельщик» (one product, no storefront data) opens without errors and shows the skeleton; `#store=` deep link opens; the old filter carry-over between stores is gone; no console errors.
- Screens of the three demo storefronts (full page) light and dark.
- Commit `Storefronts: each store's own ink, voice, blocks and filters; spine-to-cover opening`.

### Task 8: Admin storefront designer

Owns `admin.html`, `src/admin/**`.

- Token-level restyle of `admin.css` to «Линейка»: Sofia Sans (self-hosted, reuse `public/fonts`), ink/orange/neutral ramp, square corners, rules instead of shadows; layout unchanged.
- Shop editor gains tabs «Оформление» and «Блоки»; «Фильтры» becomes per store. Implement in `src/admin/features/storefront-designer/` (TypeScript, `html`…``, `data-action`), hooked from `renderShopTab` for the new tab ids; the draft shop's `storefront` is edited in place and saved by the existing `saveShop`.
  - Оформление: store type (`KIND_LABELS`; changing it offers to load that preset's blocks and filters), ink (the 10 family swatches + a hex field validated by `normalizeHex`, live contrast note), ground, voice, cover style (segmented controls), a live mini cover preview with the theme applied, and «Открыть витрину в приложении» → `index.html#store=<name>` in a new tab.
  - Блоки: the resolved block list; each row: label (`BLOCK_LABELS`), «Пример» badge when `example`, on/off switch (disabled for required blocks), up/down, edit (inline panel with that block's fields: cover line+image, categories items, lookbook image + pins (x, y %, product select), steps items, swatches items, promo text/sticker/image/product, about text), delete (optional blocks only); «Добавить блок» lists the optional types.
  - Фильтры: the store's filter defs (start from the preset), add (key from the product attributes found in this store's products, or free text), rename label, type, unit, reorder, delete; a preview line of the facet values from the store's products.
- `tests/e2e/admin-storefront.spec.ts`: change Любимый Дом's ink and voice and hide its promo in the admin, reload the app, open the store: the new ink is on the cover, the voice attribute changed, the promo is gone; add a filter in the admin and see it in the store's filter sheet.
- Commit `Admin: storefront designer — theme, blocks and per-store filters`.

### Task 9: Deploy and the desktop stage

- `.github/workflows/pages.yml`: on push to `main` and manual dispatch; Node 20 with npm cache; `npm ci`; `npm run build`; `actions/upload-pages-artifact@v3` (path `dist`); deploy job with `actions/deploy-pages@v4`, permissions `pages: write`, `id-token: write`, environment `github-pages`, concurrency group `pages`.
- `README.md` «Публикация демо» section: GitHub Pages (create repo, push, Settings → Pages → Source: GitHub Actions), Netlify Drop (drag `dist/`), Cloudflare Pages (`npx wrangler pages deploy dist`), Surge (`npx surge dist`); note that each viewer's data lives in their own browser (localStorage).
- Desktop stage (`stage.css`, stage markup): the page around the phone frame becomes the world's stage — paper background (black in dark), a left column at ≥ 1024px with the wordmark plate, the tagline, one sentence on what the prototype shows, and a QR code of the current URL («Откройте на телефоне») generated with the `qrcode-generator` package (lazy-loaded only at ≥ 1024px); the phone frame bezel `--r-n9`, square-cornered screen kept at the existing scale logic. Below 1024px nothing changes.
- Verify `npm run build && npx vite preview` at 1440×900 and 390×844; `npm test` green.
- Commit `Deploy workflow and a desktop stage with a QR code for the demo link`.

### Task 10: Integration and finish (controller)

- Merge order 1 → 2 → 3 → 4 → (5, 7, 8, 9) → 6, resolving conflicts in favour of the owner of each region; `npm test` green after each merge.
- Rerun the baseline screenshot script into `.impeccable/review/` (`mobile.png` 390 wide full home, `desktop.png` 1440 stage), light and dark; one fix batch; second round only to confirm.
- `/Users/User/.claude/skills/impeccable/scripts/impeccable detect --json` on the changed targets; fix mechanical findings.
- Spawn `impeccable-finish-reviewer` (fresh) with the request, the spec, the direction contract, screenshots and the craft-floor path; act on its disposition.
- Spawn `impeccable-documenter` to write `docs/DESIGN.md` and `.impeccable/design.json` from the built world.
- Final whole-branch code review; one fix wave; then report to the developer with the rulings list and the hosting decision.
