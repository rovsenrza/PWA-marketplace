/**
 * Domain model types. They describe the data as it is stored now
 * (seed.js + localStorage) and will become the API contract later.
 * Fields are optional where real records vary.
 */
import type { SavedStorefront } from '../storefront/types';

/** Storefront types (blocks, themes, filter definitions) are part of the domain model too. */
export type * from '../storefront/types';

export type PublicationStatus = 'published' | 'pending' | 'rejected' | 'draft';

export interface Product {
  [field: string]: unknown;
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
  /** Values for the store's own filters and the consumption calculator: 'Основа': 'гипс', 'Фасовка, кг': 30. */
  attrs?: Record<string, string | number>;
  status: PublicationStatus;
  rejectReason?: string;
}

export interface Shop {
  [field: string]: unknown;
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
  /** The store's own page as saved by the admin; `resolveStorefront` fills in and repairs whatever is missing. */
  storefront?: SavedStorefront;
}

export interface Story {
  [field: string]: unknown;
  id: string;
  name: string;
  status?: PublicationStatus;
  isLifehack?: boolean;
  image?: string;
  slides?: string[];
  createdAt?: number;
}

export interface PromoSlide {
  [field: string]: unknown;
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

/* ---- справочник и контент (форма как в прототипе; поля, которые код не трогает, сохраняются как есть) ---- */
type Loose = { [field: string]: unknown };

export interface Specialist extends Loose { id: string; name?: string; craft?: string }
/** Directory: sections with lists; only specialists are merged on load. */
export interface Directory extends Loose { specialists?: Specialist[] }
export interface Vacancy extends Loose { id: string; title?: string; company?: string; salary?: string }
export interface Lifehack extends Loose { id: string; title?: string; status?: PublicationStatus; category?: string }
export interface OnboardingSlide extends Loose { title?: string; image?: string }
/** A store's request to publish or change its showcase (moderation queue). */
export interface ShowcaseRequest extends Loose { id: string; shop?: string; status?: string }
