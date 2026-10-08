import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '../../src/shared/domain/types';
import { inkFor, onInk, presetTheme } from '../../src/shared/storefront';

/* The app's catalogue store builds itself from window.SEED when its module loads; the cell only reads its shops. */
const catalogState = vi.hoisted(() => ({ shops: {} as Record<string, unknown> }));
vi.mock('../../src/app/data/catalog', () => ({ catalog: { state: catalogState } }));

import { productCellHtml, type CellState } from '../../src/app/ui/product-cell';
import { storeTheme } from '../../src/app/features/storefront/store-theme';

const prod = (over: Partial<Product> = {}): Product => ({
  id: 'prod-1', title: 'Кухня «KT-01»', price: '189 000 ₽', store: 'Кухни Дриада',
  image: 'https://example.com/kitchen.jpg', status: 'published', ...over,
});
const state = (over: Partial<CellState> = {}): CellState =>
  ({ inCart: false, fav: false, ink: '#FFC20E', onInk: '#111110', goods: true, ...over });
const cell = (p: Partial<Product> = {}, s: Partial<CellState> = {}, variant?: 'grid' | 'rail' | 'mini') =>
  productCellHtml(prod(p), state(s), variant);
const priceOf = (out: string) => /<div class="r-price[^"]*">.*?<\/div>/.exec(out)?.[0];

