import type { Product, Shop } from '../../../shared/domain/types';
import { activeCount, applyFilters, buildFacets, calcBags, mixSpecOf, resolveStorefront, sortProducts, toNumber, type FilterState, type SortKey, type Storefront } from '../../../shared/storefront';
import { html } from '../../../shared/ui/html';
import { registerActions } from '../../../shared/ui/actions';
import { catalog } from '../../data/catalog';
import { addToCart } from '../cart/actions';
import { cartStore } from '../cart/cart-store';
import { applyStoreTheme } from './theme';
import { contactUrl, icon, records, renderBlock, renderProductGrid } from './blocks';

type StoreWindow = Window & { openStorefront?: typeof openStorefront; openShopCatalogModal?: (name: string) => void; openLightbox?: (src: string) => void };
const w = window as StoreWindow;
let root: HTMLElement;
let shop: Shop;
let sf: Storefront;
let products: Product[] = [];
let filters: FilterState = {};
let sort: SortKey = 'popular';
let previousHash = '';
let pushed = false;
let origin: Element | null = null;
let installed = false;
const shown = () => sortProducts(applyFilters(products, sf.filters, filters), sort);
const input = (id: string) => document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;

function renderCatalog(): void {
  const target = root.querySelector<HTMLElement>('#sf-catalog-content');
  if (!target) return;
  const list = shown();
  const facet = buildFacets(products, sf.filters).find((f) => f.type === 'chips');
  target.innerHTML = String(html`<div class="sf-catalog__bar"><button class="r-chip" data-action="sf-filters">Фильтры (${activeCount(filters)})</button><label class="sf-sort"><span class="sr-only">Сортировка</span><select class="r-input" id="sf-sort">${[['popular', 'Популярные'], ['cheap', 'Дешевле'], ['expensive', 'Дороже'], ['new', 'Новинки']].map(([key, label]) => html`<option value="${key}" ${key === sort ? html`selected` : html``}>${label}</option>`)}</select></label><span class="sf-catalog__count" aria-live="polite">${list.length} товаров</span></div>${facet?.type === 'chips' ? html`<div class="sf-quick">${facet.values.map((v) => html`<button class="r-chip" data-action="sf-chip" data-key="${facet.def.key}" data-value="${v.value}" aria-pressed="${Array.isArray(filters[facet.def.key]) && (filters[facet.def.key] as string[]).includes(v.value)}">${facet.def.label}: ${v.value}</button>`)}</div>` : html``}${renderProductGrid(list)}`);
}
function renderFilterSheet(): void {
  const sheet = root.querySelector<HTMLElement>('#sf-filter-sheet')!;
  sheet.innerHTML = String(html`<div class="sf-filter-panel" role="dialog" aria-modal="true" aria-labelledby="sf-filter-title"><div class="sf-filter-head"><h2 id="sf-filter-title" class="sf-h">Фильтры</h2><button class="r-btn r-btn--line r-btn--sm" data-action="sf-filter-close">Готово</button></div>${buildFacets(products, sf.filters).map((facet) => html`<fieldset><legend>${facet.def.label}${facet.def.unit ? `, ${facet.def.unit}` : ''}</legend>${facet.type === 'chips' ? html`<div class="sf-filter-chips">${facet.values.map((v) => html`<button class="r-chip" data-action="sf-chip" data-key="${facet.def.key}" data-value="${v.value}" aria-pressed="${Array.isArray(filters[facet.def.key]) && (filters[facet.def.key] as string[]).includes(v.value)}">${v.value} <span>${v.count}</span></button>`)}</div>` : html`<div class="sf-fields">${(['min', 'max'] as const).map((bound) => { const sel = filters[facet.def.key]; return html`<label>${bound === 'min' ? 'От' : 'До'}<input class="r-input" type="number" inputmode="decimal" data-filter-key="${facet.def.key}" data-bound="${bound}" placeholder="${bound === 'min' ? facet.min : facet.max}" value="${sel && !Array.isArray(sel) ? sel[bound] ?? '' : ''}"></label>`; })}</div>`}</fieldset>`)}<button class="r-btn r-btn--line r-btn--block" data-action="sf-reset">Сбросить фильтры</button><button class="r-btn r-btn--primary r-btn--block" data-action="sf-filter-close" id="sf-filter-show">Показать ${shown().length} товаров</button></div>`);
}
function updateFilters(): void { renderCatalog(); if (!root.querySelector('#sf-filter-sheet')?.classList.contains('hidden')) renderFilterSheet(); }
function scrollCatalog(): void { root.querySelector('#sf-catalog')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }); }
function calculate(): { id: string; bags: number; kg: number } {
  const id = input('sf-mix-product')?.value || '';
  const product = products.find((p) => p.id === id), spec = product && mixSpecOf(product);
  const result = spec ? calcBags(Number(input('sf-mix-area')?.value), Number(input('sf-mix-layer')?.value), spec) : { bags: 0, kg: 0 };
  const output = document.getElementById('sf-mix-result'), button = document.getElementById('sf-mix-add') as HTMLButtonElement | null;
  if (output) output.textContent = `${result.bags} мешков · ${result.kg.toLocaleString('ru-RU')} кг`;
  if (button) { button.textContent = result.bags ? `Добавить ${result.bags} мешков в корзину` : 'Укажите площадь и толщину слоя'; button.disabled = result.bags === 0; }
  return { id, ...result };
}
function updateCartCount(): void {
  if (!shop) return;
  const count = cartStore.list().filter((line) => line.storeId === shop.name).reduce((n, line) => n + line.qty, 0);
  const el = root.querySelector<HTMLElement>('#sf-cart-count'); if (el) el.textContent = String(count);
}
function close(route = true): void {
  if (!root || root.classList.contains('hidden')) return;
  root.querySelector('#sf-filter-sheet')?.classList.add('hidden');
  root.classList.add('hidden');
  if (route && location.hash.startsWith('#store=')) {
    if (pushed) history.back(); else history.replaceState(null, '', location.pathname + location.search + previousHash);
  }
  pushed = false;
  if (origin instanceof HTMLElement) origin.focus({ preventScroll: true });
}
export function openStorefront(name: string, from?: Element | null, route = true): void {
  const found = Object.prototype.hasOwnProperty.call(catalog.state.shops, name) ? catalog.state.shops[name] : undefined;
  if (!found) { window.showSmsToast?.('Магазин не найден'); return; }
  document.getElementById('product-modal')?.style.removeProperty('z-index');
  shop = { ...found, name };
  products = Object.values(catalog.state.products).filter((p) => p.store === name && p.status === 'published');
  sf = resolveStorefront(shop, products);
  filters = {}; sort = 'popular'; origin = from || null;
  applyStoreTheme(root, sf.theme);
  root.innerHTML = String(html`<header class="sf-top"><button class="r-back" data-action="sf-back" aria-label="Назад">${icon('back')}</button><span>${name}</span><button class="r-btn r-btn--line r-btn--sm" data-action="sf-catalog">Каталог</button></header><div class="sf-scroll">${sf.demo ? html`<p class="sf-demo">Демонстрационная витрина. Контент и контакты — примеры.</p>` : html``}${sf.blocks.map((block) => renderBlock(block, shop, products))}</div><footer class="sf-dock"><button class="sf-message" data-action="sf-manager">Написать менеджеру</button><button class="sf-cart" data-action="sf-cart" aria-label="Корзина этого магазина">${icon('cart')}<span id="sf-cart-count">0</span></button></footer><div id="sf-filter-sheet" class="sf-filter-sheet hidden"></div>`);
  root.classList.remove('hidden');
  renderCatalog(); calculate(); updateCartCount();
  if (route) {
    const next = `#store=${encodeURIComponent(name)}`;
    if (location.hash !== next) { previousHash = location.hash.startsWith('#store=') ? previousHash : location.hash; history.pushState({ storefront: true }, '', next); pushed = true; }
  }
  const scroll = root.querySelector('.sf-scroll'); if (scroll) scroll.scrollTop = 0;
  if (from && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const phone = root.parentElement!, p = phone.getBoundingClientRect(), rect = from.getBoundingClientRect();
    const layer = document.createElement('div'); layer.className = 'sf-reveal'; layer.style.background = sf.theme.ink; phone.append(layer);
    const scaleX = p.width / phone.clientWidth, scaleY = p.height / phone.clientHeight;
    const inset = `${Math.max(0, (rect.top - p.top) / scaleY)}px ${Math.max(0, (p.right - rect.right) / scaleX)}px ${Math.max(0, (p.bottom - rect.bottom) / scaleY)}px ${Math.max(0, (rect.left - p.left) / scaleX)}px`;
    layer.animate([{ clipPath: `inset(${inset})` }, { clipPath: 'inset(0)' }], { duration: 420, easing: 'cubic-bezier(.32,.72,0,1)', fill: 'forwards' }).finished.then(() => {
      layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180 }).finished.then(() => layer.remove()).catch(() => layer.remove());
    }).catch(() => layer.remove());
  }
  root.querySelector<HTMLElement>('.r-back')?.focus({ preventScroll: true });
}
export function initStorefront(): void {
  if (installed) return; installed = true;
  const phone = document.getElementById('phone-container'); if (!phone) return;
  root = document.createElement('div'); root.id = 'storefront'; root.className = 'sf-page absolute inset-0 hidden'; root.setAttribute('aria-label', 'Витрина магазина'); phone.append(root);
  w.openStorefront = openStorefront;
  const legacy = w.openShopCatalogModal;
  w.openShopCatalogModal = (name) => {
    const found = catalog.state.shops[name];
    if (found?.kind === 'landscape' || found?.kind === 'realestate' || !w.openStorefront) legacy?.(name);
    else openStorefront(name);
  };
  registerActions({
    'sf-back': () => close(), 'sf-catalog': scrollCatalog,
    'sf-chip': (el) => { const key = el.dataset.key!, value = el.dataset.value!, current = Array.isArray(filters[key]) ? filters[key] as string[] : []; filters[key] = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]; updateFilters(); },
    'sf-category': (el) => { filters[el.dataset.key!] = [el.dataset.value!]; renderCatalog(); scrollCatalog(); },
    'sf-reset': () => { filters = {}; updateFilters(); },
    'sf-filters': () => { renderFilterSheet(); root.querySelector('#sf-filter-sheet')!.classList.remove('hidden'); root.querySelector<HTMLElement>('[data-action="sf-filter-close"]')?.focus(); },
    'sf-filter-close': () => { root.querySelector('#sf-filter-sheet')!.classList.add('hidden'); root.querySelector<HTMLElement>('[data-action="sf-filters"]')?.focus(); },
    'sf-mix-add': () => { const result = calculate(); if (result.bags) { addToCart(result.id, result.bags); updateCartCount(); } },
    'sf-photo': (el) => { if (el.dataset.src) { w.openLightbox?.(el.dataset.src); document.getElementById('lightbox-modal')?.style.setProperty('z-index', '160'); } },
    'sf-pin': (el) => { const row = Array.from(root.querySelectorAll<HTMLElement>('[data-pin-product]')).find((r) => r.dataset.pinProduct === el.dataset.product); root.querySelectorAll('.sf-lookbook__row.is-on').forEach((r) => r.classList.remove('is-on')); row?.classList.add('is-on'); row?.scrollIntoView({ behavior: 'smooth', block: 'center' }); },
    'sf-manager': () => { const manager = records(shop.managers)[0]; const url = contactUrl('tg', manager?.tg || manager?.telegram || shop.telegram) || contactUrl('max', manager?.max); if (url) window.open(url, '_blank', 'noopener,noreferrer'); else root.querySelector('#sf-managers, #sf-addresses')?.scrollIntoView({ behavior: 'smooth' }); },
    'sf-cart': () => { close(); window.switchTab?.('cart'); },
  });
  root.addEventListener('click', (event) => {
    if ((event.target as Element).closest('[data-action="open-product"]')) document.getElementById('product-modal')?.style.setProperty('z-index', '150');
  });
  root.addEventListener('change', (event) => {
    const el = event.target as HTMLInputElement;
    if (el.id === 'sf-sort') { sort = el.value as SortKey; renderCatalog(); }
    if (el.id.startsWith('sf-mix-')) calculate();
  });
  root.addEventListener('input', (event) => {
    const el = event.target as HTMLInputElement;
    if (el.id.startsWith('sf-mix-')) calculate();
    if (el.dataset.filterKey) {
      const key = el.dataset.filterKey, bound = el.dataset.bound as 'min' | 'max';
      const old = filters[key]; const range = old && !Array.isArray(old) ? { ...old } : {};
      const n = toNumber(el.value); if (n === null) delete range[bound]; else range[bound] = n;
      filters[key] = range; renderCatalog(); const show = document.getElementById('sf-filter-show'); if (show) show.textContent = `Показать ${shown().length} товаров`;
    }
  });
  root.addEventListener('keydown', (event) => {
    const sheet = root.querySelector('#sf-filter-sheet');
    if (event.key === 'Escape') { if (!sheet?.classList.contains('hidden')) { sheet?.classList.add('hidden'); root.querySelector<HTMLElement>('[data-action="sf-filters"]')?.focus(); } else close(); }
    if (event.key === 'Tab' && !sheet?.classList.contains('hidden')) { const els = Array.from(sheet!.querySelectorAll<HTMLElement>('button, input')).filter((e) => !(e as HTMLButtonElement).disabled); const first = els[0], last = els.at(-1); if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); } }
  });
  document.addEventListener('app:cart-changed', updateCartCount);
  new MutationObserver(() => { if (sf) applyStoreTheme(root, sf.theme); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const route = () => { if (location.hash.startsWith('#store=')) { try { const name = decodeURIComponent(location.hash.slice(7)); if (root.classList.contains('hidden') || shop?.name !== name) openStorefront(name, null, false); } catch { window.showSmsToast?.('Ссылка магазина повреждена'); } } else close(false); };
  window.addEventListener('hashchange', route); window.addEventListener('popstate', route); route();
}
