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

/** A cart line: a snapshot of the product at the time it was added (price, title, photo). */
export interface CartItem {
  productId: string;
  storeId: string;
  qty: number;
  priceSnapshot: number;
  titleSnapshot: string;
  image?: string;
  variant?: string;
}

export interface BuyerContact {
  name: string;
  phone: string;
  telegram?: string;
  max?: string;
  comment?: string;
}

export interface Checkout {
  id: string;
  userId: string;
  contact: BuyerContact;
  createdAt: number;
  status: 'submitted';
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
  image?: string;
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
  contact?: BuyerContact;
  invoiceId?: string;
}

export interface Invoice {
  id: string;
  storeOrderId: string;
  amount: number;
  currency: 'RUB';
  channel: 'in_app';
  status: 'issued' | 'paid';
  createdAt: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  provider: 'manual';
  status: 'succeeded';
  amount: number;
  paidAt: number;
}

export interface Marketplace {
  checkouts: Checkout[];
  storeOrders: StoreOrder[];
  invoices: Invoice[];
  payments: Payment[];
}

/** The buyer's profile on this device (there is no account on a server yet). */
export interface BuyerProfile {
  name: string;
  phone: string;
  email: string;
  city: string;
}
