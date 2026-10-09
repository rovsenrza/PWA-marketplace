---
name: Супер-Апп — Витрина (V3)
description: A regional marketplace in Russian e-commerce grammar: white rounded cards on an off-white ground, one quiet sans, orange actions, store ink as a dot.
colors:
  ground: "#F4F5F7"
  card: "#FFFFFF"
  fill: "#EAEBEF"
  ink: "#1A1B20"
  ink-2: "#4A4D57"
  ink-3: "#686C77"
  brand: "#FE5000"
  on-brand: "#111110"
  brand-text: "#B83A00"
  sale: "#D0281E"
typography:
  heading:
    fontFamily: "Google Sans"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: "24px"
  price:
    fontFamily: "Google Sans"
    fontSize: "18px"
    fontWeight: 600
  body:
    fontFamily: "Google Sans"
    fontSize: "13px"
    fontWeight: 400
rounded:
  sm: "8px"
  ctl: "10px"
  card: "14px"
  sheet: "16px"
spacing:
  grid-col: "3px"
  grid-row: "10px"
  gutter: "12px"
---

# Супер-Апп — «Витрина» (V3)

V3 rebuilds the buyer app and admin in the grammar of Russian marketplaces (Wildberries, Ozon) on top of the V2 «Линейка» token names and markup. The app is Russian-language and mobile first; the desktop stage still places the phone beside a wordmark and a QR code.

Preserved versions: V2 «Линейка» in [DESIGN-v2.md](DESIGN-v2.md), V1 in [DESIGN-v1.md](DESIGN-v1.md).

## Colour

The light neutral ramp n0–n9 is `#FFFFFF`, `#F4F5F7`, `#EAEBEF`, `#DCDEE3`, `#A3A6AF`, `#686C77`, `#4A4D57`, `#33353D`, `#24262C`, `#1A1B20`. Dark mode swaps the ramp in place, from card `#1C1D22` and ground `#111215` to ink `#F5F6F8`; every role reads the ramp, so screens switch without their own dark rules.

**The Ground and Card Rule.** The page is the off-white ground; content sits on pure white cards. Controls, inputs, chips and secondary buttons take the fill (n2). There is no other way to separate parts.

Orange (`#FE5000`, dark `#FF6526`) is the app's action colour and carries black labels; white on orange fails contrast. Orange text uses its own token (`#B83A00`, dark `#FF8A57`). The sale sticker is a small red rounded badge (`--r-bad`, 6px corners, 12px/600 white copy); "new" stickers are ink on paper. Hearts and favourite state use the same red.

Store inks identify stores and never replace orange. All app colours read `--r-*` from `src/app/styles/range/tokens.css`; legacy `--mk-*` names are remapped there. The admin (`src/admin/styles/admin.css`) mirrors the same ramp, orange and red under its own short names.

## Type

One self-hosted face: Google Sans (cyrillic, latin, latin-ext for the ruble sign), licence in `public/fonts/GoogleSans-OFL.txt`. The faces declare weights 400–600 only and `font-synthesis` is off, so a legacy request for 700–900 resolves to 600.

**The 18/600 Ceiling.** No text is larger than 18px or heavier than 600. Headings and prices sit at the ceiling; titles in cells are 13px/400 in ink-2; notes, store lines and old prices are 12px; tab labels are 10px/500. Uppercase transforms and tracking are removed. The store voices (`industrial`, `modern`, `classic`) remain theme fields but all resolve to Google Sans.

## Shape and depth

Cards, promo slides, category tiles, store rows and cart groups take 14px; buttons, chips, inputs and quantity steppers 10px; thumbnails and small plates 8px; header, tab bar, bottom bars and sheets round their open edge at 16px. Avatars, hearts, story rings and round keys are circles.

**The No-Line, No-Shadow Rule.** Nothing in the phone has a border or a box/text shadow; `wb.css` enforces both globally (checkboxes, radios and spinners excepted). Separation comes only from ground-versus-card contrast and radius. Focus is a 2px orange outline.

## Layout and product cell

**The 3/10 Grid.** Product grids use a 3px column gap and a 10px row gap; rails use 3px. Screen gutters are 12px.

Every product unit is `src/app/ui/product-cell.ts`: photo on the ground tone with a rounded corner, sticker at its lower left and a heart disc at the upper right; then price, two-line title, the store line, and a full-width orange «В корзину» button (fill-coloured «В корзине» once added).

**The Store Dot Rule.** The V2 spine is now a quiet store line: an 8px dot of the store's ink beside its name in ink-3. The same dot marks promo names, catalogue store rows and cart group headers. Story rings are filled with the store ink behind a ground-coloured gap. Storefront covers keep the full store ink field (`--sf-ink` with its contrast-aware foreground); opening a store still expands the ink over 420ms with a direct opening under reduced motion.

Category tiles on home and catalogue rows use generated PNG cut-outs (public/cat/, 320px, transparent): photoreal product groups shown with object-fit: contain straight on the white card.

## Implementation and verification

`src/app/styles/range/wb.css` is the V3 layer, loaded last over the range layer. TypeScript, the production build, 216 unit tests and 90 Chrome e2e tests pass. A computed-style audit over 14 screens in light and dark found no text above 18px or 600, no box-shadow, no border, and every product grid at 3px/10px.
