/**
 * Cart actions under the old names: the markup calls them (onclick="addToCart('…')")
 * and so does the remaining legacy code. The logic is in shared/orders and the store; here are
 * only the screen side effects: redraw (legacy refreshCartSurfaces) and the toast.
 */
import { addItem, removeItem, setQty, snapshotOf } from '../../../shared/orders/cart';
import { cleanContact, createCheckout, makeUid } from '../../../shared/orders/checkout';
import { expireOverdue } from '../../../shared/orders/store-order';
import { StorageKeys } from '../../../shared/storage/keys';
import { writeJSON } from '../../../shared/storage/local-store';
import { cartStore as store } from './cart-store';

const toast = (msg: string) => window.showSmsToast?.(msg);
const refresh = () => window.refreshCartSurfaces?.();
const field = (id: string) => (document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null)?.value ?? '';

export function loadCart(): void {
  store.loadCart((id) => productsDb[id]);
  window.updateCartBadge?.();
}

export function addToCart(productId: string, qty?: number | string): void {
  if (!productId) return;
  const p = productsDb[productId];
  if (!p) { toast('Товар не найден'); return; }
  /* выбранный цвет на открытой странице товара — вариант позиции */
  const color = window.currentProductId === productId ? window.pmSelectedColor?.label ?? '' : '';
  const { items, existed } = addItem(store.list(), snapshotOf(p, Math.max(1, parseInt(String(qty), 10) || 1), color));
  store.replace(items);
  store.saveCart();
  refresh();
  toast(existed ? 'Количество увеличено' : 'Добавлено в корзину');
}

export function setCartQty(productId: string, qty: number | string): void {
  store.replace(setQty(store.list(), productId, parseInt(String(qty), 10) || 0));
  store.saveCart();
  refresh();
}

export function removeFromCart(productId: string): void {
  store.replace(removeItem(store.list(), productId));
  store.saveCart();
  refresh();
  toast('Удалено из корзины');
}

export function clearCart(): void {
  store.replace([]);
  store.saveCart();
  refresh();
  toast('Корзина очищена');
}

export function expireExpiredStoreOrders(): void {
  if (expireOverdue(store.marketplace.storeOrders)) store.saveOrders();
}

export function submitCheckout(): void {
  const items = store.list();
  if (!items.length) { toast('Корзина пуста'); return; }
  const contact = cleanContact({
    name: field('chk-name'), phone: field('chk-phone'),
    telegram: field('chk-telegram'), max: field('chk-max'), comment: field('chk-comment'),
  });
  if (!contact) { toast('Укажите имя и телефон'); return; }

  /* гость: имя и телефон запоминаются на этом устройстве, иначе «Мои заказы» не находят его заказ */
  if (!buyerProfile.phone || !buyerProfile.name) {
    buyerProfile.phone ||= contact.phone;
    buyerProfile.name ||= contact.name;
    writeJSON(StorageKeys.buyer, buyerProfile);
  }

  const { checkout, storeOrders } = createCheckout({ items, contact, userId: state.userEmail || contact.phone });
  store.marketplace.checkouts.push(checkout);
  store.marketplace.storeOrders.push(...storeOrders);
  store.replace([]);
  store.saveCart();
  store.saveOrders();
  refresh();
  toast(`Создано заказов: ${storeOrders.length} (по магазинам)`);
}

/** Everything legacy code calls by the old names. */
export const cartLegacyApi = {
  getCartItems: () => store.list(),
  cartHasProduct: (id: string) => store.has(id),
  cartQtyTotal: () => store.count(),
  cartUid: makeUid,
  loadCart,
  saveCart: () => store.saveCart(),
  loadMarketplace: () => store.loadOrders(),
  saveMarketplace: () => store.saveOrders(),
  expireExpiredStoreOrders,
  addToCart,
  setCartQty,
  removeFromCart,
  clearCart,
  submitCheckout,
};
