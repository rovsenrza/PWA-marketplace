import type { Product, Shop } from '../../../shared/domain/types';
import type { StorefrontBlock } from '../../../shared/storefront';
import { mixSpecOf, normalizeHex } from '../../../shared/storefront';
import { html, raw, type SafeHtml } from '../../../shared/ui/html';
import { productCell } from '../../ui/product-cell';

export type RecordData = Record<string, unknown>;
export const records = (value: unknown): RecordData[] => Array.isArray(value) ? value.filter((x): x is RecordData => !!x && typeof x === 'object') : [];
export const strings = (value: unknown): string[] => Array.isArray(value) ? value.filter((x): x is string => typeof x === 'string' && !!x) : [];
export const text = (value: unknown): string => typeof value === 'string' ? value : '';
export function safeUrl(value: unknown): string {
  const s = text(value).trim();
  if (!s || /[\u0000-\u001f\u007f\\]/.test(s) || s.startsWith('//')) return '';
  if (/^(https?:\/\/|data:image\/(png|jpeg|webp|gif);base64,)/i.test(s)) return s;
  try {
    const resolved = new URL(s, 'https://asset.invalid/');
    return resolved.origin === 'https://asset.invalid' ? s : '';
  } catch { return ''; }
}
export function contactUrl(kind: string, value: unknown): string {
  const s = text(value).trim();
  if (!s) return '';
  if (kind === 'phone') return `tel:${s.replace(/[^+\d]/g, '')}`;
  if (kind === 'email') return /^[^\s@]+@[^\s@]+$/.test(s) ? `mailto:${s}` : '';
  if (/^https?:\/\//i.test(s)) return safeUrl(s);
  if (kind === 'telegram' || kind === 'tg') return `https://t.me/${encodeURIComponent(s.replace(/^@/, ''))}`;
  if (kind === 'max') return `https://max.ru/${encodeURIComponent(s)}`;
  return '';
}
const image = (src: unknown, cls = '', alt = '') => safeUrl(src) ? html`<img class="${cls}" src="${safeUrl(src)}" alt="${alt}" loading="lazy" decoding="async">` : html``;
export function icon(name: string): SafeHtml {
  const paths = /достав/i.test(name) ? '<path d="M2 5h12v12H2zM14 9h4l4 4v4h-8"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>'
    : /сбор|монтаж/i.test(name) ? '<path d="m14 6-8 8a3 3 0 0 0 4 4l8-8M14 2a6 6 0 0 0 8 8l-5-1-2-2z"/>'
    : /замер/i.test(name) ? '<rect x="3" y="6" width="18" height="12"/><path d="M7 6v5m5-5v3m5-3v5"/>'
    : /проект|дизайн/i.test(name) ? '<path d="m3 17 12-12 4 4L7 21H3zM14 6l4 4M3 3h6v6H3z"/>'
    : /гарант/i.test(name) ? '<path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6zM8 12l3 3 5-6"/>'
    : /расч/i.test(name) ? '<rect x="5" y="2" width="14" height="20"/><path d="M8 6h8M8 11h2m4 0h2m-8 4h2m4 0h2m-8 4h2m4 0h2"/>'
    : /разгруз/i.test(name) ? '<path d="M3 17h18M4 21v-4m8 4v-4m8 4v-4M5 5h14v12H5zM12 5v12"/>'
    : name === 'back' ? '<path d="m14 5-7 7 7 7"/>' : name === 'cart' ? '<path d="M2 3h3l3 13h11l3-9H6"/><circle cx="9" cy="21" r="1"/><circle cx="18" cy="21" r="1"/>'
    : '<path d="m5 12 4 4L19 6"/>';
  return raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`);
}
const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
export const todayIndex = () => (new Date().getDay() + 6) % 7;
export function openingStatus(shop: Shop): string {
  const hours = records(shop.hours);
  if (hours.length !== 7) return 'Часы уточняйте у менеджера';
  const today = todayIndex(), row = hours[today];
  const parse = (v: unknown) => { const m = /^(\d{2}):(\d{2})$/.exec(text(v)); return m ? +m[1] * 60 + +m[2] : -1; };
  const now = new Date(), minutes = now.getHours() * 60 + now.getMinutes();
  if (!row.off && minutes >= parse(row.from) && minutes < parse(row.to)) return `Открыто до ${text(row.to)}`;
  if (!row.off && minutes < parse(row.from)) return `Закрыто до ${text(row.from)}`;
  for (let i = 1; i <= 7; i++) { const n = (today + i) % 7; if (!hours[n].off) return `Закрыто · ${i === 1 ? 'завтра' : DAYS[n].toLowerCase()} с ${text(hours[n].from)}`; }
  return 'Часы уточняйте у менеджера';
}
function contacts(manager: RecordData): SafeHtml {
  return html`<div class="sf-contacts">${[['tg', 'Telegram'], ['telegram', 'Telegram'], ['max', 'MAX'], ['phone', 'Позвонить'], ['email', 'E-mail']].map(([key, label]) => {
    const url = contactUrl(key, manager[key]);
    return url ? html`<a class="r-btn r-btn--line r-btn--sm" href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>` : html``;
  })}</div>`;
}
const DEFAULT_TITLES: Record<string, string> = { services: 'Услуги', categories: 'Категории', catalog: 'Каталог', lookbook: 'В интерьере', steps: 'Как мы работаем', swatches: 'Материалы и цвета', calculator: 'Расчёт смеси', promo: 'Предложение', gallery: 'Галерея', about: 'О магазине', addresses: 'Адреса и часы работы', managers: 'Менеджеры', terms: 'Оплата и доставка' };

export function renderBlock(block: StorefrontBlock, shop: Shop, products: Product[]): SafeHtml {
  if (!block.on) return html``;
  let content: SafeHtml = html``;
  switch (block.type) {
    case 'cover': return html`<section class="sf-block sf-cover"><div class="sf-cover__field"><h1>${shop.name}</h1>${block.line ? html`<p>${block.line}</p>` : html``}${block.example ? html`<span class="sf-example">Пример оформления</span>` : html``}<button class="r-btn r-btn--line" data-action="sf-catalog">Каталог</button></div>${image(block.image || shop.banner, 'sf-cover__photo')}<div class="sf-facts"><span>${openingStatus(shop)}</span><span>${shop.address || text(records(shop.facades)[0]?.address)}</span><span>${products.length} товаров</span></div></section>`;
    case 'services': content = html`<div class="sf-services__grid">${records(shop.services).filter((s) => s.on !== false).map((s) => html`<div class="r-pict"><i>${icon(text(s.name))}</i><span>${text(s.name)}${s.price ? html`<small>${text(s.price)}</small>` : html``}</span></div>`)}</div>`; if (!records(shop.services).some((s) => s.on !== false)) return html``; break;
    case 'categories': if (!block.items.length) return html``; content = html`<div class="sf-categories__rail">${block.items.map((c) => html`<button class="sf-category" data-action="sf-category" data-key="${c.key}" data-value="${c.value}">${image(c.image || products.find((p) => p.category === c.value)?.image)}<span>${c.label}</span></button>`)}</div>`; break;
    case 'catalog': content = html`<div id="sf-catalog-content"></div>`; break;
    case 'lookbook': {
      const pins = block.pins.filter((pin) => products.some((p) => p.id === pin.productId));
      if (!safeUrl(block.image)) return html``;
      content = html`<div class="sf-lookbook__image">${image(block.image)}${pins.map((pin, i) => html`<button class="sf-pin" style="left:${Math.max(0, Math.min(100, Number(pin.x) || 0))}%;top:${Math.max(0, Math.min(100, Number(pin.y) || 0))}%" data-action="sf-pin" data-product="${pin.productId}" aria-label="${products.find((p) => p.id === pin.productId)?.title}">${i + 1}</button>`)}</div>${block.text ? html`<p>${block.text}</p>` : html``}<div class="sf-lookbook__products">${pins.map((pin, i) => { const p = products.find((p) => p.id === pin.productId)!; return html`<button class="sf-lookbook__row" data-action="open-product" data-product="${p.id}" data-pin-product="${p.id}"><span>${i + 1}</span>${image(p.image)}<span>${p.title}<b>${p.price}</b></span></button>`; })}</div>`; break;
    }
    case 'steps': if (!block.items.length) return html``; content = html`<ol class="sf-steps">${block.items.map((s, i) => html`<li><b class="r-x">${String(i + 1).padStart(2, '0')}</b><div><h3>${s.title}</h3><p>${s.text}</p></div></li>`)}</ol>`; break;
    case 'swatches': if (!block.items.length) return html``; content = html`<div class="sf-swatches__grid">${block.items.map((s) => html`<div><div class="sf-swatch" style="background:${normalizeHex(s.color) || 'var(--sf-ground)'}">${image(s.image)}</div><b>${s.name}</b>${s.note ? html`<small>${s.note}</small>` : html``}</div>`)}</div>`; break;
    case 'calculator': {
      const mixes = products.filter((p) => mixSpecOf(p)); if (!mixes.length) return html``;
      content = html`<div class="sf-calculator__form"><label>Смесь<select class="r-input" id="sf-mix-product">${mixes.map((p) => html`<option value="${p.id}">${p.title}</option>`)}</select></label><div class="sf-fields"><label>Площадь, м²<input class="r-input" id="sf-mix-area" type="number" min="0.1" step="0.1" value="20"></label><label>Слой, мм<input class="r-input" id="sf-mix-layer" type="number" min="0.1" step="0.1" value="10"></label></div><p class="sf-calculator__note">С запасом 10%. Расход по характеристикам выбранной смеси.</p><output id="sf-mix-result" class="r-x" aria-live="polite"></output><button class="r-btn r-btn--primary r-btn--block" data-action="sf-mix-add" id="sf-mix-add"></button></div>`; break;
    }
    case 'promo': if (!block.text) return html``; content = html`<div class="sf-promo__body">${block.sticker ? html`<span class="r-sticker">${block.sticker}</span>` : html``}<p>${block.text}</p><button class="r-btn r-btn--primary" data-action="${block.productId ? 'open-product' : 'sf-catalog'}" data-product="${block.productId || ''}">${block.productId ? 'Смотреть товар' : 'В каталог'}</button></div>${image(block.image)}`; break;
    case 'gallery': if (!strings(shop.gallery).length) return html``; content = html`<div class="sf-gallery__rail">${strings(shop.gallery).map((src, i) => html`<button data-action="sf-photo" data-src="${safeUrl(src)}" aria-label="Открыть фото ${i + 1}">${image(src)}</button>`)}</div>`; break;
    case 'about': if (!(block.text || shop.description)) return html``; content = html`<p class="sf-prose">${block.text || shop.description}</p>`; break;
    case 'addresses': {
      const facades = records(shop.facades); if (!facades.length && shop.address) facades.push({ address: shop.address });
      content = html`${facades.map((f) => html`<div class="sf-address">${image(f.photo)}<p>${text(f.address)}</p><a class="r-btn r-btn--line" href="https://yandex.ru/maps/?text=${encodeURIComponent(text(f.address))}" target="_blank" rel="noopener noreferrer">Маршрут</a></div>`)}<div class="sf-contacts">${['mapYandex', 'mapGoogle'].map((key) => safeUrl(shop[key]) ? html`<a class="r-btn r-btn--line r-btn--sm" href="${safeUrl(shop[key])}" target="_blank" rel="noopener noreferrer">${key === 'mapYandex' ? 'Яндекс Карты' : 'Google Maps'}</a>` : html``)}</div>${records(shop.hours).length ? html`<table class="sf-hours"><caption>Часы работы</caption><tbody>${DAYS.map((day, i) => { const row = records(shop.hours)[i]; return html`<tr class="${i === todayIndex() ? 'is-today' : ''}"><th scope="row">${day}${i === todayIndex() ? ' · сегодня' : ''}</th><td>${row ? row.off ? 'Выходной' : `${text(row.from)}–${text(row.to)}` : 'Уточните у менеджера'}</td></tr>`; })}</tbody></table>` : html`<p>Адрес и часы работы уточняйте у менеджера.</p>`}`; break;
    }
    case 'managers': {
      const managers = records(shop.managers);
      if (!managers.length && !shop.telegram && !shop.site) return html``;
      content = html`${managers.map((m) => html`<article class="sf-manager"><h3>${text(m.name)}</h3><p>${text(m.role)}</p>${contacts(m)}</article>`)}${!managers.length ? html`${contacts({ telegram: shop.telegram })}${safeUrl(shop.site) ? html`<a class="r-btn r-btn--line" href="${safeUrl(shop.site)}" target="_blank" rel="noopener noreferrer">Сайт магазина</a>` : html``}` : html``}`; break;
    }
    case 'terms': content = html`${shop.payment ? html`<h3>Оплата</h3><p>${text(shop.payment)}</p>` : html``}${shop.delivery ? html`<h3>Доставка</h3><p>${text(shop.delivery)}</p>` : html``}<p>Оплата — напрямую менеджеру магазина, приложение платежи не принимает.</p>`; break;
  }
  return html`<section class="sf-block sf-${block.type}" id="sf-${block.type}" data-block-id="${block.id}"><div class="sf-block__head"><h2 class="sf-h">${block.title || DEFAULT_TITLES[block.type]}</h2>${block.example ? html`<span class="sf-example">Пример</span>` : html``}</div>${content}</section>`;
}

export function renderProductGrid(products: Product[]): SafeHtml {
  return products.length ? html`<div class="r-grid sf-grid">${products.map((p) => raw(productCell(p)))}</div>` : html`<div class="sf-empty"><p>По этим фильтрам товаров нет.</p><button class="r-btn r-btn--line" data-action="sf-reset">Сбросить фильтры</button></div>`;
}
