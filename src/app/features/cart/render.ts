/**
 * Cart, «Мои заказы» and the store's order list. Rendering only through html`…` (escaping),
 * buttons through data-action (src/shared/ui/actions.ts), with no inline handlers.
 * Markup and classes are as in the prototype (the styles in market.css / glass.css rely on them).
 */
import type { OrderLine, StoreOrder } from '../../../shared/domain/types';
import { formatRub } from '../../../shared/format/price';
import { cartTotal } from '../../../shared/orders/cart';
import { buyerFacingAmount, confirmedAmount, ordersForBuyer, ordersForStore, statusLabel } from '../../../shared/orders/store-order';
import { html, type SafeHtml } from '../../../shared/ui/html';
import { buyerStore } from '../buyer/buyer-store';
import { cartStore as store } from './cart-store';
import { expireExpiredStoreOrders } from './actions';
import { emit } from '../../../shared/events';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T | null;

const LINE_LABELS: Record<string, string> = { pending: 'ожидание', confirmed: 'ок', unavailable: 'нет', price_changed: 'новая цена', removed: 'снято' };
const lineBadge = (st: string) => html`<span class="text-slate-400">${LINE_LABELS[st] ?? st}</span>`;

export function updateCartBadge(): void {
  const badge = $('cart-badge');
  if (!badge) return;
  const count = store.count();
  badge.innerText = String(count);
  badge.classList.toggle('hidden', count === 0);
}

/* ---------- корзина ---------- */
export function renderCart(): void {
  expireExpiredStoreOrders();
  const container = $('cart-list');
  if (!container) return;
  const clearBtn = $('cart-clear-btn');
  const box = $('cart-checkout-box');
  const items = store.list();
  clearBtn?.classList.toggle('hidden', !items.length);
  box?.classList.toggle('hidden', !items.length);
  if (!items.length) {
    container.innerHTML = html`<div class="cart-empty"><p class="text-sm text-sky-100/80">Корзина пуста</p><p class="text-xs text-sky-200/50 mt-1">Товары разных магазинов можно добавить в одну корзину</p></div>`.value;
    renderBuyerOrders();
    return;
  }
  /* поля оформления — из профиля, если покупатель их ещё не заполнил */
  const p = buyerStore.get();
  const nameEl = $<HTMLInputElement>('chk-name');
  const phoneEl = $<HTMLInputElement>('chk-phone');
  if (nameEl && !nameEl.value && p.name) nameEl.value = p.name;
  if (phoneEl && !phoneEl.value && p.phone) phoneEl.value = p.phone;

  const cards = items.map((i) => {
    const qty = i.qty || 1;
    return html`<div class="cart-card" data-swipe-fn="removeFromCart" data-swipe-arg="${i.productId}">
      <div class="cart-card-top">
        <div class="min-w-0">
          <span class="cart-card-store">${i.storeId}</span>
          <span class="cart-card-note">Отдельный заказ при оформлении</span>
        </div>
        <button type="button" class="cart-card-x" data-action="cart-remove" data-product="${i.productId}" aria-label="Удалить">×</button>
      </div>
      <div class="cart-card-body">
        <img src="${i.image ?? ''}" class="cart-card-photo" alt="">
        <div class="min-w-0">
          <p class="cart-card-title">${i.titleSnapshot}</p>
          ${i.variant ? html`<p class="cart-card-var">${i.variant}</p>` : null}
          <p class="cart-card-price">${formatRub(i.priceSnapshot)}</p>
          <div class="cart-qty">
            <button type="button" data-action="cart-qty" data-product="${i.productId}" data-qty="${qty - 1}" aria-label="Меньше">−</button>
            <span>${qty}</span>
            <button type="button" data-action="cart-qty" data-product="${i.productId}" data-qty="${qty + 1}" aria-label="Больше">+</button>
          </div>
        </div>
        <p class="cart-card-sum">${formatRub((i.priceSnapshot || 0) * qty)}</p>
      </div>
    </div>`;
  });
  container.innerHTML = html`${cards}<p class="cart-total">Итого: ${formatRub(cartTotal(items))}</p>`.value;
  renderBuyerOrders();
}

/* ---------- «Мои заказы» ---------- */
const btn = (action: string, orderId: string, cls: string, label: string) =>
  html`<button type="button" data-action="${action}" data-order="${orderId}" class="${cls}">${label}</button>`;

function buyerOrderCard(o: StoreOrder): SafeHtml {
  const lines = o.lines.map((l) => {
    const price = l.proposedPrice && l.lineStatus === 'price_changed' ? l.proposedPrice : l.quotedPrice;
    return html`<div class="flex justify-between gap-2 text-[11px] py-1"><span class="truncate">${l.title} ×${l.qty}</span><span>${lineBadge(l.lineStatus)} ${formatRub(price)}</span></div>`;
  });
  const actions = [
    o.status === 'awaiting_buyer' && btn('so-accept-price', o.id, 'flex-1 bg-[#1e6091] text-white text-[10px] font-bold py-2 rounded-lg', 'Принять цену'),
    ['pending_review', 'awaiting_buyer', 'partial', 'confirmed'].includes(o.status) && btn('so-cancel', o.id, 'flex-1 bg-slate-100 text-slate-600 text-[10px] font-bold py-2 rounded-lg', 'Отменить'),
    ['expired', 'rejected', 'cancelled'].includes(o.status) && btn('so-return', o.id, 'flex-1 bg-slate-800 text-white text-[10px] font-bold py-2 rounded-lg', 'Вернуть в корзину'),
  ].filter((x): x is SafeHtml => !!x);
  return html`<div class="bg-white rounded-2xl border border-slate-100 p-3 space-y-2">
    <div class="flex justify-between gap-2"><span class="text-xs font-bold">${o.storeId}</span><span class="text-[10px] text-slate-500">${statusLabel(o.status)}</span></div>
    ${lines}
    <p class="text-xs font-bold text-right">${formatRub(buyerFacingAmount(o))}</p>
    ${actions.length ? html`<div class="flex gap-2">${actions}</div>` : null}
  </div>`;
}

