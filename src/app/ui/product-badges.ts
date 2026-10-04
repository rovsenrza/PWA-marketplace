/** HTML for product badges and prices in cards and lists. */
import type { Product } from '../../shared/domain/types';

type BadgeKind = 'hit' | 'new' | 'sale';
const BADGES: Record<BadgeKind, { text: string; bg: string }> = {
  hit: { text: 'ХИТ', bg: 'bg-rose-500' },
  new: { text: 'НОВИНКА', bg: 'bg-emerald-500' },
  sale: { text: 'РАСПРОДАЖА', bg: 'bg-red-600' },
};

/** «Хит» / «Новинка» / «Распродажа», or an empty string. */
export function getBadgeHtml(prod: Pick<Product, 'badge'> | null | undefined): string {
  const b = prod?.badge ? BADGES[prod.badge as BadgeKind] : undefined;
  if (!b) return '';
  return `<span class="${b.bg} text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wide">${b.text}</span>`;
}

/** The price; on sale, the new price in the sale colour plus the crossed-out old one. */
export function getPriceHtml(prod: Pick<Product, 'price' | 'oldPrice' | 'badge'>, size?: string): string {
  const cls = size || 'oz-price';
  if (prod.oldPrice && prod.badge === 'sale') {
    return `<div class="flex items-baseline gap-1.5 flex-wrap">
                    <span class="${cls}" style="color:#f43f5e !important;">${prod.price}</span>
                    <span class="oz-price-old">${prod.oldPrice}</span>
                </div>`;
  }
  return `<span class="${cls}">${prod.price}</span>`;
}
