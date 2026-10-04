import { describe, expect, it } from 'vitest';
import type { OrderLine, StoreOrder } from '../../src/shared/domain/types';
import {
  STORE_ORDER_SLA_MS, buyerFacingAmount, confirmedAmount, expireOverdue, ordersForBuyer, ordersForStore, recalcStatus, statusLabel,
} from '../../src/shared/orders/store-order';

const line = (lineStatus: OrderLine['lineStatus'], quotedPrice = 1000, qty = 1, proposedPrice: number | null = null): OrderLine =>
  ({ productId: `p${Math.random()}`, qty, quotedPrice, proposedPrice, lineStatus });
const order = (lines: OrderLine[], status: StoreOrder['status'] = 'pending_review'): StoreOrder =>
  ({ id: 'so-1', checkoutId: 'chk-1', storeId: 'Постройка', status, lines, createdAt: 0 });
const after = (o: StoreOrder) => { recalcStatus(o); return o.status; };

describe('recalcStatus: status from the lines', () => {
  it('everything unanswered: waiting on the store', () => expect(after(order([line('pending'), line('pending')]))).toBe('pending_review'));
  it('everything confirmed: confirmed', () => expect(after(order([line('confirmed'), line('confirmed')]))).toBe('confirmed'));
  it('partly unavailable: partial', () => expect(after(order([line('confirmed'), line('unavailable')]))).toBe('partial'));
  it('nothing left: rejected', () => expect(after(order([line('unavailable'), line('removed')]))).toBe('rejected'));
  it('a new price outranks pending lines: waiting on the buyer', () =>
    expect(after(order([line('pending'), line('price_changed', 1000, 1, 900)]))).toBe('awaiting_buyer'));
  it('frozen statuses do not change', () => {
    for (const s of ['cancelled', 'expired', 'paid', 'invoiced', 'awaiting_payment'] as const) {
      expect(after(order([line('confirmed')], s))).toBe(s);
    }
  });
});

describe('confirmedAmount', () => {
  it('only confirmed lines, the new price takes priority', () => {
    const o = order([line('confirmed', 1000, 2), line('confirmed', 500, 1, 450), line('unavailable', 9999)]);
    expect(confirmedAmount(o)).toBe(2000 + 450);
  });
});

describe('expireOverdue', () => {
  it('only pending_review past its SLA', () => {
    const now = 10 * STORE_ORDER_SLA_MS;
    const late = { ...order([line('pending')]), slaDeadline: now - 1 };
    const fresh = { ...order([line('pending')]), slaDeadline: now + 1 };
    const done = { ...order([line('confirmed')], 'confirmed'), slaDeadline: now - 1 };
    expect(expireOverdue([late, fresh, done], now)).toBe(true);
    expect([late.status, fresh.status, done.status]).toEqual(['expired', 'pending_review', 'confirmed']);
    expect(expireOverdue([fresh], now)).toBe(false);
  });
});

describe('statusLabel', () => {
  it('known status gives text, unknown is returned as is', () => {
    expect(statusLabel('expired')).toBe('Магазин не ответил');
    expect(statusLabel('weird')).toBe('weird');
  });
});

describe('ordersForBuyer / ordersForStore', () => {
  const o = (id: string, checkoutId: string, storeId: string, createdAt: number, phone?: string): StoreOrder =>
    ({ id, checkoutId, storeId, status: 'pending_review', lines: [], createdAt, contact: phone ? { name: 'x', phone } : undefined });
  const m = {
    checkouts: [{ id: 'c1', userId: 'anna@x.ru' }, { id: 'c2', userId: '+7 900' }, { id: 'c3', userId: 'other' }],
    storeOrders: [o('a', 'c1', 'S1', 1), o('b', 'c2', 'S2', 3), o('c', 'c3', 'S1', 2, '+7 900'), o('d', 'c3', 'S1', 4)],
  };
  it('by account, by phone through the checkout and through the contact; newest first', () => {
    expect(ordersForBuyer(m, { userId: 'anna@x.ru', phone: '+7 900' }).map((x) => x.id)).toEqual(['b', 'c', 'a']);
  });
  it('without an account and a phone, nothing (an empty phone does not match empty contacts)', () => {
    expect(ordersForBuyer(m, { userId: undefined, phone: '' })).toEqual([]);
  });
  it('store orders', () => expect(ordersForStore(m.storeOrders, 'S1').map((x) => x.id)).toEqual(['d', 'c', 'a']));
  it('amount for the buyer: confirmed, otherwise at checkout prices', () => {
    const lines: OrderLine[] = [line('pending', 100, 2), line('pending', 50, 1)];
    expect(buyerFacingAmount({ lines })).toBe(250);
    lines[0].lineStatus = 'confirmed';
    expect(buyerFacingAmount({ lines })).toBe(200);
  });
});
