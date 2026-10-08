/**
 * The designer's three tabs of the shop editor: «Оформление» (type, ink, ground, voice, cover, live preview),
 * «Блоки» (order, visibility, each block's fields) and «Фильтры» (the store's own filter list).
 * Saved storefronts may hold anything inside block items (Task 2 repairs the shape, not the fields), so every
 * field read here goes through `str` / `pct`, and everything goes through html`…`.
 * Inputs carry `data-sf` (what they edit) and `data-focus` (a stable key, so focus survives a redraw);
 * buttons carry `data-action` (registered in designer.ts).
 */
import {
  BLOCK_LABELS, FAMILY_INKS, INK_DARK, KIND_LABELS, STORE_KINDS, contrastRatio, mixHex, mixSpecOf, normalizeHex, onInk,
  presetFilters, presetTheme,
} from '../../../shared/storefront';
import type {
  BlockType, CategoriesBlock, CoverBlock, CoverStyle, LookbookBlock, Product, PromoBlock, Shop, StepsBlock, StoreFilterDef,
  StoreGround, StoreKind, StoreVoice, Storefront, StorefrontBlock, SwatchesBlock,
} from '../../../shared/domain/types';
import { html, raw, type SafeHtml } from '../../../shared/ui/html';
import {
  attributeKeys, canAddBlock, canMoveBlock, countMatching, derivedCategories, facetPreview, filled, isRequired, keyLabel,
  OPTIONAL_BLOCKS, oldFilterDefs, presetChanges, valuesOf,
} from './model';
import { coverPreview, plural } from './preview';

export type DesignerTab = 'design' | 'blocks' | 'filters';
export const DESIGNER_TABS: readonly DesignerTab[] = ['design', 'blocks', 'filters'];

/** The designer's own screen state (not saved). */
export interface DesignerUi {
  /** the block whose panel is open */
  open: string | null;
  /** the «Добавить блок» list is open */
  adding: boolean;
  /** a type was just picked: offer its preset */
  kindOffer: StoreKind | null;
  /** the offer also loads the type's ground, voice and cover */
  offerLook: boolean;
  /** what the hex field holds (may be unfinished while typing) */
  hex: string;
  /** the hex field was left with something that is not a colour */
  hexError: boolean;
  /** the «своё поле» field of the filters tab */
  customKey: string;
}

export interface Ctx {
  shop: Shop;
  /** the shop's saved name, null for a new shop */
  key: string | null;
  sf: Storefront;
  /** the store's products, any status */
  products: Product[];
  /** what buyers see: the store's published products */
  published: Product[];
  ui: DesignerUi;
  /** the type came from the shop category, not from a choice */
  kindFromCategory: boolean;
  /** section tiles still derived from the products (they follow the products until changed) */
  derived: (block: CategoriesBlock) => boolean;
}

/* ------------------------------------------------------------------------------------------------- helpers */

const ico = (name: string, cls = '') => raw(`<svg class="ico ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`);
const on = (cond: boolean, attr: string) => (cond ? raw(` ${attr}`) : '');
/** A text field's value from data that may hold anything. */
export const str = (v: unknown): string => (typeof v === 'string' ? v : typeof v === 'number' && Number.isFinite(v) ? String(v) : '');
const pct = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number.parseFloat(str(v).replace(',', '.'));
  return Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n * 10) / 10)) : 50;
};
const fmt = (n: number) => n.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
const clip = (s: string, max = 60) => (s.length > max ? `${s.slice(0, max).trimEnd()}…` : s);
/** Items and pins of saved blocks are objects (resolve checks that much); their fields are not checked. */
type Loose = Record<string, unknown>;
const items = (b: { items?: unknown }): Loose[] => (Array.isArray(b.items) ? (b.items as Loose[]) : []);
const pins = (b: LookbookBlock): Loose[] => (Array.isArray(b.pins) ? (b.pins as unknown as Loose[]) : []);

const thumb = (src: unknown) => (filled(src) ? html`<img src="${src}" alt="" loading="lazy" data-sfd-img>` : '');

function seg(label: string, options: readonly (readonly [string, string])[], current: string, action: string, extra: Record<string, string> = {}, decorate?: (v: string) => SafeHtml): SafeHtml {
  const data = Object.entries(extra).map(([k, v]) => html` data-${k}="${v}"`);
  return html`<div class="sfd-seg" role="group" aria-label="${label}">${options.map(([value, text]) => html`
    <button type="button" data-action="${action}" data-value="${value}"${data} aria-pressed="${value === current}" data-focus="${action}:${Object.values(extra).join(':')}:${value}">${decorate ? decorate(value) : ''}<span>${text}</span></button>`)}</div>`;
}

/* ============================================================================================== Оформление */

const GROUNDS: readonly (readonly [StoreGround, string])[] = [['stock', 'Обычный'], ['tint', 'Тон цвета'], ['black', 'Чёрный']];
const VOICES: readonly (readonly [StoreVoice, string])[] = [['industrial', 'Строгий'], ['modern', 'Современный'], ['classic', 'Классический']];
const COVERS: readonly (readonly [CoverStyle, string])[] = [['field', 'Поле и фото'], ['split', 'Пополам'], ['full', 'Фото целиком']];
const GROUND_WORDS: Record<StoreGround, string> = { stock: 'обычный фон', tint: 'фон в тон цвета', black: 'чёрный фон' };
const VOICE_WORDS: Record<StoreVoice, string> = { industrial: 'строгий шрифт', modern: 'современный шрифт', classic: 'классический шрифт' };
const COVER_WORDS: Record<CoverStyle, string> = { field: 'обложка «поле и фото»', split: 'обложка пополам', full: 'фото на всю обложку' };

