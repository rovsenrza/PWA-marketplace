import { test, expect } from './fixtures';

test('home: categories, recommendations, product grid', async ({ app }) => {
  await expect(app.locator('.home-cat').first()).toHaveText('Все');
  expect(await app.locator('.home-cat').count()).toBeGreaterThan(3);
  expect(await app.locator('#recommendations-container .rec-card').count()).toBeGreaterThan(2);
  expect(await app.locator('#product-grid .pc-card').count()).toBeGreaterThan(4);
});

test('cart: add from the card, badge, swipe to delete', async ({ app }) => {
  await app.locator('.rec-add').first().click();
  await expect(app.locator('#cart-badge')).toHaveText('1');
  await app.evaluate(() => (window as any).switchTab('cart'));
  const card = app.locator('#cart-list .cart-card').first();
  const box = (await card.boundingBox())!;
  const y = box.y + box.height / 2;
  await app.mouse.move(box.x + box.width - 20, y);
  await app.mouse.down();
  for (let i = 1; i <= 14; i++) await app.mouse.move(box.x + box.width - 20 - i * 22, y);
  await app.mouse.up();
  await expect.poll(() => app.evaluate(() => (window as any).getCartItems().length)).toBe(0);
});

test('theme: toggle, persists after reload, «Система» follows the OS', async ({ app }) => {
  await app.locator('.lg-theme-btn').click();
  const t = await app.evaluate(() => document.documentElement.dataset.theme);
  await app.reload();
  await expect.poll(() => app.evaluate(() => document.documentElement.dataset.theme)).toBe(t);
  await app.evaluate(() => (window as any).setUiTheme('system'));
  await app.emulateMedia({ colorScheme: 'dark' });
  await expect.poll(() => app.evaluate(() => document.documentElement.dataset.theme)).toBe('dark');
});

test('notifications: sheet opens, drags to the large detent, closes', async ({ app }) => {
  await app.locator('.lg-bell').click();
  await app.waitForTimeout(600); // шит доезжает до среднего детента
  const grab = (await app.locator('.lg-sheet-grab').boundingBox())!;
  await app.mouse.move(grab.x + grab.width / 2, grab.y + 5);
  await app.mouse.down();
  for (let i = 1; i <= 12; i++) await app.mouse.move(grab.x + grab.width / 2, grab.y + 5 - i * 30);
  await app.mouse.up();
  await expect(app.locator('#lg-notif-sheet')).toHaveClass(/is-large/);
  await app.locator('[data-act="close"]').click();
  await expect(app.locator('#lg-notif-sheet')).toBeHidden();
});

test('navigation: deeper and back, product page, close leaves no exit copies', async ({ app }) => {
  await app.evaluate(() => { (window as any).switchTab('directory'); (window as any).switchDirectoryView('shops'); });
  await expect(app.locator('#subview-shops')).toBeVisible();
  await app.evaluate(() => (window as any).backToDirectory());
  await expect(app.locator('#view-directory')).toBeVisible();
  await app.evaluate(() => (window as any).openProductModal('prod-2'));
  await expect(app.locator('#product-modal')).toBeVisible();
  await app.evaluate(() => (window as any).closeProductModal());
  await expect.poll(() => app.locator('[data-lg-ghost]').count()).toBe(0);
});
