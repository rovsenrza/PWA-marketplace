/**
 * Notifications sheet, SwiftUI .sheet with .presentationDetents([.medium, .large]).
 * Medium detent: the whole sheet drags, scrolling up expands it. Large detent: the list scrolls,
 * the page behind scales down like an iOS card. Swipe down or tap the scrim to dismiss.
 */
import { EASE_PUSH, mainScroller, play } from '../motion/easing';
import { StorageKeys } from '../../../shared/storage/keys';
import { readSet, writeSet, onExternalChange } from '../../../shared/storage/local-store';
import { esc } from '../../../shared/ui/html';
import { collectNotifications, relativeTime, runAction, type AppNotification } from './sources';

type Detent = 'medium' | 'large';

const ICONS: Record<'order' | 'cart', string> = {
  order: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
  cart: '<path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 2.3c-.6.6-.2 1.7.7 1.7H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>',
};
const EMPTY = '<div class="lg-notif-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4-5.7V5a2 2 0 10-4 0v.3C7.7 6.2 6 8.4 6 11v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg><p>Новых уведомлений нет</p><span>Здесь появятся статусы заказов и новые истории магазинов</span></div>';

export function initNotificationsSheet(phone: HTMLElement): void {
  let root: HTMLElement | null = null;
  let sheet!: HTMLElement;
  let scrim!: HTMLElement;
  let body!: HTMLElement;
  let list!: HTMLElement;
  let clearBtn!: HTMLButtonElement;
  let detent: Detent = 'medium';
  let shown: AppNotification[] = [];

  const updateBell = () => {
    const dot = document.querySelector<HTMLElement>('.lg-bell .lg-dot');
    if (!dot) return;
    const seen = readSet(StorageKeys.notificationsSeen);
    dot.style.display = collectNotifications().some((n) => !seen.has(n.id)) ? '' : 'none';
  };

  const detentY = (d: Detent) => (d === 'large' ? 0 : Math.round(phone.clientHeight * 0.42));

  function setY(y: number, animated: boolean): void {
    sheet.style.transition = animated ? `transform .46s ${EASE_PUSH}` : 'none';
    sheet.style.transform = `translateY(${y}px)`;
    const k = Math.max(0, Math.min(1, 1 - y / phone.clientHeight));
    scrim.style.opacity = String(Math.min(1, k * 1.4));
    /* большой детент — страница позади уменьшается, как карточка в iOS */
    const main = mainScroller();
    const large = Math.max(0, 1 - y / detentY('medium'));
    if (main) {
      main.style.transition = animated ? `transform .46s ${EASE_PUSH}, border-radius .46s` : 'none';
      main.style.transform = large > 0 ? `scale(${1 - 0.06 * large})` : '';
      main.style.borderRadius = large > 0 ? `${18 * large}px` : '';
    }
  }

  const applyDetent = () => {
    root?.classList.toggle('is-large', detent === 'large');
    setY(detentY(detent), true);
  };

  function rowHtml(n: AppNotification): string {
    const ico = n.img
      ? `<img src="${esc(n.img)}" alt="">`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n.kind as 'order' | 'cart'] ?? ICONS.order}</svg>`;
    return `<div class="lg-notif-row" data-swipe-fn="dismissNotification" data-swipe-arg="${esc(n.id)}">`
      + `<span class="lg-notif-ico lg-notif-ico--${n.kind}">${ico}</span>`
      + `<span class="lg-notif-copy"><b>${esc(n.title)}</b><span>${esc(n.text)}</span></span>`
      + `<time>${relativeTime(n.at)}</time></div>`;
  }

  function render(): void {
    shown = collectNotifications();
    clearBtn.style.visibility = shown.length ? '' : 'hidden';
    list.innerHTML = shown.length ? shown.map(rowHtml).join('') : EMPTY;
    const seen = readSet(StorageKeys.notificationsSeen);
    shown.forEach((n) => seen.add(n.id));
    writeSet(StorageKeys.notificationsSeen, seen);
    updateBell();
  }

  function close(): void {
    if (!root || root.hidden) return;
    setY(phone.clientHeight, true);
    document.removeEventListener('keydown', onKey);
    window.setTimeout(() => {
      if (root) root.hidden = true;
      const main = mainScroller();
      if (main) { main.style.transform = ''; main.style.borderRadius = ''; main.style.transition = ''; }
    }, 380);
  }
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };

  function bindDrag(): void {
    let pid: number | null = null;
    let active = false, startX = 0, startY = 0, baseY = 0, lastY = 0, lastT = 0, vel = 0;
    sheet.addEventListener('pointerdown', (e) => {
      if (detent === 'large' && body.contains(e.target as Node)) return;
      pid = e.pointerId; active = false; vel = 0;
      startX = e.clientX; startY = lastY = e.clientY; lastT = performance.now();
      baseY = detentY(detent);
    });
    /* движение слушаем на окне: палец быстро уходит за верхний край шита */
    window.addEventListener('pointermove', (e) => {
      if (e.pointerId !== pid) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (!active) {
        if (Math.abs(dx) < 7 && Math.abs(dy) < 7) return;
        if (Math.abs(dx) > Math.abs(dy)) { pid = null; return; } // горизонталь — свайпу строк
        active = true;
        try { sheet.setPointerCapture(e.pointerId); } catch { /* указатель уже отпущен */ }
      }
      const now = performance.now();
      vel = (e.clientY - lastY) / Math.max(1, now - lastT);
      lastY = e.clientY; lastT = now;
      let y = baseY + dy;
      if (y < 0) y *= 0.3; /* резинка выше большого детента */
      setY(y, false);
    });
    const up = (e: PointerEvent) => {
      if (e.pointerId !== pid) return;
      pid = null;
      if (!active) return;
      active = false;
      const y = baseY + (lastY - startY), mid = detentY('medium'), h = phone.clientHeight;
      if (vel > 0.8 || y > mid + (h - mid) * 0.38) { close(); return; }
      if (vel < -0.5) detent = 'large';
      else if (vel > 0.5) detent = 'medium';
      else detent = y < mid / 2 ? 'large' : 'medium';
      applyDetent();
    };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    body.addEventListener('wheel', (e) => {
      if (detent === 'medium' && e.deltaY > 0) { detent = 'large'; applyDetent(); e.preventDefault(); }
      else if (detent === 'large' && e.deltaY < 0 && body.scrollTop <= 0) { detent = 'medium'; applyDetent(); e.preventDefault(); }
    }, { passive: false });
  }

  function build(): void {
    root = document.createElement('div');
    root.id = 'lg-notif-sheet';
    root.className = 'lg-sheet-root';
    root.hidden = true;
    root.innerHTML = '<div class="lg-sheet-scrim"></div>'
      + '<section class="lg-sheet" role="dialog" aria-modal="true" aria-labelledby="lg-notif-title">'
      + '<div class="lg-sheet-grab" aria-hidden="true"><i></i></div>'
      + '<header class="lg-sheet-head">'
      + '<button type="button" class="lg-sheet-btn" data-act="clear">Очистить</button>'
      + '<h2 id="lg-notif-title">Уведомления</h2>'
      + '<button type="button" class="lg-sheet-btn lg-sheet-btn--done" data-act="close">Готово</button>'
      + '</header>'
      + '<div class="lg-sheet-body"><div class="lg-notif-list"></div></div>'
      + '</section>';
    phone.appendChild(root);
    sheet = root.querySelector<HTMLElement>('.lg-sheet')!;
    scrim = root.querySelector<HTMLElement>('.lg-sheet-scrim')!;
    body = root.querySelector<HTMLElement>('.lg-sheet-body')!;
    list = root.querySelector<HTMLElement>('.lg-notif-list')!;
    clearBtn = root.querySelector<HTMLButtonElement>('[data-act="clear"]')!;

    scrim.addEventListener('click', close);
    root.querySelector('[data-act="close"]')!.addEventListener('click', close);
    clearBtn.addEventListener('click', () => {
      const gone = readSet(StorageKeys.notificationsDismissed);
      shown.forEach((n) => gone.add(n.id));
      writeSet(StorageKeys.notificationsDismissed, gone);
      const rows = list.querySelectorAll('.lg-notif-row');
      rows.forEach((r, i) => play(r, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(-30%)' }],
        { duration: 220, delay: i * 30, easing: EASE_PUSH, fill: 'forwards' }));
      window.setTimeout(render, 240 + rows.length * 30);
    });
    /* тап по строке: шит уходит, затем действие */
    list.addEventListener('click', (e) => {
      const row = (e.target as Element).closest('.lg-notif-row');
      const n = row && shown.find((x) => x.id === row.getAttribute('data-swipe-arg'));
      if (!n) return;
      close();
      window.setTimeout(() => runAction(n.action), 220);
    });
    bindDrag();
  }

  window.openNotifications = () => {
    if (!root) build();
    render();
    root!.hidden = false;
    detent = 'medium';
    root!.classList.remove('is-large');
    setY(phone.clientHeight, false);
    void sheet.offsetHeight;
    requestAnimationFrame(() => setY(detentY(detent), true));
    document.addEventListener('keydown', onKey);
  };
  window.closeNotifications = close;
  window.dismissNotification = (id: string) => {
    const gone = readSet(StorageKeys.notificationsDismissed);
    gone.add(id);
    writeSet(StorageKeys.notificationsDismissed, gone);
    shown = shown.filter((n) => n.id !== id);
    const row = list?.querySelector(`.lg-notif-row[data-swipe-arg="${CSS.escape(id)}"]`);
    (row?.closest('.lg-swipe') ?? row)?.remove();
    if (root && !shown.length) render();
  };

  updateBell();
  onExternalChange(StorageKeys.notificationsSeen, updateBell);
  onExternalChange(StorageKeys.marketplace, updateBell);
}
