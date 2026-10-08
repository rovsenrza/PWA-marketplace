import type { StoreKind } from './types';

export const STORE_KINDS: readonly StoreKind[] = ['mixtures', 'kitchens', 'furniture', 'general'];

export function isStoreKind(v: unknown): v is StoreKind {
  return typeof v === 'string' && (STORE_KINDS as readonly string[]).includes(v);
}

/* Tried in this order, the first match wins. */
const KITCHENS = /кухн/i;
const FURNITURE = /мебел|товары для дома|декор|интерьер|освещ|текстил|матрас|штор/i;
const MIXTURES = /строй|строит|смес|отделк|плитк|кровл|сантех|инструмент|пиломат|древес|обои|ламинат|двер|материал|лакокрас|вентиляц/i;

/**
 * The kind of a store's page: the one saved in its storefront if it is valid, else guessed from the shop
 * category. Anything not recognised is `general` (price filter only), never an error.
 */
export function storeKindOf(shop: { category?: unknown; storefront?: { kind?: unknown } | null }): StoreKind {
  const saved = shop.storefront?.kind;
  if (isStoreKind(saved)) return saved;
  const category = typeof shop.category === 'string' ? shop.category : '';
  if (KITCHENS.test(category)) return 'kitchens';
  if (FURNITURE.test(category)) return 'furniture';
  if (MIXTURES.test(category)) return 'mixtures';
  return 'general';
}
