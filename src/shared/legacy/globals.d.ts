/**
 * The bridge between typed modules and the classic legacy scripts.
 * Only what new code actually uses is declared here. Every new dependency on legacy code
 * gets a line here first, so the list shows what still has to be ported.
 */
import type { CartItem, Product, Shop } from '../domain/types';

declare global {
  /* глобальные let из legacy (общая лексическая область классических скриптов; живые привязки) */
  /** core/data.js: общее состояние покупателя (cart — аксессор на CartStore) */
  const state: { cart?: unknown; isAuthenticated?: boolean; userEmail?: string; userRole?: string; currentShop?: string; favorites?: string[]; [k: string]: unknown };
  /** каталог: аксессоры на CatalogStore (src/shared/data/catalog-store.ts) */
  const productsDb: Record<string, Product>;
  const shopsProfileDb: Record<string, Shop>;

  interface Window {
    /* функции app-core.js, вызываемые из модулей */
    switchTab?: (tab: 'catalog' | 'directory' | 'cart' | 'favorites' | 'profile') => void;
    openStory?: (id: string) => void;
    showSmsToast?: (msg: string) => void;
    refreshCartSurfaces?: () => void;
    updateCartBadge?: () => void;
    renderProductGrid?: () => void;
    renderRecommendations?: () => void;
    renderCategoryProducts?: () => void;
    renderShopCatalogProducts?: (shop: string) => void;
    renderCatalogProducts?: (query: string) => void;
    pmRefreshCart?: () => void;
    renderPmRecent?: () => void;
    updateShopStats?: () => void;
    currentCatalogShop?: string;
    applyShopLocalBanners?: () => void;
    loadBuyerProfile?: () => void;
    renderBuyerCard?: () => void;
    renderAdminModerationList?: () => void;
    updateModCounter?: () => void;
    updateAdminStats?: () => void;
    renderShopDashboard?: () => void;
    applyPromoToHome?: () => void;
    loadLhEngageState?: () => void;
    hydrateLifehacksEngage?: () => void;
    openProductModal?: (id: string) => void;
    openAssistant?: () => void;
    renderFavorites?: () => void;
    updateBuyerFavCount?: () => void;
    currentProductId?: string | null;
    pmSelectedColor?: { label?: string } | null;
    getCartItems?: () => CartItem[];
    /* панель управления (src/admin/legacy/admin.js), вызываемые из модулей панели */
    renderAll?: () => void;
    toast?: (msg: string) => void;
    thumb?: (src: string, round?: boolean) => string;
    showStoreProducts?: (store: string, status?: string) => void;
    /* функции модулей, которые зовёт разметка (onclick) и legacy */
    openNotifications?: () => void;
    closeNotifications?: () => void;
    dismissNotification?: (id: string) => void;
    setUiTheme?: (pref: 'system' | 'light' | 'dark') => void;
    toggleUiTheme?: () => void;
    renderImportPage?: () => string;
    startImport?: (store: string) => void;
    [legacyFn: string]: unknown;
  }
}

export {};
