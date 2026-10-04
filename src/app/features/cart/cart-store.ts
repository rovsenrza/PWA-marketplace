/**
 * Cart and order store: the single source of truth for cart lines and orders.
 * It persists through repositories. For the remaining legacy code it installs two accessors,
 * so legacy reads and writes land in the same store:
 *   state.cart   → store lines (get / replace)
 *   marketplace  → the orders object (a global, as in the prototype)
 */
import type { CartItem, Marketplace, Product } from '../../../shared/domain/types';
import { normalizeCart, hasProduct, qtyTotal } from '../../../shared/orders/cart';
import {
  emptyMarketplace, localCartRepository, localMarketplaceRepository,
  normalizeMarketplace, type CartRepository, type MarketplaceRepository,
} from '../../../shared/data/repositories';

export class CartStore {
  private items: CartItem[] = [];
  private orders: Marketplace = emptyMarketplace();

  constructor(
    private readonly cartRepo: CartRepository = localCartRepository,
    private readonly ordersRepo: MarketplaceRepository = localMarketplaceRepository,
  ) {}

  /* ---- корзина ---- */
  /** A copy of the array (the line objects are shared), as the old getCartItems returned. */
  list(): CartItem[] { return this.items.filter((i) => i && i.productId); }
  replace(items: unknown): void { this.items = Array.isArray(items) ? (items as CartItem[]).filter((i) => i && i.productId) : []; }
  has(productId: string): boolean { return !!productId && hasProduct(this.list(), productId); }
  count(): number { return qtyTotal(this.list()); }
  loadCart(lookup: (id: string) => Product | undefined): void { this.items = normalizeCart(this.cartRepo.loadRaw(), lookup); }
  saveCart(): void { this.cartRepo.save(this.list()); }

  /* ---- заказы ---- */
  get marketplace(): Marketplace { return this.orders; }
  set marketplace(m: Marketplace) { this.orders = normalizeMarketplace(m); }
  loadOrders(): void { this.orders = this.ordersRepo.load(); }
  saveOrders(): void { this.ordersRepo.save(this.orders); }

  /** Accessors for legacy code: one source of truth instead of two copies. */
  installLegacyAccessors(legacyState: { cart?: unknown } | undefined): void {
    if (legacyState) {
      this.replace(legacyState.cart);
      Object.defineProperty(legacyState, 'cart', {
        configurable: true, enumerable: true,
        get: () => this.list(),
        set: (v: unknown) => this.replace(v),
      });
    }
    Object.defineProperty(window, 'marketplace', {
      configurable: true,
      get: () => this.orders,
      set: (v: Marketplace) => { this.marketplace = v; },
    });
  }
}

export const cartStore = new CartStore();
