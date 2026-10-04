import { describe, expect, it } from 'vitest';
import type { CartItem, Marketplace, Product } from '../../src/shared/domain/types';
import { addItem, cartTotal, hasProduct, normalizeCart, qtyTotal, removeItem, setQty, snapshotOf } from '../../src/shared/orders/cart';
import { cleanContact, createCheckout } from '../../src/shared/orders/checkout';
import { STORE_ORDER_SLA_MS } from '../../src/shared/orders/store-order';
import { normalizeMarketplace } from '../../src/shared/data/repositories';
import { CartStore } from '../../src/app/features/cart/cart-store';

const prod = (id: string, store: string, price = '1 000 ₽'): Product =>
  ({ id, title: `Товар ${id}`, price, store, status: 'published' });
const db: Record<string, Product> = { a: prod('a', 'Постройка', '450 ₽'), b: prod('b', 'Любимый Дом', '57 240 ₽') };

describe('snapshotOf / normalizeCart', () => {
  it('the snapshot freezes price and title', () => {
    expect(snapshotOf(db.b, 2, 'Белый')).toMatchObject({ productId: 'b', storeId: 'Любимый Дом', qty: 2, priceSnapshot: 57240, variant: 'Белый' });
  });
  it('the old id format becomes lines, unknown ids are dropped', () => {
    expect(normalizeCart(['a', 'zzz', 'b'], (id) => db[id]).map((i) => i.productId)).toEqual(['a', 'b']);
  });
  it('broken records and junk give an empty or cleaned cart', () => {
    expect(normalizeCart('oops', (id) => db[id])).toEqual([]);
    expect(normalizeCart([null, { qty: 1 }, snapshotOf(db.a)], (id) => db[id])).toHaveLength(1);
  });
});

describe('cart operations', () => {
  const start: CartItem[] = [snapshotOf(db.a)];
  it('adding an existing product increases the quantity', () => {
    const r = addItem(start, snapshotOf(db.a, 3));
    expect(r.existed).toBe(true);
    expect(r.items[0].qty).toBe(4);
    expect(start[0].qty).toBe(1); // исходный массив не изменён
  });
  it('a new product is appended to the end, quantity at least 1', () => {
    const r = addItem(start, snapshotOf(db.b, 0));
    expect(r.existed).toBe(false);
    expect(r.items.map((i) => [i.productId, i.qty])).toEqual([['a', 1], ['b', 1]]);
  });
  it('quantity 0 removes the line', () => expect(setQty(start, 'a', 0)).toEqual([]));
  it('removing, totals', () => {
    const items = addItem(addItem(start, snapshotOf(db.b, 2)).items, snapshotOf(db.a)).items;
    expect(qtyTotal(items)).toBe(4);
    expect(cartTotal(items)).toBe(450 * 2 + 57240 * 2);
    expect(hasProduct(removeItem(items, 'a'), 'a')).toBe(false);
  });
});

describe('checkout', () => {
  it('the contact is required: name and phone', () => {
    expect(cleanContact({ name: '  ', phone: '+7' })).toBeNull();
    expect(cleanContact({ name: ' Иван ', phone: ' +7 900 ' })).toMatchObject({ name: 'Иван', phone: '+7 900' });
  });
  it('one order per store, lines pending, SLA set', () => {
    let n = 0;
    const items = [snapshotOf(db.a, 2), snapshotOf(db.b), snapshotOf(prod('c', 'Постройка'))];
    const contact = cleanContact({ name: 'Иван', phone: '+7 900' })!;
    const { checkout, storeOrders } = createCheckout({ items, contact, userId: '+7 900', now: 1000, uid: (p) => `${p}${++n}` });
    expect(checkout).toMatchObject({ id: 'chk-1', userId: '+7 900', status: 'submitted' });
    expect(storeOrders.map((o) => [o.storeId, o.lines.length])).toEqual([['Постройка', 2], ['Любимый Дом', 1]]);
    expect(storeOrders.every((o) => o.checkoutId === 'chk-1' && o.status === 'pending_review' && o.slaDeadline === 1000 + STORE_ORDER_SLA_MS)).toBe(true);
    expect(storeOrders[0].lines[0]).toMatchObject({ productId: 'a', qty: 2, quotedPrice: 450, proposedPrice: null, lineStatus: 'pending' });
  });
});

describe('CartStore with an in-memory repository', () => {
  const memory = () => {
    let cart: unknown = [];
    let orders: Marketplace = normalizeMarketplace(null);
    return {
      cartRepo: { loadRaw: () => cart, save: (i: CartItem[]) => { cart = JSON.parse(JSON.stringify(i)); } },
      ordersRepo: { load: () => normalizeMarketplace(JSON.parse(JSON.stringify(orders))), save: (m: Marketplace) => { orders = JSON.parse(JSON.stringify(m)); } },
      peek: () => ({ cart, orders }),
    };
  };
  it('lines and orders survive save → load', () => {
    const m = memory();
    const s1 = new CartStore(m.cartRepo, m.ordersRepo);
    s1.replace(addItem([], snapshotOf(db.a, 2)).items);
    s1.marketplace.storeOrders.push(createCheckout({ items: s1.list(), contact: { name: 'И', phone: '1' }, userId: '1' }).storeOrders[0]);
    s1.saveCart(); s1.saveOrders();
    const s2 = new CartStore(m.cartRepo, m.ordersRepo);
    s2.loadCart((id) => db[id]); s2.loadOrders();
    expect(s2.count()).toBe(2);
    expect(s2.marketplace.storeOrders).toHaveLength(1);
  });
  it('normalizeMarketplace fills in missing collections', () => {
    expect(normalizeMarketplace({ storeOrders: [{ id: 'x' }] })).toMatchObject({ checkouts: [], invoices: [], payments: [], storeOrders: [{ id: 'x' }] });
  });
});
