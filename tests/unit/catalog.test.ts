import { describe, expect, it } from 'vitest';
import type { Product, Shop } from '../../src/shared/domain/types';
import { mergeCatalog, mergeDirectory, mergeLifehacks, mergeProducts, mergeShops, stripEmbeddedMedia, type CatalogState } from '../../src/shared/data/catalog';
import { CATALOG_KEYS, createLocalCatalogRepository } from '../../src/shared/data/catalog-repository';
import { CatalogStore } from '../../src/shared/data/catalog-store';
import { memoryStorage } from './support/memory-storage';

const P = (id: string, extra: Partial<Product> = {}): Product => ({ id, title: `T${id}`, price: '1 ₽', store: 'S', status: 'published', ...extra });
const seed = (): CatalogState => ({
  products: { a: P('a', { description: 'из кода', images: ['1.jpg'] }) },
  shops: { S: { name: 'S', status: 'published', banner: 'b.jpg', gallery: ['g.jpg'] } as Shop },
  stories: [{ id: 's1', name: 'Story' }],
  promo: [{ title: 'P', image: 'p.jpg' }],
  directory: { specialists: [{ id: 'm1', craft: 'плиточник' }, { id: 'm2' }], other: 1 },
  vacancies: [{ id: 'v1' }],
  onboarding: [{ title: 'O1' }],
  showcases: [],
  lifehacks: { categories: ['Ремонт', 'Сад'], items: [{ id: 'l1' }] },
  lifehackSaved: [],
});

describe('mergeProducts', () => {
  it('a stored record wins field by field (an admin edit to the description reaches the app)', () => {
    const out = mergeProducts(seed().products, { a: { id: 'a', description: 'отредактировано', price: '2 ₽' } });
    expect(out.a).toMatchObject({ description: 'отредактировано', price: '2 ₽', title: 'Ta', images: ['1.jpg'] });
  });
  it('a store-created product is added; junk is skipped', () => {
    const out = mergeProducts(seed().products, { n: P('n'), bad: 'x' });
    expect(Object.keys(out).sort()).toEqual(['a', 'n']);
  });
});

describe('mergeShops / toStored', () => {
  it('per field: the seed fills fields the stored record lacks', () => {
    expect(mergeShops(seed().shops, { S: { name: 'S', status: 'published', description: 'новое' } }).S).toMatchObject({ banner: 'b.jpg', description: 'новое' });
  });
  it('stripEmbeddedMedia: data: URLs leave, ordinary links stay', () => {
    const shop = { name: 'S', banner: 'data:image/jpeg;base64,AAA', logo: 'logo.png', gallery: ['data:x', 'ok.jpg'], nested: { cover: 'data:y' } };
    expect(stripEmbeddedMedia(shop)).toEqual({ name: 'S', banner: '', logo: 'logo.png', gallery: ['ok.jpg'], nested: { cover: '' } });
    expect(shop.banner.startsWith('data:')).toBe(true); // исходник не тронут
  });

});

describe('directory and lifehacks', () => {
  it('specialists: stored first, missing seed ones appended, craft filled', () => {
    const d = mergeDirectory(seed().directory, { specialists: [{ id: 'm2' }, { id: 'm1' }, { id: 'new' }] });
    expect(d.specialists!.map((s) => s.id)).toEqual(['m2', 'm1', 'new']);
    expect(d.specialists![1].craft).toBe('плиточник');
    expect(d.other).toBe(1);
  });
  it('lifehacks: the old format (array) and the new one with categories completed', () => {
    expect(mergeLifehacks(seed().lifehacks, [{ id: 'x' }]).items.map((i) => i.id)).toEqual(['x']);
    expect(mergeLifehacks(seed().lifehacks, { items: [], categories: ['Своя'] }).categories).toEqual(['Своя', 'Ремонт', 'Сад']);
    expect(mergeLifehacks(seed().lifehacks, []).items.map((i) => i.id)).toEqual(['l1']);
  });
});

describe('mergeCatalog: lists', () => {
  it('an empty stored story or onboarding list does not wipe the seed; vacancies and promo are kept as is', () => {
    const out = mergeCatalog(seed(), { stories: [], onboarding: [], vacancies: [], promo: [] });
    expect([out.stories.length, out.onboarding.length, out.vacancies.length, out.promo.length]).toEqual([1, 1, 0, 0]);
  });
  it('broken parts become the seed', () => {
    const out = mergeCatalog(seed(), { products: 'junk', directory: null, lifehackSaved: ['a', 3] });
    expect(Object.keys(out.products)).toEqual(['a']);
    expect(out.lifehackSaved).toEqual(['a']);
  });
});