/** Small drawings of the three cover layouts (ink field filled, photo outlined). */
const COVER_ICONS: Record<CoverStyle, SafeHtml> = {
  field: raw('<svg class="sfd-cov" viewBox="0 0 40 26" aria-hidden="true"><rect x="1" y="1" width="23" height="24" class="f"/><rect x="24" y="1" width="15" height="24" class="p"/></svg>'),
  split: raw('<svg class="sfd-cov" viewBox="0 0 40 26" aria-hidden="true"><rect x="1" y="1" width="19" height="24" class="f"/><rect x="20" y="1" width="19" height="24" class="p"/></svg>'),
  full: raw('<svg class="sfd-cov" viewBox="0 0 40 26" aria-hidden="true"><rect x="1" y="1" width="38" height="24" class="p"/><rect x="4" y="14" width="18" height="8" class="f"/></svg>'),
};

function kindPanel(ctx: Ctx): SafeHtml {
  const cards = STORE_KINDS.map((kind) => {
    const pressed = ctx.sf.kind === kind;
    return html`<button type="button" class="sfd-kind" data-action="sf-kind" data-kind="${kind}" aria-pressed="${pressed}" data-focus="kind:${kind}">
      <b>${KIND_LABELS[kind]}</b><span>Фильтры: ${presetFilters(kind).map((f) => f.label).join(', ')}</span>${pressed ? ico('check', 'sfd-mark') : ''}</button>`;
  });
  const why = ctx.kindFromCategory && filled(ctx.shop.category) ? html` Сейчас подобран по категории «${ctx.shop.category}».` : '';
  return html`<section class="panel">
    <h4>Тип витрины</h4>
    <p>От типа зависят готовые блоки и фильтры.${why}</p>
    <div class="sfd-kinds" role="group" aria-label="Тип витрины">${cards}</div>
    ${ctx.ui.kindOffer ? kindOffer(ctx, ctx.ui.kindOffer) : ''}
  </section>`;
}

function kindOffer(ctx: Ctx, kind: StoreKind): SafeHtml {
  const { blocks, removed } = presetChanges(ctx.sf, kind);
  const look = presetTheme(kind, str(ctx.shop.name));
  return html`<div class="sfd-offer" role="region" aria-label="Набор блоков и фильтров для типа">
    <p><b>Загрузить набор для типа «${KIND_LABELS[kind]}»?</b></p>
    <p>Блоки: ${blocks.map((t) => BLOCK_LABELS[t]).join(', ')}. Фильтры: ${presetFilters(kind).map((f) => f.label).join(', ')}.${removed.length ? html` Уберутся: ${removed.map((t) => BLOCK_LABELS[t]).join(', ')}.` : ''}</p>
    <p>Тексты и фото блоков, которые останутся, сохранятся; цвет магазина не изменится.</p>
    <label class="sfd-check"><input type="checkbox" data-sf="offer-look" data-focus="offer-look"${on(ctx.ui.offerLook, 'checked')}><span>Взять и оформление типа: ${GROUND_WORDS[look.ground]}, ${VOICE_WORDS[look.voice]}, ${COVER_WORDS[look.cover]}</span></label>
    <div class="sfd-actions">
      <button type="button" class="btn btn-primary btn-sm" data-action="sf-kind-apply" data-focus="kind-apply">Загрузить набор</button>
      <button type="button" class="btn btn-secondary btn-sm" data-action="sf-kind-dismiss">Не нужно</button>
    </div>
  </div>`;
}

/** The note under the ink: what colour the words on it get, the contrast, and whether it melts into the ground. */
export function inkNote(ctx: Ctx): SafeHtml {
  if (ctx.ui.hexError) {
    return html`<p class="sfd-note is-bad" role="alert">${ico('alert', 'ico-sm')}<span>Это не код цвета. Нужно 6 знаков после #, например #0F6A3C. На витрине остаётся ${ctx.sf.theme.ink}.</span></p>`;
  }
  const ink = normalizeHex(ctx.sf.theme.ink) ?? '#3A3A38';
  const text = onInk(ink);
  const ratio = contrastRatio(ink, text);
  const r = ratio.toFixed(1).replace('.', ',');
  const words = text === INK_DARK ? 'чёрные' : 'белые';
  const level = ratio >= 4.5 ? 'ok' : ratio >= 3 ? 'warn' : 'bad';
  const verdict = level === 'ok' ? 'читаются хорошо.' : level === 'warn' ? 'крупное название прочтут, мелкий текст — с трудом. Возьмите цвет темнее или светлее.' : 'читаются плохо — выберите другой цвет.';
  const grounds: [string, string][] = ctx.sf.theme.ground === 'stock' ? [['#FFFFFF', 'в светлой теме'], ['#121211', 'в тёмной теме']]
    : ctx.sf.theme.ground === 'tint' ? [[mixHex(ink, '#FFFFFF', 0.92), 'в светлой теме'], [mixHex(ink, '#121211', 0.88), 'в тёмной теме']]
      : [['#121211', '']];
  const melts = grounds.filter(([g]) => contrastRatio(ink, g) < 1.5).map(([, where]) => where);
  return html`<p class="sfd-note is-${level}">${ico(level === 'ok' ? 'check' : 'alert', 'ico-sm')}<span>Надписи на этом цвете — ${words}: контраст ${r} : 1, ${verdict}</span></p>
    ${melts.length ? html`<p class="sfd-note is-warn">${ico('alert', 'ico-sm')}<span>Цвет почти сливается с фоном страницы${melts[0] ? ` ${melts.join(' и ')}` : ''}: выберите другой фон или цвет.</span></p>` : ''}`;
}

