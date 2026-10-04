/**
 * The buyer app's catalogue: one CatalogStore, accessors for legacy, and the old
 * saveAllData / loadAllData names (they're called from 25 places in legacy).
 */
import { CatalogStore, seedFromLegacy } from '../../shared/data/catalog-store';

export const catalog = new CatalogStore(seedFromLegacy);

/** Load and the legacy hooks after it: local banners of partner stores, the promo, lifehack likes and polls. */
export function loadAllData(): void {
  catalog.load();
  const w = window;
  w.applyShopLocalBanners?.();
  w.applyPromoToHome?.();
  w.loadLhEngageState?.();
  w.hydrateLifehacksEngage?.();
}

export function saveAllData(): void {
  const r = catalog.save();
  if (r.failed.length) {
    window.showSmsToast?.('Не хватило места в браузере: часть изменений не сохранилась');
    console.warn('Не сохранено:', r.failed.join(', '));
  } else if (r.degraded.length) {
    window.showSmsToast?.('Изменения сохранены, но загруженные фото не поместились в память браузера и пропадут после перезагрузки');
  }
}
