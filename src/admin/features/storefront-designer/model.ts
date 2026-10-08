/**
 * Storefront designer: the editing rules, as functions over the storefront the admin edits (no DOM).
 * The admin works on a resolved storefront (`resolveStorefront`) held in the draft shop and saves it whole;
 * these functions change it in place and keep what the screens rely on: one cover, first; the skeleton
 * (REQUIRED_BLOCKS) present and switched on; unique block ids; no two filters on the same key.
 */
import {
  BLOCK_TYPES, REQUIRED_BLOCKS, applyFilters, buildFacets, newBlock, normalizeHex, presetBlocks, presetFilters, presetTheme,
  productValue, resolveStorefront, toNumber,
} from '../../../shared/storefront';
import type {
  BlockType, CategoriesBlock, CategoryItem, CoverBlock, ProductLike, StoreFilterDef, StoreKind, Storefront, StorefrontBlock,
} from '../../../shared/domain/types';

export const isRequired = (type: BlockType): boolean => REQUIRED_BLOCKS.includes(type);
/** The blocks a store may add, hide and delete, in the order the admin offers them. */
export const OPTIONAL_BLOCKS: readonly BlockType[] = BLOCK_TYPES.filter((t) => !isRequired(t));
/** Optional blocks that make sense more than once on a page (two promos, a second lookbook…). */
export const REPEATABLE_BLOCKS: readonly BlockType[] = ['promo', 'lookbook', 'swatches', 'steps'];
/** The closing blocks of a page; a new block goes in before them. */
const CLOSING: readonly BlockType[] = ['about', 'addresses', 'managers', 'terms'];

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
/** A string with something in it (saved items may hold numbers, objects or nothing in a text field). */
export const filled = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';

/** type-1, type-2…: the first id of this type that no block uses. */
export function nextBlockId(blocks: readonly StorefrontBlock[], type: BlockType): string {
  const taken = new Set(blocks.map((b) => b.id));
  let n = 1;
  while (taken.has(`${type}-${n}`)) n++;
  return `${type}-${n}`;
}

/** Later blocks with an id already in use get the next free id of their type. */
function uniqueIds(blocks: StorefrontBlock[]): void {
  const seen = new Set<string>();
  for (const block of blocks) {
    if (seen.has(block.id)) block.id = nextBlockId(blocks, block.type);
    seen.add(block.id);
  }
}

/**
 * One cover, first, switched on. `resolveStorefront` keeps every cover it finds in saved data; the page shows
 * one, so the first stays and takes over a line, image or title that only a later cover had, and the rest go.
 */
export function keepOneCover(sf: Storefront): void {
  const covers = sf.blocks.filter((b): b is CoverBlock => b.type === 'cover');
  const first: CoverBlock = covers[0] ?? (newBlock('cover', nextBlockId(sf.blocks, 'cover')) as CoverBlock);
  for (const extra of covers.slice(1)) {
    if (!filled(first.line) && filled(extra.line)) first.line = extra.line;
    if (!filled(first.image) && filled(extra.image)) first.image = extra.image;
    if (!filled(first.title) && filled(extra.title)) first.title = extra.title;
  }
  first.on = true;
  sf.blocks = [first, ...sf.blocks.filter((b) => b.type !== 'cover')];
}

const indexOf = (sf: Storefront, id: string) => sf.blocks.findIndex((b) => b.id === id);

/** One step up (-1) or down (+1); the cover never moves and nothing goes above it. */
export function canMoveBlock(sf: Storefront, id: string, delta: -1 | 1): boolean {
  const i = indexOf(sf, id);
  if (i < 0 || sf.blocks[i].type === 'cover') return false;
  const j = i + delta;
  const top = sf.blocks[0]?.type === 'cover' ? 1 : 0;
  return j >= top && j < sf.blocks.length;
}

export function moveBlock(sf: Storefront, id: string, delta: -1 | 1): boolean {
  if (!canMoveBlock(sf, id, delta)) return false;
  const i = indexOf(sf, id);
  const blocks = [...sf.blocks];
  [blocks[i], blocks[i + delta]] = [blocks[i + delta], blocks[i]];
  sf.blocks = blocks;
  return true;
}

/** Shows or hides an optional block; the skeleton stays on whatever is asked. */
export function setBlockOn(sf: Storefront, id: string, on: boolean): boolean {
  const block = sf.blocks[indexOf(sf, id)];
  if (!block || isRequired(block.type)) return false;
  block.on = on;
  return true;
}

/** Deletes an optional block; the skeleton can't be deleted. */
export function removeBlock(sf: Storefront, id: string): boolean {
  const block = sf.blocks[indexOf(sf, id)];
  if (!block || isRequired(block.type)) return false;
  sf.blocks = sf.blocks.filter((b) => b !== block);
  return true;
}

/** An optional block can be added if the page doesn't have one yet, or if that kind of block repeats. */
export function canAddBlock(sf: Storefront, type: BlockType): boolean {
  if (isRequired(type) || !OPTIONAL_BLOCKS.includes(type)) return false;
  return REPEATABLE_BLOCKS.includes(type) || !sf.blocks.some((b) => b.type === type);
}

