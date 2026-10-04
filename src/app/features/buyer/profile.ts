/** The buyer card in the profile and its editor (the old names: the markup calls them). */
import { buyerStore as store } from './buyer-store';
import { favoritesStore } from '../favorites/favorites-store';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T | null;
const setText = (id: string, text: string) => { const el = $(id); if (el) el.innerText = text; };
const valueOf = (id: string) => ($<HTMLInputElement>(id)?.value ?? '').trim();
const toast = (msg: string) => window.showSmsToast?.(msg);

export function updateBuyerFavCount(): void {
  setText('buyer-fav-count', String(favoritesStore.count()));
}

export function renderBuyerCard(): void {
  const p = store.get();
  setText('buyer-view-name', p.name || 'Не указано');
  setText('buyer-view-phone', p.phone || 'Не указан');
  setText('buyer-view-email', p.email || state.userEmail || 'Не указан');
  setText('buyer-view-city', p.city || 'Не указан');
  setText('user-avatar-letter', (p.name[0] ?? 'П').toUpperCase());
  setText('user-display-email', p.name || state.userEmail || '');
  updateBuyerFavCount();
}

export function openBuyerEditor(): void {
  const p = store.get();
  const fill = (id: string, v: string) => { const el = $<HTMLInputElement>(id); if (el) el.value = v; };
  fill('buyer-edit-name', p.name);
  fill('buyer-edit-phone', p.phone);
  fill('buyer-edit-email', p.email || state.userEmail || '');
  fill('buyer-edit-city', p.city);
  const e = $('buyer-editor');
  e?.classList.remove('hidden');
  e?.classList.add('flex');
}

export function closeBuyerEditor(): void {
  const e = $('buyer-editor');
  e?.classList.add('hidden');
  e?.classList.remove('flex');
}

export function saveBuyerCard(): void {
  const name = valueOf('buyer-edit-name');
  if (!name) { toast('Введите имя!'); return; }
  store.replace({ name, phone: valueOf('buyer-edit-phone'), email: valueOf('buyer-edit-email'), city: valueOf('buyer-edit-city') });
  store.save();
  toast('Профиль сохранён');
  closeBuyerEditor();
  renderBuyerCard();
}

export const buyerLegacyApi = {
  loadBuyerProfile: () => store.load(),
  renderBuyerCard, updateBuyerFavCount, openBuyerEditor, closeBuyerEditor, saveBuyerCard,
};