function inkPanel(ctx: Ctx): SafeHtml {
  const ink = ctx.sf.theme.ink;
  const swatches = FAMILY_INKS.map((f) => html`<button type="button" class="sfd-swatch" data-action="sf-ink" data-ink="${f.hex}" style="--sw:${f.hex};--sw-on:${onInk(f.hex)}" aria-label="${f.name}, ${f.hex}" title="${f.name}" aria-pressed="${ink === f.hex}" data-focus="ink:${f.hex}">${ico('check')}</button>`);
  return html`<section class="panel">
    <h4>Цвет магазина</h4>
    <p>Поле обложки, полоса с названием магазина у товаров и кнопка «Написать менеджеру».</p>
    <div class="sfd-swatches" role="group" aria-label="Цвета набора">${swatches}</div>
    <div class="sfd-hexrow">
      <label class="sfd-picker" title="Свой цвет на палитре"><input type="color" data-sf="ink-picker" value="${(normalizeHex(ink) ?? '#3A3A38').toLowerCase()}" aria-label="Свой цвет на палитре" data-focus="ink-picker"><span data-ink-chip style="--sw:${normalizeHex(ink) ?? '#3A3A38'}"></span></label>
      <label class="field sfd-hex"><span>Свой цвет — код</span><input class="input" data-sf="hex" value="${ctx.ui.hex}" maxlength="7" spellcheck="false" autocomplete="off" aria-describedby="sfd-ink-note" data-focus="hex"${on(ctx.ui.hexError, 'aria-invalid="true"')}></label>
    </div>
    <div data-region="ink-note" id="sfd-ink-note" aria-live="polite">${inkNote(ctx)}</div>
  </section>`;
}

function lookPanel(ctx: Ctx): SafeHtml {
  const t = ctx.sf.theme;
  return html`<section class="panel">
    <h4>Фон, шрифт и обложка</h4>
    <div class="sfd-opt"><span>Фон страницы</span>${seg('Фон страницы', GROUNDS, t.ground, 'sf-ground')}
      <small>Обычный — фон приложения: белый в светлой теме, чёрный в тёмной.</small></div>
    <div class="sfd-opt"><span>Шрифт заголовков</span>${seg('Шрифт заголовков', VOICES, t.voice, 'sf-voice', {}, (v) => raw(`<i class="sfd-voice-${v}" aria-hidden="true">Аа</i>`))}</div>
    <div class="sfd-opt"><span>Обложка</span>${seg('Обложка', COVERS, t.cover, 'sf-cover', {}, (v) => COVER_ICONS[v as CoverStyle])}</div>
  </section>`;
}

function openLink(ctx: Ctx): SafeHtml {
  const name = ctx.key ?? (filled(ctx.shop.name) ? ctx.shop.name.trim() : '');
  if (!name) return html`<p class="sfd-hint">Ссылка на витрину появится, когда у магазина будет название.</p>`;
  return html`<a class="btn btn-secondary sfd-open" href="index.html#store=${encodeURIComponent(name)}" target="_blank" rel="noopener">${ico('external')}Открыть витрину в приложении</a>
    <p class="sfd-hint">Откроется сохранённая витрина: сначала нажмите «Сохранить витрину».</p>`;
}

export function renderDesign(ctx: Ctx): SafeHtml {
  return html`<div class="sfd-design">
    <div class="sfd-main">${kindPanel(ctx)}${inkPanel(ctx)}${lookPanel(ctx)}</div>
    <aside class="sfd-aside" aria-label="Превью витрины">
      <div data-region="preview">${coverPreview(ctx.shop, ctx.sf, ctx.published)}</div>
      ${openLink(ctx)}
    </aside>
  </div>`;
}

/* ================================================================================================== Блоки */

const count = (n: number, one: string, few: string, many: string) => `${n} ${plural(n, one, few, many)}`;
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** One line under a block's name: what it shows now. */
export function summary(ctx: Ctx, b: StorefrontBlock): string {
  const s = ctx.shop;
  const title = filled(b.title) ? `«${clip(b.title, 40)}» · ` : '';
  switch (b.type) {
    case 'cover': return filled(b.line) ? clip(b.line) : 'Строка под названием не задана';
    case 'categories': {
      const n = items(b).length;
      return title + (n ? count(n, 'раздел', 'раздела', 'разделов') + (ctx.derived(b) ? ' из категорий товаров' : '') : 'Разделов нет');
    }
    case 'lookbook': return title + (filled(b.image) ? count(pins(b).length, 'метка', 'метки', 'меток') : 'Нет фото');
    case 'steps': return title + count(items(b).length, 'шаг', 'шага', 'шагов');
    case 'swatches': return title + count(items(b).length, 'образец', 'образца', 'образцов');
    case 'promo': return title + (filled(b.text) ? clip(b.text) : 'Текст акции не задан');
    case 'about': return title + (filled(b.text) ? clip(b.text) : 'Описание из вкладки «О магазине»');
    case 'services': {
      const all = list(s.services) as { on?: unknown }[];
      return title + `Включено ${all.filter((x) => x && x.on).length} из ${all.length}`;
    }
    case 'catalog': return title + `${count(ctx.published.length, 'товар', 'товара', 'товаров')} · ${count(ctx.sf.filters.length, 'фильтр', 'фильтра', 'фильтров')}`;
    case 'gallery': return title + count(list(s.gallery).filter(filled).length, 'фото', 'фото', 'фото');
    case 'addresses': return title + count(list(s.facades).length, 'адрес', 'адреса', 'адресов');
    case 'managers': { const n = list(s.managers).length; return title + (n ? count(n, 'менеджер', 'менеджера', 'менеджеров') : 'Менеджеров нет'); }
    case 'terms': return title + (filled(s.payment) || filled(s.delivery) ? 'Оплата и доставка заполнены' : 'Оплата и доставка не заполнены');
    case 'calculator': return title + count(ctx.products.filter((p) => mixSpecOf(p)).length, 'товар с расходом', 'товара с расходом', 'товаров с расходом');
  }
}

/* ---------- fields ---------- */

type Target = { sf: string; id?: string; index?: number; prop: string };
const targetAttrs = (t: Target) => html`data-sf="${t.sf}"${t.id !== undefined ? html` data-id="${t.id}"` : ''}${t.index !== undefined ? html` data-index="${t.index}"` : ''} data-prop="${t.prop}" data-focus="${t.sf}:${t.id ?? ''}:${t.index ?? ''}:${t.prop}"`;

