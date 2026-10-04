/**
 * Repositories: the only place that knows where data lives. Today that's localStorage
 * under the existing keys (compatible with the prototype); with a backend, an HTTP
 * implementation of the same interface will appear, and the code above it won't change.
 */
import type { BuyerProfile, CartItem, Marketplace } from '../domain/types';
import { StorageKeys } from '../storage/keys';
import { readJSON, writeJSON } from '../storage/local-store';

export interface CartRepository {
  /** raw data: normalising it (old format, broken records) is the caller's job */
  loadRaw(): unknown;
  save(items: CartItem[]): void;
}

export interface MarketplaceRepository {
  load(): Marketplace;
  save(m: Marketplace): void;
}

export interface FavoritesRepository {
  loadRaw(): unknown;
  save(ids: string[]): void;
}

export const emptyMarketplace = (): Marketplace => ({ checkouts: [], storeOrders: [], invoices: [], payments: [] });

/** Fills in missing collections: older saves may not have some of them. */
export function normalizeMarketplace(raw: unknown): Marketplace {
  const d = (raw && typeof raw === 'object' ? raw : {}) as Partial<Marketplace>;
  const arr = <T>(v: T[] | undefined): T[] => (Array.isArray(v) ? v : []);
  return { checkouts: arr(d.checkouts), storeOrders: arr(d.storeOrders), invoices: arr(d.invoices), payments: arr(d.payments) };
}

export const localCartRepository: CartRepository = {
  loadRaw: () => readJSON<unknown>(StorageKeys.cart, []),
  save: (items) => writeJSON(StorageKeys.cart, items),
};

export const localMarketplaceRepository: MarketplaceRepository = {
  load: () => normalizeMarketplace(readJSON<unknown>(StorageKeys.marketplace, null)),
  save: (m) => writeJSON(StorageKeys.marketplace, m),
};

export const localFavoritesRepository: FavoritesRepository = {
  loadRaw: () => readJSON<unknown>(StorageKeys.favorites, []),
  save: (ids) => writeJSON(StorageKeys.favorites, ids),
};

export interface BuyerRepository {
  load(): BuyerProfile;
  save(p: BuyerProfile): void;
}

/** Always all four fields as trimmed strings: older saves and broken records give empty fields. */
export function normalizeBuyer(raw: unknown): BuyerProfile {
  const d = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  return { name: str(d.name), phone: str(d.phone), email: str(d.email), city: str(d.city) };
}

export const localBuyerRepository: BuyerRepository = {
  load: () => normalizeBuyer(readJSON<unknown>(StorageKeys.buyer, null)),
  save: (p) => writeJSON(StorageKeys.buyer, p),
};
