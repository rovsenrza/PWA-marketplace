/**
 * From a saved storefront (anything the shop record holds, possibly damaged) to a complete one the screens can
 * trust: a valid theme, a block list with the whole skeleton in it, filters that exist. Nothing here throws on
 * bad data and nothing mutates its input.
 */
import { normalizeHex } from './color';
import { storeKindOf } from './kind';
import { BLOCK_TYPES, REQUIRED_BLOCKS, newBlock, presetBlocks, presetFilters, presetTheme } from './presets';
import type {
  BlockType, CategoryItem, CoverStyle, ProductLike, ShopLike, StoreFilterDef, StoreGround, StoreKind, StoreVoice,
  Storefront, StorefrontBlock, StorefrontTheme,
} from './types';

const GROUNDS: readonly StoreGround[] = ['stock', 'tint', 'black'];
const VOICES: readonly StoreVoice[] = ['industrial', 'modern', 'classic'];
const COVERS: readonly CoverStyle[] = ['split', 'full', 'field'];

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const oneOf = <T extends string>(allowed: readonly T[], v: unknown, fallback: T): T =>
  (allowed as readonly unknown[]).includes(v) ? (v as T) : fallback;

/**
 * A saved block made safe to use: a known type, a string id, a boolean `on`, content arrays that are arrays
 * (and hold only objects). Null when it cannot be a block at all.
 */
export function normalizeBlock(raw: unknown): StorefrontBlock | null {
  if (!isRecord(raw)) return null;
  const type = raw.type as BlockType;
  if (!BLOCK_TYPES.includes(type)) return null;
  const empty = newBlock(type);
  const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id : empty.id;
  const on = raw.on !== false && raw.on !== 'false';
  const block: Record<string, unknown> = { ...empty, ...raw, id, type, on };
  for (const [field, fallback] of Object.entries(empty)) {
    if (Array.isArray(fallback)) block[field] = Array.isArray(raw[field]) ? (raw[field] as unknown[]).filter(isRecord) : [];
  }
  return block as unknown as StorefrontBlock;
}

/** Colours, grounds, voices and covers are repaired one by one, so one bad field doesn't cost the others. */
function resolveTheme(raw: unknown, kind: StoreKind, storeName: string): StorefrontTheme {
  const preset = presetTheme(kind, storeName);
  const saved: Record<string, unknown> = isRecord(raw) ? raw : {};
  return {
    ink: normalizeHex(saved.ink) ?? preset.ink,
    ground: oneOf(GROUNDS, saved.ground, preset.ground),
    voice: oneOf(VOICES, saved.voice, preset.voice),
    cover: oneOf(COVERS, saved.cover, preset.cover),
  };
}

/** Sections of a store's page taken from its own products: one per distinct category, in product order. */
function categoriesOf(products: readonly ProductLike[], storeName: string): CategoryItem[] {
  const seen = new Set<string>();
  const items: CategoryItem[] = [];
  for (const p of Array.isArray(products) ? products : []) {
    if (p.store !== storeName || typeof p.category !== 'string') continue;
    const value = p.category.trim();
    if (!value || seen.has(value.toLowerCase())) continue;
    seen.add(value.toLowerCase());
    items.push({ label: value.charAt(0).toUpperCase() + value.slice(1), key: 'category', value });
  }
  return items;
}

/** The first block keeps its id; later blocks with the same id get -2, -3… and never take an id that is already used. */
function makeIdsUnique(blocks: StorefrontBlock[]): void {
  const taken = new Set(blocks.map((b) => b.id));
  const seen = new Set<string>();
  for (const block of blocks) {
    if (seen.has(block.id)) {
      let n = 2;
      while (taken.has(`${block.id}-${n}`)) n++;
      block.id = `${block.id}-${n}`;
      taken.add(block.id);
    }
    seen.add(block.id);
  }
}

/** A saved block copied, so repairs never reach the shop record; one that can't be copied is dropped. */
function cloneBlock(raw: unknown): unknown[] {
  try { return [structuredClone(raw)]; } catch { return []; }
}

function resolveBlocks(raw: unknown, kind: StoreKind, storeName: string, products: readonly ProductLike[]): StorefrontBlock[] {
  const saved = (Array.isArray(raw) ? (raw as unknown[]) : [])
    .flatMap(cloneBlock)
    .map(normalizeBlock)
    .filter((b): b is StorefrontBlock => b !== null);
  const blocks = saved.length ? saved : presetBlocks(kind);

  for (const type of REQUIRED_BLOCKS) {
    if (!blocks.some((b) => b.type === type)) blocks.push(newBlock(type, `${type}-auto`));
  }
  for (const block of blocks) {
    if (REQUIRED_BLOCKS.includes(block.type)) block.on = true;
  }
  makeIdsUnique(blocks);

  const cover = blocks.findIndex((b) => b.type === 'cover');
  if (cover > 0) blocks.unshift(...blocks.splice(cover, 1));

  for (const block of blocks) {
    if (block.type === 'categories' && !block.items.length) block.items = categoriesOf(products, storeName);
  }
  return blocks;
}

/** Saved definitions that are well-formed, or the preset when none are. */
function resolveFilters(raw: unknown, kind: StoreKind): StoreFilterDef[] {
  const valid = (Array.isArray(raw) ? (raw as unknown[]) : []).flatMap((d): StoreFilterDef[] => {
    if (!isRecord(d) || typeof d.key !== 'string' || typeof d.label !== 'string') return [];
    if (d.type !== 'chips' && d.type !== 'range') return [];
    const def: StoreFilterDef = { key: d.key, label: d.label, type: d.type };
    if (typeof d.unit === 'string' && d.unit) def.unit = d.unit;
    return [def];
  });
  return valid.length ? valid : presetFilters(kind);
}

/**
 * The storefront to show for a shop: what it saved, over the preset of its kind, with the skeleton guaranteed.
 * `products` are only used to derive section tiles that the store left empty.
 */
export function resolveStorefront(shop: ShopLike, products: readonly ProductLike[] = []): Storefront {
  const saved: Record<string, unknown> = isRecord(shop.storefront) ? shop.storefront : {};
  const name = typeof shop.name === 'string' ? shop.name : '';
  const kind = storeKindOf(shop);
  return {
    kind,
    theme: resolveTheme(saved.theme, kind, name),
    blocks: resolveBlocks(saved.blocks, kind, name, products),
    filters: resolveFilters(saved.filters, kind),
    demo: saved.demo === true,
  };
}