interface FieldOpts { placeholder?: string; max?: number; hint?: string; thumb?: string; type?: string; invalid?: boolean }
function input(label: string, t: Target, value: string, o: FieldOpts = {}): SafeHtml {
  return html`<label class="field"><span>${label}</span><input class="input"${o.type ? html` type="${o.type}"` : ''} ${targetAttrs(t)} value="${value}"${o.placeholder ? html` placeholder="${o.placeholder}"` : ''}${o.max ? html` maxlength="${o.max}"` : ''}${o.thumb ? html` data-thumb-for="${o.thumb}"` : ''}${on(!!o.invalid, 'aria-invalid="true"')} autocomplete="off">${o.hint ? html`<small>${o.hint}</small>` : ''}</label>`;
}
function textarea(label: string, t: Target, value: string, rows: number, o: FieldOpts = {}): SafeHtml {
  return html`<label class="field"><span>${label}</span><textarea class="textarea" rows="${rows}" ${targetAttrs(t)}${o.placeholder ? html` placeholder="${o.placeholder}"` : ''}>${value}</textarea>${o.hint ? html`<small>${o.hint}</small>` : ''}</label>`;
}
function urlField(label: string, t: Target, value: string, thumbKey: string, hint?: string): SafeHtml {
  return html`<div class="sfd-url"><div class="sfd-thumb" data-thumb="${thumbKey}">${thumb(value)}</div>${input(label, t, value, { placeholder: 'https://…', thumb: thumbKey, hint })}</div>`;
}
const titleField = (b: StorefrontBlock) => input('Заголовок на витрине', { sf: 'block', id: b.id, prop: 'title' }, str(b.title), { placeholder: BLOCK_LABELS[b.type], max: 60 });

const exampleToggle = (b: StorefrontBlock) => html`<label class="sfd-check"><input type="checkbox" data-sf="example" data-id="${b.id}" data-focus="example:${b.id}"${on(b.example === true, 'checked')}><span>Пример: текст придуман для показа, его нужно заменить данными магазина</span></label>`;

function productOptions(ctx: Ctx, current: unknown, empty: string): SafeHtml {
  const id = str(current);
  const known = ctx.products.some((p) => p.id === id);
  return html`<option value=""${on(!id, 'selected')}>${empty}</option>
    ${id && !known ? html`<option value="${id}" selected>Товар не найден (${id})</option>` : ''}
    ${ctx.products.map((p) => html`<option value="${p.id}"${on(p.id === id, 'selected')}>${clip(str(p.title) || p.id, 50)}${p.price ? ` — ${p.price}` : ''}${p.status !== 'published' ? ' (не в каталоге)' : ''}</option>`)}`;
}

function itemTools(b: StorefrontBlock, i: number, n: number, noun: string): SafeHtml {
  return html`<div class="sfd-tools">
    <button type="button" class="icon-btn" data-action="sf-item-move" data-id="${b.id}" data-index="${i}" data-dir="-1"${on(i === 0, 'disabled')} aria-label="Выше: ${noun} ${i + 1}" data-focus="iup:${b.id}:${i}">${ico('up')}</button>
    <button type="button" class="icon-btn" data-action="sf-item-move" data-id="${b.id}" data-index="${i}" data-dir="1"${on(i === n - 1, 'disabled')} aria-label="Ниже: ${noun} ${i + 1}" data-focus="idown:${b.id}:${i}">${ico('down')}</button>
    <button type="button" class="icon-btn danger" data-action="sf-item-delete" data-id="${b.id}" data-index="${i}" aria-label="Удалить: ${noun} ${i + 1}">${ico('trash')}</button>
  </div>`;
}

const addButton = (b: StorefrontBlock, label: string) => html`<button type="button" class="btn btn-ghost btn-sm" data-action="sf-item-add" data-id="${b.id}" data-focus="iadd:${b.id}">${ico('plus', 'ico-sm')}${label}</button>`;

/* ---------- panels ---------- */

function coverPanel(ctx: Ctx, b: CoverBlock): SafeHtml {
  return html`<div class="sfd-cover-edit">
    <div>
      ${input('Строка под названием', { sf: 'block', id: b.id, prop: 'line' }, str(b.line), { placeholder: 'Например, Мебель для дома. Собственное производство', max: 90 })}
      ${urlField('Фото обложки — ссылка', { sf: 'block', id: b.id, prop: 'image' }, str(b.image), `cover:${b.id}`, 'Горизонтальное фото без надписей. Пусто — главное фото магазина.')}
      ${exampleToggle(b)}
    </div>
    <div data-region="preview">${coverPreview(ctx.shop, ctx.sf, ctx.published, { compact: true })}</div>
  </div>`;
}

/** Keys a section tile can lead by: the product category, the store's filters, the products' attributes. */
function tileKeys(ctx: Ctx, current: string): { key: string; label: string }[] {
  const out = new Map<string, string>([['category', keyLabel('category')]]);
  for (const f of ctx.sf.filters) if (f.key !== 'price') out.set(f.key, f.label || keyLabel(f.key));
  for (const k of attributeKeys(ctx.products, [])) if (k !== 'price' && !out.has(k)) out.set(k, keyLabel(k));
  if (current && !out.has(current)) out.set(current, current);
  return [...out].map(([key, label]) => ({ key, label }));
}

export function tileCount(ctx: Ctx, key: unknown, value: unknown): SafeHtml {
  const n = countMatching(ctx.published, key, value);
  return n ? html`<span class="sfd-count">${count(n, 'товар', 'товара', 'товаров')}</span>` : html`<span class="sfd-count is-none">Нет товаров</span>`;
}

