/**
 * Admin: the storefront designer inside the shop editor (tabs «Оформление», «Блоки», «Фильтры»).
 * The legacy editor (admin.js) owns the draft shop and the tabs; for these three tab ids it asks
 * `renderStorefrontTab` for the body, and `saveShop` calls `prepareStorefrontForSave` before `DB_save`.
 *
 * The designer edits `draft.storefront` in place, starting from `resolveStorefront(shop, products)`: a store
 * without a saved storefront shows its preset. Until the admin changes something, the draft keeps following
 * the shop (a new category picks a new type) and saving leaves the shop's storefront as it was; once changed,
 * the whole resolved storefront is saved.
 */
import './designer.css';
import type { CatalogStore } from '../../../shared/data/catalog-store';
import type {
  CategoriesBlock, LookbookBlock, Product, SavedStorefront, Shop, StoreFilterDef, Storefront, StorefrontBlock,
} from '../../../shared/domain/types';
import { BLOCK_LABELS, KIND_LABELS, isStoreKind, normalizeHex, resolveStorefront, onInk } from '../../../shared/storefront';
import { registerActions } from '../../../shared/ui/actions';
import type { SafeHtml } from '../../../shared/ui/html';
import {
  addBlock, addFilter, applyPreset, canMoveBlock, derivedCategories, filled, finalizeStorefront, keepOneCover, migrateOldFilters,
  moveBlock, moveItem, removeBlock, setBlockOn, suggestFilter,
} from './model';
import { coverPreview } from './preview';
import {
  DESIGNER_TABS, facetLine, inkNote, lookStage, renderTab, summary, swatchChip, tileCount, type Ctx, type DesignerTab, type DesignerUi,
} from './render';

declare global {
  interface Window {
    /* shop editor in src/admin/legacy/admin.js (move to src/shared/legacy/globals.d.ts at integration) */
    setShopTab?: (tab: string) => void;
    renderStorefrontTab?: (tab: string, shop: Shop, key: string | null) => string;
    prepareStorefrontForSave?: (shop: Shop) => void;
    storeInkOf?: (shop: Shop) => { ink: string; on: string };
  }
}

export interface DesignerDeps { catalog: CatalogStore }
let deps: DesignerDeps;

const freshUi = (): DesignerUi => ({ open: null, adding: false, kindOffer: null, offerLook: true, hex: '', hexError: false, customKey: '' });

/* the draft on screen and the designer's own state for it; a new draft starts clean */
let draft: Shop | null = null;
let draftKey: string | null = null;
let tab: DesignerTab = 'design';
let ui: DesignerUi = freshUi();

/** drafts whose storefront the admin changed: saved whole */
const touched = new WeakSet<Shop>();
/** what each draft held under `storefront` before the designer resolved it */
const before = new WeakMap<Shop, unknown>();
/** section tiles derived from the products, as JSON at the time: unchanged ones are saved empty and stay derived */
const derived = new WeakMap<CategoriesBlock, string>();

const isTab = (t: string): t is DesignerTab => (DESIGNER_TABS as readonly string[]).includes(t);
const sfOf = (shop: Shop) => shop.storefront as unknown as Storefront;
const toast = (msg: string) => window.toast?.(msg);

/** The store's products (the saved name and the draft's name, for a shop being renamed), under the draft's name. */
function storeProducts(shop: Shop, key: string | null): Product[] {
  const names = new Set([key, shop.name].filter(filled));
  return Object.values(deps.catalog.state.products)
    .filter((p) => p && typeof p === 'object' && names.has(p.store))
    .map((p) => (p.store === shop.name ? p : { ...p, store: shop.name }));
}

/** Fills empty section tiles from the products (the app does the same) and remembers them as derived. */
function fillDerived(sf: Storefront, shop: Shop, products: Product[]): void {
  const auto = derivedCategories(str(shop.name), products);
  const json = JSON.stringify(auto);
  for (const b of sf.blocks) {
    if (b.type !== 'categories') continue;
    if (!b.items.length) b.items = structuredClone(auto);
    if (JSON.stringify(b.items) === json) derived.set(b, json);
  }
}

const str = (v: unknown) => (typeof v === 'string' ? v : '');

