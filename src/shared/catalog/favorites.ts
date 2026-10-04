/** Favourites: a list of product ids. Pure functions. */
import type { Product } from '../domain/types';

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
