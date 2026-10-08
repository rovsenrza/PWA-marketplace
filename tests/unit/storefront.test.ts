import { describe, expect, it } from 'vitest';
import {
  FAMILY_INKS, INK_DARK, INK_LIGHT, contrastRatio, inkFor, mixHex, normalizeHex, onInk,
  storeKindOf, REQUIRED_BLOCKS, presetBlocks, presetFilters, presetTheme, newBlock,
  resolveStorefront, normalizeBlock, buildFacets, applyFilters, activeCount, sortProducts, productValue, toNumber,
  mixSpecOf, calcBags,
} from '../../src/shared/storefront';
import type { ProductLike, StoreFilterDef, StoreKind } from '../../src/shared/storefront';

describe('colour', () => {
  it('normalises hex', () => {
    expect(normalizeHex('#ffc20e')).toBe('#FFC20E');
    expect(normalizeHex('abc')).toBe('#AABBCC');
    expect(normalizeHex(' #0F6A3C ')).toBe('#0F6A3C');
    for (const bad of ['', 'red', '#12', '#GGGGGG', null, 42]) expect(normalizeHex(bad)).toBeNull();
  });
  it('picks black text on yellow and white text on deep green', () => {
    expect(onInk('#FFC20E')).toBe(INK_DARK);
    expect(onInk('#0F6A3C')).toBe(INK_LIGHT);
  });
  it('every family ink reads at AA with its on-ink colour', () => {
    for (const { hex } of FAMILY_INKS) expect(contrastRatio(hex, onInk(hex))).toBeGreaterThanOrEqual(4.5);
  });
  it('family inks never include the platform orange', () => {
    expect(FAMILY_INKS.map((i) => i.hex)).not.toContain('#FE5000');
  });
  it('mixes linearly', () => {
    expect(mixHex('#000000', '#FFFFFF', 0)).toBe('#000000');
    expect(mixHex('#000000', '#FFFFFF', 1)).toBe('#FFFFFF');
    expect(mixHex('#000000', '#FFFFFF', 0.5)).toBe('#808080');
  });
  it('gives a stable ink from the family set', () => {
    expect(inkFor('Постройка')).toBe(inkFor('  постройка '));
    expect(FAMILY_INKS.map((i) => i.hex)).toContain(inkFor('Кровельщик'));
    const inks = new Set(['Кровельщик', 'Рио+', 'Дары леса', 'Самоделкин', 'Вудстул', 'Мир Плитки', 'Дом сантехники', 'Hess stroy'].map(inkFor));
    expect(inks.size).toBeGreaterThanOrEqual(4);
  });
});

describe('store kind', () => {
  it.each<[string, StoreKind]>([
    ['Кухни', 'kitchens'], ['Мебель', 'furniture'], ['Товары для дома', 'furniture'],
    ['Стройматериалы', 'mixtures'], ['Отделка', 'mixtures'], ['Сантехника', 'mixtures'], ['Двери', 'mixtures'],
    ['Строительство', 'mixtures'], ['Ландшафт', 'general'], ['', 'general'],
  ])('%s → %s', (category, kind) => expect(storeKindOf({ category })).toBe(kind));
  it('a saved kind wins over the category', () => {
    expect(storeKindOf({ category: 'Мебель', storefront: { kind: 'kitchens' } })).toBe('kitchens');
    expect(storeKindOf({ category: 'Мебель', storefront: { kind: 'boats' } })).toBe('furniture');
  });
});

describe('presets', () => {
  it.each<StoreKind>(['mixtures', 'kitchens', 'furniture', 'general'])('%s preset holds the whole skeleton', (kind) => {
    const types = presetBlocks(kind).map((b) => b.type);
    for (const t of REQUIRED_BLOCKS) expect(types).toContain(t);
    expect(types[0]).toBe('cover');
    expect(presetFilters(kind).slice(-1)[0]).toEqual({ key: 'price', label: 'Цена', type: 'range', unit: '₽' });
  });
  it('kitchens get example process steps', () => {
    const steps = presetBlocks('kitchens').find((b) => b.type === 'steps');
    expect(steps && steps.type === 'steps' && steps.items.length).toBe(4);
    expect(steps?.example).toBe(true);
  });
  it('themes per kind', () => {
    expect(presetTheme('kitchens', 'X')).toMatchObject({ ground: 'black', voice: 'modern', cover: 'full' });
    expect(presetTheme('mixtures', 'X')).toMatchObject({ ground: 'stock', voice: 'industrial', cover: 'field' });
    expect(presetTheme('furniture', 'X')).toMatchObject({ ground: 'tint', voice: 'classic', cover: 'split' });
    expect(presetTheme('general', 'X').ink).toBe(inkFor('X'));
  });
  it('new blocks carry empty content arrays', () => {
    expect(newBlock('lookbook')).toEqual({ id: 'lookbook-1', type: 'lookbook', on: true, image: '', pins: [] });
    expect(newBlock('promo', 'p9')).toEqual({ id: 'p9', type: 'promo', on: true, text: '' });
  });
});

