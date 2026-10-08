/**
 * A store's own filters: which facets its products really offer, which products a selection keeps, in what
 * order they are listed. A facet that cannot narrow anything is not offered; a bound on a value a product
 * does not have excludes that product.
 */
import { parsePrice } from '../format/price';
import type { ProductLike, StoreFilterDef } from './types';

export interface FacetValue { value: string; count: number }
export type Facet =
  | { def: StoreFilterDef; type: 'chips'; values: FacetValue[] }
  | { def: StoreFilterDef; type: 'range'; min: number; max: number };
export type RangeSel = { min?: number; max?: number };
/** The buyer's selection by filter key: chip values picked, or the bounds of a range. */
export type FilterState = Record<string, string[] | RangeSel>;
export type SortKey = 'popular' | 'cheap' | 'expensive' | 'new';

/** 3 → 3, '1,5' → 1.5, ' 40 ' → 40; anything that is not a plain decimal number → null. */
export function toNumber(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return /^[+-]?\d+(?:[.,]\d+)?$/.test(s) ? Number(s.replace(',', '.')) : null;
}

const text = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

/**
 * What a product has under a filter key. `price` is a number (undefined when unknown or zero); `store` and
 * `category` are text; any other key is read from the product's `attrs`, and «Бренд» also from an imported `brand`.
 */
export function productValue(p: ProductLike, key: string): string | number | undefined {
  if (key === 'price') {
    const price = parsePrice(p.price);
    return price > 0 ? price : undefined;
  }
  if (key === 'store' || key === 'category') return text(p[key]);
  const attrs = p.attrs;
  if (attrs && typeof attrs === 'object' && Object.prototype.hasOwnProperty.call(attrs, key)) {
    const v = attrs[key];
    const value = typeof v === 'number' ? (Number.isFinite(v) ? v : undefined) : text(v);
    if (value !== undefined) return value;
  }
  return key === 'Бренд' ? text(p.brand) : undefined;
}

/** Numbers by value, everything else by popularity and then alphabet. */
function orderValues(values: FacetValue[]): FacetValue[] {
  const numeric = values.every((v) => toNumber(v.value) !== null);
  return values.sort(numeric
    ? (a, b) => (toNumber(a.value) as number) - (toNumber(b.value) as number)
    : (a, b) => b.count - a.count || a.value.localeCompare(b.value, 'ru'));
}

/**
 * The facets worth showing for these products, in the order of `defs`: chips need two different values,
 * a range needs numbers that are not all equal.
 */
export function buildFacets(products: readonly ProductLike[], defs: readonly StoreFilterDef[]): Facet[] {
  const facets: Facet[] = [];
  for (const def of defs) {
    const values = products.map((p) => productValue(p, def.key)).filter((v): v is string | number => v !== undefined);
    if (def.type === 'range') {
      let min = Infinity, max = -Infinity;
      for (const v of values) {
        const n = toNumber(v);
        if (n === null) continue;
        if (n < min) min = n;
        if (n > max) max = n;
      }
      if (min < max) facets.push({ def, type: 'range', min, max });
    } else {
      const counts = new Map<string, number>();
      for (const v of values) counts.set(String(v), (counts.get(String(v)) ?? 0) + 1);
      if (counts.size >= 2) facets.push({ def, type: 'chips', values: orderValues([...counts].map(([value, count]) => ({ value, count }))) });
    }
  }
  return facets;
}

/** The bounds of a range selection; a missing, damaged or non-numeric bound is null. */
function boundsOf(sel: unknown): { min: number | null; max: number | null } {
  const range = (typeof sel === 'object' && sel !== null && !Array.isArray(sel) ? sel : {}) as RangeSel;
  return { min: toNumber(range.min), max: toNumber(range.max) };
}

/**
 * The products that satisfy every active selection (values of one key combine with OR, keys with AND).
 * The type of a key comes from `defs`; a key they don't know is chips if its selection is a list, else a range.
 * An empty list or a range without bounds selects nothing, so it doesn't filter.
 */
export function applyFilters<T extends ProductLike>(products: readonly T[], defs: readonly StoreFilterDef[], state: FilterState): T[] {
  const tests: ((p: T) => boolean)[] = [];
  for (const [key, sel] of Object.entries(state)) {
    const def = defs.find((d) => d.key === key);
    const isRange = def ? def.type === 'range' : !Array.isArray(sel);
    if (isRange) {
      const { min, max } = boundsOf(sel);
      if (min === null && max === null) continue;
      tests.push((p) => {
        const v = toNumber(productValue(p, key));
        return v !== null && (min === null || v >= min) && (max === null || v <= max);
      });
    } else {
      const wanted = Array.isArray(sel) ? sel.map(String) : [];
      if (!wanted.length) continue;
      tests.push((p) => {
        const v = productValue(p, key);
        return v !== undefined && wanted.includes(String(v));
      });
    }
  }
  return products.filter((p) => tests.every((test) => test(p)));
}

/** How many filters are switched on: keys with a chip picked or a range bound set. */
export function activeCount(state: FilterState): number {
  return Object.values(state).filter((sel) => {
    if (Array.isArray(sel)) return sel.length > 0;
    const { min, max } = boundsOf(sel);
    return min !== null || max !== null;
  }).length;
}

/**
 * The same products in the chosen order; ties and `popular` keep the store's own order. Products without a
 * price come last whichever way prices are sorted. `new` lists the ones badged «new» first.
 */
export function sortProducts<T extends ProductLike>(products: readonly T[], key: SortKey): T[] {
  if (key === 'new') return [...products].sort((a, b) => Number(b.badge === 'new') - Number(a.badge === 'new'));
  if (key === 'popular') return [...products];
  const dir = key === 'cheap' ? 1 : -1;
  const priced = products.map((p) => {
    const price = productValue(p, 'price');
    return { p, price: typeof price === 'number' ? price : null };
  });
  priced.sort((a, b) => {
    if (a.price === null || b.price === null) return Number(a.price === null) - Number(b.price === null);
    return (a.price - b.price) * dir;
  });
  return priced.map((x) => x.p);
}
