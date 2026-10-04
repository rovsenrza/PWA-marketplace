/**
 * What modules publish for legacy code. The list shrinks as domains are ported;
 * once it's empty, the bridge is no longer needed.
 */
import { exposeToLegacy } from '../shared/legacy/expose';
import { parsePrice, formatPrice, formatRub } from '../shared/format/price';
import { STORE_ORDER_SLA_MS, confirmedAmount, expireOverdue, recalcStatus, statusLabel } from '../shared/orders/store-order';
import { getBadgeHtml, getPriceHtml } from './ui/product-badges';
import { cartStore } from './features/cart/cart-store';
import { cartLegacyApi } from './features/cart/actions';

exposeToLegacy({ parsePrice, formatPrice, formatRub, getBadgeHtml, getPriceHtml });

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
