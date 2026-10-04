/**
 * Notification sources: only real app events, never invented ones.
 * Today they read the legacy state (orders, cart, stories); once there is an API,
 * they switch to the server feed and the sheet stays the same.
 */
import { StorageKeys } from '../../../shared/storage/keys';
import { readSet } from '../../../shared/storage/local-store';
import { statusLabel } from '../../../shared/orders/store-order';

export type NotificationAction =
  | { type: 'tab'; tab: 'cart' }
  | { type: 'story'; id: string };

export interface AppNotification {
  id: string;
  kind: 'order' | 'cart' | 'story';
  title: string;
  text: string;
  img?: string;
  at: number | null;
  action: NotificationAction;
}

export function plural(n: number, one: string, few: string, many: string): string {
  const m = n % 10, h = n % 100;
  if (m === 1 && h !== 11) return one;
  return m >= 2 && m <= 4 && (h < 10 || h >= 20) ? few : many;
}

function fromOrders(): AppNotification[] {
  const orders = (typeof marketplace !== 'undefined' && marketplace?.storeOrders) || [];
  return orders
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 10)
    .map((o) => ({
      id: `ord-${o.id}-${o.status}`,
      kind: 'order' as const,
      title: `${o.storeId}: ${statusLabel(o.status)}`,
      text: 'Заказ из корзины',
      at: o.updatedAt ?? o.createdAt,
      action: { type: 'tab', tab: 'cart' } as const,
    }));
}

function fromCart(): AppNotification[] {
  const items = window.getCartItems?.() ?? [];
  if (!items.length) return [];
  const stores = new Set(items.map((i) => i.storeId)).size;
  return [{
    id: `cart-${items.length}-${stores}`,
    kind: 'cart',
    title: `В корзине ${items.length} ${plural(items.length, 'товар', 'товара', 'товаров')}`,
    text: `Отправьте заказ ${stores > 1 ? `${stores} магазинам` : 'менеджеру магазина'}`,
    at: Date.now(),
    action: { type: 'tab', tab: 'cart' },
  }];
}

function fromStories(): AppNotification[] {
  const stories = (typeof storiesData !== 'undefined' && storiesData) || [];
  return stories
    .filter((s) => s.status === 'published' || !s.status)
    .map((s) => ({
      id: `story-${s.id}`,
      kind: 'story' as const,
      title: s.isLifehack ? 'Новый лайфхак' : s.name,
      text: s.isLifehack ? 'Советы по ремонту в историях' : 'Новая история магазина',
      img: s.slides?.[0] ?? s.image,
      at: s.createdAt ?? null,
      action: { type: 'story', id: s.id } as const,
    }));
}

/** Everything except what the user dismissed. Each source fails on its own without breaking the rest. */
export function collectNotifications(): AppNotification[] {
  const all: AppNotification[] = [];
  for (const src of [fromOrders, fromCart, fromStories]) {
    try { all.push(...src()); } catch { /* источник недоступен */ }
  }
  const gone = readSet(StorageKeys.notificationsDismissed);
  return all.filter((n) => !gone.has(n.id));
}

export function runAction(a: NotificationAction): void {
  if (a.type === 'tab') window.switchTab?.(a.tab);
  else window.openStory?.(a.id);
}

export function relativeTime(t: number | null): string {
  if (!t) return 'сегодня';
  const min = (Date.now() - t) / 60000;
  if (min < 1) return 'сейчас';
  if (min < 60) return `${Math.round(min)} мин`;
  if (min < 1440) return `${Math.round(min / 60)} ч`;
  return `${Math.round(min / 1440)} дн`;
}
