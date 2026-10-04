import { describe, expect, it } from 'vitest';
import { formatPrice, formatRub, parsePrice } from '../../src/shared/format/price';

describe('parsePrice', () => {
  it('whole roubles in the usual formats', () => {
    expect(parsePrice('189 000 ₽')).toBe(189000);
    expect(parsePrice('57\u00a0240 ₽')).toBe(57240); // неразрывный пробел
    expect(parsePrice('6 900 000 ₽')).toBe(6900000);
    expect(parsePrice('от 450 ₽/м²')).toBe(450);
    expect(parsePrice(57240)).toBe(57240);
  });
  it('only the first number is the price (before, every digit in the string was taken)', () => {
    expect(parsePrice('2 100 ₽ / ведро 10 л')).toBe(2100);
    expect(parsePrice('25 000 ₽ / мес')).toBe(25000);
  });
  it('kopecks: comma or dot; three digits after a dot are thousands', () => {
    expect(parsePrice('1 299,90 ₽')).toBe(1299.9); // раньше 129990
    expect(parsePrice('545,00')).toBe(545);
    expect(parsePrice('1299.5')).toBe(1299.5);
    expect(parsePrice('1.299')).toBe(1299);
    expect(parsePrice('1.299.000,50')).toBe(1299000.5);
  });
  it('0 for empty and non-numeric input', () => {
    for (const v of ['', null, undefined, 'договорная']) expect(parsePrice(v)).toBe(0);
  });
});

describe('formatPrice / formatRub', () => {
  it('groups thousands with a space; kopecks only when there are any', () => {
    expect(formatPrice(189000)).toBe('189 000 ₽');
    expect(formatPrice(450)).toBe('450 ₽');
    expect(formatPrice(1299.9)).toBe('1 299,90 ₽');
    expect(formatPrice(0.5)).toBe('0,50 ₽');
  });
  it('is the inverse of parsePrice', () => {
    for (const n of [0, 7, 999, 1000, 57240, 215000, 1299.9, 0.05]) expect(parsePrice(formatPrice(n))).toBe(n);
  });
  it('formatRub: to the kopeck, tolerates bad input', () => {
    expect(formatRub(57240.6)).toBe('57 240,60 ₽');
    expect(formatRub(1300)).toBe('1 300 ₽');
    expect(formatRub('abc')).toBe('0 ₽');
    expect(formatRub(null)).toBe('0 ₽');
  });
});
