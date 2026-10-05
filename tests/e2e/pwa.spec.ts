import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from './fixtures';

const dist = resolve(dirname(fileURLToPath(import.meta.url)), '../../dist');
const assetsOf = (html: string) => [...html.matchAll(/(?:src|href)="(?:\.\/)?(assets\/[^"]+\.(?:js|css))"/g)].map((m) => m[1]);

/* Покупатель при установке скачивает только своё приложение: панель и ленивые части (Excel, zip, XML)
   в предкэш не входят и кэшируются, только если их открыли. */
test('service worker: precaches the buyer app, not the admin panel or the Excel reader', () => {
  const sw = readFileSync(resolve(dist, 'sw.js'), 'utf8');
  const precache: string[] = JSON.parse(sw.match(/const PRECACHE = (\[[\s\S]*?\]);/)![1]);
  for (const asset of assetsOf(readFileSync(resolve(dist, 'index.html'), 'utf8'))) expect(precache).toContain(`./${asset}`);
  const adminOnly = assetsOf(readFileSync(resolve(dist, 'admin.html'), 'utf8')).filter((a) => /admin/.test(a));
  expect(adminOnly.length).toBeGreaterThan(0);
  for (const asset of adminOnly) expect(precache).not.toContain(`./${asset}`);
  expect(precache.filter((f) => /xlsx/.test(f))).toEqual([]);
});

test('offline: after the first visit the app opens without a network', async ({ app, context }) => {
  await app.evaluate(async () => { await navigator.serviceWorker.ready; });
  /* предкэш заполняется при установке; ждём, пока в кэше окажется оболочка */
  await app.waitForFunction(async () => {
    const keys = await caches.keys();
    const cache = keys.length ? await caches.open(keys[0]) : null;
    return !!cache && !!(await cache.match('./index.html'));
  });
  await context.setOffline(true);
  await app.reload();
  await app.waitForFunction(() => typeof (window as any).switchTab === 'function');
  expect(await app.evaluate(() => Object.keys(eval('productsDb')).length)).toBeGreaterThan(40);
  await context.setOffline(false);
});