export function renderBuyerOrders(): void {
  const el = $('buyer-orders-list');
  if (!el) return;
  expireExpiredStoreOrders();
  const mine = ordersForBuyer(store.marketplace, { userId: state.userEmail, phone: buyerStore.get().phone });
  el.innerHTML = mine.length ? html`${mine.map(buyerOrderCard)}`.value : html`<p class="cart-orders-empty">Заказов пока нет</p>`.value;
}

/* ---------- заказы в кабинете магазина ---------- */
function shopLine(o: StoreOrder, l: OrderLine): SafeHtml {
  const canAct = ['pending_review', 'partial', 'confirmed', 'awaiting_buyer'].includes(o.status)
    && (l.lineStatus === 'pending' || l.lineStatus === 'price_changed');
  const act = (action: string, cls: string, label: string) =>
    html`<button type="button" data-action="${action}" data-order="${o.id}" data-product="${l.productId}" class="text-[9px] font-bold ${cls} px-2 py-1 rounded-md">${label}</button>`;
  return html`<div class="py-2 border-b border-slate-50 last:border-0">
    <div class="flex justify-between text-[11px]"><span class="font-medium truncate pr-2">${l.title} ×${l.qty}</span><span>${formatRub(l.proposedPrice || l.quotedPrice)}</span></div>
    <p class="text-[10px] text-slate-400">${lineBadge(l.lineStatus)}</p>
    ${canAct ? html`<div class="flex gap-1 mt-1">${act('so-confirm-line', 'bg-emerald-50 text-emerald-700', 'Есть')}${act('so-unavailable', 'bg-red-50 text-red-600', 'Нет')}${act('so-propose-price', 'bg-amber-50 text-amber-700', 'Цена')}</div>` : null}
  </div>`;
}

function shopOrderCard(o: StoreOrder): SafeHtml {
  const c = o.contact ?? { name: '', phone: '' };
  const foot: SafeHtml[] = [];
  if (['confirmed', 'partial'].includes(o.status)) foot.push(btn('so-invoice', o.id, 'w-full bg-[#1c3a34] text-white text-[11px] font-bold py-2 rounded-xl', 'Выставить счёт'));
  if (o.status === 'awaiting_payment' || o.status === 'invoiced') {
    foot.push(html`<div class="grid grid-cols-2 gap-2">
      <button type="button" data-action="so-contact" data-order="${o.id}" data-channel="telegram" class="bg-[#2AABEE] text-white text-[10px] font-bold py-2 rounded-xl">Telegram</button>
      <button type="button" data-action="so-contact" data-order="${o.id}" data-channel="max" class="bg-slate-800 text-white text-[10px] font-bold py-2 rounded-xl">MAX</button>
    </div>`, btn('so-paid', o.id, 'w-full bg-emerald-600 text-white text-[11px] font-bold py-2 rounded-xl', 'Отметить оплату'));
  }
  if (o.status === 'pending_review') {
    foot.push(btn('so-confirm-all', o.id, 'w-full bg-[#1e6091] text-white text-[11px] font-bold py-2 rounded-xl mb-1', 'Подтвердить все'),
      btn('so-reject-all', o.id, 'w-full bg-slate-100 text-slate-600 text-[11px] font-bold py-2 rounded-xl', 'Отклонить заказ'));
  }
  const sla = new Date(o.slaDeadline ?? 0).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return html`<div class="bg-white rounded-2xl border border-slate-100 p-3 space-y-2">
    <div class="flex justify-between"><span class="text-[10px] font-bold text-slate-500">${statusLabel(o.status)}</span><span class="text-[10px] text-slate-400">SLA до ${sla}</span></div>
    <p class="text-[11px] text-slate-600">${c.name} · ${c.phone}</p>
    ${o.lines.map((l) => shopLine(o, l))}
    <p class="text-xs font-bold">К счёту: ${formatRub(confirmedAmount(o))}</p>
    <div class="space-y-1">${foot}</div>
  </div>`;
}

export function renderShopOrders(): void {
  expireExpiredStoreOrders();
  const el = $('shop-orders-list');
  if (!el) return;
  const list = ordersForStore(store.marketplace.storeOrders, String(state.currentShop ?? ''));
  el.innerHTML = list.length
    ? html`${list.map(shopOrderCard)}`.value
    : html`<p class="text-xs text-slate-400 p-4 text-center border border-dashed rounded-xl">Заказов нет</p>`.value;
}

/* ---------- перерисовка всех поверхностей после изменения корзины или заказов ---------- */
export function refreshCartSurfaces(): void {
  const w = window;
  const safely = (fn: () => void) => { try { fn(); } catch { /* экран может быть не готов */ } };
  updateCartBadge();
  renderCart();
  renderBuyerOrders();
  w.renderProductGrid?.();
  safely(() => w.renderRecommendations?.());
  safely(() => w.renderCategoryProducts?.());
  safely(() => { if (w.currentCatalogShop) w.renderShopCatalogProducts?.(w.currentCatalogShop); });
  safely(() => w.renderCatalogProducts?.(($<HTMLInputElement>('catalog-search-input')?.value) ?? ''));
  safely(() => w.pmRefreshCart?.());
  safely(() => w.renderPmRecent?.());
  safely(() => { if (state.userRole === 'shop') { w.updateShopStats?.(); renderShopOrders(); } });
  emit('app:cart-changed');
}