/** The draft's storefront: resolved afresh while untouched (it follows the shop's name and category). */
function ensure(shop: Shop, key: string | null): Storefront {
  if (!before.has(shop)) before.set(shop, shop.storefront);
  if (!touched.has(shop)) {
    const products = storeProducts(shop, key);
    const sf = resolveStorefront({ ...shop, storefront: before.get(shop) as SavedStorefront | undefined }, products);
    keepOneCover(sf);
    fillDerived(sf, shop, products);
    shop.storefront = sf as unknown as SavedStorefront;
  }
  return sfOf(shop);
}

function context(shop: Shop, key: string | null): Ctx {
  const sf = ensure(shop, key);
  const products = storeProducts(shop, key);
  const saved = before.get(shop) as { kind?: unknown } | undefined;
  return {
    shop, key, sf, products, ui,
    published: products.filter((p) => p.status === 'published'),
    kindFromCategory: !touched.has(shop) && !isStoreKind(saved?.kind),
    derived: (b) => derived.get(b) === JSON.stringify(b.items),
  };
}

/** For admin.js renderShopTab: the body of a designer tab for this draft. */
export function renderStorefrontTab(tabId: string, shop: Shop, key: string | null): string {
  if (shop !== draft) { draft = shop; draftKey = key; ui = freshUi(); }
  tab = isTab(tabId) ? tabId : 'design';
  const ctx = context(shop, key);
  if (!ui.hexError) ui.hex = ctx.sf.theme.ink;
  return renderTab(tab, ctx).value;
}

/** For admin.js saveShop, right before the shop is stored. */
export function prepareStorefrontForSave(shop: Shop): void {
  if (!before.has(shop)) return; // the designer never opened: the draft keeps what it had
  if (!touched.has(shop)) {
    const saved = before.get(shop);
    if (saved === undefined) delete shop.storefront; else shop.storefront = saved as SavedStorefront;
    return;
  }
  finalizeStorefront(sfOf(shop), (b) => derived.get(b) === JSON.stringify(b.items));
}

/** The ink a shop shows (its saved one, else its stable family ink) and the text colour on it. */
export function storeInkOf(shop: Shop): { ink: string; on: string } {
  const ink = resolveStorefront(shop).theme.ink;
  return { ink, on: onInk(ink) };
}

/* ------------------------------------------------------------------------------------------------- redraw */

function current(): { shop: Shop; sf: Storefront } | null {
  if (!draft || !document.querySelector('#shop-body [data-sfd]')) return null;
  return { shop: draft, sf: sfOf(draft) };
}

function touch(): void { if (draft) touched.add(draft); }

/** Redraws the open tab and puts focus back on the same control (or on `focusKey`). */
function refresh(focusKey?: string): void {
  const body = document.getElementById('shop-body');
  if (!body || !draft || !body.querySelector('[data-sfd]')) return;
  const active = document.activeElement as HTMLElement | null;
  const key = focusKey ?? (active && body.contains(active) ? active.dataset.focus : undefined);
  body.innerHTML = renderStorefrontTab(tab, draft, draftKey);
  if (!key) return;
  const el = body.querySelector<HTMLElement>(`[data-focus="${CSS.escape(key)}"]`);
  if (el && !(el as HTMLButtonElement).disabled) { el.focus({ preventScroll: true }); el.scrollIntoView({ block: 'nearest' }); }
}

/** Redraws one marked region (a preview, a count, a note) without touching the fields around it. */
function patch(region: string, render: (ctx: Ctx) => SafeHtml | string): void {
  if (!draft) return;
  const ctx = context(draft, draftKey);
  document.querySelectorAll<HTMLElement>(`#shop-body [data-region="${CSS.escape(region)}"]`).forEach((el) => {
    const out = render(ctx);
    el.innerHTML = typeof out === 'string' ? out : out.value;
  });
}

const patchPreview = () => patch('preview', (ctx) => coverPreview(ctx.shop, ctx.sf, ctx.published, { compact: tab === 'blocks' }));

