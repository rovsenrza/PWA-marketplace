import { test, expect } from './fixtures';

/* The order goes through the legacy UI, and the status rules through the module (src/shared/orders). */
test('checkout as a guest: an order per store, visible in «Мои заказы», confirmation, SLA expiry', async ({ app }) => {
  await app.evaluate(() => {
    const w = window as any;
    w.addToCart('prod-2');  // Любимый Дом
    w.addToCart('prod-4');  // Постройка
    w.switchTab('cart');
  });
  await app.fill('#chk-name', 'Тест Покупатель');
  await app.fill('#chk-phone', '+7 (900) 000-00-00');
  await app.evaluate(() => (window as any).submitCheckout());

  type Row = { id: string; store: string; status: string };
  const orders = (): Promise<Row[]> => app.evaluate(() => eval('marketplace').storeOrders.map((o: any) => ({ id: o.id, store: o.storeId, status: o.status })));
  const list = await orders();
  expect(list.map((o) => o.store).sort()).toEqual(['Любимый Дом', 'Постройка']);
  expect(list.every((o) => o.status === 'pending_review')).toBe(true);
  await expect(app.locator('#buyer-orders-list')).toContainText('Ждёт магазин');

  /* магазин подтверждает первый заказ */
  await app.evaluate((id) => (window as any).soConfirmAll(id), list[0].id);
  /* второй магазин не ответил вовремя */
  await app.evaluate((id) => {
    const o = eval('marketplace').storeOrders.find((x: any) => x.id === id);
    o.slaDeadline = Date.now() - 1;
    (window as any).expireExpiredStoreOrders();
    (window as any).renderBuyerOrders();
  }, list[1].id);
  const after = await orders();
  expect(after.find((o) => o.id === list[0].id)!.status).toBe('confirmed');
  expect(after.find((o) => o.id === list[1].id)!.status).toBe('expired');
  await expect(app.locator('#buyer-orders-list')).toContainText('Магазин не ответил');
});

test('cart: survives a reload (repository → localStorage), quantity and remove', async ({ app }) => {
  await app.evaluate(() => { const w = window as any; w.addToCart('prod-2'); w.addToCart('prod-2'); w.addToCart('prod-4', 3); });
  await expect(app.locator('#cart-badge')).toHaveText('5');
  await app.reload();
  await app.waitForFunction(() => typeof (window as any).switchTab === 'function');
  await expect(app.locator('#cart-badge')).toHaveText('5');
  await app.evaluate(() => { const w = window as any; w.setCartQty('prod-4', 1); w.removeFromCart('prod-2'); });
  await expect(app.locator('#cart-badge')).toHaveText('1');
  /* legacy reads state.cart: it is an accessor onto the same store */
  expect(await app.evaluate(() => eval('state').cart.map((i: any) => i.productId))).toEqual(['prod-4']);
});

test('lifehack: «Собрать в корзину» (legacy writes state.cart) lands in the shared store', async ({ app }) => {
  const id = await app.evaluate(() => (eval('lifehacksDb') as any[]).find((x) => x.estimate?.lines?.length)?.id);
  expect(id, 'a lifehack with an estimate').toBeTruthy();
  await app.evaluate((x) => (window as any).addLifehackEstimateToCart(x), id);
  const n = await app.evaluate(() => (window as any).getCartItems().length);
  expect(n).toBeGreaterThan(0);
  await expect(app.locator('#cart-badge')).toBeVisible();
});

test('store and buyer: new price → acceptance → invoice → payment; refusals on a locked order', async ({ app }) => {
  app.on('dialog', (d) => d.accept('50000'));
  await app.evaluate(() => { const w = window as any; w.addToCart('prod-2'); w.addToCart('prod-4'); w.switchTab('cart'); });
  await app.fill('#chk-name', 'Тест');
  await app.fill('#chk-phone', '+7 900 111-22-33');
  await app.evaluate(() => (window as any).submitCheckout());
  const so = (store: string) => app.evaluate((s) => JSON.parse(JSON.stringify(eval('marketplace').storeOrders.find((o: any) => o.storeId === s))), store);

  const ld = await so('Любимый Дом');
  await app.evaluate(([id, p]) => (window as any).soProposePrice(id, p), [ld.id, 'prod-2']);
  expect((await so('Любимый Дом')).status).toBe('awaiting_buyer');
  await app.evaluate((id) => (window as any).soAcceptPrice(id), ld.id);
  expect((await so('Любимый Дом')).lines[0].quotedPrice).toBe(50000);
  await app.evaluate((id) => { (window as any).soIssueInvoice(id); (window as any).soIssueInvoice(id); }, ld.id);
  expect(await app.evaluate(() => eval('marketplace').invoices.length)).toBe(1);
  await app.evaluate((id) => (window as any).soMarkPaid(id), ld.id);
  await app.evaluate((id) => (window as any).soRejectAll(id), ld.id);
  expect((await so('Любимый Дом')).status).toBe('paid');

  /* второй магазин: нет в наличии → покупатель возвращает позицию в корзину */
  const ps = await so('Постройка');
  await app.evaluate(([id, p]) => (window as any).soMarkUnavailable(id, p), [ps.id, 'prod-4']);
  expect((await so('Постройка')).status).toBe('rejected');
  await app.evaluate((id) => (window as any).soReturnToCart(id), ps.id);
  expect(await app.evaluate(() => (window as any).getCartItems().map((i: any) => i.productId))).toEqual(['prod-4']);
});

test('price with kopecks: the cart counts it correctly (before, «1 299,90 ₽» became 129 990)', async ({ app }) => {
  await app.evaluate(() => {
    eval('productsDb')['prod-4'].price = '1 299,90 ₽';
    (window as any).addToCart('prod-4', 2);
    (window as any).switchTab('cart');
  });
  await expect(app.locator('#cart-list .cart-total')).toHaveText('Итого: 2 599,80 ₽');
  await expect(app.locator('#cart-list .cart-card-price').first()).toHaveText('1 299,90 ₽');
});