function categoriesPanel(ctx: Ctx, b: CategoriesBlock, bi: number): SafeHtml {
  const all = items(b);
  const rows = all.map((it, i) => {
    const key = filled(it.key) ? it.key : 'category';
    const listId = `sfd-vals-${bi}-${i}`;
    return html`<div class="sfd-item">
      <div class="sfd-thumb" data-thumb="cat:${b.id}:${i}">${thumb(it.image)}</div>
      <div class="sfd-grid2">
        ${input('Название', { sf: 'item', id: b.id, index: i, prop: 'label' }, str(it.label), { placeholder: 'Например, Спальня', max: 40 })}
        <label class="field"><span>Ведёт в каталог по</span><select class="select" ${targetAttrs({ sf: 'item', id: b.id, index: i, prop: 'key' })}>${tileKeys(ctx, key).map((k) => html`<option value="${k.key}"${on(k.key === key, 'selected')}>${k.label}</option>`)}</select></label>
        <label class="field"><span>Значение</span><input class="input" ${targetAttrs({ sf: 'item', id: b.id, index: i, prop: 'value' })} value="${str(it.value)}" list="${listId}" autocomplete="off"><datalist id="${listId}">${valuesOf(ctx.products, key).map((v) => html`<option value="${v}"></option>`)}</datalist></label>
        ${input('Фото — ссылка', { sf: 'item', id: b.id, index: i, prop: 'image' }, str(it.image), { placeholder: 'https://…', thumb: `cat:${b.id}:${i}` })}
      </div>
      <div class="sfd-side"><span data-region="count:${b.id}:${i}">${tileCount(ctx, key, it.value)}</span>${itemTools(b, i, all.length, 'раздел')}</div>
    </div>`;
  });
  const auto = ctx.derived(b);
  /* an empty list is not an empty block: the app fills it from the products' categories (as resolve does) */
  const fallback = rows.length ? [] : derivedCategories(str(ctx.shop.name), ctx.products).map((c) => c.label);
  const empty = fallback.length
    ? `Пусто — на витрине будут разделы из категорий товаров: ${fallback.join(', ')}. Чтобы убрать блок, выключите его.`
    : 'Разделов нет: у товаров магазина нет категорий, на витрине блок не появится.';
  return html`<div class="sfd-items">${rows.length ? rows : html`<p class="sfd-empty">${empty}</p>`}</div>
    <div class="sfd-foot">${addButton(b, 'Добавить раздел')}<button type="button" class="btn btn-ghost btn-sm" data-action="sf-cats-derive" data-id="${b.id}">Собрать заново из категорий товаров</button></div>
    ${auto && rows.length ? html`<p class="sfd-hint">Разделы собраны из категорий товаров и обновляются сами, пока вы их не измените.</p>` : ''}`;
}

/** The lookbook photo with its pins: a click on it adds one. */
export function lookStage(b: LookbookBlock): SafeHtml {
  return filled(b.image)
    ? html`<div class="sfd-stage" data-action="sf-pin-add" data-id="${b.id}" title="Нажмите на фото, чтобы поставить метку">
        <img src="${b.image}" alt="" data-sfd-img>
        ${pins(b).map((p, i) => html`<span class="sfd-pin" data-pin="${b.id}:${i}" style="left:${pct(p.x)}%;top:${pct(p.y)}%">${i + 1}</span>`)}
      </div><p class="sfd-hint">Нажмите на фото, чтобы поставить метку, и выберите товар.</p>`
    : html`<div class="sfd-stage is-empty">${ico('image')}<span>Добавьте ссылку на фото — потом ставьте на него метки товаров</span></div>`;
}

function lookbookPanel(ctx: Ctx, b: LookbookBlock): SafeHtml {
  const all = pins(b);
  const ink = normalizeHex(ctx.sf.theme.ink) ?? '#3A3A38';
  const rows = all.map((p, i) => html`<div class="sfd-pinrow">
    <span class="sfd-pin is-static" aria-hidden="true">${i + 1}</span>
    <label class="field"><span>Товар метки ${i + 1}</span><select class="select" ${targetAttrs({ sf: 'pin', id: b.id, index: i, prop: 'productId' })}>${productOptions(ctx, p.productId, 'Выберите товар')}</select></label>
    ${input('X, %', { sf: 'pin', id: b.id, index: i, prop: 'x' }, String(pct(p.x)), { type: 'number' })}
    ${input('Y, %', { sf: 'pin', id: b.id, index: i, prop: 'y' }, String(pct(p.y)), { type: 'number' })}
    <button type="button" class="icon-btn danger" data-action="sf-pin-delete" data-id="${b.id}" data-index="${i}" aria-label="Удалить метку ${i + 1}">${ico('trash')}</button>
  </div>`);
  return html`<div class="sfd-look" style="--pin:${ink};--pin-on:${onInk(ink)}">${titleField(b)}
    ${urlField('Фото интерьера — ссылка', { sf: 'block', id: b.id, prop: 'image' }, str(b.image), `look:${b.id}`)}
    ${input('Подпись', { sf: 'block', id: b.id, prop: 'text' }, str(b.text), { placeholder: 'Например, Спальня из коллекции «Прованс»', max: 120 })}
    <div data-region="stage:${b.id}">${lookStage(b)}</div>
    <div class="sfd-pins">${rows}</div>
    <div class="sfd-foot"><button type="button" class="btn btn-ghost btn-sm" data-action="sf-pin-add" data-id="${b.id}" data-center="1" data-focus="padd:${b.id}">${ico('plus', 'ico-sm')}Добавить метку</button></div>
    ${exampleToggle(b)}</div>`;
}

function stepsPanel(b: StepsBlock): SafeHtml {
  const all = items(b);
  return html`${titleField(b)}
    <div class="sfd-items">${all.map((it, i) => html`<div class="sfd-item">
      <span class="sfd-stepno" aria-hidden="true">${i + 1}</span>
      <div class="sfd-stack">
        ${input(`Шаг ${i + 1}`, { sf: 'item', id: b.id, index: i, prop: 'title' }, str(it.title), { placeholder: 'Например, Замер', max: 40 })}
        ${textarea('Что происходит', { sf: 'item', id: b.id, index: i, prop: 'text' }, str(it.text), 2)}
      </div>
      <div class="sfd-side">${itemTools(b, i, all.length, 'шаг')}</div>
    </div>`)}</div>
    ${all.length ? '' : html`<p class="sfd-empty">Шагов нет: на витрине блок не появится.</p>`}
    <div class="sfd-foot">${addButton(b, 'Добавить шаг')}</div>
    ${exampleToggle(b)}`;
}

export function swatchChip(it: Loose): SafeHtml {
  const colour = normalizeHex(it.color);
  return html`<span class="sfd-chip${colour || filled(it.image) ? '' : ' is-empty'}"${colour ? html` style="--sw:${colour}"` : ''}>${thumb(it.image)}</span>`;
}