/** Adds an empty block of an optional type before the page's closing blocks (about, addresses…). */
export function addBlock(sf: Storefront, type: BlockType): StorefrontBlock | null {
  if (!canAddBlock(sf, type)) return null;
  const block = newBlock(type, nextBlockId(sf.blocks, type));
  let at = sf.blocks.length;
  while (at > 1 && CLOSING.includes(sf.blocks[at - 1].type)) at--;
  sf.blocks = [...sf.blocks.slice(0, at), block, ...sf.blocks.slice(at)];
  return block;
}

/** What loading a type's preset would do to this storefront, for the admin to confirm. */
export function presetChanges(sf: Storefront, kind: StoreKind): { blocks: BlockType[]; removed: BlockType[] } {
  const blocks = presetBlocks(kind).map((b) => b.type);
  const removed = [...new Set(sf.blocks.map((b) => b.type))].filter((t) => !blocks.includes(t));
  return { blocks, removed };
}

/**
 * Loads a type's preset: its blocks in its order and its filters; with `withLook`, its ground, voice and cover too.
 * What the store already wrote stays: a preset block whose type the page already has takes that block (texts,
 * photos, items, id). Blocks of types the preset doesn't hold go. The store's ink never changes here.
 */
export function applyPreset(sf: Storefront, kind: StoreKind, storeName: string, withLook: boolean): void {
  const mine = new Map<BlockType, StorefrontBlock[]>();
  for (const b of sf.blocks) mine.set(b.type, [...(mine.get(b.type) ?? []), b]);
  const blocks = presetBlocks(kind).map((fresh) => {
    const kept = mine.get(fresh.type)?.shift();
    if (!kept) return fresh;
    kept.on = true;
    return kept;
  });
  uniqueIds(blocks);
  sf.kind = kind;
  sf.blocks = blocks;
  sf.filters = presetFilters(kind);
  if (withLook) sf.theme = { ...presetTheme(kind, storeName), ink: sf.theme.ink };
}

/** One step up or down in a list (items of a block, filters). */
export function moveItem<T>(list: T[], index: number, delta: -1 | 1): boolean {
  const j = index + delta;
  if (index < 0 || index >= list.length || j < 0 || j >= list.length) return false;
  [list[index], list[j]] = [list[j], list[index]];
  return true;
}

/* ---------------------------------------------------------------------------------------------- categories */

/** The section tiles `resolveStorefront` derives from the store's products when the store set none. */
export function derivedCategories(storeName: string, products: readonly ProductLike[]): CategoryItem[] {
  const sf = resolveStorefront({ name: storeName, storefront: { blocks: [{ id: 'categories-1', type: 'categories', on: true, items: [] }] } }, products);
  const block = sf.blocks.find((b): b is CategoriesBlock => b.type === 'categories');
  return block ? block.items : [];
}

/** How many of these products a section tile leads to: its key and value as a chip selection of the catalogue. */
export function countMatching(products: readonly ProductLike[], key: unknown, value: unknown): number {
  if (!filled(key) || typeof value !== 'string' || !value) return 0;
  return applyFilters(products, [], { [key]: [value] }).length;
}

