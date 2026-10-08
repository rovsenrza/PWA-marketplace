import { describe, expect, it } from 'vitest';
import {
  addBlock, addFilter, applyPreset, attributeKeys, canAddBlock, canMoveBlock, countMatching, derivedCategories, facetPreview,
  finalizeStorefront, keepOneCover, migrateOldFilters, moveBlock, moveItem, oldFilterDefs, presetChanges, removeBlock,
  setBlockOn, suggestFilter, valuesOf,
} from '../../src/admin/features/storefront-designer/model';
import { REQUIRED_BLOCKS, presetBlocks, presetFilters, resolveStorefront } from '../../src/shared/storefront';
import type { ProductLike, Storefront, StorefrontBlock } from '../../src/shared/storefront';

const sfOf = (raw: unknown, name = 'Любимый Дом', category = 'Мебель', products: ProductLike[] = []): Storefront =>
  resolveStorefront({ name, category, storefront: raw as never }, products);
const types = (sf: Storefront) => sf.blocks.map((b) => b.type);
const byType = (sf: Storefront, t: string) => sf.blocks.find((b) => b.type === t) as StorefrontBlock & Record<string, unknown>;

const goods: ProductLike[] = [
  { id: 'a', store: 'S', category: 'спальня', price: '57 240 ₽', attrs: { Комната: 'Спальня', 'Ширина, см': 160 } },
  { id: 'b', store: 'S', category: 'спальня', price: '19 900 ₽', attrs: { Комната: 'Спальня', 'Ширина, см': 90 } },
  { id: 'c', store: 'S', category: 'гостиная', price: '34 200 ₽', attrs: { Комната: 'Гостиная', 'Ширина, см': 200 } },
  { id: 'd', store: 'S', category: 'гостиная', price: '9 990 ₽', brand: 'Аскона', attrs: { 'Ширина, см': 120 } },
  { id: 'e', store: 'S', category: 'декор', price: '1 200 ₽', attrs: { 'Ширина, см': 45 } },
];

describe('one cover, first', () => {
  it('keeps the first cover and takes a line, image or title only a later one had', () => {
    const sf = sfOf({ blocks: [{ type: 'catalog' }, { type: 'cover', id: 'c1' }, { type: 'cover', id: 'c2', line: 'Строка', image: 'x.jpg' }, { type: 'cover', id: 'c3', line: 'Другая' }] });
    keepOneCover(sf);
    expect(types(sf).filter((t) => t === 'cover')).toHaveLength(1);
    expect(sf.blocks[0]).toMatchObject({ id: 'c1', type: 'cover', on: true, line: 'Строка', image: 'x.jpg' });
  });
  it('a cover whose line is not text does not win over a real one', () => {
    const sf = sfOf({ blocks: [{ type: 'cover', line: 42 }, { type: 'cover', line: 'Настоящая' }] });
    keepOneCover(sf);
    expect(byType(sf, 'cover').line).toBe('Настоящая');
  });
});

describe('blocks: order, visibility, deletion', () => {
  it('the cover never moves and nothing goes above it', () => {
    const sf = sfOf(undefined);
    const second = sf.blocks[1].id;
    expect(canMoveBlock(sf, sf.blocks[0].id, 1)).toBe(false);
    expect(canMoveBlock(sf, second, -1)).toBe(false);
    expect(moveBlock(sf, second, -1)).toBe(false);
    expect(canMoveBlock(sf, sf.blocks[sf.blocks.length - 1].id, 1)).toBe(false);
  });
  it('moves a block one step and keeps the block object', () => {
    const sf = sfOf(undefined);
    const block = sf.blocks[2];
    expect(moveBlock(sf, block.id, -1)).toBe(true);
    expect(sf.blocks[1]).toBe(block);
    expect(moveBlock(sf, block.id, 1)).toBe(true);
    expect(sf.blocks[2]).toBe(block);
  });
  it('required blocks stay on and can not be deleted; optional ones can be hidden and deleted', () => {
    const sf = sfOf(undefined);
    for (const t of REQUIRED_BLOCKS) {
      const b = byType(sf, t);
      expect(setBlockOn(sf, b.id, false)).toBe(false);
      expect(b.on).toBe(true);
      expect(removeBlock(sf, b.id)).toBe(false);
    }
    const gallery = byType(sf, 'gallery');
    expect(setBlockOn(sf, gallery.id, false)).toBe(true);
    expect(gallery.on).toBe(false);
    expect(removeBlock(sf, gallery.id)).toBe(true);
    expect(types(sf)).not.toContain('gallery');
  });
});