describe('the localStorage repository', () => {
  it('an overflow on one part does not cancel the others (before, saving stopped at the first error)', () => {
    const storage = memoryStorage(CATALOG_KEYS.shops);
    const r = createLocalCatalogRepository(storage).save(seed());
    expect(r).toEqual({ failed: ['shops'], degraded: [], quotaExceeded: true });
    for (const k of [CATALOG_KEYS.stories, CATALOG_KEYS.vacancies, CATALOG_KEYS.lifehacks]) expect(storage.dump[k]).toBeTruthy();
    expect(storage.dump.meb_updated).toBeTruthy();
  });
  it('only the listed parts are saved; a broken JSON record reads as a missing one', () => {
    const storage = memoryStorage();
    createLocalCatalogRepository(storage).save(seed(), ['products', 'promo']);
    expect(Object.keys(storage.dump).sort()).toEqual(['meb_products', 'meb_promo', 'meb_updated']);
    storage.dump.meb_stories = '{broken';
    expect(createLocalCatalogRepository(storage).load()).not.toHaveProperty('stories');
  });
});

describe('saving with embedded photos', () => {
  it('photos are saved with the data when they fit (before, store banners were always stripped)', () => {
    const storage = memoryStorage();
    const st = seed(); st.shops.S = { ...st.shops.S, banner: 'data:image/jpeg;base64,QUJD' };
    expect(createLocalCatalogRepository(storage).save(st, ['shops'])).toEqual({ failed: [], degraded: [], quotaExceeded: false });
    expect(JSON.parse(storage.dump.meb_shops).S.banner).toBe('data:image/jpeg;base64,QUJD');
  });
  it('they did not fit: the part is saved without photos (the edits are not lost)', () => {
    const storage = memoryStorage();
    const set = storage.setItem;
    storage.setItem = (k, v) => { if (v.includes('data:')) { const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; } set(k, v); };
    const st = seed(); st.shops.S = { ...st.shops.S, banner: 'data:image/jpeg;base64,QUJD', description: 'новое описание' };
    expect(createLocalCatalogRepository(storage).save(st, ['shops'])).toEqual({ failed: [], degraded: ['shops'], quotaExceeded: true });
    expect(JSON.parse(storage.dump.meb_shops).S).toMatchObject({ banner: '', description: 'новое описание' });
  });
});

describe('saving the import: all or nothing', () => {
  const quotaOnPhotos = (storage: ReturnType<typeof memoryStorage>) => {
    const set = storage.setItem;
    storage.setItem = (k, v) => { if (v.includes('data:')) { const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; } set(k, v); };
  };
  it('strict: a part that does not fit is not saved without its photos; the stored value stays', () => {
    const storage = memoryStorage();
    const repo = createLocalCatalogRepository(storage);
    repo.save(seed(), ['products']);
    const before = storage.dump.meb_products;
    quotaOnPhotos(storage);
    const st = seed(); st.products.n = P('n', { image: 'data:image/jpeg;base64,QUJD' });
    expect(repo.save(st, ['products'], { strict: true })).toEqual({ failed: ['products'], degraded: [], quotaExceeded: true });
    expect(storage.dump.meb_products).toBe(before);
  });
  it('not strict: a published product that loses its only photo goes to drafts (no empty cards for buyers)', () => {
    const storage = memoryStorage();
    quotaOnPhotos(storage);
    const st = seed();
    st.products.n = P('n', { image: 'data:image/jpeg;base64,QUJD' });
    st.products.u = P('u', { image: 'https://cdn/u.jpg', images: ['data:image/jpeg;base64,QUJD'] });
    expect(createLocalCatalogRepository(storage).save(st, ['products']).degraded).toEqual(['products']);
    const saved = JSON.parse(storage.dump.meb_products);
    expect(saved.n).toMatchObject({ image: '', status: 'draft' });
    expect(saved.u).toMatchObject({ image: 'https://cdn/u.jpg', images: [], status: 'published' });
    expect(st.products.n.status).toBe('published'); // в памяти — как было
  });
});

describe('CatalogStore', () => {
  it('save → load in another store: the data survives, the seed fills the gaps', () => {
    const storage = memoryStorage();
    const repo = createLocalCatalogRepository(storage);
    const a = new CatalogStore(seed, repo);
    a.state.products.n = P('n', { title: 'Новый' });
    a.state.products.a.description = 'правка';
    a.save();
    const b = new CatalogStore(seed, repo);
    b.load();
    expect(b.state.products.n.title).toBe('Новый');
    expect(b.state.products.a).toMatchObject({ description: 'правка', images: ['1.jpg'] });
  });
});
