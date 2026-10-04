/**
 * Domain model types. They describe the data as it is stored now
 * (seed.js + localStorage) and will become the API contract later.
 * Fields are optional where real records vary.
 */

export type PublicationStatus = 'published' | 'pending' | 'rejected' | 'draft';

export interface Product {
  id: string;
  title: string;
  /** Price as display text: '57 240 ₽'. Normalising to a number is stage 3. */
  price: string;
  oldPrice?: string;
  sku?: string;
  store: string;
  category?: string;
  image?: string;
  images?: string[];
  description?: string;
  badge?: 'sale' | 'new' | 'hit' | string;
  status: PublicationStatus;
  rejectReason?: string;
}

export interface Shop {
  name: string;
  status: PublicationStatus;
  category?: string;
  banner?: string;
  bannerFit?: 'cover' | 'contain';
  logo?: string;
  description?: string;
  address?: string;
  site?: string;
  telegram?: string;
  video?: string;
  rating?: string;
}

export interface Story {
  id: string;
  name: string;
  status?: PublicationStatus;
  isLifehack?: boolean;
  image?: string;
  slides?: string[];
  createdAt?: number;
}

export interface PromoSlide {
  title: string;
  image: string;
}

export interface CartItem {
  productId: string;
  storeId: string;
  qty: number;
  priceSnapshot?: number;
  titleSnapshot?: string;
  image?: string;
  variant?: string;
}

export type StoreOrderStatus =
  | 'pending_review' | 'awaiting_buyer' | 'partial' | 'confirmed'
  | 'rejected' | 'expired' | 'cancelled'
  | 'invoiced' | 'awaiting_payment' | 'paid';

/** An order line, as the store sees it: confirmed, unavailable, or a different price offered. */
export type OrderLineStatus = 'pending' | 'confirmed' | 'unavailable' | 'price_changed' | 'removed';

export interface OrderLine {
  productId: string;
  title?: string;
  qty: number;
  /** the price at checkout */
  quotedPrice: number;
  /** the price the store offered instead (status price_changed) */
  proposedPrice: number | null;
  lineStatus: OrderLineStatus;
}

export interface StoreOrder {
  id: string;
  checkoutId: string;
  storeId: string;
  status: StoreOrderStatus;
  lines: OrderLine[];
  createdAt: number;
  updatedAt?: number;
  slaDeadline?: number;
}

export interface Marketplace {
  checkouts: Array<{ id: string; userId?: string; createdAt: number; status: string }>;
  storeOrders: StoreOrder[];
  invoices: unknown[];
  payments: unknown[];
}
