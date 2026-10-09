/**
 * The product cell: one renderer for every grid and rail of goods (home, the catalogue, category goods, the
 * product page's «Похожие» and «Недавние», lifehack picks, storefronts). Every cell carries its store's spine,
 * drawn in V3 as the store line: a dot of the store's ink beside its name, so stores stay apart by colour.
 *
 *  - productCellHtml: pure. A product and its state in, markup out; every value is escaped (html`…`).
 *  - productCell: the same for a product as the app has it now (cart, favourites, the store's ink, the unit).
 *    Legacy renderers call it by the global name productCellHtml(prod, variant, note).
 *  - initProductCells: the cell's buttons (data-action) and their state after cart and favourites changes.
 *
 * Markup contract (screens style around it and never re-implement it):
 *   article.r-cell.r-cell--{grid|rail|mini}[data-product][style="--spine:…;--on-spine:…"]
 *     div.r-cell__media > img, span.r-sticker, button.r-cell__fav[data-action=cell-fav][aria-pressed]
 *     div.r-cell__body > div.r-price, h3.r-cell__title > button.r-cell__open[data-action=open-product], p.r-cell__note
 *     button.r-cell__cart[data-action=cell-cart] (goods only; .is-on while in the cart)
 *     button.r-spine.r-cell__spine[data-action=open-store][data-store] > span
 * Grid cells also carry .product-card: the home search (handleSearch) filters the grid by that class.
 */
import type { Product } from '../../shared/domain/types';
import { on } from '../../shared/events';
import { formatPrice, parsePrice } from '../../shared/format/price';
import { normalizeHex, onInk } from '../../shared/storefront';
import { registerActions } from '../../shared/ui/actions';
import { html, raw, type SafeHtml } from '../../shared/ui/html';
import { addToCart } from '../features/cart/actions';
import { cartStore } from '../features/cart/cart-store';
import { toggleFavorite } from '../features/favorites/actions';
import { favoritesStore } from '../features/favorites/favorites-store';
import { storeTheme } from '../features/storefront/store-theme';

/** What a cell shows besides the product itself. */
export interface CellState {
  inCart: boolean;
  fav: boolean;
  /** the store's ink (#RRGGBB) and the label colour that reads on it */
  ink: string;
  onInk: string;
  /** goods go to the cart; real estate and other listings do not */
  goods: boolean;
  /** what the price is for: '/ мешок' */
  unit?: string;
  /** one line under the title: the quantity in a lifehack estimate */
  note?: string;
}
export type CellVariant = 'grid' | 'rail' | 'mini';
const VARIANTS: readonly string[] = ['grid', 'rail', 'mini'];

