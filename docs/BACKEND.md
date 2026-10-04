# Backend decision

Status: **open, waiting for a decision.** Everything that can be built without a server is done; the
remaining work needs one.

## 1. Where we are

The app and the admin panel already talk to their data only through interfaces. A backend means writing new
implementations of these interfaces; screens and business rules stay as they are.

| Interface (in the code) | Today | What the server implementation does |
|---|---|---|
| `CatalogRepository` (`shared/data/catalog-repository.ts`) | localStorage, per-part saves | catalogue API: products, stores, stories, promo, directory, vacancies, lifehacks, onboarding, showcase requests |
| `CartRepository`, `MarketplaceRepository` (`shared/data/repositories.ts`) | localStorage on the buyer's device | orders API: checkout, store orders, invoices, payments |
| `FavoritesRepository`, `BuyerRepository` | localStorage | stored in the user's account (synced across devices) |
| `AuthService` (`shared/auth/types.ts`) | **`DemoAuthService`: no password checks** | real accounts and sessions, roles buyer · store · agency · admin |
| `MediaStore` (`shared/media/types.ts`) | compression on the device, data: URL inside the data | upload to object storage, returns a URL |
| `EngagementRepository` (`shared/data/engagement.ts`) | device state + **demo** community totals | real totals: «полезно», poll votes |

The business rules are pure TypeScript functions with tests (`shared/orders/*`, `shared/catalog/*`,
`shared/data/catalog.ts`). A TypeScript backend can import them as they are, so the browser and the server
apply the same rules (locked orders, SLA, one order per store, merging).

## 2. What doesn't work without a server

- **Orders don't reach stores.** A checkout creates the store orders in the buyer's browser. The store's
  cabinet only sees orders made on the same device. The core marketplace flow «the buyer orders → the store
  confirms» can't work between two people.
- **Sign-in is a demo.** `admin` with any password is an administrator; the admin panel has a role switcher
  and no sign-in at all. A browser cannot protect this; only a server can.
- **Data lives in one browser.** A store's edits, moderation and new products exist only where they were made;
  clearing the browser loses everything. The 5 MB browser storage is the ceiling for all photos.
- **Community totals are invented.** «Это сработало» and poll results show placeholder numbers from the
  prototype plus this browser's own clicks.
- **The admin's mock-ups are disconnected.** 1C/Excel import, shared cards across stores, the filter builder,
  agencies and their listings are demo screens (`demo` in `admin.js`): an agency's listing never reaches buyers.
- **Managers aren't notified.** A store learns about an order only by opening the cabinet; there are no MAX or
  Telegram notifications.

## 3. What the server has to provide

Derived from the interfaces and the current screens. Scale: one region, tens of stores, 1,000–10,000 products
per store (bulk import), thousands of buyers. No payments in the app (no card data to protect).