/** The ink changed: swatches, picker, note and preview follow (the hex field too, unless it is being typed in). */
function patchInk(fromHexField: boolean): void {
  const s = current();
  if (!s) return;
  const ink = s.sf.theme.ink;
  document.querySelectorAll<HTMLElement>('#shop-body [data-action="sf-ink"]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ink === ink)));
  const picker = document.querySelector<HTMLInputElement>('#shop-body [data-sf="ink-picker"]');
  if (picker) picker.value = ink.toLowerCase();
  document.querySelector<HTMLElement>('#shop-body [data-ink-chip]')?.style.setProperty('--sw', ink);
  const hex = document.querySelector<HTMLInputElement>('#shop-body [data-sf="hex"]');
  if (hex) {
    if (!fromHexField) hex.value = ink;
    setInvalid(hex, ui.hexError);
  }
  patch('ink-note', inkNote);
  patchPreview();
}

function setInvalid(el: HTMLElement, invalid: boolean): void {
  if (invalid) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
}

const timers = new Map<string, number>();
/** Runs once typing pauses (a photo is fetched for the address typed, not for every letter of it). */
function later(key: string, fn: () => void): void {
  clearTimeout(timers.get(key));
  timers.set(key, window.setTimeout(fn, 350));
}

/** A photo field changed: its thumbnail follows once typing pauses. */
function patchThumb(key: string, src: string): void {
  later(`thumb:${key}`, () => {
    document.querySelectorAll<HTMLElement>(`#shop-body [data-thumb="${CSS.escape(key)}"]`).forEach((el) => {
      el.replaceChildren();
      if (!src.trim()) return;
      const img = document.createElement('img');
      img.alt = '';
      img.dataset.sfdImg = '';
      img.src = src.trim();
      el.append(img);
    });
  });
}

/* ------------------------------------------------------------------------------------------------- editing */

const blockById = (sf: Storefront, id: string | undefined) => sf.blocks.find((b) => b.id === id);
/** Optional text fields are dropped when emptied (the default shows); required ones keep ''. */
function setText(target: Record<string, unknown>, prop: string, value: string, optional: boolean): void {
  if (optional && !value.trim()) delete target[prop]; else target[prop] = value;
}

/** Fields a block's panel may write, by block type ('title' everywhere). */
const BLOCK_FIELDS: Partial<Record<StorefrontBlock['type'], string[]>> = {
  cover: ['line', 'image'], lookbook: ['image', 'text'], promo: ['text', 'sticker', 'image', 'productId'], about: ['text'],
};
const ITEM_FIELDS: Partial<Record<StorefrontBlock['type'], string[]>> = {
  categories: ['label', 'key', 'value', 'image'], steps: ['title', 'text'], swatches: ['name', 'color', 'image', 'note'],
};
/** Item fields an item must have (the rest are optional and dropped when emptied). */
const REQUIRED_ITEM_FIELDS = new Set(['label', 'key', 'value', 'title', 'text', 'name']);

function editBlockField(sf: Storefront, el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): void {
  const b = blockById(sf, el.dataset.id);
  const prop = el.dataset.prop ?? '';
  if (!b || !(prop === 'title' || BLOCK_FIELDS[b.type]?.includes(prop))) return;
  setText(b as unknown as Record<string, unknown>, prop, el.value, !(b.type === 'promo' && prop === 'text'));
  touch();
  patch(`sum:${b.id}`, (ctx) => summary(ctx, b));
  if (b.type === 'cover') patchPreview();
  if (el.dataset.thumbFor) patchThumb(el.dataset.thumbFor, el.value);
  if (b.type === 'lookbook' && prop === 'image') later(`stage:${b.id}`, () => patch(`stage:${b.id}`, () => lookStage(b)));
}

function itemOf(sf: Storefront, el: HTMLElement): { b: StorefrontBlock; item: Record<string, unknown>; i: number } | null {
  const b = blockById(sf, el.dataset.id);
  const i = Number(el.dataset.index);
  const list = b && 'items' in b && Array.isArray(b.items) ? (b.items as unknown as Record<string, unknown>[]) : null;
  if (!b || !list || !Number.isInteger(i) || !list[i]) return null;
  return { b, item: list[i], i };
}

function editItemField(sf: Storefront, el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): void {
  const found = itemOf(sf, el);
  const prop = el.dataset.prop ?? '';
  if (!found || !ITEM_FIELDS[found.b.type]?.includes(prop)) return;
  const { b, item, i } = found;
  setText(item, prop, el.value, !REQUIRED_ITEM_FIELDS.has(prop));
  touch();
  patch(`sum:${b.id}`, (ctx) => summary(ctx, b));
  if (b.type === 'categories' && (prop === 'key' || prop === 'value')) patch(`count:${b.id}:${i}`, (ctx) => tileCount(ctx, item.key ?? 'category', item.value));
  if (b.type === 'swatches' && (prop === 'color' || prop === 'image')) {
    patch(`sw:${b.id}:${i}`, () => swatchChip(item));
    if (prop === 'color') setInvalid(el, !!el.value.trim() && !normalizeHex(el.value));
  }
  if (el.dataset.thumbFor) patchThumb(el.dataset.thumbFor, el.value);
}

function editPin(sf: Storefront, el: HTMLInputElement | HTMLSelectElement, committed: boolean): void {
  const b = blockById(sf, el.dataset.id);
  const i = Number(el.dataset.index);
  if (!b || b.type !== 'lookbook' || !b.pins[i]) return;
  const pin = b.pins[i] as unknown as Record<string, unknown>;
  const prop = el.dataset.prop;
  if (prop === 'productId') pin.productId = el.value;
  else if (prop === 'x' || prop === 'y') {
    const n = Number.parseFloat(el.value.replace(',', '.'));
    if (!Number.isFinite(n)) return;
    const v = Math.min(100, Math.max(0, n));
    pin[prop] = v;
    if (committed && String(v) !== el.value) el.value = String(v);
    const marker = document.querySelector<HTMLElement>(`#shop-body [data-pin="${CSS.escape(`${b.id}:${i}`)}"]`);
    marker?.style.setProperty(prop === 'x' ? 'left' : 'top', `${v}%`);
  } else return;
  touch();
}

function editFilter(sf: Storefront, el: HTMLInputElement): void {
  const i = Number(el.dataset.index);
  const f = sf.filters[i];
  const prop = el.dataset.prop;
  if (!f || (prop !== 'label' && prop !== 'unit')) return;
  const next: StoreFilterDef = { ...f };
  if (prop === 'label') next.label = el.value;
  else if (el.value.trim()) next.unit = el.value; else delete next.unit;
  sf.filters[i] = next;
  touch();
  if (prop === 'unit') patch(`facet:${i}`, (ctx) => facetLine(ctx, next));
}

function setInkFromText(sf: Storefront, value: string, committed: boolean): void {
  ui.hex = value;
  const complete = /^\s*#?[0-9a-f]{6}\s*$/i.test(value);
  const hex = complete || committed ? normalizeHex(value) : null;
  if (hex) {
    sf.theme.ink = hex;
    ui.hexError = false;
    touch();
    if (committed) ui.hex = hex;
    patchInk(!committed);
    return;
  }
  ui.hexError = committed && value.trim() !== '';
  if (committed && !value.trim()) ui.hex = sf.theme.ink;
  patchInk(!committed || ui.hexError);
}

function onInput(e: Event): void {
  const el = e.target as HTMLInputElement | HTMLTextAreaElement;
  if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) || el.type === 'checkbox') return;
  const s = current();
  if (!s || !el.closest('[data-sfd]')) return;
  switch (el.dataset.sf) {
    case 'hex': return setInkFromText(s.sf, el.value, false);
    case 'ink-picker': {
      const hex = normalizeHex(el.value);
      if (!hex) return;
      s.sf.theme.ink = hex; ui.hex = hex; ui.hexError = false;
      touch();
      return patchInk(false);
    }
    case 'block': return editBlockField(s.sf, el);
    case 'item': return editItemField(s.sf, el);
    case 'pin': return editPin(s.sf, el as HTMLInputElement, false);
    case 'filter': return editFilter(s.sf, el as HTMLInputElement);
    case 'gallery': {
      const i = Number(el.dataset.index);
      if (Array.isArray(s.shop.gallery) && Number.isInteger(i) && i < s.shop.gallery.length) {
        (s.shop.gallery as unknown[])[i] = el.value;
        if (el.dataset.thumbFor) patchThumb(el.dataset.thumbFor, el.value);
      }
      return;
    }
    case 'custom-key': ui.customKey = el.value; return;
  }
}