describe('adding blocks', () => {
  it('only optional types; a calculator, gallery or sections once; promos and lookbooks again', () => {
    const sf = sfOf(undefined); // furniture: has categories and gallery
    expect(canAddBlock(sf, 'about')).toBe(false);
    expect(canAddBlock(sf, 'gallery')).toBe(false);
    expect(canAddBlock(sf, 'categories')).toBe(false);
    expect(canAddBlock(sf, 'calculator')).toBe(true);
    expect(addBlock(sf, 'promo')?.id).toBe('promo-1');
    expect(addBlock(sf, 'promo')?.id).toBe('promo-2');
    expect(addBlock(sf, 'calculator')).not.toBeNull();
    expect(addBlock(sf, 'calculator')).toBeNull();
  });
  it('goes in before the closing blocks, with its content arrays in place', () => {
    const sf = sfOf(undefined);
    const b = addBlock(sf, 'steps') as StorefrontBlock & { items: unknown[] };
    const i = sf.blocks.indexOf(b);
    expect(b).toMatchObject({ type: 'steps', on: true, items: [] });
    expect(types(sf).slice(i + 1)).toEqual(['about', 'addresses', 'managers', 'terms']);
  });
  it('ids stay unique when a saved block already took the default id', () => {
    const sf = sfOf({ blocks: [{ type: 'cover' }, { type: 'promo', id: 'promo-1' }] });
    expect(addBlock(sf, 'promo')?.id).toBe('promo-2');
  });
});

describe('loading a type preset', () => {
  it('takes the preset order and filters, keeps what the store wrote, drops the rest, keeps the ink', () => {
    const sf = sfOf({ theme: { ink: '#0F6A3C' }, blocks: [{ type: 'cover', line: 'Мебель для дома' }, { type: 'promo', text: 'Акция' }, { type: 'about', text: 'О нас' }] });
    expect(presetChanges(sf, 'kitchens').removed).toEqual(['promo']);
    applyPreset(sf, 'kitchens', 'Любимый Дом', true);
    expect(sf.kind).toBe('kitchens');
    expect(types(sf)).toEqual(presetBlocks('kitchens').map((b) => b.type));
    expect(byType(sf, 'cover').line).toBe('Мебель для дома');
    expect(byType(sf, 'about').text).toBe('О нас');
    expect(byType(sf, 'steps').example).toBe(true);
    expect(sf.filters).toEqual(presetFilters('kitchens'));
    expect(sf.theme).toEqual({ ink: '#0F6A3C', ground: 'black', voice: 'modern', cover: 'full' });
    expect(new Set(sf.blocks.map((b) => b.id)).size).toBe(sf.blocks.length);
    expect(sf.blocks.every((b) => b.on)).toBe(true);
  });
  it('without the look only blocks, filters and kind change', () => {
    const sf = sfOf({ theme: { ink: '#0F6A3C', ground: 'stock', voice: 'industrial', cover: 'field' } });
    applyPreset(sf, 'general', 'Любимый Дом', false);
    expect(sf.theme).toEqual({ ink: '#0F6A3C', ground: 'stock', voice: 'industrial', cover: 'field' });
    expect(sf.filters).toEqual(presetFilters('general'));
  });
});

describe('section tiles', () => {
  it('derived tiles are what resolve derives from the products', () => {
    expect(derivedCategories('S', goods).map((i) => i.value)).toEqual(['спальня', 'гостиная', 'декор']);
  });
  it('counts products the way the catalogue filters them (exact value)', () => {
    expect(countMatching(goods, 'category', 'спальня')).toBe(2);
    expect(countMatching(goods, 'Комната', 'Гостиная')).toBe(1);
    expect(countMatching(goods, 'Комната', 'гостиная')).toBe(0);
    expect(countMatching(goods, '', 'x')).toBe(0);
    expect(valuesOf(goods, 'Комната')).toEqual(['Спальня', 'Гостиная']);
  });
});

