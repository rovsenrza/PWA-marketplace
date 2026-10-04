/**
 * Store order actions under the old so* names (onclick in renderBuyerOrders / renderShopOrders).
 * The rules are in shared/orders/store-order-actions.ts; here: finding the order, saving, redrawing, toasts.
 */
import type { StoreOrder } from '../../../shared/domain/types';
import { formatRub } from '../../../shared/format/price';
import { addItem, snapshotOf } from '../../../shared/orders/cart';
import { confirmedAmount } from '../../../shared/orders/store-order';
import {
  acceptNewPrices, cancelOrder, confirmAll, findOrder, issueInvoice, linesToReturn,
  markPaid, parseOfferedPrice, rejectAll, setLineStatus, type ActionError, type Result,
} from '../../../shared/orders/store-order-actions';
import { cartStore as store } from '../cart/cart-store';

const toast = (msg: string) => window.showSmsToast?.(msg);
const ERRORS: Record<ActionError, string> = {
  not_found: 'Заказ не найден',
  locked: 'Заказ уже нельзя изменить',
  bad_price: 'Некорректная цена',
  nothing_confirmed: 'Нет подтверждённых позиций',
  already_invoiced: 'Счёт уже выставлен',
  no_invoice: 'Сначала выставьте счёт',
  not_ready: 'Сначала подтвердите позиции',
};

/** Finds the order, runs the action, saves and redraws on success; on refusal, shows the reason. */
function run<T>(orderId: string, action: (o: StoreOrder) => Result<T>, okMessage?: (r: T) => string): boolean {
  const o = findOrder(store.marketplace, orderId);
  if (!o) return false;
  const r = action(o);
  if (!r.ok) { toast(ERRORS[r.reason]); return false; }
  store.saveOrders();
  window.refreshCartSurfaces?.();
  if (okMessage) toast(okMessage(r as T));
  return true;
}

export const soConfirmLine = (orderId: string, productId: string) =>
  run(orderId, (o) => setLineStatus(o, productId, 'confirmed'), () => 'Позиция подтверждена');

export const soMarkUnavailable = (orderId: string, productId: string) =>
  run(orderId, (o) => setLineStatus(o, productId, 'unavailable'), () => 'Нет в наличии');

export function soProposePrice(orderId: string, productId: string): void {
  const o = findOrder(store.marketplace, orderId);
  const line = o?.lines.find((l) => l.productId === productId);
  if (!line) return;
  const input = window.prompt('Новая цена, ₽', String(line.quotedPrice));
  if (input == null) return;
  const price = parseOfferedPrice(input);
  if (!price) { toast(ERRORS.bad_price); return; }
  run(orderId, (x) => setLineStatus(x, productId, 'price_changed', price), () => 'Цена отправлена клиенту');
}

export const soConfirmAll = (orderId: string) => run(orderId, confirmAll);
export const soRejectAll = (orderId: string) => run(orderId, rejectAll);
export const soCancel = (orderId: string) => run(orderId, cancelOrder, () => 'Заказ отменён');
export const soAcceptPrice = (orderId: string) => run(orderId, acceptNewPrices, () => 'Новая цена принята');

export const soIssueInvoice = (orderId: string) =>
  run(orderId, (o) => issueInvoice(store.marketplace, o), (r) => `Счёт ${formatRub(r.invoice.amount)} выставлен`);

export const soMarkPaid = (orderId: string) =>
  run(orderId, (o) => markPaid(store.marketplace, o), () => 'Оплата отмечена');

/** Unavailable items (or the whole failed order) go back to the cart as fresh lines from the catalogue. */
export function soReturnToCart(orderId: string): void {
  const o = findOrder(store.marketplace, orderId);
  if (!o) return;
  let items = store.list();
  for (const l of linesToReturn(o)) {
    const p = productsDb[l.productId];
    if (p) items = addItem(items, snapshotOf(p, l.qty || 1)).items;
  }
  store.replace(items);
  store.saveCart();
  store.saveOrders();
  window.refreshCartSurfaces?.();
  toast('Позиции возвращены в корзину');
}

/** Message to the client in Telegram or MAX with the amount due. */
export function soContactClient(orderId: string, channel: 'telegram' | 'max'): void {
  const o = findOrder(store.marketplace, orderId);
  if (!o) return;
  const amount = confirmedAmount(o);
  const msg = encodeURIComponent(`Заказ ${o.id} из «${o.storeId}». К оплате: ${formatRub(amount)}`);
  if (channel === 'telegram') {
    const handle = (o.contact?.telegram ?? '').replace(/^@/, '');
    if (handle.includes('t.me')) window.open(handle, '_blank');
    else if (handle) window.open(`https://t.me/${handle}?text=${msg}`, '_blank');
    else toast('Клиент не указал Telegram');
  } else {
    const m = o.contact?.max ?? '';
    if (m.startsWith('http')) window.open(m, '_blank');
    else toast(`MAX: ${m || 'не указан'}. Счёт: ${formatRub(amount)}`);
  }
}

export const ordersLegacyApi = {
  soConfirmLine, soMarkUnavailable, soProposePrice, soConfirmAll, soRejectAll, soCancel,
  soAcceptPrice, soReturnToCart, soIssueInvoice, soMarkPaid, soContactClient,
};
