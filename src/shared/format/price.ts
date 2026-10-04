/**
 * Prices. Today they are stored as display text ('189 000 ₽'); the server model will hold kopecks
 * as an integer. These functions are the only place that knows the text format.
 */

/**
 * The first number in a string: '189 000 ₽' → 189000, '1 299,90 ₽' → 1299.9, 'от 450 ₽/м²' → 450.
 * Thousands are separated by spaces (including non-breaking ones); the decimal separator is a comma or a dot
 * with 1–2 digits; '1.299' (three digits after the dot) is thousands. Before, every digit in the string was
 * taken, and '1 299,90' became 129 990: the price grew a hundredfold.
 */
export function parsePrice(price: string | number | null | undefined): number {
  if (price == null || price === '') return 0;
  if (typeof price === 'number') return Number.isFinite(price) ? price : 0;
  const s = String(price).replace(/[\u00a0\u2009\u202f]/g, ' ');
  const m = s.match(/\d[\d ]*(?:[.,]\d+)*/);
  if (!m) return 0;
  let num = m[0].trim().replace(/ /g, '');
  const tail = num.match(/[.,](\d+)$/);
  if (tail && tail[1].length <= 2) {
    /* последний разделитель с 1–2 цифрами — дробная часть; остальные разделители — тысячи */
    num = `${num.slice(0, tail.index).replace(/[.,]/g, '')}.${tail[1]}`;
  } else {
    num = num.replace(/[.,]/g, '');
  }
  const v = parseFloat(num);
  return Number.isFinite(v) ? v : 0;
}

const groupThousands = (int: string) => int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/** 189000 → '189 000 ₽'; 1299.9 → '1 299,90 ₽' (kopecks only when there are any). */
export function formatPrice(value: number | string): string {
  const n = typeof value === 'number' ? value : parsePrice(value);
  const kop = Math.round(Math.abs(n) * 100) % 100;
  const rub = Math.trunc(Math.round(n * 100) / 100);
  const sign = n < 0 && (rub !== 0 || kop !== 0) ? '-' : '';
  return `${sign}${groupThousands(String(Math.abs(rub)))}${kop ? `,${String(kop).padStart(2, '0')}` : ''} ₽`;
}

/** A sum in roubles (to the kopeck); 'abc', NaN, null → '0 ₽'. */
export function formatRub(value: unknown): string {
  const n = Number(value);
  return formatPrice(Number.isFinite(n) ? Math.round(n * 100) / 100 : 0);
}
