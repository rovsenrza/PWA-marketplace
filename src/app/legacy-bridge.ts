/**
 * What modules publish for legacy code. The list shrinks as domains are ported;
 * once it's empty, the bridge is no longer needed.
 */
import { exposeToLegacy } from '../shared/legacy/expose';
import { esc, escJsArg } from '../shared/ui/html';
import { parsePrice, formatPrice, formatRub } from '../shared/format/price';
import { STORE_ORDER_SLA_MS, confirmedAmount, expireOverdue, recalcStatus, statusLabel } from '../shared/orders/store-order';
import { getBadgeHtml, getPriceHtml } from './ui/product-badges';
import { cartStore } from './features/cart/cart-store';
import { cartLegacyApi } from './features/cart/actions';
import { refreshCartSurfaces, renderBuyerOrders, renderCart, renderShopOrders, updateCartBadge } from './features/cart/render';
import { registerCartActions } from './features/cart/ui-actions';
import { favoritesStore } from './features/favorites/favorites-store';
import { favoritesLegacyApi } from './features/favorites/actions';
import { registerFavoritesActions, renderFavorites, sendOrderToManager } from './features/favorites/render';
import { ordersLegacyApi } from './features/orders/actions';
import { buyerStore } from './features/buyer/buyer-store';
import { buyerLegacyApi } from './features/buyer/profile';

exposeToLegacy({ parsePrice, formatPrice, formatRub, getBadgeHtml, getPriceHtml });

/* экранирование для legacy-рендеров: данные в HTML и в JS-строке внутри onclick */
exposeToLegacy({ escHtml: esc, escJsArg });

/* заказы по магазинам: имена — как их вызывает legacy (core/cart.js, shop-cabinet.js) */
exposeToLegacy({
  soStatusLabel: statusLabel,
  soRecalc: recalcStatus,
  soConfirmedAmount: confirmedAmount,
  soExpireOverdue: expireOverdue,
});
exposeToLegacy({ STORE_ORDER_SLA_MS });

/* корзина и заказы: одно хранилище, state.cart и marketplace — аксессоры на него */
cartStore.installLegacyAccessors(typeof state !== 'undefined' ? state : undefined);
exposeToLegacy(cartLegacyApi);
exposeToLegacy({ refreshCartSurfaces, updateCartBadge, renderCart, renderBuyerOrders, renderShopOrders });
registerCartActions();
exposeToLegacy(ordersLegacyApi);

/* избранное: state.favorites — аксессор на FavoritesStore */
favoritesStore.installLegacyAccessor(typeof state !== 'undefined' ? state : undefined);
exposeToLegacy(favoritesLegacyApi);
exposeToLegacy({ renderFavorites, sendOrderToManager });
registerFavoritesActions();

/* профиль покупателя: buyerProfile — аксессор на BuyerStore (auth.js присваивает его целиком) */
buyerStore.installLegacyAccessor();
exposeToLegacy(buyerLegacyApi);
