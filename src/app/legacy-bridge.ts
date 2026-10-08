import './features/onboarding/consent';
/**
 * What modules publish for legacy code. The list shrinks as domains are ported;
 * once it's empty, the bridge is no longer needed.
 */
import { exposeToLegacy } from '../shared/legacy/expose';
import { catalog, loadAllData, saveAllData } from './data/catalog';
import { installEngagementAccessors, loadLhEngageState, persistLhEngage } from './data/engagement';
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
import { authLegacyApi } from './features/auth/auth-ui';
import { mediaUpload } from './features/media';
import { initProductCells, productCell } from './ui/product-cell';
import { storeTheme } from './features/storefront/store-theme';
import { buildFacets, applyFilters, sortProducts, onInk } from '../shared/storefront';

exposeToLegacy({ parsePrice, formatPrice, formatRub, getBadgeHtml, getPriceHtml });

/* каталог: productsDb, storiesData, … — аксессоры на CatalogStore; сохранение и загрузка — через репозиторий */
catalog.installLegacyAccessors();
exposeToLegacy({ loadAllData, saveAllData });

/* реакции на лайфхаки: состояние устройства + итоги сообщества (без сервера — демо) */
installEngagementAccessors();
exposeToLegacy({ loadLhEngageState, persistLhEngage });

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

/* вход и регистрация: AuthService (сейчас демо, см. src/shared/auth/demo-auth.ts) */
exposeToLegacy(authLegacyApi);

/* загрузка фото и видео из редакторов: MediaStore */
exposeToLegacy({ mediaUpload });

/* одна ячейка товара для всех сеток и лент, со «спинкой» магазина: legacy зовёт productCellHtml(prod, variant, note);
   кнопки ячейки — data-action (cell-cart, cell-fav, open-store; название — open-product модуля избранного) */
exposeToLegacy({ productCellHtml: productCell });
exposeToLegacy({ storeTheme, buildFacets, applyFilters, sortProducts, onInk });
initProductCells();