const svg = (body: string) => raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`);
/* the heart and the cart are the tab bar's drawings */
const ICON_HEART = svg('<path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>');
const ICON_CART = svg('<path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>');
const ICON_CHECK = svg('<path d="M5 13l4 4L19 7"/>');

const cartLabel = (inCart: boolean) => (inCart ? 'В корзине' : 'В корзину');
const cartIcon = (inCart: boolean) => (inCart ? ICON_CHECK : ICON_CART);

/** A price as display text: '189 000 ₽' stays as it is, a bare number is formatted. */
function priceText(v: unknown): string {
  if (typeof v === 'number') return Number.isFinite(v) ? formatPrice(v) : '';
  return typeof v === 'string' ? v.trim() : '';
}

/** Whole percent off (1…99) when the old price is above the price, else 0. */
function discountOf(p: Product): number {
  const now = parsePrice(priceText(p.price));
  const was = parsePrice(priceText(p.oldPrice));
  return now > 0 && was > now ? Math.min(99, Math.max(1, Math.round((1 - now / was) * 100))) : 0;
}

function stickerHtml(p: Product, discount: number): SafeHtml | null {
  if (discount) return html`<span class="r-sticker">−${discount}%</span>`;
  if (p.badge === 'new') return html`<span class="r-sticker r-sticker--new">Новинка</span>`;
  if (p.badge === 'hit') return html`<span class="r-sticker">Хит</span>`;
  return null;
}

/** A price that starts with its number: '189 000 ₽', '450 ₽/м²'. Anything else stays one block. */
const PRICE = /^([\d\s .,]+)\s*₽(.*)$/;

/** The number in <b>, ₽ and what follows it (or the passport unit) in <i>, the old price struck through. */
function priceHtml(p: Product, unit: string, discount: number): SafeHtml {
  const text = priceText(p.price);
  if (!text) return html`<div class="r-price r-price--ask"><b>Цена по запросу</b></div>`;
  const old = discount ? html`<s>${priceText(p.oldPrice)}</s>` : null;
  const m = PRICE.exec(text);
  if (!m) return html`<div class="r-price"><b>${text}</b>${unit && !text.includes('/') ? html`<i>${unit}</i>` : null}${old}</div>`;
  const rest = m[2].trimEnd();
  return html`<div class="r-price"><b>${m[1].trim()}</b><i>₽${rest || (unit ? ` ${unit}` : '')}</i>${old}</div>`;
}

function photoOf(p: Product): string {
  if (typeof p.image === 'string' && p.image) return p.image;
  const first = Array.isArray(p.images) ? p.images.find((src) => typeof src === 'string' && src) : undefined;
  return first ?? '';
}

/** The spine colours as custom properties; nothing (the spine's own defaults) when the ink is not a colour. */
function spineStyle(s: CellState): string | null {
  const ink = normalizeHex(s.ink);
  return ink ? `--spine:${ink};--on-spine:${normalizeHex(s.onInk) ?? onInk(ink)}` : null;
}

function cartButton(id: string, inCart: boolean): SafeHtml {
  return html`<button type="button" class="r-cell__cart${inCart ? ' is-on' : ''}" data-action="cell-cart" data-product="${id}" aria-label="${cartLabel(inCart)}">${cartIcon(inCart)}</button>`;
}

/** The cell's markup for a product in a given state. Pure: the same input always gives the same string. */
export function productCellHtml(p: Product, s: CellState, variant: CellVariant = 'grid'): string {
  const v = VARIANTS.includes(variant) ? variant : 'grid';
  const id = String(p.id ?? '');
  const store = typeof p.store === 'string' ? p.store.trim() : '';
  const style = spineStyle(s);
  const discount = discountOf(p);
  const photo = photoOf(p);
  const title = (typeof p.title === 'string' && p.title.trim()) || 'Без названия';

  const media = html`<div class="r-cell__media">${photo ? html`<img src="${photo}" alt="" loading="lazy" decoding="async">` : null}${stickerHtml(p, discount)}<button type="button" class="r-cell__fav" data-action="cell-fav" data-product="${id}" aria-label="В избранное" aria-pressed="${s.fav ? 'true' : 'false'}">${ICON_HEART}</button></div>`;
  const body = html`<div class="r-cell__body">${priceHtml(p, s.unit ?? '', discount)}<h3 class="r-cell__title"><button type="button" class="r-cell__open" data-action="open-product" data-product="${id}">${title}</button></h3>${s.note ? html`<p class="r-cell__note">${s.note}</p>` : null}</div>`;
  const spine = store ? html`<button type="button" class="r-spine r-cell__spine" data-action="open-store" data-store="${store}"><span>${store}</span></button>` : null;

  return html`<article class="r-cell r-cell--${v}${v === 'grid' ? ' product-card' : ''}" data-product="${id}"${style ? html` style="${style}"` : null}>${media}${body}${s.goods ? cartButton(id, s.inCart) : null}${spine}</article>`.value;
}

/* ------------------------------------------------------------------------------------- the live cell */

type LegacyPassport = (p: Product) => { unitShort?: unknown } | null | undefined;
type LegacyTest = (p: Product) => unknown;

/** Goods go to the cart: the product page's own rule (pmIsGoods) when it is loaded, else everything but real estate. */
function isGoods(p: Product): boolean {
  const legacy = window.pmIsGoods as LegacyTest | undefined;
  if (typeof legacy === 'function') return !!legacy(p);
  return p.category !== 'недвижимость' && !p.reSegment;
}

/** The unit from the product passport ('/ мешок'), when the product page's code is loaded. */
function unitOf(p: Product): string | undefined {
  const passport = window.productPassport as LegacyPassport | undefined;
  const unit = typeof passport === 'function' ? passport(p)?.unitShort : undefined;
  return typeof unit === 'string' && unit ? unit : undefined;
}

/** A note as one clean line: no separator left dangling at either end ('· стены' → 'стены'). */
const cleanNote = (note: unknown) => (typeof note === 'string' ? note.replace(/^[\s·]+|[\s·]+$/g, '') : '');

/** The cell for a product as the app has it now: in the cart or not, in favourites or not, its store's ink. */
export function productCell(p: Product, variant: CellVariant = 'grid', note?: string): string {
  if (!p || typeof p !== 'object') return '';
  const theme = storeTheme(typeof p.store === 'string' ? p.store : '');
  return productCellHtml(p, {
    inCart: cartStore.has(p.id),
    fav: favoritesStore.has(p.id),
    ink: theme.ink,
    onInk: theme.onInk,
    goods: isGoods(p),
    unit: unitOf(p),
    note: cleanNote(note) || undefined,
  }, variant);
}

/* ------------------------------------------------------------------------------------------- buttons */

type OpenStorefront = (name: string, from?: Element | null) => void;

/** A store's page: its storefront when the app has one (window.openStorefront), else the old showcase. */
function openStore(name: string, from: HTMLElement): void {
  if (!name) return;
  const storefront = window.openStorefront as OpenStorefront | undefined;
  if (typeof storefront === 'function') { storefront(name, from); return; }
  /* the showcase sits under the product page: raise it over the page when a cell there was tapped (as pmOpenShop does) */
  const showcase = document.getElementById('shop-catalog-modal');
  const page = document.getElementById('product-modal');
  if (showcase && page && !page.classList.contains('hidden')) {
    const z = parseInt(page.style.zIndex || '60', 10) || 60;
    showcase.style.zIndex = String(Math.max(70, z + 10));
  }
  (window.openShopCatalogModal as ((name: string) => void) | undefined)?.(name);
}

/** The heart and the cart key of every cell in the document, repainted from the stores where they changed. */
function refreshCells(): void {
  document.querySelectorAll<HTMLElement>('.r-cell[data-product]').forEach((cell) => {
    const id = cell.dataset.product ?? '';
    const fav = cell.querySelector<HTMLElement>('.r-cell__fav');
    const pressed = String(favoritesStore.has(id));
    if (fav && fav.getAttribute('aria-pressed') !== pressed) fav.setAttribute('aria-pressed', pressed);
    const cart = cell.querySelector<HTMLElement>('.r-cell__cart');
    const inCart = cartStore.has(id);
    if (cart && cart.classList.contains('is-on') !== inCart) {
      cart.classList.toggle('is-on', inCart);
      cart.setAttribute('aria-label', cartLabel(inCart));
      cart.innerHTML = cartIcon(inCart).value;
    }
  });
}

/**
 * Runs a cart or favourites change for the key `el`. The change redraws the cell's container at once, so a focused
 * key (Enter or Space from the keyboard) would leave focus on <body>: it goes back to the same key of the same
 * product in the same container.
 */
function keepingFocus(el: HTMLElement, change: () => void): void {
  const focused = document.activeElement === el;
  const scope = el.closest<HTMLElement>('[id]')?.id;
  const { action, product } = el.dataset;
  change();
  if (!focused || el.isConnected || !scope || !action || !product) return;
  const key = `[data-action="${CSS.escape(action)}"][data-product="${CSS.escape(product)}"]`;
  document.getElementById(scope)?.querySelector<HTMLElement>(key)?.focus({ preventScroll: true });
}

let wired = false;

/**
 * The cell's buttons. The title uses open-product, the favourites module's action, so every «open this product»
 * has one handler. Renderers that do not redraw on cart and favourites events still show the right state.
 */
export function initProductCells(): void {
  if (wired) return;
  wired = true;
  registerActions({
    'cell-cart': (el) => keepingFocus(el, () => addToCart(el.dataset.product ?? '')),
    'cell-fav': (el) => keepingFocus(el, () => { if (el.dataset.product) toggleFavorite(el.dataset.product); }),
    'open-store': (el) => openStore(el.dataset.store ?? '', el),
  });
  on('app:cart-changed', refreshCells);
  on('app:favorites-changed', refreshCells);
  /* iOS Safari applies :active only under a touch listener: this passive, empty one turns on the pressed states
     (the cell's tone, the keys) on iPhones; it blocks nothing */
  document.addEventListener('touchstart', () => {}, { passive: true });
}
