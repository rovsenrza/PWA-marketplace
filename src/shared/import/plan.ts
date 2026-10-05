/** Rows → drafts with errors → a plan against the catalogue → the catalogue after import. */
import type { Product } from '../domain/types';
import { formatPrice, parsePrice } from '../format/price';
import type { ImportField, ImportTable, ProductDraft, RowIssue } from './types';
import { isPhotoUrl, type PhotoTarget } from './photos';

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
    for (const f of ['unit', 'category', 'barcode', 'weight', 'desc', 'brand'] as const) {
      const v = at(r, f);
      if (v) d[f] = v;
    }
    /* ссылка — это фото; имя файла или путь (CommerceML: «import_files/…») — фото из архива, его ещё загрузят */
    const image = at(r, 'image');
    if (image) { if (isPhotoUrl(image)) d.image = image; else d.photoRef = image; }
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

/**
 * Products of this import that will have no photo: new ones without a link and without a confirmed twin
 * with a photo, and the store's existing products without one. Photos are matched against these.
 */
export function photoTargets(plan: ImportPlan, products: Record<string, Product>, reuse: Set<number> = new Set()): PhotoTarget[] {
  const twinOf = new Map(plan.similar.map((s) => [s.draft.row, s.productId]));
  const out: PhotoTarget[] = [];
  const add = (d: ProductDraft) => out.push(d.photoRef ? { sku: d.sku, photoRef: d.photoRef } : { sku: d.sku });
  for (const d of plan.create) {
    const twin = reuse.has(d.row) ? products[twinOf.get(d.row) ?? ''] : undefined;
    if (!d.image && !twin?.image) add(d);
  }
  for (const u of [...plan.update, ...plan.unchanged]) if (!products[u.productId]?.image) add(u.draft);
  return out;
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
  /** photos by article in lower case, the main one first (already uploaded through MediaStore) */
  photos?: Map<string, string[]>;
  now?: number;
}

export interface ApplyResult {
  products: Record<string, Product>;
  created: number;
  updated: number;
  /** new products without a photo: saved as drafts, invisible to buyers */
  withoutPhoto: number;
  /** visible to buyers after the import: new ones with a photo and drafts of earlier imports that got one */
  published: number;
  /** existing products of the store that got photos */
  photosAttached: number;
}

/** The catalogue after import (a new object; the original is not changed). */
export function applyImport(plan: ImportPlan, products: Record<string, Product>, opts: ApplyOptions = {}): ApplyResult {
  const out: Record<string, Product> = { ...products };
  const now = opts.now ?? Date.now();
  const photosOf = (sku: string) => opts.photos?.get(skuKey(sku)) ?? [];
  let withoutPhoto = 0;
  let published = 0;
  let photosAttached = 0;
  const existing: PlannedUpdate[] = [...plan.update, ...plan.unchanged];
  for (const u of existing) {
    const before = out[u.productId];
    if (!before) continue; // товар удалили в другой вкладке, пока шёл импорт
    const photos = before.image ? [] : photosOf(u.draft.sku);
    if (!u.price && !u.stock && !photos.length) continue;
    const p = { ...before };
    if (u.price) p.price = u.price[1];
    if (u.stock) p.stock = u.stock[1];
    /* фото к товару без фото; черновик прошлой загрузки («Нет фото») теперь виден покупателям */
    if (photos.length) {
      p.image = photos[0];
      if (photos.length > 1) p.images = [...photos];
      photosAttached++;
      if (p.status === 'draft' && p.importedAt) { p.status = 'published'; published++; }
    }
    p.importedAt = now;
    out[u.productId] = p;
  }
  const similarByRow = new Map(plan.similar.map((s) => [s.draft.row, s]));
  for (const d of plan.create) {
    const id = importedProductId(plan.store, d.sku);
    const twin = opts.reuse?.has(d.row) ? out[similarByRow.get(d.row)?.productId ?? ''] : undefined;
    const photos = photosOf(d.sku);
    const image = photos[0] || d.image || (twin?.image as string | undefined) || '';
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
    if (photos.length > 1) p.images = [...photos];
    else if (!photos.length && twin && Array.isArray(twin.images)) p.images = [...(twin.images as string[])];
    if (image) published++; else withoutPhoto++;
    out[id] = p;
  }
  return { products: out, created: plan.create.length, updated: plan.update.length, withoutPhoto, published, photosAttached };
}
