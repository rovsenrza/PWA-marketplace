/**
 * A store's look outside its own page: its ink (the spine of every product cell, story ring, cart and
 * favourites group) and the label colour that reads on it. The storefront screens resolve the whole
 * storefront; everything else needs only this.
 */
import type { Shop, StorefrontTheme } from '../../../shared/domain/types';
import { onInk, presetTheme, resolveStorefront } from '../../../shared/storefront';
import { catalog } from '../../data/catalog';

export type StoreTheme = StorefrontTheme & { onInk: string };

/** The shop record under this name, if it is one (a name like «constructor» is not a shop). */
function shopNamed(name: string): Shop | undefined {
  const shops = catalog.state.shops;
  const shop = Object.prototype.hasOwnProperty.call(shops, name) ? shops[name] : undefined;
  return shop && typeof shop === 'object' ? shop : undefined;
}

/**
 * The theme of the store with this name, read from the app's catalogue: what its storefront saved, repaired
 * and filled from the preset of its kind. A store the catalogue does not know gets the general preset; either
 * way the ink is the store's stable family ink unless the store chose its own.
 */
export function storeTheme(name: string): StoreTheme {
  const shop = shopNamed(name);
  const theme = shop ? resolveStorefront(shop.name ? shop : { ...shop, name }).theme : presetTheme('general', name);
  return { ...theme, onInk: onInk(theme.ink) };
}
