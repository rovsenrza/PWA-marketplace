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
