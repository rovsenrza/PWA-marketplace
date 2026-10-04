import { test, expect } from './fixtures';

/* Data can't inject markup: product titles (stores edit them) and buyer contacts
   (the store sees them in its cabinet) render as text. */
const EVIL = `<img src=x onerror="window.__pwned=1">"'`;

test('cart and «Мои заказы»: a product title with markup renders as text', async ({ app }) => {
  await app.evaluate((evil) => {
    const db = eval('productsDb');
    db['prod-2'].title = evil;
    db['prod-2'].store = `Магазин ${evil}`;
    (window as any).addToCart('prod-2');
    (window as any).switchTab('cart');
  }, EVIL);
  await expect(app.locator('#cart-list .cart-card-title')).toHaveText(EVIL);
  expect(await app.locator('#cart-list img[src="x"]').count()).toBe(0);
  await app.fill('#chk-name', EVIL);
  await app.fill('#chk-phone', '+7 900 000-00-00');
  await app.evaluate(() => (window as any).submitCheckout());
  await expect(app.locator('#buyer-orders-list')).toContainText('<img src=x');
  expect(await app.locator('#buyer-orders-list img').count()).toBe(0);
  expect(await app.evaluate(() => (window as any).__pwned)).toBeUndefined();
});

test('store cabinet: the buyer name with markup renders as text; buttons work through data-action', async ({ app }) => {
  await app.evaluate(() => { (window as any).addToCart('prod-4'); (window as any).switchTab('cart'); });
  await app.fill('#chk-name', EVIL);
  await app.fill('#chk-phone', '+7 900 000-00-00');
  await app.evaluate(() => (window as any).submitCheckout());
  await app.evaluate(() => { const s = eval('state'); s.currentShop = 'Постройка'; (window as any).renderShopOrders(); });
  const list = app.locator('#shop-orders-list');
  await expect(list).toContainText('<img src=x');
  expect(await list.locator('img').count()).toBe(0);
  /* кнопка «Есть» — настоящий клик по data-action */
  await list.locator('[data-action="so-confirm-line"]').first().evaluate((b: HTMLElement) => b.click());
  expect(await app.evaluate(() => eval('marketplace').storeOrders[0].status)).toBe('confirmed');
  expect(await app.evaluate(() => (window as any).__pwned)).toBeUndefined();
});

test('cart: the «+», «−» and «×» buttons (data-action) with real clicks', async ({ app }) => {
  await app.evaluate(() => { (window as any).addToCart('prod-2'); (window as any).switchTab('cart'); });
  const card = app.locator('#cart-list .cart-card').first();
  await card.locator('[data-action="cart-qty"]').last().click();
  await expect(card.locator('.cart-qty span')).toHaveText('2');
  await card.locator('[data-action="cart-qty"]').first().click();
  await expect(card.locator('.cart-qty span')).toHaveText('1');
  await app.locator('#cart-list [data-action="cart-remove"]').first().click();
  await expect(app.locator('#cart-list .cart-empty')).toBeVisible();
});

test('favourites: a title with markup renders as text; «убрать магазин» and the product open with real clicks', async ({ app }) => {
  await app.evaluate((evil) => {
    const db = eval('productsDb');
    db['prod-2'].title = evil;
    (window as any).toggleFavorite('prod-2');
    (window as any).toggleFavorite('prod-4');
    (window as any).switchTab('favorites');
  }, EVIL);
  const list = app.locator('#favorites-list');
  await expect(list.locator('.fav-item-title').first()).toHaveText(EVIL);
  expect(await list.locator('img[src="x"]').count()).toBe(0);
  await list.locator('.fav-item').first().click();
  await expect(app.locator('#product-modal')).toBeVisible();
  await app.evaluate(() => (window as any).closeProductModal());
  await list.locator('[data-action="fav-unfavorite-store"]').first().click();
  await expect(list.locator('.fav-card')).toHaveCount(1);
  expect(await app.evaluate(() => (window as any).__pwned)).toBeUndefined();
});

test('«Отправить заказ менеджеру»: the URL is encoded whole (a title with & and # does not break the message)', async ({ app }) => {
  await app.evaluate(() => {
    const w = window as any;
    w.__opened = [];
    w.open = (u: string) => { w.__opened.push(u); return null; };
    eval('productsDb')['prod-2'].title = 'Кровать #1 & тумба';
    w.toggleFavorite('prod-2');
    w.switchTab('favorites');
  });
  await app.locator('[data-action="fav-send-manager"]').first().click();
  const url = await app.evaluate(() => (window as any).__opened[0] as string);
  expect(url.startsWith('https://t.me/')).toBe(true);
  const text = new URL(url).searchParams.get('text')!;
  expect(text).toContain('1. Кровать #1 & тумба — 57 240 ₽');
  expect(text).toContain('Итого: 57 240 ₽');
});
