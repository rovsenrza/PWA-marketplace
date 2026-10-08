import { test, expect } from './fixtures';

test('stories remember viewing across reloads', async ({ app }) => {
  const story = app.locator('.r-story').first();
  const id = await story.getAttribute('data-story');
  await story.click();
  await expect(app.locator('#story-viewer')).toBeVisible();
  await app.evaluate(() => (window as any).closeStory());
  await expect(app.locator(`.r-story[data-story="${id}"]`)).toHaveClass(/is-viewed/);
  expect(await app.evaluate(() => JSON.parse(localStorage.getItem('meb_stories_seen') || '[]'))).toContain(id);
  await app.reload();
  await expect(app.locator(`.r-story[data-story="${id}"]`)).toHaveClass(/is-viewed/);
});

test('home search and store filters narrow product cells', async ({ app }) => {
  await app.locator('#search-input').fill('Штукатурка');
  const cells = app.locator('#product-grid .r-cell');
  expect(await cells.count()).toBeGreaterThan(0);
  for (const title of await cells.locator('.r-cell__title').allTextContents()) expect(title.toLowerCase()).toContain('штукатурка');
  await app.locator('#search-input').fill('');
  await app.getByRole('button', { name: 'Фильтры', exact: true }).click();
  await app.locator('#filter-store-list').getByRole('button', { name: 'Постройка', exact: true }).click();
  await app.getByRole('button', { name: 'Применить', exact: true }).click();
  expect(await cells.count()).toBeGreaterThan(0);
  for (const store of await cells.locator('.r-spine').allTextContents()) expect(store).toBe('Постройка');
});

test('category goods use their own store facet and price ordering', async ({ app }) => {
  await app.evaluate(() => (window as any).openCategoryProducts('стройматериалы', 'Стройматериалы'));
  const grid = app.locator('#cat-prod-grid .r-cell');
  const initial = await grid.count();
  expect(initial).toBeGreaterThan(1);
  await app.locator('#cat-prod-filters').getByRole('button', { name: /Постройка/ }).click();
  expect(await grid.count()).toBeLessThan(initial);
  for (const store of await grid.locator('.r-spine').allTextContents()) expect(store).toBe('Постройка');
  await app.locator('#cat-prod-filters').getByRole('button', { name: 'Дешевле', exact: true }).click();
  await expect(app.locator('#cat-prod-filters').getByRole('button', { name: 'Дешевле', exact: true })).toHaveAttribute('aria-pressed','true');
});

test('promo uses demo packs and opens a store; shelf has no overflow at 360px', async ({ app }) => {
  await app.setViewportSize({ width:360, height:844 });
  await expect(app.locator('#promo-slide-0 .promo-pager')).toHaveText('01 / 03');
  await app.locator('#promo-slide-0 .promo-go').click();
  await expect(app.locator('#storefront')).toBeVisible();
  await app.locator('#storefront [data-action="sf-back"]').click();
  await app.evaluate(() => (window as any).switchTab('directory'));
  expect(await app.locator('#view-directory .dir-row').count()).toBe(12);
  expect(await app.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