describe('filters', () => {
  it('offers the attributes, brand, category and price the store does not filter by yet', () => {
    expect(attributeKeys(goods, [])).toEqual(['category', 'price', 'Ширина, см', 'Комната', 'Бренд']);
    expect(attributeKeys(goods, [{ key: 'Комната', label: 'Комната', type: 'chips' }, { key: 'price', label: 'Цена', type: 'range' }])).not.toContain('Комната');
    expect(attributeKeys([{ id: 'x', attrs: 'oops' as never }, { id: 'y', attrs: { '  ': 1 } }], [])).toEqual([]);
  });
  it('suggests a label, a unit and a type', () => {
    expect(suggestFilter('Ширина, см', goods)).toEqual({ key: 'Ширина, см', label: 'Ширина', type: 'range', unit: 'см' });
    expect(suggestFilter('Комната', goods)).toEqual({ key: 'Комната', label: 'Комната', type: 'chips' });
    expect(suggestFilter('price', goods)).toEqual({ key: 'price', label: 'Цена', type: 'range', unit: '₽' });
    expect(suggestFilter(' Коллекция ', goods)).toEqual({ key: 'Коллекция', label: 'Коллекция', type: 'chips' });
  });
  it('a new filter goes before the price; an empty or used key is refused', () => {
    const sf = sfOf(undefined);
    expect(addFilter(sf, { key: 'Коллекция', label: 'Коллекция', type: 'chips' })).toBe(true);
    expect(sf.filters.slice(-2).map((f) => f.key)).toEqual(['Коллекция', 'price']);
    expect(addFilter(sf, { key: 'Коллекция', label: 'Ещё раз', type: 'chips' })).toBe(false);
    expect(addFilter(sf, { key: '  ', label: '', type: 'chips' })).toBe(false);
  });
  it('the old per-store filters move over once', () => {
    const old = [{ name: 'Цвет', type: 'Список', vals: ['Белый'] }, { name: 'Размер', type: 'Диапазон', vals: [] }, { name: '' }, 'x', { name: 'Комната', type: 'Список' }];
    expect(oldFilterDefs(old)).toEqual([
      { key: 'Цвет', label: 'Цвет', type: 'chips' }, { key: 'Размер', label: 'Размер', type: 'range' }, { key: 'Комната', label: 'Комната', type: 'chips' },
    ]);
    const sf = sfOf(undefined);
    expect(migrateOldFilters(sf, old)).toBe(1); // «Цвет» and «Комната» are in the furniture preset already
    expect(sf.filters.slice(-2).map((f) => f.key)).toEqual(['Размер', 'price']);
    expect(oldFilterDefs('nope')).toEqual([]);
  });
  it('previews what the buyer will see, or why the filter stays hidden', () => {
    expect(facetPreview({ key: 'Комната', label: 'Комната', type: 'chips' }, goods)).toEqual({ shown: true, type: 'chips', values: [{ value: 'Спальня', count: 2 }, { value: 'Гостиная', count: 1 }] });
    expect(facetPreview({ key: 'price', label: 'Цена', type: 'range' }, goods)).toEqual({ shown: true, type: 'range', min: 1200, max: 57240 });
    expect(facetPreview({ key: 'Цвет', label: 'Цвет', type: 'chips' }, goods)).toMatchObject({ shown: false, reason: expect.stringContaining('нет значения «Цвет»') });
    expect(facetPreview({ key: 'Комната', label: 'Комната', type: 'chips' }, goods.slice(0, 2))).toMatchObject({ shown: false, reason: expect.stringContaining('одно значение — «Спальня»') });
    expect(facetPreview({ key: 'Комната', label: 'Комната', type: 'range' }, goods)).toMatchObject({ shown: false, reason: expect.stringContaining('не числа') });
    expect(facetPreview({ key: 'price', label: 'Цена', type: 'range' }, [])).toMatchObject({ shown: false, reason: expect.stringContaining('нет опубликованных') });
  });
});

describe('saving', () => {
  it('drops blank items, clamps pins, fills labels, normalises the ink, keeps the skeleton on', () => {
    const sf = sfOf({
      theme: { ink: '#0f6a3c' },
      blocks: [
        { type: 'cover' }, { type: 'cover', line: 'Вторая' },
        { type: 'steps', items: [{ title: '', text: '' }, { title: 'Замер', text: '' }] },
        { type: 'lookbook', image: 'x.jpg', pins: [{ x: 140, y: -5, productId: 7 }, { x: '33,3', y: 'oops', productId: 'p1' }] },
        { type: 'swatches', items: [{ name: '' }, { name: '', color: '#B4875A' }] },
      ],
      filters: [{ key: 'Комната', label: '', type: 'chips' }],
    });
    sf.theme.ink = '#0f6a3c';
    byType(sf, 'catalog').on = false;
    finalizeStorefront(sf);
    expect(types(sf).filter((t) => t === 'cover')).toHaveLength(1);
    expect(byType(sf, 'cover').line).toBe('Вторая');
    expect(byType(sf, 'steps').items).toEqual([{ title: 'Замер', text: '' }]);
    expect(byType(sf, 'swatches').items).toEqual([{ name: '', color: '#B4875A' }]);
    expect(byType(sf, 'lookbook').pins).toEqual([{ x: 100, y: 0, productId: '' }, { x: 33.3, y: 50, productId: 'p1' }]);
    expect(sf.filters).toEqual([{ key: 'Комната', label: 'Комната', type: 'chips' }]);
    expect(sf.theme.ink).toBe('#0F6A3C');
    expect(byType(sf, 'catalog').on).toBe(true);
  });
  it('section tiles the store never changed are saved empty, so they keep following the products', () => {
    const sf = sfOf(undefined, 'S', 'Мебель', goods);
    const cats = byType(sf, 'categories') as StorefrontBlock & { items: unknown[] };
    expect(cats.items).toHaveLength(3);
    finalizeStorefront(sf, (b) => b === cats);
    expect(cats.items).toEqual([]);
  });
  it('moves items in place within bounds', () => {
    const list = ['a', 'b', 'c'];
    expect(moveItem(list, 0, -1)).toBe(false);
    expect(moveItem(list, 0, 1)).toBe(true);
    expect(list).toEqual(['b', 'a', 'c']);
    expect(moveItem(list, 2, 1)).toBe(false);
  });
});
