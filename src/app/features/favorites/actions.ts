/** Favourites actions under the old names (the markup and legacy code call them). */
import { removeStore, toggleFavorite as toggle } from '../../../shared/catalog/favorites';
import { commitFavorites, favoritesStore as store } from './favorites-store';

const toast = (msg: string) => window.showSmsToast?.(msg);

export function toggleFavorite(productId: string): void {
  const { ids, added } = toggle(store.list(), productId);
  store.replace(ids);
  toast(added ? 'Добавлено в избранное' : 'Удалено из избранного');
  commitFavorites(productId);
}

export function clearAllFavorites(): void {
  store.replace([]);
  commitFavorites();
  toast('Избранное очищено');
}

export function unfavoriteStore(storeName: string): void {
  store.replace(removeStore(store.list(), storeName, (id) => productsDb[id]));
  commitFavorites();
}

export const favoritesLegacyApi = {
  toggleFavorite,
  clearAllFavorites,
  unfavoriteStore,
  saveFavorites: () => store.save(),
  loadFavorites: () => store.load(),
};
