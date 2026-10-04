import { test, expect } from './fixtures';

/* Startup must not wait for external photos: before, the app started on window.onload,
   and with slow images the saved cart, favourites and profile weren't applied. */
test('the saved cart shows while external photos are still loading', async ({ page }) => {
  await page.goto('/index.html');
  await page.evaluate(() => {
    localStorage.setItem('meb_cart', JSON.stringify([{ productId: 'prod-2', storeId: 'Любимый Дом', qty: 3, priceSnapshot: 57240, titleSnapshot: 'Кровать' }]));
  });
  /* все картинки Unsplash «висят» 15 секунд */
  await page.route(/images\.unsplash\.com/, (route) => { setTimeout(() => route.abort().catch(() => {}), 15_000); });
  const start = Date.now();
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#cart-badge')).toHaveText('3', { timeout: 5_000 });
  expect(Date.now() - start).toBeLessThan(5_000);
  expect(await page.evaluate(() => document.readyState)).not.toBe('complete'); // картинки ещё грузятся
});
