/**
 * Prices. Today they are stored as text ('189 000 ₽'); converting to numbers on the
 * data side is stage 3. These functions are the only place that knows the format.
 */

/** '189 000 ₽' → 189000. Takes every digit in the string; returns 0 when there are none. */
export function parsePrice(price: string | number | null | undefined): number {
  if (!price) return 0;
  const digits = price.toString().replace(/[^\d]/g, '');
  return parseInt(digits, 10) || 0;
}

/** 189000 → '189 000 ₽' (a plain space between thousands, as everywhere in the app). */
export function formatPrice(value: number | string): string {
  return `${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ₽`;
}

/** A sum in roubles: rounds to whole roubles; 'abc', NaN, null → '0 ₽'. */
export function formatRub(value: unknown): string {
  return formatPrice(Math.round(Number(value) || 0));
}
