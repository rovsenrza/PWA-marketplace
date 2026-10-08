/** The favourites screen: groups by store, the total, sending the order to the store manager. */
import { groupByStore, managerMessage, telegramHandle, type StoreGroup } from '../../../shared/catalog/favorites';
import { formatPrice } from '../../../shared/format/price';
import { html, raw } from '../../../shared/ui/html';
import { registerActions } from '../../../shared/ui/actions';
import { getBadgeHtml, getPriceHtml } from '../../ui/product-badges';
import { buyerStore } from '../buyer/buyer-store';
import { favoritesStore as store } from './favorites-store';
import { unfavoriteStore } from './actions';

import { storeTheme } from '../storefront/store-theme';

const ICON_HEART = raw('<svg class="fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>');
const ICON_CHAT = raw('<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.22-.9L3 20l1.16-3.48C3.43 15.4 3 13.76 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>');
const ICON_SEND = raw('<svg class="fill-current" viewBox="0 0 24 24"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg>');
const ICON_CHEVRON = raw('<svg class="fav-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>');

const lookup = (id: string) => productsDb[id];

function groupCard(g: StoreGroup) {
  const shop = shopsProfileDb[g.store] ?? {};
  const theme = storeTheme(g.store);
  /* getBadgeHtml / getPriceHtml экранируют данные сами и возвращают готовую разметку */
  const items = g.products.map((p) => {
    const badge = getBadgeHtml(p);
    return html`<div class="fav-item" data-action="open-product" data-product="${p.id}" data-swipe-fn="toggleFavorite" data-swipe-arg="${p.id}">
      <img class="fav-item-photo" src="${p.image || ''}" alt="">
      <div class="flex-1 min-w-0">
        ${badge ? html`<div class="fav-badge-wrap">${raw(badge)}</div>` : null}
        <div class="fav-item-price">${raw(getPriceHtml(p, 'fav-price'))}</div>
        <h5 class="fav-item-title">${p.title}</h5>
      </div>
      ${ICON_CHEVRON}
    </div>`;
  });
  return html`<div class="fav-card" style="--spine:${theme.ink};--on-spine:${theme.onInk}">
    <div class="fav-banner">
      <img src="${shop.banner || shop.logo || ''}" alt="">
      <div class="fav-banner-veil"></div>
      <button type="button" class="fav-heart" data-action="fav-unfavorite-store" data-store="${g.store}" aria-label="Убрать магазин из избранного">${ICON_HEART}</button>
      <div class="fav-banner-copy">
        <span class="fav-shop">${g.store}</span>
        <span class="fav-count">${g.products.length} тов.</span>
      </div>
    </div>
    <div>
      ${items}
      <div class="fav-foot">
        <div class="fav-sum"><span>Итого по магазину:</span><b>${formatPrice(g.total)}</b></div>
        <div class="fav-actions">
          <button type="button" class="fav-chat" data-action="open-assistant" aria-label="Умный помощник">${ICON_CHAT}</button>
          <button type="button" class="fav-send r-btn r-btn--primary" data-action="fav-send-manager" data-store="${g.store}">${ICON_SEND} Отправить заказ менеджеру</button>
        </div>
      </div>
    </div>
  </div>`;
}


export function renderFavorites(): void {
  const container = document.getElementById('favorites-list');
  if (!container) return;
  const groups = groupByStore(store.list(), lookup);
  document.getElementById('fav-clear-btn')?.classList.toggle('hidden', !store.count());
  container.innerHTML = groups.length
    ? html`${groups.map(groupCard)}`.value
    : html`<div class="fav-empty"><p class="text-sm">В избранном пока пусто</p><p class="text-xs mt-1" >Добавляйте товары кнопкой в каталоге</p></div>`.value;
}

/** The order to the store manager in Telegram: the message text is URL-encoded once, as a whole. */
export function sendOrderToManager(storeName: string): void {
  const products = store.list().map(lookup).filter((p) => p && p.store === storeName) as NonNullable<ReturnType<typeof lookup>>[];
  if (!products.length) return;
  const handle = telegramHandle(shopsProfileDb[storeName]?.telegram);
  if (!handle) { window.showSmsToast?.(`У магазина "${storeName}" не указан Telegram`); return; }
  const text = managerMessage(storeName, products, buyerStore.get());
  window.open(`https://t.me/${encodeURIComponent(handle)}?text=${encodeURIComponent(text)}`, '_blank');
  window.showSmsToast?.(`Заказ отправлен в ${storeName}`);
}

export function registerFavoritesActions(): void {
  registerActions({
    'open-product': (el) => window.openProductModal?.(el.dataset.product ?? ''),
    'open-assistant': () => window.openAssistant?.(),
    'fav-unfavorite-store': (el) => unfavoriteStore(el.dataset.store ?? ''),
    'fav-send-manager': (el) => sendOrderToManager(el.dataset.store ?? ''),
  });
}
