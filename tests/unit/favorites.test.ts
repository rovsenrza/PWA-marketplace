import { describe, expect, it } from 'vitest';
import type { Product } from '../../src/shared/domain/types';
import { normalizeFavorites, removeStore, toggleFavorite } from '../../src/shared/catalog/favorites';
import { FavoritesStore } from '../../src/app/features/favorites/favorites-store';

const db: Record<string, Product> = {
  a: { id: 'a', title: 'A', price: '1 ₽', store: 'Постройка', status: 'published' },
  b: { id: 'b', title: 'B', price: '1 ₽', store: 'Любимый Дом', status: 'published' },
};

describe('favourites: operations', () => {
  it('toggle adds and removes', () => {
    const r1 = toggleFavorite([], 'a');
    expect(r1).toEqual({ ids: ['a'], added: true });
    expect(toggleFavorite(r1.ids, 'a')).toEqual({ ids: [], added: false });
  });
  it('normalisation: strings only, no repeats', () => {
    expect(normalizeFavorites(['a', 'a', 7, null, '', 'b'])).toEqual(['a', 'b']);
    expect(normalizeFavorites('junk')).toEqual([]);
  });
  it('removing a store also drops products that no longer exist', () => {
    expect(removeStore(['a', 'b', 'ghost'], 'Постройка', (id) => db[id])).toEqual(['b']);
  });
});

describe('FavoritesStore', () => {
  it('saves and loads through the repository; list() returns a copy', () => {
    let saved: unknown = [];
    const repo = { loadRaw: () => saved, save: (ids: string[]) => { saved = [...ids]; } };
    const s1 = new FavoritesStore(repo);
    s1.replace(['a', 'b']); s1.save();
    const s2 = new FavoritesStore(repo); s2.load();
    expect(s2.list()).toEqual(['a', 'b']);
    s2.list().push('x');
    expect(s2.count()).toBe(2);
  });
});