describe('resolveStorefront', () => {
  const products: ProductLike[] = [
    { id: 'a', store: 'Тест', category: 'спальня', price: '10 000 ₽' },
    { id: 'b', store: 'Тест', category: 'гостиная', price: '20 000 ₽' },
    { id: 'c', store: 'Другой', category: 'кухня', price: '5 ₽' },
  ];
  it('a shop without a storefront gets its kind preset', () => {
    const sf = resolveStorefront({ name: 'Тест', category: 'Мебель' }, products);
    expect(sf.kind).toBe('furniture');
    expect(sf.blocks.map((b) => b.type)).toEqual(presetBlocks('furniture').map((b) => b.type));
    expect(sf.demo).toBe(false);
  });
  it('derives categories from the store\'s own products only', () => {
    const sf = resolveStorefront({ name: 'Тест', category: 'Мебель' }, products);
    const cat = sf.blocks.find((b) => b.type === 'categories');
    expect(cat && cat.type === 'categories' && cat.items).toEqual([
      { label: 'Спальня', key: 'category', value: 'спальня' },
      { label: 'Гостиная', key: 'category', value: 'гостиная' },
    ]);
  });
  it('repairs a garbage theme field by field', () => {
    const sf = resolveStorefront({ name: 'Тест', category: 'Мебель', storefront: { theme: { ink: 'nope', ground: 'black', voice: 'loud' as never, cover: 'split' } } });
    expect(sf.theme).toEqual({ ink: inkFor('Тест'), ground: 'black', voice: 'classic', cover: 'split' });
  });
  it('re-adds missing required blocks, forces them on and puts the cover first', () => {
    const sf = resolveStorefront({ name: 'Тест', storefront: { blocks: [
      { id: 'g', type: 'gallery', on: false },
      { id: 'm', type: 'managers', on: false },
      { id: 'c', type: 'cover', on: false },
      { id: 'x', type: 'teleport', on: true },
      'junk',
    ] } });
    const types = sf.blocks.map((b) => b.type);
    expect(types[0]).toBe('cover');
    for (const t of REQUIRED_BLOCKS) expect(types).toContain(t);
    expect(types).not.toContain('teleport' as never);
    expect(sf.blocks.find((b) => b.type === 'managers')?.on).toBe(true);
    expect(sf.blocks.find((b) => b.type === 'cover')?.on).toBe(true);
    expect(sf.blocks.find((b) => b.type === 'gallery')?.on).toBe(false);
  });
  it('makes duplicate ids unique', () => {
    const sf = resolveStorefront({ name: 'Тест', storefront: { blocks: [
      { id: 'p', type: 'promo', on: true, text: 'a' }, { id: 'p', type: 'promo', on: true, text: 'b' },
    ] } });
    const ids = sf.blocks.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('fills missing content arrays instead of crashing', () => {
    expect(normalizeBlock({ id: 'l', type: 'lookbook' })).toEqual({ id: 'l', type: 'lookbook', on: true, image: '', pins: [] });
    expect(normalizeBlock({ type: 'steps', on: 'yes' })).toMatchObject({ type: 'steps', on: true, items: [] });
    expect(normalizeBlock({ id: 1, type: 'about', on: false })).toMatchObject({ id: 'about-1', type: 'about', on: false });
    expect(normalizeBlock(null)).toBeNull();
  });
  it('uses saved filters when valid, the preset otherwise', () => {
    const own = [{ key: 'Цвет', label: 'Цвет', type: 'chips' as const }];
    expect(resolveStorefront({ name: 'Тест', category: 'Мебель', storefront: { filters: own } }).filters).toEqual(own);
    expect(resolveStorefront({ name: 'Тест', category: 'Мебель', storefront: { filters: [{ key: 1 }] } }).filters).toEqual(presetFilters('furniture'));
  });
});

describe('filters', () => {
  const items: ProductLike[] = [
    { id: '1', price: '520 ₽', attrs: { 'Тип': 'Штукатурка', 'Основа': 'гипс', 'Фасовка, кг': 30 } },
    { id: '2', price: '430 ₽', attrs: { 'Тип': 'Штукатурка', 'Основа': 'цемент', 'Фасовка, кг': 25 } },
    { id: '3', price: '760 ₽', badge: 'new', attrs: { 'Тип': 'Шпаклёвка', 'Основа': 'полимер', 'Фасовка, кг': 20 } },
    { id: '4', price: 'договорная', attrs: { 'Тип': 'Грунтовка' } },
  ];
  const defs = [
    { key: 'Тип', label: 'Тип', type: 'chips' as const },
    { key: 'Фасовка, кг', label: 'Фасовка', type: 'chips' as const, unit: 'кг' },
    { key: 'Бренд', label: 'Бренд', type: 'chips' as const },
    { key: 'price', label: 'Цена', type: 'range' as const, unit: '₽' },
  ];
  it('reads values: price, store, category, attrs, imported brand', () => {
    expect(productValue(items[0], 'price')).toBe(520);
    expect(productValue(items[3], 'price')).toBeUndefined();
    expect(productValue({ id: 'x', store: 'S', category: 'c' }, 'store')).toBe('S');
    expect(productValue({ id: 'x', brand: 'Волма' }, 'Бренд')).toBe('Волма');
    expect(toNumber('1,5')).toBe(1.5);
    expect(toNumber('abc')).toBeNull();
  });
  it('builds facets, dropping one-value chips and flat ranges', () => {
    const facets = buildFacets(items, defs);
    expect(facets.map((f) => f.def.key)).toEqual(['Тип', 'Фасовка, кг', 'price']);
    const type = facets[0];
    expect(type.type === 'chips' && type.values[0]).toEqual({ value: 'Штукатурка', count: 2 });
    const pack = facets[1];
    expect(pack.type === 'chips' && pack.values.map((v) => v.value)).toEqual(['20', '25', '30']);
    expect(facets[2]).toMatchObject({ type: 'range', min: 430, max: 760 });
  });
  it('applies chips, ranges and keys outside the defs', () => {
    expect(applyFilters(items, defs, { 'Тип': ['Штукатурка'] }).map((p) => p.id)).toEqual(['1', '2']);
    expect(applyFilters(items, defs, { price: { min: 500 } }).map((p) => p.id)).toEqual(['1', '3']);
    expect(applyFilters(items, defs, { price: {} }).map((p) => p.id)).toEqual(['1', '2', '3', '4']);
    expect(applyFilters(items, defs, { 'Основа': ['гипс'] }).map((p) => p.id)).toEqual(['1']);
    expect(applyFilters(items, defs, { 'Тип': [] }).length).toBe(4);
    expect(activeCount({ 'Тип': ['a'], price: { max: 3 }, 'Цвет': [], x: {} })).toBe(2);
  });
  it('sorts; unknown prices go last', () => {
    expect(sortProducts(items, 'cheap').map((p) => p.id)).toEqual(['2', '1', '3', '4']);
    expect(sortProducts(items, 'expensive').map((p) => p.id)).toEqual(['3', '1', '2', '4']);
    expect(sortProducts(items, 'new').map((p) => p.id)).toEqual(['3', '1', '2', '4']);
    expect(sortProducts(items, 'popular').map((p) => p.id)).toEqual(['1', '2', '3', '4']);
  });
});

describe('calculator', () => {
  it('reads a mix spec only when both numbers are there', () => {
    expect(mixSpecOf({ id: 'a', attrs: { 'Расход, кг/м²·мм': '0,9', 'Фасовка, кг': 30 } })).toEqual({ rate: 0.9, bagKg: 30 });
    expect(mixSpecOf({ id: 'b', attrs: { 'Фасовка, кг': 30 } })).toBeNull();
    expect(mixSpecOf({ id: 'c' })).toBeNull();
  });
  it('20 m² × 10 mm of gypsum plaster at 0.9 kg with 10% reserve → 198 kg → 7 bags of 30 kg', () => {
    expect(calcBags(20, 10, { rate: 0.9, bagKg: 30 })).toEqual({ kg: 198, bags: 7 });
    expect(calcBags(20, 10, { rate: 0.9, bagKg: 30 }, 0)).toEqual({ kg: 180, bags: 6 });
  });
  it('nonsense input gives zero, not NaN', () => {
    for (const [a, l] of [[0, 10], [-5, 10], [Number.NaN, 10], [10, 0]]) expect(calcBags(a, l, { rate: 1, bagKg: 25 })).toEqual({ kg: 0, bags: 0 });
  });
});

describe('a bare store', () => {
  const one: ProductLike = { id: 'p', store: 'Голая', category: 'Что-то', price: '100 ₽', attrs: { 'Тип': 'Один' } };
  it.each(['Мебель', 'Кухни', 'Стройматериалы', 'Ландшафт', undefined])(
    'no storefront, no services or managers, one product, category %s: whole skeleton, nothing to filter by',
    (category) => {
      const sf = resolveStorefront({ name: 'Голая', category }, [one]);
      const types = sf.blocks.map((b) => b.type);
      for (const t of REQUIRED_BLOCKS) expect(types).toContain(t);
      expect(types[0]).toBe('cover');
      expect(buildFacets([one], sf.filters)).toEqual([]);
    },
  );
});

describe('a damaged saved storefront', () => {
  it('is repaired, not thrown on', () => {
    const sf = resolveStorefront({
      name: 'Мусор', category: 'Мебель',
      storefront: {
        theme: { ink: '#GGGGGG' },
        blocks: [{ type: 'categories' }, { type: 'lookbook', pins: 'x' }, { type: 'steps', items: [null, 1, { title: 'a', text: 'b' }] }, { type: 'teleport' }, null],
        filters: 'nope',
      } as never,
    }, [{ id: 'p', store: 'Мусор', category: 'спальня' }]);
    const by = (t: string) => sf.blocks.find((b) => b.type === t) as { items?: unknown[]; pins?: unknown[] };
    expect(sf.theme.ink).toMatch(/^#[0-9A-F]{6}$/);
    expect(by('categories').items).toHaveLength(1);
    expect(by('lookbook').pins).toEqual([]);
    expect(by('steps').items).toEqual([{ title: 'a', text: 'b' }]);
    expect(sf.filters.length).toBeGreaterThan(0);
    for (const t of REQUIRED_BLOCKS) expect(sf.blocks.map((b) => b.type)).toContain(t);
  });
  it('non-array blocks fall back to the preset; non-array content becomes []', () => {
    expect(resolveStorefront({ name: 'A', storefront: { blocks: 'x' } as never }).blocks.length).toBeGreaterThan(0);
    expect(normalizeBlock({ type: 'steps', items: 'x' })).toMatchObject({ items: [] });
  });
  it('never mutates or shares the saved blocks', () => {
    const saved = { blocks: [{ id: 'a', type: 'about', on: false }, { id: 's', type: 'steps', items: [{ title: 't', text: 'x' }] }] };
    const before = JSON.stringify(saved);
    const sf = resolveStorefront({ name: 'A', storefront: saved as never });
    (sf.blocks.find((b) => b.type === 'steps') as { items: { title: string }[] }).items[0].title = 'CHANGED';
    expect(JSON.stringify(saved)).toBe(before);
  });
});

describe('facets and bounds on products that lack a value', () => {
  const defs: StoreFilterDef[] = [{ key: 'Тип', label: 'Тип', type: 'chips' }, { key: 'price', label: 'Цена', type: 'range' }];
  it('one distinct value gives no chip, equal prices give no range', () => {
    const same: ProductLike[] = [{ id: '1', price: '100 ₽', attrs: { 'Тип': 'A' } }, { id: '2', price: '100 ₽', attrs: { 'Тип': 'A' } }, { id: '3', price: '100 ₽' }];
    expect(buildFacets(same, defs)).toEqual([]);
    expect(buildFacets([{ id: '1', attrs: { 'Тип': 'A' } }, { id: '2' }, { id: '3' }], defs)).toEqual([]);
  });
  it('a max bound, like a min bound, leaves out products with no value', () => {
    const ps: ProductLike[] = [{ id: '1', price: '100 ₽' }, { id: '2', price: '300 ₽' }, { id: '3' }];
    expect(applyFilters(ps, defs, { price: { max: 250 } }).map((p) => p.id)).toEqual(['1']);
    expect(applyFilters(ps, defs, { price: { min: 0 } }).map((p) => p.id)).toEqual(['1', '2']);
  });
});

describe('repairs the implementation adds beyond the brief', () => {
  it('a blank block id counts as missing', () => {
    expect(normalizeBlock({ id: '  ', type: 'promo' })).toMatchObject({ id: 'promo-1' });
  });
  it('a mix with no usable rate or bag size calculates to zero, not Infinity', () => {
    expect(calcBags(20, 10, { rate: 0, bagKg: 30 })).toEqual({ kg: 0, bags: 0 });
    expect(calcBags(20, 10, { rate: 1, bagKg: 0 })).toEqual({ kg: 0, bags: 0 });
  });
  it('a saved filter of an unknown type is not kept', () => {
    const sf = resolveStorefront({ name: 'A', category: 'Мебель', storefront: { filters: [{ key: 'k', label: 'K', type: 'dropdown' }] } as never });
    expect(sf.filters).toEqual(presetFilters('furniture'));
  });
});
