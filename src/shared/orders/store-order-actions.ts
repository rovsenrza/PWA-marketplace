/**
 * Actions on a store order: by the store (confirm, unavailable, new price, reject all,
 * invoice, payment) and by the buyer (accept the price, cancel, return items to the cart).
 * Pure transitions over the data: they mutate the passed order (as the legacy code expects) and
 * return a result instead of showing toasts themselves. The rule for a locked order lives here, in one place.
 */
import type { Invoice, Marketplace, OrderLine, OrderLineStatus, Payment, StoreOrder } from '../domain/types';
import { confirmedAmount, recalcStatus } from './store-order';
import { makeUid } from './checkout';

export type ActionError = 'not_found' | 'locked' | 'bad_price' | 'nothing_confirmed' | 'already_invoiced' | 'no_invoice' | 'not_ready';
export type Result<T = object> = ({ ok: true } & T) | { ok: false; reason: ActionError };

const fail = (reason: ActionError) => ({ ok: false as const, reason });

/**
 * Locked: there's an invoice or a payment, or the order is cancelled or expired. Its lines don't change.
 * (A rejected order can still be revised by the store, as in the prototype.)
 */
const LOCKED = new Set(['invoiced', 'awaiting_payment', 'paid', 'cancelled', 'expired']);
export const isLocked = (o: StoreOrder): boolean => LOCKED.has(o.status);

export const findOrder = (m: Marketplace, id: string) => m.storeOrders.find((o) => o.id === id);
const findLine = (o: StoreOrder, productId: string) => o.lines.find((l) => l.productId === productId);

/** The store's answer on one line. */
export function setLineStatus(o: StoreOrder, productId: string, status: OrderLineStatus, proposedPrice?: number): Result {
  if (isLocked(o)) return fail('locked');
  const line = findLine(o, productId);
  if (!line) return fail('not_found');
  if (status === 'price_changed' && !(proposedPrice && proposedPrice > 0)) return fail('bad_price');
  line.lineStatus = status;
  if (proposedPrice != null) line.proposedPrice = proposedPrice;
  recalcStatus(o);
  return { ok: true };
}

/** '1 290 ₽', '1290' → 1290; nothing → null. */
export function parseOfferedPrice(input: string | null | undefined): number | null {
  const n = parseInt(String(input ?? '').replace(/\D/g, ''), 10);
  return n > 0 ? n : null;
}

/** The store confirms everything left: pending ones, and new prices at that new price. */
export function confirmAll(o: StoreOrder): Result {
  if (isLocked(o)) return fail('locked');
  for (const l of o.lines) {
    if (l.lineStatus === 'pending' || l.lineStatus === 'price_changed') {
      l.lineStatus = 'confirmed';
      if (l.proposedPrice) l.quotedPrice = l.proposedPrice;
    }
  }
  recalcStatus(o);
  return { ok: true };
}

/** The store rejects the order: nothing is in stock. */
export function rejectAll(o: StoreOrder): Result {
  if (isLocked(o)) return fail('locked');
  o.lines.forEach((l) => { l.lineStatus = 'unavailable'; });
  o.status = 'rejected';
  return { ok: true };
}

/** The buyer cancels the order. A paid order can't be cancelled. */
export function cancelOrder(o: StoreOrder): Result {
  if (o.status === 'paid') return fail('locked');
  o.status = 'cancelled';
  return { ok: true };
}

/** The buyer accepts the store's new prices. */
export function acceptNewPrices(o: StoreOrder): Result {
  if (isLocked(o)) return fail('locked');
  for (const l of o.lines) {
    if (l.lineStatus === 'price_changed' && l.proposedPrice) {
      l.quotedPrice = l.proposedPrice;
      l.lineStatus = 'confirmed';
    }
  }
  recalcStatus(o);
  return { ok: true };
}

/** Which lines go back to the cart: unavailable ones, or all if the order fell through (expired, cancelled, rejected). */
export function linesToReturn(o: StoreOrder): OrderLine[] {
  const failed = o.status === 'expired' || o.status === 'cancelled' || o.status === 'rejected';
  return o.lines.filter((l) => failed || l.lineStatus === 'unavailable');
}

/** Invoice for the confirmed lines. Only a confirmed (fully or partly) order, and only once. */
export function issueInvoice(m: Marketplace, o: StoreOrder, now = Date.now(), uid = makeUid): Result<{ invoice: Invoice }> {
  if (o.invoiceId) return fail('already_invoiced');
  if (o.status !== 'confirmed' && o.status !== 'partial') return fail('not_ready');
  const amount = confirmedAmount(o);
  if (!amount) return fail('nothing_confirmed');
  const invoice: Invoice = { id: uid('inv-'), storeOrderId: o.id, amount, currency: 'RUB', channel: 'in_app', status: 'issued', createdAt: now };
  m.invoices.push(invoice);
  o.status = 'awaiting_payment';
  o.invoiceId = invoice.id;
  return { ok: true, invoice };
}

/** The store marks the invoice as paid (manually: payment outside the app). */
export function markPaid(m: Marketplace, o: StoreOrder, now = Date.now(), uid = makeUid): Result<{ payment: Payment }> {
  if (!o.invoiceId) return fail('no_invoice');
  if (o.status === 'paid') return fail('locked');
  const inv = m.invoices.find((i) => i.id === o.invoiceId);
  const payment: Payment = { id: uid('pay-'), invoiceId: o.invoiceId, provider: 'manual', status: 'succeeded', amount: inv ? inv.amount : confirmedAmount(o), paidAt: now };
  m.payments.push(payment);
  if (inv) inv.status = 'paid';
  o.status = 'paid';
  return { ok: true, payment };
}