function swatchesPanel(b: SwatchesBlock): SafeHtml {
  const all = items(b);
  return html`${titleField(b)}
    <div class="sfd-items">${all.map((it, i) => html`<div class="sfd-item">
      <span data-region="sw:${b.id}:${i}">${swatchChip(it)}</span>
      <div class="sfd-grid2">
        ${input('Название', { sf: 'item', id: b.id, index: i, prop: 'name' }, str(it.name), { placeholder: 'Например, Дуб натуральный', max: 40 })}
        ${input('Цвет — код', { sf: 'item', id: b.id, index: i, prop: 'color' }, str(it.color), { placeholder: '#B4875A', max: 7, invalid: filled(it.color) && !normalizeHex(it.color) })}
        ${input('Фото образца — ссылка', { sf: 'item', id: b.id, index: i, prop: 'image' }, str(it.image), { placeholder: 'https://…' })}
        ${input('Примечание', { sf: 'item', id: b.id, index: i, prop: 'note' }, str(it.note), { placeholder: 'Например, матовый', max: 60 })}
      </div>
      <div class="sfd-side">${itemTools(b, i, all.length, 'образец')}</div>
    </div>`)}</div>
    ${all.length ? '' : html`<p class="sfd-empty">Образцов нет: на витрине блок не появится.</p>`}
    <div class="sfd-foot">${addButton(b, 'Добавить образец')}</div>
    ${exampleToggle(b)}`;
}

function promoPanel(ctx: Ctx, b: PromoBlock): SafeHtml {
  return html`${titleField(b)}
    <div class="sfd-grid2">
      ${input('Наклейка', { sf: 'block', id: b.id, prop: 'sticker' }, str(b.sticker), { placeholder: '−15% или Новинка', max: 14 })}
      <label class="field"><span>Товар акции</span><select class="select" ${targetAttrs({ sf: 'block', id: b.id, prop: 'productId' })}>${productOptions(ctx, b.productId, 'Без товара: кнопка ведёт в каталог')}</select></label>
    </div>
    ${textarea('Текст акции', { sf: 'block', id: b.id, prop: 'text' }, str(b.text), 3, { placeholder: 'Например, Спальни из коллекции «Прованс» со скидкой 15%' })}
    ${urlField('Фото — ссылка', { sf: 'block', id: b.id, prop: 'image' }, str(b.image), `promo:${b.id}`)}
    ${exampleToggle(b)}`;
}

function aboutPanel(ctx: Ctx, b: StorefrontBlock & { text?: unknown }): SafeHtml {
  return html`${titleField(b)}
    ${textarea('Текст о компании', { sf: 'block', id: b.id, prop: 'text' }, str(b.text), 5, { placeholder: filled(ctx.shop.description) ? ctx.shop.description : 'Чем занимается магазин, с какого года, что производит', hint: 'Пусто — на витрине описание из вкладки «О магазине».' })}
    ${exampleToggle(b)}`;
}

function galleryPanel(ctx: Ctx, b: StorefrontBlock): SafeHtml {
  const photos = list(ctx.shop.gallery);
  return html`${titleField(b)}
    <p class="sfd-hint">Фото магазина: зал, образцы, работы. Общие для витрины.</p>
    <div class="sfd-items">${photos.map((src, i) => html`<div class="sfd-item">
      <div class="sfd-thumb" data-thumb="gal:${i}">${thumb(src)}</div>
      ${input(`Фото ${i + 1} — ссылка`, { sf: 'gallery', index: i, prop: 'src' }, str(src), { placeholder: 'https://…', thumb: `gal:${i}` })}
      <div class="sfd-side"><div class="sfd-tools">
        <button type="button" class="icon-btn" data-action="sf-gallery-move" data-index="${i}" data-dir="-1"${on(i === 0, 'disabled')} aria-label="Раньше: фото ${i + 1}" data-focus="gup:${i}">${ico('up')}</button>
        <button type="button" class="icon-btn" data-action="sf-gallery-move" data-index="${i}" data-dir="1"${on(i === photos.length - 1, 'disabled')} aria-label="Позже: фото ${i + 1}" data-focus="gdown:${i}">${ico('down')}</button>
        <button type="button" class="icon-btn danger" data-action="sf-gallery-delete" data-index="${i}" aria-label="Удалить фото ${i + 1}">${ico('trash')}</button>
      </div></div>
    </div>`)}</div>
    ${photos.length ? '' : html`<p class="sfd-empty">Фото нет: на витрине блок не появится.</p>`}
    <div class="sfd-foot"><button type="button" class="btn btn-ghost btn-sm" data-action="sf-gallery-add" data-focus="gadd">${ico('plus', 'ico-sm')}Добавить фото</button></div>`;
}

const SOURCES: Partial<Record<BlockType, { text: string; tabs: [string, string][] }>> = {
  services: { text: 'Услуги — из вкладки «Услуги»: на витрине только включённые.', tabs: [['services', 'Услуги']] },
  catalog: { text: 'Опубликованные товары магазина; фильтры — на вкладке «Фильтры».', tabs: [['filters', 'Фильтры']] },
  addresses: { text: 'Фасады с адресами, ссылки на карты и режим работы — из вкладок «Адреса», «Карта» и «Часы».', tabs: [['facades', 'Адреса'], ['map', 'Карта'], ['hours', 'Часы']] },
  managers: { text: 'Менеджеры с телефоном, почтой, MAX и Telegram — из вкладки «Менеджеры». Без менеджеров блок не появится.', tabs: [['managers', 'Менеджеры']] },
  terms: { text: 'Оплата и доставка — из вкладки «Оплата». Покупатель всегда видит, что платит напрямую менеджеру магазина.', tabs: [['pay', 'Оплата']] },
};

