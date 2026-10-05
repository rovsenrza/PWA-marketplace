import { test, expect } from './fixtures';

test('admin sees the same catalogue as the app (shared seed)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/admin.html');
  const count = await page.evaluate(() => Object.keys((window as any).SEED.products()).length);
  expect(count).toBeGreaterThan(40);
  expect(await page.evaluate(() => Object.keys(eval('productsDb')).length)).toBe(count);
  for (const role of ['store', 'agency', 'admin']) await page.evaluate((r) => (window as any).setRole(r), role);
  expect(errors).toEqual([]);
});

test('products list after a big import: at most 300 rows; typing a search keeps the store and status filters', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/admin.html');
  await page.waitForFunction(() => typeof (window as any).go === 'function');
  await page.evaluate(() => {
    const db = eval('productsDb');
    for (let i = 0; i < 400; i++) {
      db[`bulk${i}`] = { id: `bulk${i}`, sku: `BLK-${i}`, title: `Товар ${i}`, price: '10 ₽', store: 'Постройка', status: i % 2 ? 'published' : 'draft', image: i % 2 ? 'x.jpg' : '' };
    }
    (window as any).showStoreProducts('Постройка', 'all');
  });
  const rows = page.locator('#prod-list .lrow:not(.head)');
  await expect(rows).toHaveCount(300);
  await expect(page.locator('#prod-list .empty')).toContainText(/Показаны 300 из 4\d\d/);
  await page.locator('.chip', { hasText: 'Без фото' }).click();
  await page.fill('.toolbar .search input', 'Товар 1');
  /* без фото — только чётные: «Товар 10»…«Товар 18» и «Товар 100»…«Товар 198» */
  await expect(rows).toHaveCount(55);
});
