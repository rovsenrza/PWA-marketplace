# Stakeholder review — V1 and V2

Prepared on 8 October 2026. Both versions run as independent static sites, with a buyer application at `/` and their corresponding admin panel at `/admin.html`.

| Version | Buyer application | Source |
| --- | --- | --- |
| V1 | https://super-app-v1-review.spunkywasp8.chatgpt.site | `main`, `76dc1b8` |
| V2 — Линейка | https://super-app-design-review.spunkywasp8.chatgpt.site | `redesign-v2`, completed workspace changes |

## Review paths

In V2, open a shop from a home promo, a product's coloured shop spine, or Catalogue → Shops. Постройка demonstrates mixture filters and a bag calculator; Кухни Дриада demonstrates the lookbook and kitchen project steps; Любимый Дом demonstrates the classic furniture storefront. Store URLs use `#store=<encoded store name>`.

In the admin panel, open Shops → a shop → Оформление, Блоки or Фильтры. Save the storefront, then open its buyer view in the same browser. Each version uses a separate browser origin, so settings and edits do not cross between versions.

## Validation

- V1: TypeScript, production build, 107 unit tests and 48 Chrome browser tests passed.
- V2: TypeScript, production build, 216 unit tests and the complete 90-test Chrome suite passed. After final review fixes, all 18 affected storefront, admin and detail tests passed again, including local cover-photo loading and header contrast.
- The focused design detector reports no findings in the new range styles, buyer storefront/consent modules and admin storefront designer. `git diff --check` passes.
- Mobile at 360/390px, desktop at 1440px, light and dark evidence is in `.impeccable/review/stakeholder/`.
- Independent finish review: SHIP. Findings addressed: relative image URL validation, actual service-name rendering, black storefront controls in the light app theme; narrow cover headings and section wrapper layouts were corrected in visual review.

## Prototype data

Catalogues, cart, favourites, orders and admin changes live in the viewer's browser. There is no shared production backend or payment processing. Demo storefronts and authored example blocks identify their content as examples. Contact and payment arrangements go directly through store managers.

Hosting uses Sites. Site identities are `appgprj_6ac7eb7a7508819192e7bfce7137512b` (V1) and `appgprj_6ac7eb4acfac8191802f0d62f3cf7b30` (V2); credentials are not stored in the project.