function sourcePanel(ctx: Ctx, b: StorefrontBlock): SafeHtml {
  if (b.type === 'calculator') {
    const n = ctx.products.filter((p) => mixSpecOf(p)).length;
    return html`${titleField(b)}<p class="sfd-note ${n ? 'is-ok' : 'is-warn'}">${ico(n ? 'check' : 'alert', 'ico-sm')}<span>${n
      ? `Считает мешки по площади и толщине слоя. Подходит ${count(n, 'товар', 'товара', 'товаров')} с расходом и фасовкой.`
      : 'Ни у одного товара магазина нет расхода и фасовки («Расход, кг/м²·мм», «Фасовка, кг»): на витрине блок не появится.'}</span></p>`;
  }
  const src = SOURCES[b.type];
  const services = b.type === 'services' ? (list(ctx.shop.services) as { name?: unknown; on?: unknown }[]).filter((x) => x && x.on && filled(x.name)).map((x) => String(x.name)) : [];
  const now = b.type !== 'services' ? '' : services.length ? ` Сейчас включены: ${services.join(', ')}.` : ' Сейчас не включена ни одна: на витрине блок не появится.';
  return html`${titleField(b)}${src ? html`<p class="sfd-hint">${src.text}${now}</p><div class="sfd-foot">${src.tabs.map(([tab, label]) => html`<button type="button" class="btn btn-ghost btn-sm" data-action="sf-goto-tab" data-tab="${tab}">${label} ${ico('arrow', 'ico-sm')}</button>`)}</div>` : ''}`;
}

function panel(ctx: Ctx, b: StorefrontBlock, i: number): SafeHtml {
  switch (b.type) {
    case 'cover': return coverPanel(ctx, b);
    case 'categories': return html`${titleField(b)}${categoriesPanel(ctx, b, i)}${exampleToggle(b)}`;
    case 'lookbook': return lookbookPanel(ctx, b);
    case 'steps': return stepsPanel(b);
    case 'swatches': return swatchesPanel(b);
    case 'promo': return promoPanel(ctx, b);
    case 'about': return aboutPanel(ctx, b);
    case 'gallery': return galleryPanel(ctx, b);
    default: return sourcePanel(ctx, b);
  }
}

function blockRow(ctx: Ctx, b: StorefrontBlock, i: number): SafeHtml {
  const label = BLOCK_LABELS[b.type];
  const required = isRequired(b.type);
  const open = ctx.ui.open === b.id;
  return html`<div class="sfd-brow${b.on ? '' : ' is-off'}${open ? ' is-open' : ''}" data-block="${b.id}">
    <div class="sfd-bhead">
      <div class="sfd-bname">
        <b>${label}</b>${b.example ? html`<span class="badge b-wait">Пример</span>` : ''}${b.on ? '' : html`<span class="badge b-off">Скрыт</span>`}
        <span class="sfd-bsum" data-region="sum:${b.id}">${summary(ctx, b)}</span>
      </div>
      <div class="sfd-tools">
        <label class="switch" title="${required ? 'Обязательный блок: всегда на витрине' : b.on ? 'Показан на витрине' : 'Скрыт с витрины'}"><input type="checkbox" data-sf="block-on" data-id="${b.id}" aria-label="Показывать на витрине: ${label}" data-focus="on:${b.id}"${on(b.on, 'checked')}${on(required, 'disabled')}><i></i></label>
        <button type="button" class="icon-btn" data-action="sf-block-move" data-id="${b.id}" data-dir="-1"${on(!canMoveBlock(ctx.sf, b.id, -1), 'disabled')} aria-label="Выше: ${label}" data-focus="up:${b.id}">${ico('up')}</button>
        <button type="button" class="icon-btn" data-action="sf-block-move" data-id="${b.id}" data-dir="1"${on(!canMoveBlock(ctx.sf, b.id, 1), 'disabled')} aria-label="Ниже: ${label}" data-focus="down:${b.id}">${ico('down')}</button>
        <button type="button" class="icon-btn${open ? ' is-on' : ''}" data-action="sf-block-edit" data-id="${b.id}" aria-expanded="${open}" aria-controls="sfd-panel-${i}" aria-label="Настроить: ${label}" data-focus="edit:${b.id}">${ico('edit')}</button>
        ${required
          ? html`<span class="icon-btn sfd-lock" title="Обязательный блок нельзя удалить">${ico('lock')}</span>`
          : html`<button type="button" class="icon-btn danger" data-action="sf-block-delete" data-id="${b.id}" aria-label="Удалить блок: ${label}">${ico('trash')}</button>`}
      </div>
    </div>
    ${open ? html`<div class="sfd-bpanel" id="sfd-panel-${i}" role="region" aria-label="${label}">${panel(ctx, b, i)}</div>` : ''}
  </div>`;
}

const ADD_HINTS: Partial<Record<BlockType, string>> = {
  categories: 'Плитки разделов: покупатель сразу попадает в нужный раздел каталога',
  lookbook: 'Фото интерьера с метками товаров',
  steps: 'Этапы работы: замер, проект, производство, монтаж',
  swatches: 'Образцы фасадов, тканей и цветов',
  calculator: 'Сколько мешков смеси нужно на площадь и толщину слоя',
  promo: 'Акция: наклейка, текст, фото и товар',
  gallery: 'Фото магазина: зал, образцы, работы',
};

function addList(ctx: Ctx): SafeHtml {
  return html`<div class="sfd-addlist">${OPTIONAL_BLOCKS.map((type) => {
    const can = canAddBlock(ctx.sf, type);
    return html`<button type="button" class="sfd-addopt" data-action="sf-block-add" data-type="${type}"${on(!can, 'disabled')} data-focus="add:${type}">
      <b>${BLOCK_LABELS[type]}</b><span>${can ? ADD_HINTS[type] ?? '' : 'Уже на витрине'}</span></button>`;
  })}</div>`;
}

export function renderBlocks(ctx: Ctx): SafeHtml {
  return html`<section class="panel sfd-blocks">
    <h4>Блоки витрины</h4>
    <p>Сверху вниз — как на витрине. Обязательные блоки всегда на месте: их можно переставить, но не скрыть и не удалить.</p>
    <div class="sfd-blist">${ctx.sf.blocks.map((b, i) => blockRow(ctx, b, i))}</div>
    <div class="sfd-add">
      <button type="button" class="btn btn-secondary" data-action="sf-add-toggle" aria-expanded="${ctx.ui.adding}" data-focus="add-toggle">${ico('plus')}Добавить блок</button>
      ${ctx.ui.adding ? addList(ctx) : ''}
    </div>
  </section>`;
}

