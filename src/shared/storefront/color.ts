/** Colour for storefronts: store inks, contrast and mixing. Pure functions on `#RRGGBB` strings. */

export const INK_DARK = '#111110';
export const INK_LIGHT = '#FFFFFF';

/** Store and section inks. Orange 021 (#FE5000) is the platform's own ink and is not part of this set. */
export const FAMILY_INKS: readonly { name: string; hex: string }[] = [
  { name: 'Синий', hex: '#0067B1' }, { name: 'Зелёный', hex: '#00753A' }, { name: 'Жёлтый', hex: '#FFC20E' },
  { name: 'Красный', hex: '#D7261E' }, { name: 'Фиолетовый', hex: '#6D2C91' }, { name: 'Бирюзовый', hex: '#00A19A' },
  { name: 'Графит', hex: '#3A3A38' }, { name: 'Бронза', hex: '#A8803F' }, { name: 'Небесный', hex: '#3AA0DB' },
  { name: 'Малиновый', hex: '#C2185B' },
];

/** '#ffc20e' / 'abc' / ' #0F6A3C ' → '#FFC20E' / '#AABBCC' / '#0F6A3C'; anything else → null. */
export function normalizeHex(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(input.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1];
  return `#${h.toUpperCase()}`;
}

function channels(hex: string): [number, number, number] {
  const h = normalizeHex(hex);
  if (!h) throw new Error(`not a colour: ${hex}`);
  return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

/** WCAG relative luminance, 0 (black) … 1 (white). */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = channels(hex).map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio, 1 … 21, whichever way round the colours come. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Text colour on a field of `hex`: process black or white, whichever reads better. */
export function onInk(hex: string): string {
  return contrastRatio(hex, INK_DARK) >= contrastRatio(hex, INK_LIGHT) ? INK_DARK : INK_LIGHT;
}

/** Linear mix: t = 0 → a, t = 1 → b. */
export function mixHex(a: string, b: string, t: number): string {
  const k = Math.min(1, Math.max(0, t));
  const ca = channels(a), cb = channels(b);
  return `#${ca.map((v, i) => Math.round(v + (cb[i] - v) * k).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

/** A stable ink for a store that has none of its own: FNV-1a of the trimmed, lower-cased name. */
export function inkFor(name: string): string {
  let h = 0x811c9dc5;
  for (const ch of name.trim().toLowerCase()) { h ^= ch.codePointAt(0)!; h = Math.imul(h, 0x01000193) >>> 0; }
  return FAMILY_INKS[h % FAMILY_INKS.length].hex;
}
