/**
 * Store order rules (Cart → Checkout → StoreOrder → Invoice → Payment).
 * Each store gets its own order; the store confirms lines, marks them unavailable, or offers
 * a different price, and the order's status follows from its lines. Pure functions over data:
 * shared by the app, the admin and, later, the server.
 */
import type { OrderLine, StoreOrder, StoreOrderStatus } from '../domain/types';

/** How long a store has to respond before the order goes to «Магазин не ответил». */
export const STORE_ORDER_SLA_MS = 2 * 60 * 60 * 1000;

const LABELS: Record<StoreOrderStatus, string> = {
  pending_review: 'Ждёт магазин',
  awaiting_buyer: 'Ждёт ваше согласие по цене',
  partial: 'Частично подтверждён',
  confirmed: 'Подтверждён, можно выставить счёт',
  rejected: 'Отклонён',
  expired: 'Магазин не ответил',
  cancelled: 'Отменён',
  invoiced: 'Счёт выставлен',
  awaiting_payment: 'Ожидает оплату',
  paid: 'Оплачен',
};

export function statusLabel(status: string): string {
  return LABELS[status as StoreOrderStatus] ?? status;
}

/** Statuses after which lines no longer affect the order. */
const FROZEN: ReadonlySet<StoreOrderStatus> = new Set(['cancelled', 'expired', 'paid', 'invoiced', 'awaiting_payment']);

/**
 * Recomputes the order status from its lines (mutates order.status, as the legacy code expects).
 * Priority: nothing left → rejected; a new price exists → waiting on the buyer;
 * something unanswered → waiting on the store; otherwise confirmed (fully or partly).
 */
export function recalcStatus(order: Pick<StoreOrder, 'status' | 'lines'>): void {
  if (FROZEN.has(order.status)) return;
  const lines = order.lines ?? [];
  const has = (s: OrderLine['lineStatus']) => lines.some((l) => l.lineStatus === s);
  if (lines.every((l) => l.lineStatus === 'unavailable' || l.lineStatus === 'removed')) { order.status = 'rejected'; return; }
  if (has('price_changed')) { order.status = 'awaiting_buyer'; return; }
  if (has('pending')) { order.status = 'pending_review'; return; }
  if (has('confirmed')) order.status = has('unavailable') ? 'partial' : 'confirmed';
}

/** Total of confirmed lines (using the new price, if the store set one). */
export function confirmedAmount(order: Pick<StoreOrder, 'lines'>): number {
  return (order.lines ?? [])
    .filter((l) => l.lineStatus === 'confirmed')
    .reduce((sum, l) => sum + (l.proposedPrice || l.quotedPrice) * (l.qty || 1), 0);
}

/** Moves orders the store didn't answer in time to expired. Returns whether anything changed. */
export function expireOverdue(orders: StoreOrder[], now: number = Date.now()): boolean {
  let changed = false;
  for (const o of orders) {
    if (o.status === 'pending_review' && o.slaDeadline && now > o.slaDeadline) {
      o.status = 'expired';
      changed = true;
    }
  }
  return changed;
}
