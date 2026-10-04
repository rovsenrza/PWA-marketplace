/**
 * The bridge between typed modules and the classic legacy scripts.
 * Only what new code actually uses is declared here. Every new dependency on legacy code
 * gets a line here first, so the list shows what still has to be ported.
 */
import type { CartItem, Marketplace, Story } from '../domain/types';

declare global {
  /* глобальные let из app-core.js (общая лексическая область классических скриптов) */
  const marketplace: Marketplace | undefined;
  const storiesData: Story[] | undefined;

  interface Window {
    /* функции app-core.js, вызываемые из модулей */
    switchTab?: (tab: 'catalog' | 'directory' | 'cart' | 'favorites' | 'profile') => void;
    openStory?: (id: string) => void;
    getCartItems?: () => CartItem[];
    soStatusLabel?: (status: string) => string;
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
