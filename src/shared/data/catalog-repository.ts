/**
 * Catalogue repository. The localStorage implementation keeps the prototype's keys, so saved data
 * from earlier versions keeps working. The next implementation is HTTP, behind the same interface.
 */
import { StorageKeys } from '../storage/keys';
import type { CatalogPart, CatalogState, StoredCatalog } from './catalog';
import { CATALOG_PARTS, toStored } from './catalog';

export interface SaveResult {
  /** parts that didn't fit (quota) or failed to save for another reason */
  failed: CatalogPart[];
  quotaExceeded: boolean;
}

export interface CatalogRepository {
  load(): StoredCatalog;
  /** Saves the listed parts (all by default) independently of each other. */
  save(state: CatalogState, parts?: CatalogPart[]): SaveResult;
  /** Another tab (the admin or the app) saved the catalogue. */
  onExternalChange(cb: () => void): () => void;
}

export const CATALOG_KEYS: Record<CatalogPart, string> = {
  products: StorageKeys.products,
  shops: StorageKeys.shops,
  stories: StorageKeys.stories,
  promo: StorageKeys.promo,
  directory: StorageKeys.directory,
  vacancies: StorageKeys.vacancies,
  onboarding: StorageKeys.onboarding,
  showcases: StorageKeys.showcases,
  lifehacks: StorageKeys.lifehacks,
  lifehackSaved: StorageKeys.lifehackSaved,
};

const isQuota = (e: unknown) => {
  const err = e as { name?: string; message?: string; code?: number };
  return err?.name === 'QuotaExceededError' || err?.code === 22 || /quota/i.test(err?.message ?? '');
};

export function createLocalCatalogRepository(storage: Storage | undefined = globalThis.localStorage): CatalogRepository {
  return {
    load() {
      const out: StoredCatalog = {};
      for (const part of CATALOG_PARTS) {
        try {
          const raw = storage?.getItem(CATALOG_KEYS[part]);
          if (raw != null) out[part] = JSON.parse(raw);
        } catch { /* битая запись — как будто её нет, берётся seed */ }
      }
      return out;
    },
    save(state, parts = CATALOG_PARTS) {
      const failed: CatalogPart[] = [];
      let quotaExceeded = false;
      /* каждая часть — отдельно: переполнение на одной не отменяет остальные (раньше отменяло) */
      for (const part of parts) {
        try {
          storage?.setItem(CATALOG_KEYS[part], JSON.stringify(toStored(part, state)));
        } catch (e) {
          failed.push(part);
          if (isQuota(e)) quotaExceeded = true;
        }
      }
      try { storage?.setItem(StorageKeys.updatedAt, String(Date.now())); } catch { /* метка не критична */ }
      return { failed, quotaExceeded };
    },
    onExternalChange(cb) {
      const h = (e: StorageEvent) => { if (e.key === StorageKeys.updatedAt) cb(); };
      window.addEventListener('storage', h);
      return () => window.removeEventListener('storage', h);
    },
  };
}