describe('productCellHtml: data never turns into markup', () => {
  it('a title with <img onerror> is text', () => {
    const out = cell({ title: '<img src=x onerror="window.__pwned=1">' });
    expect(out).not.toContain('<img src=x');
    expect(out).toContain('&lt;img src=x onerror=&quot;window.__pwned=1&quot;&gt;');
  });
  it('the store name is escaped on the spine and in its data-store', () => {
    const out = cell({ store: 'Магазин "Ёлка" <b>' });
    expect(out).toContain('data-store="Магазин &quot;Ёлка&quot; &lt;b&gt;"');
    expect(out).toContain('<span>Магазин &quot;Ёлка&quot; &lt;b&gt;</span>');
    expect(out).not.toContain('<b>Магазин');
  });
  it('an id or a photo URL with a quote cannot add an attribute', () => {
    const out = cell({ id: 'x" onclick="alert(1)', image: 'https://e.com/a.jpg" onerror="alert(2)' });
    expect(out).not.toMatch(/ onclick="alert/);
    expect(out).not.toMatch(/ onerror="alert/);
    expect(out).toContain('data-product="x&quot; onclick=&quot;alert(1)"');
  });
  it('an ink that is not a colour cannot inject CSS: the spine keeps its default colours', () => {
    const out = cell({}, { ink: 'red;background:url(//evil.example/x)', onInk: '#fff;x:y' });
    expect(out).not.toContain('evil.example');
    expect(out).not.toContain('--spine');
  });
});

describe('productCellHtml: sticker', () => {
  it('an old price above the price gives the discount in whole percent, and the old price is struck', () => {
    const out = cell({ oldPrice: '210 000 ₽', badge: 'sale' });
    expect(out).toContain('<span class="r-sticker">−10%</span>');
    expect(priceOf(out)).toBe('<div class="r-price"><b>189 000</b><i>₽</i><s>210 000 ₽</s></div>');
    expect(cell({ price: '48 900 ₽', oldPrice: '62 000 ₽' })).toContain('>−21%<');
  });
  it('an old price that is not above the price is no discount', () => {
    for (const oldPrice of ['189 000 ₽', '150 000 ₽', 'по запросу']) {
      const out = cell({ oldPrice, badge: 'sale' });
      expect(out, oldPrice).not.toContain('r-sticker');
      expect(out, oldPrice).not.toContain('<s>');
    }
  });
  it('«Новинка» for new, «Хит» for hit, nothing for no badge', () => {
    expect(cell({ badge: 'new' })).toContain('<span class="r-sticker r-sticker--new">Новинка</span>');
    expect(cell({ badge: 'hit' })).toContain('<span class="r-sticker">Хит</span>');
    expect(cell()).not.toContain('r-sticker');
    expect(cell({ badge: 'promo' })).not.toContain('r-sticker');
  });
  it('a discount wins over the badge', () => {
    const out = cell({ badge: 'new', oldPrice: '210 000 ₽' });
    expect(out).toContain('>−10%<');
    expect(out).not.toContain('Новинка');
  });
});

describe('productCellHtml: price', () => {
  it('the number in the block, ₽ beside it', () => {
    expect(priceOf(cell())).toBe('<div class="r-price"><b>189 000</b><i>₽</i></div>');
    expect(priceOf(cell({ price: '1 299,90 ₽' }))).toBe('<div class="r-price"><b>1 299,90</b><i>₽</i></div>');
    expect(priceOf(cell({ price: '57 240 ₽' }))).toBe('<div class="r-price"><b>57 240</b><i>₽</i></div>');
  });
  it('what follows ₽ stays with it', () => {
    expect(priceOf(cell({ price: '450 ₽/м²' }))).toBe('<div class="r-price"><b>450</b><i>₽/м²</i></div>');
  });
  it('text that does not start with the number stays whole in the block: «от 450 ₽/м²»', () => {
    expect(priceOf(cell({ price: 'от 450 ₽/м²' }))).toBe('<div class="r-price"><b>от 450 ₽/м²</b></div>');
  });
  it('the passport unit joins the ₽, unless the price already names a unit', () => {
    expect(priceOf(cell({ price: '2 100 ₽' }, { unit: '/ мешок' }))).toBe('<div class="r-price"><b>2 100</b><i>₽ / мешок</i></div>');
    expect(priceOf(cell({ price: '450 ₽/м²' }, { unit: '/ м²' }))).toBe('<div class="r-price"><b>450</b><i>₽/м²</i></div>');
  });
  it('no price: «Цена по запросу» instead of an empty block', () => {
    expect(priceOf(cell({ price: '' }))).toBe('<div class="r-price r-price--ask"><b>Цена по запросу</b></div>');
  });
});

describe('productCellHtml: spine', () => {
  it('the store ink and its label colour ride on the cell', () => {
    expect(cell()).toMatch(/^<article class="r-cell r-cell--grid product-card" data-product="prod-1" style="--spine:#FFC20E;--on-spine:#111110">/);
    expect(cell({}, { ink: '#ffc20e' })).toContain('style="--spine:#FFC20E;--on-spine:#111110"');
  });
  it('the spine names the store and opens it', () => {
    expect(cell()).toContain('<button type="button" class="r-spine r-cell__spine" data-action="open-store" data-store="Кухни Дриада"><span>Кухни Дриада</span></button>');
  });
  it('a missing label colour is picked by contrast with the ink', () => {
    expect(cell({}, { ink: '#0067B1', onInk: '' })).toContain('style="--spine:#0067B1;--on-spine:#FFFFFF"');
  });
  it('a product without a store has no spine', () => {
    expect(cell({ store: '' })).not.toContain('r-spine');
  });
});

describe('productCellHtml: buttons and their state', () => {
  it('out of the cart: «В корзину» with the cart icon', () => {
    const out = cell();
    expect(out).toContain('<button type="button" class="r-cell__cart" data-action="cell-cart" data-product="prod-1" aria-label="В корзину">');
    expect(out).not.toContain('is-on');
  });
  it('in the cart: the button is marked, says «В корзине» and shows a check', () => {
    const out = cell({}, { inCart: true });
    expect(out).toContain('<button type="button" class="r-cell__cart is-on" data-action="cell-cart" data-product="prod-1" aria-label="В корзине">');
    expect(out).toContain('d="M5 13l4 4L19 7"');
  });
  it('favourites: a toggle with a fixed label and aria-pressed', () => {
    expect(cell()).toContain('<button type="button" class="r-cell__fav" data-action="cell-fav" data-product="prod-1" aria-label="В избранное" aria-pressed="false">');
    expect(cell({}, { fav: true })).toContain('aria-label="В избранное" aria-pressed="true"');
  });
  it('goods: false hides the cart button, the heart and the spine stay', () => {
    const out = cell({}, { goods: false });
    expect(out).not.toContain('r-cell__cart');
    expect(out).not.toContain('cell-cart');
    expect(out).toContain('data-action="cell-fav"');
    expect(out).toContain('data-action="open-store"');
  });
  it('the title opens the product (the open-product action of the favourites module)', () => {
    expect(cell()).toContain('<h3 class="r-cell__title"><button type="button" class="r-cell__open" data-action="open-product" data-product="prod-1">Кухня «KT-01»</button></h3>');
    expect(cell({ title: '' })).toContain('data-product="prod-1">Без названия</button>');
  });
  it('a note (the quantity in a lifehack estimate) is one escaped line under the title', () => {
    expect(cell({}, { note: '12 шт · м² <пола>' })).toContain('</h3><p class="r-cell__note">12 шт · м² &lt;пола&gt;</p></div>');
    expect(cell()).not.toContain('r-cell__note');
  });
  it('icons are inline SVG at a 1.75 stroke', () => {
    for (const out of [cell(), cell({}, { inCart: true })]) {
      const svgs = out.match(/<svg[^>]*>/g) ?? [];
      expect(svgs).toHaveLength(2);
      for (const svg of svgs) expect(svg).toContain('stroke-width="1.75"');
    }
  });
});

describe('productCellHtml: variants and the markup contract', () => {
  it('rail and mini cells; anything else is a grid cell', () => {
    expect(cell({}, {}, 'rail')).toMatch(/^<article class="r-cell r-cell--rail" /);
    expect(cell({}, {}, 'mini')).toMatch(/^<article class="r-cell r-cell--mini" /);
    expect(productCellHtml(prod(), state(), 'tile' as never)).toMatch(/^<article class="r-cell r-cell--grid product-card" /);
  });
  it('the parts come in the contract order', () => {
    const out = cell({ oldPrice: '210 000 ₽' });
    const order = ['r-cell r-cell--grid', 'r-cell__media', '<img ', 'r-sticker', 'r-cell__fav', 'r-cell__body', 'r-price',
      'r-cell__title', 'r-cell__open', 'r-cell__cart', 'r-cell__spine'].map((part) => out.indexOf(part));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });
  it('the photo is lazy and decorative; images[0] when there is no image; no photo, no <img>', () => {
    expect(cell()).toContain('<div class="r-cell__media"><img src="https://example.com/kitchen.jpg" alt="" loading="lazy" decoding="async">');
    expect(cell({ image: '', images: ['', 'https://example.com/2.jpg'] })).toContain('<img src="https://example.com/2.jpg"');
    expect(cell({ image: '' })).not.toContain('<img');
  });
});

describe('storeTheme: the ink of a store outside its own page', () => {
  beforeEach(() => { catalogState.shops = {}; });

  it('a saved ink wins and carries its label colour', () => {
    catalogState.shops['Постройка'] = { name: 'Постройка', status: 'published', category: 'Стройматериалы', storefront: { theme: { ink: '#ffc20e' } } };
    expect(storeTheme('Постройка')).toEqual({ ink: '#FFC20E', ground: 'stock', voice: 'industrial', cover: 'field', onInk: '#111110' });
  });
  it('a damaged ink falls back to the store\'s own family ink', () => {
    catalogState.shops['Постройка'] = { name: 'Постройка', status: 'published', category: 'Стройматериалы', storefront: { theme: { ink: 'oops' } } };
    expect(storeTheme('Постройка').ink).toBe(inkFor('Постройка'));
  });
  it('a store without a saved storefront gets the preset of its kind', () => {
    catalogState.shops['Кухни Дриада'] = { name: 'Кухни Дриада', status: 'published', category: 'Кухни' };
    const t = storeTheme('Кухни Дриада');
    expect(t).toMatchObject({ ink: inkFor('Кухни Дриада'), ground: 'black', voice: 'modern' });
    expect(t.onInk).toBe(onInk(t.ink));
  });
  it('an unknown store gets the general preset', () => {
    expect(storeTheme('Нет такого')).toEqual({ ...presetTheme('general', 'Нет такого'), onInk: onInk(inkFor('Нет такого')) });
  });
  it('names of Object.prototype are unknown stores, not a crash', () => {
    for (const name of ['constructor', '__proto__', 'toString']) {
      expect(storeTheme(name), name).toEqual({ ...presetTheme('general', name), onInk: onInk(inkFor(name)) });
    }
  });
});
