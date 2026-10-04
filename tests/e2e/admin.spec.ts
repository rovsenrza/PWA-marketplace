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
