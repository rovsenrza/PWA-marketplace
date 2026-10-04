/**
 * Swipe left to delete (SwiftUI List.onDelete).
 * A row marked `data-swipe-fn="globalFunction" data-swipe-arg="id"` is wrapped from the outside:
 * its own styles stay untouched, and the wrapper holds a red «Удалить» behind it.
 * A short swipe snaps the row open; a swipe past half the width deletes straight away.
 */
import { EASE_PUSH, EASE_SPRING } from './motion/easing';
import { isGhost } from './motion/transitions';

const TRASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg><span>Удалить</span>';
const enhanced = new WeakSet<Element>();
let openRow: HTMLElement | null = null;

const contentOf = (wrap: HTMLElement) => wrap.querySelector<HTMLElement>(':scope > .lg-swipe-content');

function closeRow(wrap: HTMLElement | null): void {
  if (!wrap) return;
  const c = contentOf(wrap);
  if (c) {
    c.style.transition = `transform .32s ${EASE_PUSH}`;
    c.style.transform = '';
  }
  wrap.classList.remove('is-open');
  if (openRow === wrap) openRow = null;
}

function runDelete(wrap: HTMLElement, fn: string, arg: string): void {
  const c = contentOf(wrap);
  wrap.style.height = `${wrap.offsetHeight}px`;
  if (c) {
    c.style.transition = `transform .24s ${EASE_PUSH}`;
    c.style.transform = 'translateX(-110%)';
  }
  window.setTimeout(() => {
    wrap.classList.add('is-gone');
    wrap.style.height = '0px';
    window.setTimeout(() => {
      if (openRow === wrap) openRow = null;
      const handler = window[fn];
      if (typeof handler === 'function') (handler as (a: string) => void)(arg);
      if (wrap.isConnected) wrap.remove();
    }, 260);
  }, 180);
}

function enhanceRow(row: HTMLElement): void {
  if (enhanced.has(row) || !row.parentNode) return;
  enhanced.add(row);
  const fn = row.getAttribute('data-swipe-fn') ?? '';
  const arg = row.getAttribute('data-swipe-arg') ?? '';

  const wrap = document.createElement('div');
  wrap.className = 'lg-swipe';
  const cs = getComputedStyle(row);
  wrap.style.borderRadius = cs.borderRadius;
  wrap.style.marginTop = cs.marginTop;
  wrap.style.marginBottom = cs.marginBottom;
  row.style.marginTop = '0';
  row.style.marginBottom = '0';
  row.parentNode.insertBefore(wrap, row);

  const action = document.createElement('button');
  action.type = 'button';
  action.className = 'lg-swipe-action';
  action.innerHTML = TRASH;
  action.addEventListener('click', (e) => { e.stopPropagation(); runDelete(wrap, fn, arg); });
  wrap.append(action, row);
  row.classList.add('lg-swipe-content');

  let x0 = 0, y0 = 0, dx = 0, base = 0, openW = 88;
  let dragging = false, decided = false, moved = false;
  let pid: number | null = null;

  row.addEventListener('pointerdown', (e) => {
    if (e.button) return;
    if (openRow && openRow !== wrap) closeRow(openRow);
    x0 = e.clientX; y0 = e.clientY; dx = 0;
    decided = dragging = moved = false;
    pid = e.pointerId;
    openW = action.offsetWidth || 88;
    base = wrap.classList.contains('is-open') ? -openW : 0;
  });

  row.addEventListener('pointermove', (e) => {
    if (e.pointerId !== pid) return;
    const mx = e.clientX - x0, my = e.clientY - y0;
    if (!decided) {
      if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
      decided = true;
      dragging = Math.abs(mx) > Math.abs(my) * 1.2 && (mx < 0 || base < 0);
      if (dragging) {
        try { row.setPointerCapture(e.pointerId); } catch { /* указатель уже отпущен */ }
        row.style.transition = 'none';
      }
    }
    if (!dragging) return;
    moved = true;
    const w = wrap.offsetWidth;
    dx = Math.min(0, base + mx);
    if (dx < -w * 0.85) dx = -w * 0.85 + (dx + w * 0.85) * 0.25; /* резинка */
    row.style.transform = `translateX(${dx}px)`;
    wrap.classList.toggle('is-full', dx < -w * 0.5);
    action.style.width = `${Math.max(openW, -dx)}px`;
  });

  const release = (e: PointerEvent) => {
    if (e.pointerId !== pid) return;
    pid = null;
    if (!dragging) return;
    dragging = false;
    const w = wrap.offsetWidth;
    wrap.classList.remove('is-full');
    if (dx < -w * 0.5) { action.style.width = `${w}px`; runDelete(wrap, fn, arg); return; }
    action.style.width = '';
    if (dx < -openW * 0.5) {
      row.style.transition = `transform .4s ${EASE_SPRING}`;
      row.style.transform = `translateX(${-openW}px)`;
      wrap.classList.add('is-open');
      openRow = wrap;
    } else closeRow(wrap);
  };
  row.addEventListener('pointerup', release);
  row.addEventListener('pointercancel', release);

  /* после жеста карточка не открывается; тап по открытой строке закрывает её */
  row.addEventListener('click', (e) => {
    if (moved || wrap.classList.contains('is-open')) {
      e.stopPropagation();
      e.preventDefault();
      if (!moved) closeRow(wrap);
      moved = false;
    }
  }, true);
}

function scan(root: Node): void {
  if (!(root instanceof HTMLElement)) return;
  if (root.classList.contains('lg-swipe') || isGhost(root)) return;
  if (root.hasAttribute('data-swipe-fn')) enhanceRow(root);
  root.querySelectorAll<HTMLElement>('[data-swipe-fn]').forEach(enhanceRow);
}

export function initSwipeToDelete(): void {
  document.addEventListener('pointerdown', (e) => {
    if (openRow && !openRow.contains(e.target as Node)) closeRow(openRow);
  }, true);
  new MutationObserver((records) => {
    for (const r of records) r.addedNodes.forEach(scan);
  }).observe(document.body, { childList: true, subtree: true });
  scan(document.body);
}
