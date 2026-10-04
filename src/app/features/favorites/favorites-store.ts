/**
 * Favourites store. Every change goes through commit(): save, redraw the screens,
 * the app:favorites-changed event. That keeps «очистить» and «убрать магазин» in line
 * with the heart (before, only the heart notified the other screens).
 * For legacy code, state.favorites is an accessor: reads return a copy, assignment replaces the list.
 */
import { localFavoritesRepository, type FavoritesRepository } from '../../../shared/data/repositories';
import { normalizeFavorites } from '../../../shared/catalog/favorites';
import { emit } from '../../../shared/events';

export class FavoritesStore {
  private ids: string[] = [];
  constructor(private readonly repo: FavoritesRepository = localFavoritesRepository) {}

  list(): string[] { return [...this.ids]; }
  has(productId: string): boolean { return this.ids.includes(productId); }
  count(): number { return this.ids.length; }
  replace(ids: unknown): void { this.ids = normalizeFavorites(ids); }
  load(): void { this.ids = normalizeFavorites(this.repo.loadRaw()); }
  save(): void { this.repo.save(this.ids); }

  installLegacyAccessor(legacyState: { favorites?: unknown } | undefined): void {
    if (!legacyState) return;
    this.replace(legacyState.favorites);
    Object.defineProperty(legacyState, 'favorites', {
      configurable: true, enumerable: true,
      get: () => this.list(),
      set: (v: unknown) => this.replace(v),
    });
  }
}

export const favoritesStore = new FavoritesStore();

/** Save + redraw (legacy renderers) + event for the other domains. */
export function commitFavorites(productId?: string): void {
  favoritesStore.save();
  window.renderProductGrid?.();
  window.renderFavorites?.();
  window.updateBuyerFavCount?.();
  emit('app:favorites-changed', { productId: productId ?? '' });
}
