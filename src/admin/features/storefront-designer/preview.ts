/**
 * The live mini preview of a storefront: its cover in the chosen style, ink, ground and voice, the facts strip,
 * the start of the catalogue and the manager key in the store ink. A sketch of the buyer storefront for the store
 * owner across the table, not the storefront itself (that is the app's). Everything from the shop goes through
 * html`…`; the colours are computed here from a normalised hex, so only #RRGGBB reaches the style attribute.
 */
import { mixHex, normalizeHex, onInk } from '../../../shared/storefront';
import type { CoverBlock, Product, Shop, Storefront } from '../../../shared/domain/types';
import { html, raw, type SafeHtml } from '../../../shared/ui/html';
import { filled } from './model';

const ico = (name: string, cls = '') => raw(`<svg class="ico ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`);
const DAYS_SHORT = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

export function plural(n: number, one: string, few: string, many: string): string {
  const d = n % 10;
  const h = n % 100;
  return d === 1 && h !== 11 ? one : d >= 2 && d <= 4 && (h < 12 || h > 14) ? few : many;
}

/** The colours of a theme for the preview's custom properties; tint grounds differ by the admin's theme. */
function previewColours(inkRaw: string): { ink: string; on: string; tintLight: string; tintDark: string } {
  const ink = normalizeHex(inkRaw) ?? '#3A3A38';
  return { ink, on: onInk(ink), tintLight: mixHex(ink, '#FFFFFF', 0.92), tintDark: mixHex(ink, '#121211', 0.88) };
}

/** Today's hours from the admin's 7-day table (Monday first), as the storefront's facts strip shows them. */
function todayHours(shop: Shop): string {
  const hours = Array.isArray(shop.hours) ? (shop.hours as unknown[]) : [];
  const day = (new Date().getDay() + 6) % 7;
  const h = hours[day] as { from?: unknown; to?: unknown; off?: unknown } | undefined;
  if (!h || typeof h !== 'object') return '';
  if (h.off) return `Сегодня (${DAYS_SHORT[day]}) выходной`;
  return filled(h.from) && filled(h.to) ? `Сегодня ${h.from}–${h.to}` : '';
}

function firstAddress(shop: Shop): string {
  const facades = Array.isArray(shop.facades) ? (shop.facades as { address?: unknown }[]) : [];
  const fromFacade = facades.find((f) => f && filled(f.address));
  return fromFacade ? String(fromFacade.address) : filled(shop.address) ? shop.address : '';
}

/** A photo that removes itself when it doesn't load (the designer listens for image errors; no inline handler). */
const photo = (src: string, alt = '') => (filled(src) ? html`<img src="${src}" alt="${alt}" data-sfd-img>` : '');

export interface PreviewOptions {
  /** cover and facts only (the cover block's panel) */
  compact?: boolean;
}

export function coverPreview(shop: Shop, sf: Storefront, published: readonly Product[], opts: PreviewOptions = {}): SafeHtml {
  const c = previewColours(sf.theme.ink);
  const cover = sf.blocks.find((b): b is CoverBlock => b.type === 'cover');
  const name = filled(shop.name) ? shop.name : 'Название магазина';
  const line = cover && filled(cover.line) ? cover.line : '';
  const image = cover && filled(cover.image) ? cover.image : filled(shop.banner) ? shop.banner : '';
  const style = `--sfp-ink:${c.ink};--sfp-on:${c.on};--sfp-tint-l:${c.tintLight};--sfp-tint-d:${c.tintDark}`;
  const nameAndLine = html`<b class="sfp-name">${name}</b>${line ? html`<span class="sfp-line">${line}</span>` : ''}`;
  const pic = html`<div class="sfp-photo">${photo(image)}<span class="sfp-ph">${ico('image')}</span></div>`;
  const coverHtml = sf.theme.cover === 'full'
    ? html`<div class="sfp-cover">${pic}<div class="sfp-plate">${nameAndLine}</div></div>`
    : html`<div class="sfp-cover"><div class="sfp-field">${nameAndLine}${sf.theme.cover === 'split' ? html`<span class="sfp-key">Каталог</span>` : ''}</div>${pic}</div>`;
  const hours = todayHours(shop);
  const address = firstAddress(shop);
  const goods = published.filter((p) => filled(p.image)).slice(0, 3);
  return html`
    <div class="sfp" data-voice="${sf.theme.voice}" data-ground="${sf.theme.ground}" data-cover="${sf.theme.cover}" style="${style}" aria-label="Как выглядит витрина" role="img">
      ${coverHtml}
      <div class="sfp-facts">${hours ? html`<span>${hours}</span>` : ''}${address ? html`<span class="sfp-addr">${address}</span>` : ''}<span>${published.length} ${plural(published.length, 'товар', 'товара', 'товаров')}</span></div>
      ${opts.compact ? '' : html`
        <div class="sfp-sec"><b class="sfp-h">Каталог</b></div>
        ${goods.length
          ? html`<div class="sfp-goods">${goods.map((p) => html`<div class="sfp-cell"><div class="sfp-cell-ph">${photo(String(p.image))}</div><b>${p.price || '—'}</b></div>`)}</div>`
          : html`<p class="sfp-none">Товаров пока нет</p>`}
        <div class="sfp-dock"><span>Написать менеджеру</span></div>`}
    </div>`;
}
