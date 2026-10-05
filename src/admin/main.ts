/**
 * Admin panel entry point. The catalogue is the same CatalogStore as in the app (one set of merge
 * and save rules); legacy admin.js works with productsDb / shopsProfileDb / storiesData / promoData
 * through accessors. admin.js starts on DOMContentLoaded, by which time the store is already loaded.
 */
import './styles/admin.css';
import { CatalogStore, seedFromLegacy } from '../shared/data/catalog-store';
import type { CatalogPart } from '../shared/data/catalog';
import { exposeToLegacy } from '../shared/legacy/expose';
import { createLocalImportRepository } from '../shared/import/repository';
import { LocalMediaStore } from '../shared/media/local-media-store';
import { initImport, renderImportPage, startImport } from './features/import/wizard';

const ADMIN_PARTS: CatalogPart[] = ['products', 'shops', 'stories', 'promo'];
const catalog = new CatalogStore(seedFromLegacy);
catalog.installLegacyAccessors(['productsDb', 'shopsProfileDb', 'storiesData', 'promoData']);
catalog.load();

exposeToLegacy({
  DB_load: () => catalog.load(),
  /* панель сохраняет только свои части: данные приложения (справочник, лайфхаки, …) не затираются */
  DB_save: () => {
    const r = catalog.save(ADMIN_PARTS);
    const toast = window.toast as ((m: string) => void) | undefined;
    if (r.failed.length) toast?.('Не хватило места в браузере: часть изменений не сохранилась');
    else if (r.degraded.length) toast?.('Сохранено без встроенных фото: они не поместились в память браузера');
  },
  /* импорт из 1С / Excel: страница PAGES.import в admin.js рисуется модулем */
  renderImportPage,
  startImport,
});
initImport({ catalog, media: new LocalMediaStore(), repo: createLocalImportRepository() });

/* the app or another admin tab saved the catalogue → reload and redraw */
catalog.onExternalChange(() => {
  catalog.load();
  (window.onDataUpdated as (() => void) | undefined)?.();
});
