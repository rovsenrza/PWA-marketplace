import { describe, expect, it } from 'vitest';
import { formatPrice, parsePrice } from '../../src/shared/format/price';

describe('parsePrice', () => {
  it('extracts the number from the display string', () => {
    expect(parsePrice('189 000 ₽')).toBe(189000);
    expect(parsePrice('от 450 ₽/м²')).toBe(450); // superscript ² is not an ASCII digit (\d), it is skipped
    expect(parsePrice(57240)).toBe(57240);
  });
  it('returns 0 for empty input', () => {
    for (const v of ['', null, undefined, 'договорная']) expect(parsePrice(v)).toBe(0);
  });
});

describe('formatPrice', () => {
  it('groups thousands with a space and adds ₽', () => {
    expect(formatPrice(189000)).toBe('189 000 ₽');
    expect(formatPrice(450)).toBe('450 ₽');
    expect(formatPrice(1234567)).toBe('1 234 567 ₽');
  });
  it('is the inverse of parsePrice for whole roubles', () => {
    for (const n of [0, 7, 999, 1000, 57240, 215000]) expect(parsePrice(formatPrice(n))).toBe(n);
  });
});
