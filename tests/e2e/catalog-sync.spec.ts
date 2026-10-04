import { test, expect } from './fixtures';

const hideOnboarding = (page: import('@playwright/test').Page) =>
  page.evaluate(() => { const o = document.getElementById('screen-onboarding'); if (o) o.style.display = 'none'; });

test('the admin edits a seeded product description → the app shows it (before, the app showed the seed text)', async ({ context }) => {
  const admin = await context.newPage();
  await admin.goto('/admin.html');
  await admin.waitForFunction(() => typeof (window as any).DB_save === 'function');
  await admin.evaluate(() => {
    const db = eval('productsDb');
    db['prod-2'].description = 'Описание от администратора';
    db['prod-2'].oldPrice = '99 000 ₽';
    (window as any).DB_save();
  });
  const app = await context.newPage();
  await app.goto('/index.html');
  await app.waitForFunction(() => typeof (window as any).switchTab === 'function');
  await app.waitForLoadState('load');
  await hideOnboarding(app);
  expect(await app.evaluate(() => eval('productsDb')['prod-2'].description)).toBe('Описание от администратора');
  await app.evaluate(() => (window as any).openProductModal('prod-2'));
  await expect(app.locator('#product-modal')).toContainText('Описание от администратора');
});

test('live sync: a product submitted from the app appears in the open admin moderation queue', async ({ context }) => {
  const admin = await context.newPage();
  await admin.setViewportSize({ width: 1280, height: 800 });
  await admin.goto('/admin.html');
  await admin.waitForFunction(() => typeof (window as any).go === 'function');
  await admin.evaluate(() => (window as any).go('moderation'));
  const before = await admin.locator('#content').innerText();
  expect(before).not.toContain('Тестовая плитка на проверке');

  const app = await context.newPage();
  await app.goto('/index.html');
  await app.waitForFunction(() => typeof (window as any).saveAllData === 'function');
  await app.waitForLoadState('load');
  await app.evaluate(() => {
    eval('productsDb')['prod-test'] = { id: 'prod-test', title: 'Тестовая плитка на проверке', price: '1 990 ₽', store: 'Постройка', status: 'pending', category: 'стройматериалы' };
    (window as any).saveAllData();
  });
  await expect(admin.locator('#content')).toContainText('Тестовая плитка на проверке');
});
