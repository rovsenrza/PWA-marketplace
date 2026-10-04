import { describe, expect, it } from 'vitest';
import type { Marketplace, OrderLine, StoreOrder } from '../../src/shared/domain/types';
import {
  acceptNewPrices, cancelOrder, confirmAll, issueInvoice, linesToReturn, markPaid,
  parseOfferedPrice, rejectAll, setLineStatus,
} from '../../src/shared/orders/store-order-actions';

const L = (productId: string, lineStatus: OrderLine['lineStatus'] = 'pending', quotedPrice = 1000, qty = 1): OrderLine =>
  ({ productId, qty, quotedPrice, proposedPrice: null, lineStatus });
const order = (lines: OrderLine[], status: StoreOrder['status'] = 'pending_review'): StoreOrder =>
  ({ id: 'so-1', checkoutId: 'chk', storeId: 'Постройка', status, lines, createdAt: 0 });
const market = (o: StoreOrder): Marketplace => ({ checkouts: [], storeOrders: [o], invoices: [], payments: [] });
let n = 0; const uid = (p: string) => `${p}${++n}`;

describe('the store answers on lines', () => {
  it('confirm one, the other unavailable → partial', () => {
    const o = order([L('a'), L('b')]);
    setLineStatus(o, 'a', 'confirmed');
    setLineStatus(o, 'b', 'unavailable');
    expect(o.status).toBe('partial');
  });
  it('new price → waiting on the buyer; the buyer accepts → confirmed at the new price', () => {
    const o = order([L('a', 'pending', 1000)]);
    expect(setLineStatus(o, 'a', 'price_changed', 900).ok).toBe(true);
    expect(o.status).toBe('awaiting_buyer');
    acceptNewPrices(o);
    expect([o.status, o.lines[0].quotedPrice]).toEqual(['confirmed', 900]);
  });
  it('a new price without a sum is refused', () => {
    expect(setLineStatus(order([L('a')]), 'a', 'price_changed')).toEqual({ ok: false, reason: 'bad_price' });
    expect(parseOfferedPrice('1 290 ₽')).toBe(1290);
    expect(parseOfferedPrice('бесплатно')).toBeNull();
  });
  it('confirm all: pending and new prices, at the new price', () => {
    const o = order([L('a'), { ...L('b', 'price_changed', 500), proposedPrice: 450 }]);
    confirmAll(o);
    expect(o.lines.map((l) => [l.lineStatus, l.quotedPrice])).toEqual([['confirmed', 1000], ['confirmed', 450]]);
    expect(o.status).toBe('confirmed');
  });
});

describe('invoice and payment', () => {
  it('only for a confirmed order and only once (two invoices used to be possible)', () => {
    const o = order([L('a', 'confirmed', 700, 2)], 'confirmed');
    const m = market(o);
    const r = issueInvoice(m, o, 1, uid);
    expect(r.ok && r.invoice.amount).toBe(1400);
    expect(o.status).toBe('awaiting_payment');
    expect(issueInvoice(m, o, 2, uid)).toEqual({ ok: false, reason: 'already_invoiced' });
    expect(m.invoices).toHaveLength(1);
  });
  it('no invoice while the order is waiting on the buyer', () => {
    const o = order([{ ...L('a', 'price_changed'), proposedPrice: 900 }], 'awaiting_buyer');
    expect(issueInvoice(market(o), o)).toEqual({ ok: false, reason: 'not_ready' });
  });
  it('payment: only after the invoice, once', () => {
    const o = order([L('a', 'confirmed')], 'confirmed');
    const m = market(o);
    expect(markPaid(m, o)).toEqual({ ok: false, reason: 'no_invoice' });
    issueInvoice(m, o, 1, uid);
    expect(markPaid(m, o, 2, uid).ok).toBe(true);
    expect([o.status, m.invoices[0].status, m.payments.length]).toEqual(['paid', 'paid', 1]);
    expect(markPaid(m, o)).toEqual({ ok: false, reason: 'locked' });
    expect(m.payments).toHaveLength(1);
  });
});

describe('a locked order does not change', () => {
  it('a paid order can be neither rejected nor cancelled (it used to turn into «Отклонён»)', () => {
    const o = order([L('a', 'confirmed')], 'paid');
    expect(rejectAll(o)).toEqual({ ok: false, reason: 'locked' });
    expect(cancelOrder(o)).toEqual({ ok: false, reason: 'locked' });
    expect(o.status).toBe('paid');
  });
  it('after the invoice, lines are fixed', () => {
    const o = order([L('a', 'confirmed')], 'awaiting_payment');
    expect(setLineStatus(o, 'a', 'unavailable')).toEqual({ ok: false, reason: 'locked' });
    expect(confirmAll(o)).toEqual({ ok: false, reason: 'locked' });
    expect(o.lines[0].lineStatus).toBe('confirmed');
  });
  it('a rejected order can still be revised by the store', () => {
    const o = order([L('a', 'unavailable')], 'rejected');
    expect(setLineStatus(o, 'a', 'confirmed').ok).toBe(true);
    expect(o.status).toBe('confirmed');
  });
});

describe('back to the cart', () => {
  it('a working order returns only the unavailable lines, a failed one returns all', () => {
    expect(linesToReturn(order([L('a', 'confirmed'), L('b', 'unavailable')], 'partial')).map((l) => l.productId)).toEqual(['b']);
    expect(linesToReturn(order([L('a', 'confirmed'), L('b', 'pending')], 'expired'))).toHaveLength(2);
  });
});
