/**
 * App events: one channel between domains, instead of functions overwriting each other.
 * These are plain CustomEvents on document, so classic scripts can use them too:
 *   document.dispatchEvent(new CustomEvent('app:cart-changed'))
 * and modules get typing through emit/on.
 */
export interface AppEvents {
  /** the cart changed: add, quantity, remove, clear, checkout */
  'app:cart-changed': undefined;
  /** a product was added to or removed from favourites */
  'app:favorites-changed': { productId: string };
}

export function emit<K extends keyof AppEvents>(type: K, detail?: AppEvents[K]): void {
  document.dispatchEvent(new CustomEvent(type, { detail }));
}

export function on<K extends keyof AppEvents>(type: K, handler: (detail: AppEvents[K]) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<AppEvents[K]>).detail);
  document.addEventListener(type, listener);
  return () => document.removeEventListener(type, listener);
}
