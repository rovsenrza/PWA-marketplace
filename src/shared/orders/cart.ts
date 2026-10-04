/**
 * Cart operations. Pure functions: they take lines and return new ones.
 * They don't touch the DOM or storage, so they're shared by the app and,
 * later, the server, and tested without a browser.
 */
import type { CartItem, Product } from '../domain/types';
import { parsePrice } from '../format/price';

/** A product line at the moment it is added: price and title are fixed, so a later price change doesn't rewrite the cart. */
export function snapshotOf(p: Pick<Product, 'id' | 'store' | 'price' | 'title' | 'image'>, qty = 1, variant = ''): CartItem {
  return { productId: p.id, storeId: p.store, qty, priceSnapshot: parsePrice(p.price), titleSnapshot: p.title, image: p.image, variant };
}

/**
 * Reads a cart from storage. Old format: an array of product ids (turned into lines
 * through lookup); unknown products and broken records are dropped.
 */
export function normalizeCart(raw: unknown, lookup: (id: string) => Product | undefined): CartItem[] {
  if (!Array.isArray(raw)) return [];
  if (raw.length && typeof raw[0] === 'string') {
    return (raw as string[]).filter(Boolean)
      .map((id) => lookup(id))
      .filter((p): p is Product => !!p)
      .map((p) => snapshotOf(p));
  }
  return (raw as CartItem[]).filter((i) => i && typeof i === 'object' && !!i.productId);
}

export const hasProduct = (items: CartItem[], productId: string): boolean => items.some((i) => i.productId === productId);

export const qtyTotal = (items: CartItem[]): number => items.reduce((s, i) => s + (i.qty || 1), 0);

export const cartTotal = (items: CartItem[]): number => items.reduce((s, i) => s + (i.priceSnapshot || 0) * (i.qty || 1), 0);

/** Adds a product; if it's already there, increases the quantity. `existed` tells which toast to show. */
export function addItem(items: CartItem[], line: CartItem): { items: CartItem[]; existed: boolean } {
  const qty = Math.max(1, Math.floor(line.qty) || 1);
  const existing = items.find((i) => i.productId === line.productId);
  if (existing) {
    return { items: items.map((i) => (i === existing ? { ...i, qty: (i.qty || 1) + qty } : i)), existed: true };
  }
  return { items: [...items, { ...line, qty }], existed: false };
}

/** Sets the quantity; 0 or less removes the line. */
export function setQty(items: CartItem[], productId: string, qty: number): CartItem[] {
  const n = Math.max(0, Math.floor(qty) || 0);
  return items.map((i) => (i.productId === productId ? { ...i, qty: n } : i)).filter((i) => i.qty > 0);
}

export const removeItem = (items: CartItem[], productId: string): CartItem[] => items.filter((i) => i.productId !== productId);
