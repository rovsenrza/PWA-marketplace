/** Favourites: a list of product ids. Pure functions. */
import type { Product } from '../domain/types';
import { formatPrice, parsePrice } from '../format/price';

/** From storage: only strings, no repeats, original order kept. */
export function normalizeFavorites(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((x): x is string => typeof x === 'string' && x.length > 0))];
}

/** Adds the product if it's missing, removes it if it's there. `added` tells which toast to show. */
export function toggleFavorite(ids: string[], productId: string): { ids: string[]; added: boolean } {
  return ids.includes(productId)
    ? { ids: ids.filter((x) => x !== productId), added: false }
    : { ids: [...ids, productId], added: true };
}

/** Removes every product of one store (and products that no longer exist in the catalogue). */
export function removeStore(ids: string[], store: string, lookup: (id: string) => Product | undefined): string[] {
  return ids.filter((id) => {
    const p = lookup(id);
    return !!p && p.store !== store;
  });
}

export interface StoreGroup {
  store: string;
  products: Product[];
  /** sum of prices (one item each) */
  total: number;
}

/** Favourites grouped by store, in the order they were added. Unknown ids are skipped. */
export function groupByStore(ids: string[], lookup: (id: string) => Product | undefined): StoreGroup[] {
  const groups = new Map<string, Product[]>();
  for (const id of ids) {
    const p = lookup(id);
    if (p) groups.set(p.store, [...(groups.get(p.store) ?? []), p]);
  }
  return [...groups].map(([store, products]) => ({ store, products, total: products.reduce((s, p) => s + parsePrice(p.price), 0) }));
}

/** Text of the order to the store manager (plain text; URL-encode it once, at the very end). */
export function managerMessage(store: string, products: Product[], buyer?: { name?: string; phone?: string }): string {
  const lines = [`Здравствуйте! Хочу оформить заказ в магазине "${store}":`, ''];
  products.forEach((p, i) => lines.push(`${i + 1}. ${p.title} — ${p.price}`));
  lines.push('', `Итого: ${formatPrice(products.reduce((s, p) => s + parsePrice(p.price), 0))}`);
  if (buyer?.name) {
    lines.push('', 'Мои данные:', `Имя: ${buyer.name}`);
    if (buyer.phone) lines.push(`Телефон: ${buyer.phone}`);
  }
  return lines.join('\n');
}

/** 'https://t.me/shop', '@shop', 'shop' → 'shop'; empty or '#' → ''. */
export function telegramHandle(link: string | undefined): string {
  const v = (link ?? '').trim();
  if (!v || v === '#') return '';
  return v.replace(/^https?:\/\/t\.me\//i, '').replace(/^@/, '').split(/[/?#]/)[0];
}