/** The distinct values these products have under a key, most common first. */
export function valuesOf(products: readonly ProductLike[], key: string): string[] {
  const counts = new Map<string, number>();
  for (const p of products) {
    const v = productValue(p, key);
    if (v !== undefined) counts.set(String(v), (counts.get(String(v)) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ru')).map(([v]) => v);
}

/* ------------------------------------------------------------------------------------------------- filters */

/** A label for a filter key the store didn't name: the built-in keys have Russian names. */
export function keyLabel(key: string): string {
  if (key === 'price') return 'Цена';
  if (key === 'category') return 'Категория товара';
  return key;
}

/**
 * Filter keys these products can offer that the store doesn't filter by yet: their attributes, «Бренд» from an
 * imported brand, the category and the price; the most common first, then by name.
 */
export function attributeKeys(products: readonly ProductLike[], filters: readonly StoreFilterDef[]): string[] {
  const used = new Set(filters.map((f) => f.key));
  const counts = new Map<string, number>();
  const bump = (k: string) => counts.set(k, (counts.get(k) ?? 0) + 1);
  for (const p of products) {
    if (isRecord(p.attrs)) for (const k of Object.keys(p.attrs)) if (k.trim() && productValue(p, k) !== undefined) bump(k);
    if (filled(p.brand) && !(isRecord(p.attrs) && 'Бренд' in p.attrs)) bump('Бренд');
    if (filled(p.category)) bump('category');
    if (productValue(p, 'price') !== undefined) bump('price');
  }
  return [...counts]
    .filter(([k]) => !used.has(k))
    .sort((a, b) => b[1] - a[1] || keyLabel(a[0]).localeCompare(keyLabel(b[0]), 'ru'))
    .map(([k]) => k);
}

/**
 * A first definition for a key: «Ширина, см» → label «Ширина», unit «см»; numbers with five or more different
 * values become a range, anything else a list of chips.
 */
export function suggestFilter(rawKey: string, products: readonly ProductLike[]): StoreFilterDef {
  const key = rawKey.trim();
  if (key === 'price') return { key, label: 'Цена', type: 'range', unit: '₽' };
  if (key === 'category') return { key, label: 'Категория', type: 'chips' };
  const m = /^(.*\S)\s*,\s*([^\s,]{1,10})$/.exec(key);
  const label = m ? m[1] : key;
  const values = products.map((p) => productValue(p, key)).filter((v): v is string | number => v !== undefined);
  const numeric = values.length > 0 && values.every((v) => toNumber(v) !== null);
  const type = numeric && new Set(values.map(String)).size >= 5 ? 'range' : 'chips';
  return m ? { key, label, type, unit: m[2] } : { key, label, type };
}

/** Adds a filter (before the price, which stays last); refused for an empty key or one already used. */
export function addFilter(sf: Storefront, def: StoreFilterDef): boolean {
  const key = def.key.trim();
  if (!key || sf.filters.some((f) => f.key === key)) return false;
  const item = { ...def, key };
  const last = sf.filters.length - 1;
  sf.filters = last >= 0 && sf.filters[last].key === 'price' && key !== 'price'
    ? [...sf.filters.slice(0, last), item, sf.filters[last]]
    : [...sf.filters, item];
  return true;
}

/** The shop editor's old per-store filters (`shop.filters[{ name, type, vals }]`) that can become filter defs. */
export function oldFilterDefs(old: unknown): StoreFilterDef[] {
  if (!Array.isArray(old)) return [];
  return old.flatMap((f): StoreFilterDef[] => {
    if (!isRecord(f) || !filled(f.name)) return [];
    return [{ key: f.name.trim(), label: f.name.trim(), type: f.type === 'Диапазон' ? 'range' : 'chips' }];
  });
}

/** Moves the old filters into the storefront's; returns how many were added (keys already used are skipped). */
export function migrateOldFilters(sf: Storefront, old: unknown): number {
  return oldFilterDefs(old).filter((def) => addFilter(sf, def)).length;
}

export type FacetPreview =
  | { shown: true; type: 'chips'; values: { value: string; count: number }[] }
  | { shown: true; type: 'range'; min: number; max: number }
  | { shown: false; reason: string };

/** What the buyer will see for this filter on these products, or why it won't be offered. */
export function facetPreview(def: StoreFilterDef, products: readonly ProductLike[]): FacetPreview {
  const [facet] = buildFacets(products, [def]);
  if (facet?.type === 'chips') return { shown: true, type: 'chips', values: facet.values };
  if (facet?.type === 'range') return { shown: true, type: 'range', min: facet.min, max: facet.max };
  const name = keyLabel(def.key);
  if (!products.length) return { shown: false, reason: 'Не покажется: у магазина нет опубликованных товаров' };
  const values = products.map((p) => productValue(p, def.key)).filter((v): v is string | number => v !== undefined);
  if (!values.length) return { shown: false, reason: `Не покажется: у товаров нет значения «${name}»` };
  if (def.type === 'range') {
    const nums = values.map(toNumber).filter((n): n is number => n !== null);
    if (!nums.length) return { shown: false, reason: `Не покажется: «${name}» у товаров не числа — выберите «Список»` };
    return { shown: false, reason: `Не покажется: у всех товаров одно значение — ${String(nums[0]).replace('.', ',')}` };
  }
  return { shown: false, reason: `Не покажется: у всех товаров одно значение — «${String(values[0])}»` };
}

/* -------------------------------------------------------------------------------------------------- saving */

const clampPct = (v: unknown): number => {
  const n = toNumber(v);
  return n === null ? 50 : Math.round(Math.min(100, Math.max(0, n)) * 10) / 10;
};

/**
 * The storefront as it is saved: one cover, the skeleton on, no blank items, lookbook pins inside the photo, filters
 * with a label, the ink in #RRGGBB. Section tiles the store never changed are saved empty, so they keep following
 * its products (`isDerived` says which those are).
 */
export function finalizeStorefront(sf: Storefront, isDerived: (block: CategoriesBlock) => boolean = () => false): void {
  keepOneCover(sf);
  for (const block of sf.blocks) {
    if (isRequired(block.type)) block.on = true;
    if ('items' in block && Array.isArray(block.items)) {
      /* an item left blank (a step, a swatch or a tile without a word in it) is not saved */
      (block as { items: unknown[] }).items = block.items.filter((item) => isRecord(item) && Object.entries(item).some(([k, v]) => k !== 'key' && filled(v)));
    }
    if (block.type === 'categories' && isDerived(block)) block.items = [];
    if (block.type === 'lookbook') {
      block.pins = block.pins.filter(isRecord).map((pin) => ({ ...pin, x: clampPct(pin.x), y: clampPct(pin.y), productId: filled(pin.productId) ? pin.productId : '' }));
    }
  }
  sf.filters = sf.filters.map((f) => ({ ...f, label: filled(f.label) ? f.label : keyLabel(f.key) }));
  sf.theme.ink = normalizeHex(sf.theme.ink) ?? sf.theme.ink;
}
