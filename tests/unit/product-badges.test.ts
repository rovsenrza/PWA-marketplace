import { describe, expect, it } from 'vitest';
import { getBadgeHtml, getPriceHtml } from '../../src/app/ui/product-badges';

describe('getBadgeHtml', () => {
  it('known badges', () => {
    expect(getBadgeHtml({ badge: 'hit' })).toContain('ХИТ');
    expect(getBadgeHtml({ badge: 'sale' })).toContain('РАСПРОДАЖА');
  });
  it('unknown or missing badge gives an empty string', () => {
    expect(getBadgeHtml({ badge: 'promo' })).toBe('');
    expect(getBadgeHtml(null)).toBe('');
  });
});

describe('getPriceHtml', () => {
  it('a sale shows the old price', () => {
    const html = getPriceHtml({ price: '48 900 ₽', oldPrice: '62 000 ₽', badge: 'sale' }, 'fav-price');
    expect(html).toContain('fav-price');
    expect(html).toContain('oz-price-old');
  });
  it('an old price without the sale badge is not shown', () => {
    expect(getPriceHtml({ price: '450 ₽', oldPrice: '500 ₽', badge: 'hit' })).toBe('<span class="oz-price">450 ₽</span>');
  });
});