function onChange(e: Event): void {
  const el = e.target as HTMLInputElement | HTMLSelectElement;
  const s = current();
  if (!s || !el.closest?.('[data-sfd]')) return;
  const sf = s.sf;
  switch (el.dataset.sf) {
    case 'hex': return setInkFromText(sf, el.value, true);
    case 'block-on': {
      if (setBlockOn(sf, el.dataset.id ?? '', (el as HTMLInputElement).checked)) touch();
      return refresh();
    }
    case 'example': {
      const b = blockById(sf, el.dataset.id);
      if (!b) return;
      if ((el as HTMLInputElement).checked) b.example = true; else delete b.example;
      touch();
      return refresh();
    }
    case 'offer-look': ui.offerLook = (el as HTMLInputElement).checked; return;
    case 'pin': return editPin(sf, el, true);
    case 'block': if (el instanceof HTMLSelectElement) editBlockField(sf, el); return;
    case 'item': if (el instanceof HTMLSelectElement) { editItemField(sf, el); refresh(); } return;
  }
}

/* ------------------------------------------------------------------------------------------------- actions */

/** A handler that runs only while a designer tab is on screen, with the draft and its storefront. */
const act = (fn: (el: HTMLElement, s: { shop: Shop; sf: Storefront }, e: MouseEvent) => void) => (el: HTMLElement, e: MouseEvent) => {
  const s = current();
  if (s) fn(el, s, e);
};

