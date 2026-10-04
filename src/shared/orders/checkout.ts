/**
 * Checkout: one cart becomes one checkout and its own order for each store.
 * Every store answers independently (confirmed / unavailable / a different price) within the SLA.
 */
import type { BuyerContact, CartItem, Checkout, StoreOrder } from '../domain/types';
import { STORE_ORDER_SLA_MS } from './store-order';

export interface CheckoutInput {
  items: CartItem[];
  contact: BuyerContact;
  /** account email or, for a guest, the phone */
  userId: string;
  now?: number;
  /** id generator; can be swapped in tests */
  uid?: (prefix: string) => string;
}

export function makeUid(prefix: string): string {
  return `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Contact from the form: trims spaces; returns null when the name or phone is missing. */
export function cleanContact(raw: Partial<Record<keyof BuyerContact, string>>): BuyerContact | null {
  const t = (v?: string) => (v ?? '').trim();
  const contact = { name: t(raw.name), phone: t(raw.phone), telegram: t(raw.telegram), max: t(raw.max), comment: t(raw.comment) };
  return contact.name && contact.phone ? contact : null;
}

export function createCheckout({ items, contact, userId, now = Date.now(), uid = makeUid }: CheckoutInput): { checkout: Checkout; storeOrders: StoreOrder[] } {
  const checkout: Checkout = { id: uid('chk-'), userId, contact, createdAt: now, status: 'submitted' };
  const byStore = new Map<string, CartItem[]>();
  for (const i of items) byStore.set(i.storeId, [...(byStore.get(i.storeId) ?? []), i]);
  const storeOrders: StoreOrder[] = [...byStore].map(([storeId, lines]) => ({
    id: uid('so-'),
    checkoutId: checkout.id,
    storeId,
    status: 'pending_review',
    slaDeadline: now + STORE_ORDER_SLA_MS,
    createdAt: now,
    contact,
    lines: lines.map((i) => ({
      productId: i.productId,
      title: i.titleSnapshot,
      image: i.image,
      qty: i.qty || 1,
      quotedPrice: i.priceSnapshot,
      proposedPrice: null,
      lineStatus: 'pending',
    })),
  }));
  return { checkout, storeOrders };
}
