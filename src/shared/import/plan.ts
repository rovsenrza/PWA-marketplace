/** Rows → drafts with errors → a plan against the catalogue → the catalogue after import. */
import type { Product } from '../domain/types';
import { formatPrice, parsePrice } from '../format/price';
import type { ImportField, ImportTable, ProductDraft, RowIssue } from './types';

const clean = (v: string | undefined) => (v ?? '').replace(/\s+/g, ' ').trim();
const skuKey = (sku: string) => sku.trim().toLowerCase();
const num = (v: string) => { const n = parsePrice(v); return Number.isFinite(n) ? n : undefined; };

/** Table + mapping → drafts. Rows without a title, price or article, and repeated articles, go into issues. */
export function toDrafts(table: ImportTable, mapping: ImportField[]): { drafts: ProductDraft[]; issues: RowIssue[] } {
  const drafts: ProductDraft[] = [];
  const issues: RowIssue[] = [];
  const seen = new Set<string>();
  const col = (f: ImportField) => mapping.indexOf(f);
  const at = (r: string[], f: ImportField) => { const i = col(f); return i < 0 ? '' : clean(r[i]); };
  table.rows.forEach((r, idx) => {
    const row = table.firstRow + idx;
    if (r.every((c) => !clean(c))) return;
    const title = at(r, 'title');
    const sku = at(r, 'sku');
    const priceRaw = at(r, 'price');
    if (!title) { issues.push({ row, code: 'no_title' }); return; }
    if (!sku) { issues.push({ row, code: 'no_sku', value: title }); return; }
    if (!priceRaw) { issues.push({ row, code: 'no_price', value: title }); return; }
    const price = parsePrice(priceRaw);
    if (!(price > 0)) { issues.push({ row, code: 'bad_price', value: priceRaw }); return; }
    const key = skuKey(sku);
    if (seen.has(key)) { issues.push({ row, code: 'duplicate_sku', value: sku }); return; }
    seen.add(key);
    const d: ProductDraft = { row, sku, title, price };
    const oldPrice = num(at(r, 'oldPrice'));
    if (oldPrice && oldPrice > price) d.oldPrice = oldPrice;
    const stock = at(r, 'stock');
    if (stock) d.stock = Math.max(0, Math.floor(parsePrice(stock)));
    for (const f of ['unit', 'category', 'barcode', 'weight', 'desc', 'image', 'brand'] as const) {
      const v = at(r, f);
      if (v) d[f] = v;
    }
    drafts.push(d);
  });
  return { drafts, issues };
}

export interface PlannedUpdate { draft: ProductDraft; productId: string; price?: [string, string]; stock?: [number | undefined, number | undefined] }
export interface SimilarMatch { draft: ProductDraft; productId: string; store: string }

export interface ImportPlan {
  store: string;
  create: ProductDraft[];
  update: PlannedUpdate[];
  unchanged: Array<{ draft: ProductDraft; productId: string }>;
  /** new products for which another store has a product with the same barcode: reuse its photo and description? */
  similar: SimilarMatch[];
}

/**
 * Against the catalogue: the same article in the same store → update the price and stock (and only those,
 * the store edits the rest in the card); otherwise a new product. Barcode matches in other stores are suggested.
 */
