import { describe, expect, it } from 'vitest';
import type { Product } from '../../src/shared/domain/types';
import { groupByStore, managerMessage, normalizeFavorites, removeStore, telegramHandle, toggleFavorite } from '../../src/shared/catalog/favorites';
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

describe('favourites: groups and the message to the manager', () => {
  const p = (id: string, store: string, price: string, title = `Товар ${id}`): Product => ({ id, title, price, store, status: 'published' });
  const catalog: Record<string, Product> = { a: p('a', 'S1', '1 000 ₽'), b: p('b', 'S2', '500 ₽'), c: p('c', 'S1', '250 ₽') };
  it('groupByStore: in the order added, with the total', () => {
    expect(groupByStore(['a', 'b', 'ghost', 'c'], (id) => catalog[id]).map((g) => [g.store, g.products.length, g.total]))
      .toEqual([['S1', 2, 1250], ['S2', 1, 500]]);
  });
  it('managerMessage: plain text, with no hand-made %0A', () => {
    const text = managerMessage('S1', [p('x', 'S1', '100 ₽', 'Плитка #3 & клей')], { name: 'Анна', phone: '+7 900' });
    expect(text).toContain('1. Плитка #3 & клей — 100 ₽');
    expect(text).toContain('Итого: 100 ₽');
    expect(text).toContain('Телефон: +7 900');
    expect(text).not.toContain('%0A');
  });
  it('telegramHandle', () => {
    expect(telegramHandle('https://t.me/lubimydom')).toBe('lubimydom');
    expect(telegramHandle('@shop')).toBe('shop');
    expect(telegramHandle('#')).toBe('');
    expect(telegramHandle(undefined)).toBe('');
  });
});
