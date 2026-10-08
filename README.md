# Супер-Апп

A regional construction and renovation marketplace: a buyer PWA (`index.html`) and an admin panel (`admin.html`).
Product: [docs/PRODUCT.md](docs/PRODUCT.md) · design system: [docs/DESIGN.md](docs/DESIGN.md) · architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · backend decision: [docs/BACKEND.md](docs/BACKEND.md).

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173 (app), /admin.html (admin panel)
npm run build      # typecheck + production build into dist/
npm run preview    # serve dist/ at http://localhost:4173
npm test           # typecheck + unit (Vitest) + fresh build + browser tests (Playwright, system Chrome)
```

Requires Node 20+. The build output (`dist/`) is fully static with relative paths, so it can go into any folder on any static host (Apache, nginx, S3, Netlify, GitHub Pages).

## Версии для просмотра

V1 сохранена на `main` (коммит `76dc1b8`), V2 разрабатывается на `redesign-v2`. У каждой версии отдельный опубликованный сайт: корзина и настройки не смешиваются между версиями. Панель управления доступна по `/admin.html` на сайте соответствующей версии.

- V1: https://super-app-v1-review.spunkywasp8.chatgpt.site
- V2: https://super-app-design-review.spunkywasp8.chatgpt.site
- Описание дизайна V1: [docs/DESIGN-v1.md](docs/DESIGN-v1.md).
- Описание дизайна V2: [docs/DESIGN.md](docs/DESIGN.md).

Это интерактивные прототипы: изменения каталога в админке видны в приложении в том же браузере. Общего серверного каталога и обработки платежей пока нет.

## Публикация демо

Заказчику вместо скриншотов можно отправить ссылку на рабочий прототип. Сборка `dist/` статическая, с относительными путями, поэтому подходит любой бесплатный статический хостинг. На ноутбуке прототип открывается в рамке телефона и показывает QR-код своей же ссылки, на телефоне занимает весь экран. Панель управления лежит рядом: `…/admin.html`.

Сначала соберите проект: `npm ci && npm run build`. `npm ci` скачивает библиотеку xlsx с cdn.sheetjs.com, поэтому нужен доступ в интернет. Дальше выберите один способ.

- **GitHub Pages**: публикуется само при каждом обновлении `main`. Создайте репозиторий на GitHub и отправьте в него проект (`git push`). В репозитории откройте Settings → Pages и в поле Source выберите **GitHub Actions**. Остальное делает `.github/workflows/pages.yml`: собирает проект и публикует `dist` при каждом push в `main`, а вручную его запускают на вкладке Actions → Pages → Run workflow. Адрес: `https://<имя>.github.io/<репозиторий>/`.
- **Netlify Drop**: откройте app.netlify.com/drop и перетащите в окно папку `dist/`. Ссылка появится сразу. Без входа в аккаунт Netlify сайт может быть удалён через некоторое время, для постоянной ссылки войдите в аккаунт.
- **Cloudflare Pages**: `npx wrangler pages deploy dist`. При первом запуске wrangler предложит войти в аккаунт Cloudflare и создать проект.
- **Surge**: `npx surge dist`. При первом запуске он спросит e-mail и пароль и предложит адрес вида `*.surge.sh`.

Данные каждого зрителя (корзина, избранное, заказы, правки в панели управления) хранятся в его собственном браузере (`localStorage`), поэтому правки, сделанные на одном устройстве, на другие не попадают.

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