const hasContent = (b: StorefrontBlock): boolean => {
  const r = b as unknown as Record<string, unknown>;
  return ['line', 'image', 'text', 'sticker', 'title'].some((k) => filled(r[k])) || (Array.isArray(r.items) && r.items.length > 0) || (Array.isArray(r.pins) && r.pins.length > 0);
};

function newItem(type: StorefrontBlock['type']): Record<string, unknown> | null {
  if (type === 'categories') return { label: '', key: 'category', value: '' };
  if (type === 'steps') return { title: '', text: '' };
  if (type === 'swatches') return { name: '' };
  return null;
}

/** Where a new item's first field is, to put the cursor there. */
const firstField = (b: StorefrontBlock, i: number) => `item:${b.id}:${i}:${b.type === 'swatches' ? 'name' : b.type === 'steps' ? 'title' : 'label'}`;

function initActions(): void {
  registerActions({
    'sf-kind': act((el, { sf }) => {
      const kind = el.dataset.kind;
      if (!isStoreKind(kind) || kind === sf.kind) return;
      sf.kind = kind;
      ui.kindOffer = kind;
      ui.offerLook = true;
      touch();
      refresh('kind-apply');
    }),
    'sf-kind-apply': act((_el, { shop, sf }) => {
      const kind = ui.kindOffer;
      if (!kind) return;
      applyPreset(sf, kind, str(shop.name), ui.offerLook);
      fillDerived(sf, shop, storeProducts(shop, draftKey));
      ui.kindOffer = null;
      ui.open = null;
      touch();
      refresh(`kind:${kind}`);
      toast(`Загружен набор типа «${KIND_LABELS[kind]}»`);
    }),
    'sf-kind-dismiss': act(() => { ui.kindOffer = null; refresh(`kind:${draft ? sfOf(draft).kind : ''}`); }),
    'sf-ink': act((el, { sf }) => {
      const hex = normalizeHex(el.dataset.ink);
      if (!hex) return;
      sf.theme.ink = hex; ui.hex = hex; ui.hexError = false;
      touch();
      patchInk(false);
    }),
    'sf-ground': act((el, { sf }) => { const v = el.dataset.value; if (v === 'stock' || v === 'tint' || v === 'black') { sf.theme.ground = v; touch(); refresh(); } }),
    'sf-voice': act((el, { sf }) => { const v = el.dataset.value; if (v === 'industrial' || v === 'modern' || v === 'classic') { sf.theme.voice = v; touch(); refresh(); } }),
    'sf-cover': act((el, { sf }) => { const v = el.dataset.value; if (v === 'split' || v === 'full' || v === 'field') { sf.theme.cover = v; touch(); refresh(); } }),

    'sf-block-move': act((el, { sf }) => {
      const id = el.dataset.id ?? '';
      const dir = el.dataset.dir === '1' ? 1 : -1;
      if (!moveBlock(sf, id, dir)) return;
      touch();
      /* focus stays on the pressed key; at the top or bottom it is disabled, so the opposite key takes it */
      const towards = canMoveBlock(sf, id, dir) ? dir : -dir;
      refresh(`${towards < 0 ? 'up' : 'down'}:${id}`);
    }),
    'sf-block-edit': act((el) => {
      const id = el.dataset.id ?? '';
      ui.open = ui.open === id ? null : id;
      refresh(`edit:${id}`);
      if (ui.open) document.querySelector(`#shop-body [data-block="${CSS.escape(id)}"]`)?.scrollIntoView({ block: 'nearest' });
    }),
    'sf-block-delete': act((el, { sf }) => {
      const b = blockById(sf, el.dataset.id);
      if (!b) return;
      if (hasContent(b) && !window.confirm(`Удалить блок «${BLOCK_LABELS[b.type]}» вместе с его содержимым?`)) return;
      if (!removeBlock(sf, b.id)) return;
      if (ui.open === b.id) ui.open = null;
      touch();
      refresh('add-toggle');
      toast(`Блок «${BLOCK_LABELS[b.type]}» удалён`);
    }),
    'sf-add-toggle': act(() => { ui.adding = !ui.adding; refresh('add-toggle'); }),
    'sf-block-add': act((el, { shop, sf }) => {
      const type = el.dataset.type as StorefrontBlock['type'];
      const b = addBlock(sf, type);
      if (!b) return;
      if (b.type === 'categories') fillDerived(sf, shop, storeProducts(shop, draftKey));
      ui.adding = false;
      ui.open = b.id;
      touch();
      refresh(`edit:${b.id}`);
      document.querySelector(`#shop-body [data-block="${CSS.escape(b.id)}"]`)?.scrollIntoView({ block: 'center' });
    }),

    'sf-item-add': act((el, { sf }) => {
      const b = blockById(sf, el.dataset.id);
      const item = b && newItem(b.type);
      if (!b || !item || !('items' in b)) return;
      (b.items as unknown[]).push(item);
      touch();
      refresh(firstField(b, b.items.length - 1));
    }),
    'sf-item-move': act((el, { sf }) => {
      const b = blockById(sf, el.dataset.id);
      const i = Number(el.dataset.index);
      const dir = el.dataset.dir === '1' ? 1 : -1;
      if (!b || !('items' in b) || !moveItem(b.items as unknown[], i, dir)) return;
      touch();
      const j = i + dir;
      const n = b.items.length;
      refresh(dir < 0 ? (j === 0 ? `idown:${b.id}:${j}` : `iup:${b.id}:${j}`) : (j === n - 1 ? `iup:${b.id}:${j}` : `idown:${b.id}:${j}`));
    }),
    'sf-item-delete': act((el, { sf }) => {
      const b = blockById(sf, el.dataset.id);
      const i = Number(el.dataset.index);
      if (!b || !('items' in b) || !b.items[i]) return;
      (b.items as unknown[]).splice(i, 1);
      touch();
      refresh(`iadd:${b.id}`);
    }),
    'sf-cats-derive': act((el, { shop, sf }) => {
      const b = blockById(sf, el.dataset.id);
      if (!b || b.type !== 'categories') return;
      b.items = [];
      fillDerived(sf, shop, storeProducts(shop, draftKey));
      touch();
      refresh(`iadd:${b.id}`);
    }),

    'sf-pin-add': act((el, { sf }, e) => {
      const b = blockById(sf, el.dataset.id) as LookbookBlock | undefined;
      if (!b || b.type !== 'lookbook') return;
      if (!filled(b.image)) { toast('Сначала добавьте фото интерьера'); return; }
      let x = 50, y = 50;
      if (!el.dataset.center) {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        x = Math.round(((e.clientX - r.left) / r.width) * 1000) / 10;
        y = Math.round(((e.clientY - r.top) / r.height) * 1000) / 10;
      }
      b.pins.push({ x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)), productId: '' });
      touch();
      refresh(`pin:${b.id}:${b.pins.length - 1}:productId`);
    }),
    'sf-pin-delete': act((el, { sf }) => {
      const b = blockById(sf, el.dataset.id);
      const i = Number(el.dataset.index);
      if (!b || b.type !== 'lookbook' || !b.pins[i]) return;
      b.pins.splice(i, 1);
      touch();
      refresh(`padd:${b.id}`);
    }),

    'sf-gallery-add': act((_el, { shop }) => {
      shop.gallery = [...(Array.isArray(shop.gallery) ? shop.gallery : []), ''];
      refresh(`gallery::${(shop.gallery as unknown[]).length - 1}:src`);
    }),
    'sf-gallery-move': act((el, { shop }) => {
      const i = Number(el.dataset.index);
      const dir = el.dataset.dir === '1' ? 1 : -1;
      if (!Array.isArray(shop.gallery) || !moveItem(shop.gallery as unknown[], i, dir)) return;
      refresh(`${dir < 0 ? 'gup' : 'gdown'}:${i + dir}`);
    }),
    'sf-gallery-delete': act((el, { shop }) => {
      const i = Number(el.dataset.index);
      if (!Array.isArray(shop.gallery)) return;
      (shop.gallery as unknown[]).splice(i, 1);
      refresh('gadd');
    }),
    'sf-goto-tab': (el) => window.setShopTab?.(el.dataset.tab ?? 'main'),

    'sf-filter-type': act((el, { sf }) => {
      const i = Number(el.dataset.index);
      const v = el.dataset.value;
      if (!sf.filters[i] || (v !== 'chips' && v !== 'range')) return;
      sf.filters[i] = { ...sf.filters[i], type: v };
      touch();
      refresh();
    }),
    'sf-filter-move': act((el, { sf }) => {
      const i = Number(el.dataset.index);
      const dir = el.dataset.dir === '1' ? 1 : -1;
      if (!moveItem(sf.filters, i, dir)) return;
      touch();
      const j = i + dir;
      refresh(dir < 0 ? (j === 0 ? `fdown:${j}` : `fup:${j}`) : (j === sf.filters.length - 1 ? `fup:${j}` : `fdown:${j}`));
    }),
    'sf-filter-delete': act((el, { sf }) => {
      const i = Number(el.dataset.index);
      const f = sf.filters[i];
      if (!f) return;
      sf.filters = sf.filters.filter((_, j) => j !== i);
      touch();
      refresh('custom-key');
      toast(`Фильтр «${f.label}» убран`);
    }),
    'sf-filter-add': act((el, { shop, sf }) => {
      const key = el.dataset.key ?? '';
      if (!addFilter(sf, suggestFilter(key, storeProducts(shop, draftKey)))) return;
      touch();
      refresh(`filter::${sf.filters.findIndex((f) => f.key === key)}:label`);
    }),
    'sf-filter-add-custom': act((_el, s) => addCustomFilter(s)),
    'sf-old-migrate': act((_el, { shop, sf }) => {
      const n = migrateOldFilters(sf, shop.filters);
      delete shop.filters;
      touch();
      refresh();
      toast(n ? `Перенесено фильтров: ${n}` : 'Такие фильтры уже есть');
    }),
    'sf-old-drop': act((_el, { shop }) => { delete shop.filters; refresh(); }),
  });
}

function addCustomFilter({ shop, sf }: { shop: Shop; sf: Storefront }): void {
  const key = ui.customKey.trim();
  if (!key) { toast('Введите название поля'); refresh('custom-key'); return; }
  if (sf.filters.some((f) => f.key === key)) { toast('Такой фильтр уже есть'); return; }
  addFilter(sf, suggestFilter(key, storeProducts(shop, draftKey)));
  ui.customKey = '';
  touch();
  refresh(`filter::${sf.filters.findIndex((f) => f.key === key)}:label`);
}

export function initStorefrontDesigner(d: DesignerDeps): void {
  deps = d;
  initActions();
  document.addEventListener('input', onInput);
  document.addEventListener('change', onChange);
  document.addEventListener('keydown', (e) => {
    const el = e.target as HTMLElement | null;
    if (e.key === 'Enter' && el?.matches?.('#shop-body [data-sf="custom-key"]')) {
      e.preventDefault();
      const s = current();
      if (s) addCustomFilter(s);
    }
  });
  /* a photo that doesn't load leaves its placeholder instead of a broken image */
  document.addEventListener('error', (e) => {
    const t = e.target;
    if (t instanceof HTMLImageElement && t.hasAttribute('data-sfd-img')) t.remove();
  }, true);
}