/* ================================================================================================= Фильтры */

/** What the buyer will see for this filter, or why it won't be offered. */
export function facetLine(ctx: Ctx, f: StoreFilterDef): SafeHtml {
  const fp = facetPreview(f, ctx.published);
  if (!fp.shown) return html`<span class="sfd-facet is-off">${fp.reason}</span>`;
  if (fp.type === 'range') return html`<span class="sfd-facet">Покупатель увидит: от ${fmt(fp.min)} до ${fmt(fp.max)}${f.unit ? ` ${f.unit}` : ''}</span>`;
  const shown = fp.values.slice(0, 8);
  return html`<span class="sfd-facet">Покупатель увидит: ${shown.map((v) => html`<span class="sfd-val">${v.value}${f.unit ? ` ${f.unit}` : ''}<i>${v.count}</i></span>`)}${fp.values.length > shown.length ? ` и ещё ${fp.values.length - shown.length}` : ''}</span>`;
}

const FILTER_TYPES: readonly (readonly [string, string])[] = [['chips', 'Список'], ['range', 'От и до']];

function filterRow(ctx: Ctx, f: StoreFilterDef, i: number, n: number): SafeHtml {
  return html`<div class="sfd-frow">
    <div class="sfd-fhead">
      ${input('Название для покупателя', { sf: 'filter', index: i, prop: 'label' }, f.label, { max: 40 })}
      <div class="field sfd-ftype"><span>Выбор</span>${seg(`Как выбирать: ${f.label}`, FILTER_TYPES, f.type, 'sf-filter-type', { index: String(i) })}</div>
      ${input('Единица', { sf: 'filter', index: i, prop: 'unit' }, f.unit ?? '', { placeholder: 'кг, см…', max: 12 })}
      <div class="sfd-tools">
        <button type="button" class="icon-btn" data-action="sf-filter-move" data-index="${i}" data-dir="-1"${on(i === 0, 'disabled')} aria-label="Выше: ${f.label}" data-focus="fup:${i}">${ico('up')}</button>
        <button type="button" class="icon-btn" data-action="sf-filter-move" data-index="${i}" data-dir="1"${on(i === n - 1, 'disabled')} aria-label="Ниже: ${f.label}" data-focus="fdown:${i}">${ico('down')}</button>
        <button type="button" class="icon-btn danger" data-action="sf-filter-delete" data-index="${i}" aria-label="Удалить фильтр: ${f.label}">${ico('trash')}</button>
      </div>
    </div>
    <div class="sfd-fmeta"><span class="sfd-fkey">Поле товара: <b>${keyLabel(f.key)}</b></span><span data-region="facet:${i}">${facetLine(ctx, f)}</span></div>
  </div>`;
}

function oldFiltersNote(ctx: Ctx): SafeHtml | '' {
  const old = oldFilterDefs(ctx.shop.filters);
  if (!old.length) return '';
  return html`<div class="note warn sfd-old">${ico('alert')}<div>
    <b>Фильтры в старом формате: ${old.map((o) => o.label).join(', ')}.</b> Приложение их не показывало. Перенести в фильтры витрины? Значения покупатель увидит из характеристик товаров.
    <div class="sfd-actions"><button type="button" class="btn btn-primary btn-sm" data-action="sf-old-migrate">Перенести</button><button type="button" class="btn btn-secondary btn-sm" data-action="sf-old-drop">Удалить старые</button></div>
  </div></div>`;
}

function addFilterPanel(ctx: Ctx): SafeHtml {
  const keys = attributeKeys(ctx.products, ctx.sf.filters);
  return html`<section class="panel">
    <h4>Добавить фильтр</h4>
    <p>По характеристике товаров этого магазина или по своему полю.</p>
    ${keys.length
      ? html`<div class="chips sfd-keys">${keys.map((k) => html`<button type="button" class="chip" data-action="sf-filter-add" data-key="${k}" data-focus="fadd:${k}">${ico('plus', 'ico-sm')}${keyLabel(k)}<span class="c">${count(valuesOf(ctx.products, k).length, 'значение', 'значения', 'значений')}</span></button>`)}</div>`
      : html`<p class="sfd-empty">Других характеристик у товаров магазина нет.</p>`}
    <div class="sfd-custom">
      <label class="field"><span>Своё поле</span><input class="input" data-sf="custom-key" value="${ctx.ui.customKey}" placeholder="Например, Коллекция" maxlength="40" autocomplete="off" data-focus="custom-key"></label>
      <button type="button" class="btn btn-secondary" data-action="sf-filter-add-custom">${ico('plus')}Добавить</button>
    </div>
    <p class="sfd-hint">Поле называется как характеристика товара: «Ширина, см» станет фильтром «Ширина» в сантиметрах. Значения фильтр берёт из характеристик товаров.</p>
  </section>`;
}

export function renderFilters(ctx: Ctx): SafeHtml {
  const n = ctx.sf.filters.length;
  return html`${oldFiltersNote(ctx)}
    <section class="panel">
      <h4>Фильтры каталога</h4>
      <p>Свои для этого магазина. Покупатель видит фильтр, только если товары по нему различаются; порядок — как здесь.</p>
      <div class="sfd-flist">${n ? ctx.sf.filters.map((f, i) => filterRow(ctx, f, i, n)) : html`<p class="sfd-empty">Фильтров нет — покупатель увидит только сортировку.</p>`}</div>
    </section>
    ${addFilterPanel(ctx)}`;
}

export function renderTab(tab: DesignerTab, ctx: Ctx): SafeHtml {
  const body = tab === 'design' ? renderDesign(ctx) : tab === 'blocks' ? renderBlocks(ctx) : renderFilters(ctx);
  return html`<div class="sfd" data-sfd="${tab}">${body}</div>`;
}
