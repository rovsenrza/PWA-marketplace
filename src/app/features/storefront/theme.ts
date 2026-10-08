import type { StorefrontTheme } from '../../../shared/storefront';
import { mixHex, onInk } from '../../../shared/storefront';

export function applyStoreTheme(root: HTMLElement, theme: StorefrontTheme): void {
  const dark = document.documentElement.dataset.theme === 'dark';
  const stock = dark ? '#121211' : '#FFFFFF';
  const ground = theme.ground === 'black' ? '#121211' : theme.ground === 'tint' ? mixHex(theme.ink, stock, dark ? .88 : .92) : stock;
  const text = onInk(ground);
  root.dataset.voice = theme.voice;
  root.dataset.ground = theme.ground;
  root.dataset.cover = theme.cover;
  const values = { ink: theme.ink, 'on-ink': onInk(theme.ink), ground, text, 'text-2': mixHex(ground, text, .72), rule: mixHex(ground, text, .22), head: `var(--r-font-${theme.voice === 'industrial' ? 'x' : theme.voice})` };
  Object.entries(values).forEach(([key, value]) => root.style.setProperty(`--sf-${key}`, value));
}