export function planImport(drafts: ProductDraft[], products: Record<string, Product>, store: string): ImportPlan {
  const mine = new Map<string, Product>();
  const byBarcode = new Map<string, Product>();
  for (const p of Object.values(products)) {
    if (p.store === store && typeof p.sku === 'string' && p.sku) mine.set(skuKey(p.sku), p);
    const bc = typeof p.barcode === 'string' ? p.barcode.trim() : '';
    if (bc && p.store !== store && !byBarcode.has(bc)) byBarcode.set(bc, p);
  }
  const plan: ImportPlan = { store, create: [], update: [], unchanged: [], similar: [] };
  for (const d of drafts) {
    const existing = mine.get(skuKey(d.sku));
    if (existing) {
      const newPrice = formatPrice(d.price);
      const u: PlannedUpdate = { draft: d, productId: existing.id };
      if (parsePrice(existing.price) !== d.price) u.price = [existing.price, newPrice];
      const oldStock = typeof existing.stock === 'number' ? existing.stock : undefined;
      if (d.stock !== undefined && d.stock !== oldStock) u.stock = [oldStock, d.stock];
      if (u.price || u.stock) plan.update.push(u); else plan.unchanged.push({ draft: d, productId: existing.id });
      continue;
    }
    plan.create.push(d);
    const twin = d.barcode ? byBarcode.get(d.barcode.trim()) : undefined;
    if (twin) plan.similar.push({ draft: d, productId: twin.id, store: twin.store });
  }
  return plan;
}

/** A stable id: the same article of the same store always gets the same id (a re-import doesn't duplicate). */
export function importedProductId(store: string, sku: string): string {
  let h = 2166136261;
  for (const ch of `${store}\u0000${skuKey(sku)}`) { h ^= ch.codePointAt(0)!; h = Math.imul(h, 16777619); }
  return `imp-${(h >>> 0).toString(36)}-${skuKey(sku).replace(/[^a-z0-9а-я]+/gi, '').slice(0, 24) || 'x'}`;
}

export interface ApplyOptions {
  /** which «similar» matches were confirmed (by row): their photo and description go to the new product */
  reuse?: Set<number>;
  /** photos by article (already uploaded through MediaStore) */
  photos?: Map<string, string>;
  now?: number;
}

export interface ApplyResult {
  products: Record<string, Product>;
  created: number;
  updated: number;
  /** new products without a photo: saved as drafts, invisible to buyers */
  withoutPhoto: number;
}

/** The catalogue after import (a new object; the original is not changed). */
export function applyImport(plan: ImportPlan, products: Record<string, Product>, opts: ApplyOptions = {}): ApplyResult {
  const out: Record<string, Product> = { ...products };
  const now = opts.now ?? Date.now();
  let withoutPhoto = 0;
  for (const u of plan.update) {
    const p = { ...out[u.productId] };
    if (u.price) p.price = u.price[1];
    if (u.stock) p.stock = u.stock[1];
    p.importedAt = now;
    out[u.productId] = p;
  }
  const similarByRow = new Map(plan.similar.map((s) => [s.draft.row, s]));
  for (const d of plan.create) {
    const id = importedProductId(plan.store, d.sku);
    const twin = opts.reuse?.has(d.row) ? out[similarByRow.get(d.row)?.productId ?? ''] : undefined;
    const image = opts.photos?.get(skuKey(d.sku)) || d.image || (twin?.image as string | undefined) || '';
    const p: Product = {
      id, sku: d.sku, title: d.title, price: formatPrice(d.price), store: plan.store,
      category: (d.category ?? '').toLowerCase(), image,
      status: image ? 'published' : 'draft',
      importedAt: now,
    };
    if (d.oldPrice) { p.oldPrice = formatPrice(d.oldPrice); p.badge = 'sale'; }
    if (d.stock !== undefined) p.stock = d.stock;
    for (const f of ['unit', 'barcode', 'weight', 'brand'] as const) if (d[f]) p[f] = d[f];
    const desc = d.desc || (twin?.description as string | undefined);
    if (desc) p.description = desc;
    if (twin && Array.isArray(twin.images) && !opts.photos?.get(skuKey(d.sku))) p.images = [...(twin.images as string[])];
    if (!image) withoutPhoto++;
    out[id] = p;
  }
  return { products: out, created: plan.create.length, updated: plan.update.length, withoutPhoto };
}

/** Photo file name → article: 'PS-0412.jpg', 'ps-0412_2.png' → 'ps-0412'. */
export function skuFromPhotoName(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? '';
  return skuKey(base.replace(/\.[a-z0-9]+$/i, '').replace(/[_ ](\d{1,2})$/, ''));
}
