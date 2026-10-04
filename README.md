# Супер-Апп

A regional construction and renovation marketplace: a buyer PWA (`index.html`) and an admin panel (`admin.html`).
Product: [docs/PRODUCT.md](docs/PRODUCT.md) · design system: [docs/DESIGN.md](docs/DESIGN.md) · architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173 (app), /admin.html (admin panel)
npm run build      # typecheck + production build into dist/
npm run preview    # serve dist/ at http://localhost:4173
npm test           # Playwright against the build (system Chrome)
```

Requires Node 20+. The build output (`dist/`) is fully static with relative paths, so it can go into any folder on any static host (Apache, nginx, S3, Netlify, GitHub Pages).

## Layout

```
index.html, admin.html     page markup (entry points)
public/                    static files copied as-is: icons, store banners, calculator art, manifest
src/app/                   buyer app
  main.ts                  module entry: styles in cascade order + feature init
  features/                typed modules (motion, swipe to delete, notifications, tab lens)
  styles/                  CSS layers: base → market → glass → motion → tailwind
  legacy/core/, features/  prototype code by domain (classic scripts, ported to modules gradually)
src/admin/                 admin panel (main.ts, styles, legacy/admin.js)
src/shared/                shared by both pages
  domain/types.ts          domain model types
  storage/                 localStorage key registry and safe access
  legacy/                  seed (one set of starting data), data layer, theme bootstrap
src/sw/sw.js               service worker template (the build fills in the file list)
tests/                     Playwright: app and admin
tools/                     Liquid Glass displacement map generator
docs/                      product, design, catalogue plan, brief
```