| Area | Must do |
|---|---|
| Accounts | buyers (phone), store and agency staff (invited by the admin), administrators; sessions; roles and ownership (a store edits only its own products, stories, orders) |
| Catalogue | read API for the app (with caching and filters by category, store, price); write API for stores and the admin; moderation states (draft → pending → published / rejected with a reason) |
| Orders | checkout → an order per store; the state machine from `shared/orders` (confirm, unavailable, new price, accept, invoice, payment, cancel, SLA expiry); the store sees its orders, the buyer theirs |
| Notifications | to the store manager (MAX and Telegram bots) on a new order or an SLA approaching; to the buyer on a new price or confirmation |
| Files | upload of photos and short videos to object storage (S3-compatible), resizing on the server, CDN links |
| Import | 1C / Excel / CSV files with 1,000–10,000 rows: a background job, matching by article, a report «published / no photo / errors» (the admin's import screen already shows this report) |
| Community | «полезно» and poll votes: one vote per account, totals on the server |
| Admin | the existing `admin.html` stays the interface; behind it, the same API with the admin role |

## 4. Constraints

- **Personal data of Russian users (152-FZ).** Recording, storing and updating the personal data of citizens
  of Russia must happen in databases located in Russia; the operator notifies Roskomnadzor and publishes a
  personal data policy; users consent to processing. In practice: the database and the files go to a Russian
  provider (Yandex Cloud, VK Cloud, Selectel, Timeweb Cloud, Beget). Firebase and the hosted Supabase cloud
  are ruled out for production. *(This is the general rule as I understand it, not legal advice: confirm
  with a lawyer before launch.)*
- **Messengers.** MAX and Telegram are the contact channels already in the app: both have bot APIs for manager
  notifications.
- **Sign-in by phone.** Buyers identify by phone. SMS one-time codes cost roughly a few roubles each through
  Russian providers (SMS.ru, SMSC, MTS Exolve); a sign-in through a MAX or Telegram bot is free for the user.
- **Team.** The frontend is TypeScript now; a TypeScript backend lets one person work on both and share the
  domain code.

## 5. Options

### A. TypeScript API: Node.js (Fastify) + PostgreSQL + S3, on a Russian cloud — **recommended**
- One language and **the same business rules** as the frontend: `shared/orders`, `shared/catalog`,
  `shared/data/catalog.ts` are imported by the server as they are.
- PostgreSQL fits the data (orders, moderation, products with filters); S3-compatible storage
  (Yandex Object Storage, Selectel) for photos; a background job queue for import and notifications.
- Full control over sign-in (SMS / MAX / Telegram), roles and the moderation flow.
- Cost: the most to build (accounts, API, jobs), about 6–10 weeks for one developer for phases 1–3 below.
  Hosting from roughly 2–4 thousand roubles a month at this scale.

### B. Supabase, self-hosted on a Russian server
- PostgreSQL + auth + file storage + row-level security out of the box; a TypeScript client.
- Faster start for the catalogue and accounts; the order state machine and import still need custom code
  (database functions or a separate service).
- Self-hosting means operating a multi-service stack yourself (updates, backups). Phone sign-in through
  Russian SMS providers isn't built in and needs a custom hook.

### C. Headless CMS (Directus) on PostgreSQL
- A ready admin UI, roles, REST and GraphQL APIs, files; good for content (catalogue, stories, lifehacks).
- The order flow, import and notifications are extensions; the existing `admin.html` would be partly replaced
  by Directus's generic screens.
- Quick for content management; harder for the marketplace logic.

### D. PHP (Laravel) on regular shared hosting
- Cheap and familiar hosting (the project already has an Apache `.htaccess`).
- The business rules would be rewritten in PHP and kept in sync with the TypeScript ones by hand: two versions
  of the order rules is exactly the kind of drift the current architecture removed.

**Recommendation: A.** The codebase is already split so that the server implementations plug into existing
interfaces, and the rules that matter most (orders) are already TypeScript with tests. B is the fallback if
speed of the first release matters more than control.

## 6. Rollout, whichever option is chosen

Each phase is a new implementation behind an existing interface; localStorage stays as the offline cache.

1. **Accounts and the catalogue.** Real sign-in (`AuthService`), the catalogue read from the server, stores and
   the admin write through the API with moderation. Seed data (`seed.js`) becomes the initial database content.
2. **Orders between people.** Checkout and store orders on the server; the store cabinet sees real orders;
   MAX / Telegram notifications to managers.
3. **Files and import.** Photo uploads to object storage; the 1C / Excel import as a background job.
4. **Community and analytics.** Real «полезно» and poll totals; statistics for the admin.

## 7. Before launch (whatever the stack)

- Replace `DemoAuthService`; give the admin panel a real sign-in (remove the role switcher).
- Remove the demo community numbers (`SEED.demoCommunity()`); review the seed's store and company ratings and
  «years on the market»: they're prototype placeholders, not real data.
- Replace the 30 dead photo links with real photos.
- Personal data: policy, consent at first launch, data in Russia (section 4).

## 8. Questions for the decision

1. Which option (A–D)?
2. Hosting: which Russian provider, and what monthly budget?
3. Buyer sign-in: SMS code, MAX / Telegram bot, or both?
4. Who will operate the server (updates, backups, monitoring)?
5. Is the 1C / Excel import needed for the first release, or can stores add products by hand at first?
