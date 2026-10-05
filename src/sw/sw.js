/* Service worker. A template: the build (vite.config.ts, plugin service-worker) fills in
   the build id and the list of hashed files of the current build.
   - assets/*  : hashed names, cache-first, they never change;
   - pages     : network-first, offline falls back to the cached index.html;
   - others    : stale-while-revalidate (images in public/, manifest).
   Lookups ignore Vary: hosts send «Vary: Origin», and Chrome adds Origin to the requests of
   module scripts and crossorigin styles, so those never matched the precached copies and the app
   didn't open offline. A hashed name never changes its content, a page is the same for everyone. */
const CACHE = 'superapp-__BUILD_ID__';
const PRECACHE = __PRECACHE__;
const APP_SHELL = './index.html';
const ANY = { ignoreVary: true };

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => undefined)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

async function put(req, res) {
  if (res && res.ok) (await caches.open(CACHE)).put(req, res.clone());
  return res;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).then((res) => put(req, res))
      .catch(async () => (await caches.match(req, ANY)) || caches.match(APP_SHELL, ANY)));
    return;
  }
  if (url.pathname.includes('/assets/')) {
    event.respondWith(caches.match(req, ANY).then((hit) => hit || fetch(req).then((res) => put(req, res))));
    return;
  }
  event.respondWith(caches.match(req, ANY).then((hit) => {
    const fresh = fetch(req).then((res) => put(req, res)).catch(() => hit);
    return hit || fresh;
  }));
});
