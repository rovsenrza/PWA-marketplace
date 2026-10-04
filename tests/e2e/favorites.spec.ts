import { test, expect } from './fixtures';

test('favourites: survive a reload, state.favorites is an accessor', async ({ app }) => {
  await app.evaluate(() => { const w = window as any; w.toggleFavorite('prod-2'); w.toggleFavorite('prod-8'); });
  await app.reload();
  await app.waitForFunction(() => typeof (window as any).switchTab === 'function');
  expect(await app.evaluate(() => eval('state').favorites)).toEqual(['prod-2', 'prod-8']);
  await app.evaluate(() => (window as any).switchTab('favorites'));
  expect(await app.locator('#view-favorites .fav-item').count()).toBe(2);
});

test('«Очистить» and «убрать магазин» redraw the recommendation hearts (they used to stay stale)', async ({ app }) => {
  const ids = await app.evaluate(() => [...document.querySelectorAll('.rec-card')].slice(0, 2)
    .map((c) => c.getAttribute('onclick')!.match(/'([^']+)'/)![1]));
  await app.evaluate((x) => x.forEach((id: string) => (window as any).toggleFavorite(id)), ids);
  await expect(app.locator('.rec-card .rec-fav.on')).toHaveCount(2);
  const store = await app.evaluate((id) => eval('productsDb')[id].store, ids[0]);
  await app.evaluate((s) => (window as any).unfavoriteStore(s), store);
  await expect(app.locator('.rec-card .rec-fav.on')).toHaveCount(1);
  await app.evaluate(() => (window as any).clearAllFavorites());
  await expect(app.locator('.rec-card .rec-fav.on')).toHaveCount(0);
});
