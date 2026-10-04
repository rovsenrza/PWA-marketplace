/**
 * The bridge between typed modules and the classic legacy scripts.
 * Only what new code actually uses is declared here. Every new dependency on legacy code
 * gets a line here first, so the list shows what still has to be ported.
 */
import type { CartItem, Product, Story } from '../domain/types';

declare global {
  /* глобальные let из legacy (общая лексическая область классических скриптов; живые привязки) */
  const storiesData: Story[] | undefined;
  /** core/data.js: общее состояние покупателя (cart — аксессор на CartStore) */
  const state: { cart?: unknown; userEmail?: string; userRole?: string; favorites?: string[]; [k: string]: unknown };
  /** core/data.js: каталог (SEED + localStorage) */
  const productsDb: Record<string, Product>;

  interface Window {
    /* функции app-core.js, вызываемые из модулей */
    switchTab?: (tab: 'catalog' | 'directory' | 'cart' | 'favorites' | 'profile') => void;
    openStory?: (id: string) => void;
    showSmsToast?: (msg: string) => void;
    refreshCartSurfaces?: () => void;
    updateCartBadge?: () => void;
    renderProductGrid?: () => void;
    renderFavorites?: () => void;
    updateBuyerFavCount?: () => void;
    currentProductId?: string | null;
    pmSelectedColor?: { label?: string } | null;
    getCartItems?: () => CartItem[];
    /* функции модулей, которые зовёт разметка (onclick) и legacy */
    openNotifications?: () => void;
    closeNotifications?: () => void;
    dismissNotification?: (id: string) => void;
    setUiTheme?: (pref: 'system' | 'light' | 'dark') => void;
    toggleUiTheme?: () => void;
    [legacyFn: string]: unknown;
  }
}

export {};
