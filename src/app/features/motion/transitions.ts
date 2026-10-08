/**
 * Screen and overlay transitions (SwiftUI-style).
 *
 * The legacy code opens and closes screens by toggling the `hidden` class. One MutationObserver
 * catches those toggles:
 *  - a screen appears: tab switch = fade, going deeper = push from the right, back = from the left;
 *  - an overlay opens: page (push), sheet (from below), dialog (scale), story (from its bubble);
 *  - an overlay closes: the app has already closed it; a visual copy (ghost) plays the exit and removes itself.
 * App code never waits on an animation and needs no changes.
 */
import { EASE_OUT, EASE_PUSH, EASE_SPRING, mainScroller, play, prefersCalm } from './easing';

type OverlayKind = 'push' | 'sheet' | 'dialog' | 'rise' | 'zoom' | 'story' | 'fade';

const MAIN_VIEWS = new Set(['view-catalog', 'view-directory', 'view-cart', 'view-favorites', 'view-profile']);
const PUSH_IDS = new Set([
  'product-modal', 'shop-catalog-modal', 'company-catalog-modal', 'spectech-modal',
  'vacancy-modal', 'portfolio-modal', 'ls-studio-modal', 'assistant-sheet',
]);
const SKIP_IDS = new Set(['home-shop-slides', 'screen-onboarding', 'sv-video', 'sv-image', 'lg-notif-sheet']);
const GHOST_ATTR = 'data-lg-ghost';

const hasHidden = (cls: string | null) => /(^|\s)hidden(\s|$)/.test(cls ?? '');

function isView(el: Element): boolean {
  const id = el.id;
  return MAIN_VIEWS.has(id) || id.startsWith('subview-') || id === 'view-category-products';
}

function overlayKind(el: Element): OverlayKind | null {
  const id = el.id;
  if (SKIP_IDS.has(id) || (el.closest('#story-viewer') && id !== 'story-viewer')) return null;
  if (id === 'storefront') return 'fade';
  if (id === 'story-viewer') return 'story';
  if (id === 'lightbox') return 'zoom';
  if (id === 'pm-about-sheet') return 'rise';
  if (PUSH_IDS.has(id)) return 'push';
  const c = ` ${el.getAttribute('class') ?? ''} `;
  if (!c.includes(' inset-0 ') || (!c.includes(' absolute ') && !c.includes(' fixed '))) return null;
  if (c.includes('promo-slide')) return null;
  if (c.includes(' justify-end ')) return 'sheet';
  if (c.includes(' items-center ')) return 'dialog';
  return 'fade';
}

/** The sheet's or dialog's content panel: its first meaningful child. */
function panelOf(el: Element): Element | null {
  for (let n = el.firstElementChild; n; n = n.nextElementSibling) {
    if (n.tagName.toLowerCase() === 'svg' || n.getAttribute('aria-hidden') === 'true' || n.tagName === 'SCRIPT') continue;
    return n;
  }
  return null;
}

export function initTransitions(phone: HTMLElement): void {
  /* ---------- сторис раскрывается из кружка, по которому нажали ---------- */
  let storyOrigin: DOMRect | null = null;
  document.addEventListener('click', (e) => {
    const t = (e.target as Element | null)?.closest?.('[onclick^="openStory("]');
    if (!t) return;
    storyOrigin = (t.querySelector('img') ?? t).getBoundingClientRect();
  }, true);

  function storyFrames(el: HTMLElement, opening: boolean): Keyframe[] {
    const p = phone.getBoundingClientRect();
    let from = 'scale(.6)';
    let origin = '50% 50%';
    if (storyOrigin?.width) {
      const cx = storyOrigin.left + storyOrigin.width / 2 - p.left;
      const cy = storyOrigin.top + storyOrigin.height / 2 - p.top;
      origin = `${cx}px ${cy}px`;
      from = `scale(${Math.max(0.06, storyOrigin.width / p.width).toFixed(3)})`;
    }
    el.style.transformOrigin = origin;
    const a: Keyframe = { transform: from, borderRadius: '50%', opacity: 0.4 };
    const b: Keyframe = { transform: 'scale(1)', borderRadius: '0px', opacity: 1 };
    return opening ? [a, b] : [b, a];
  }

  /* фон под push-страницей уходит назад, как в UINavigationController */
  function shiftUnderlay(): void {
    if (prefersCalm()) return;
    play(mainScroller(), [
      { transform: 'translateX(0)', opacity: 1 },
      { transform: 'translateX(-22%)', opacity: 0.94 },
      { transform: 'translateX(0)', opacity: 1 },
    ], { duration: 520, easing: EASE_PUSH });
  }

  function enter(el: HTMLElement, kind: OverlayKind): void {
    if (prefersCalm()) { play(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 120 }); return; }
    switch (kind) {
      case 'push':
        play(el, [
          { transform: 'translateX(100%)', boxShadow: '-20px 0 40px rgba(0,0,0,0)' },
          { transform: 'translateX(0)', boxShadow: '-20px 0 40px rgba(0,0,0,.18)' },
        ], { duration: 420, easing: EASE_PUSH });
        shiftUnderlay();
        break;
      case 'sheet':
        play(el, [{ backgroundColor: 'rgba(0,0,0,0)' }, {}], { duration: 260, easing: 'ease-out' });
        play(panelOf(el), [{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], { duration: 420, easing: EASE_PUSH });
        break;
      case 'dialog':
        play(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
        play(panelOf(el), [{ transform: 'scale(.9)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 380, easing: EASE_SPRING });
        break;
      case 'rise':
        play(el, [{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], { duration: 420, easing: EASE_PUSH });
        break;
      case 'zoom':
        play(el, [{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 260, easing: EASE_OUT });
        break;
      case 'story':
        play(el, storyFrames(el, true), { duration: 380, easing: EASE_PUSH });
        break;
      default:
        play(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
    }
  }

  /* ---------- выход: копия уезжает, оригинал уже закрыт ---------- */
  const scrollMemo = new WeakMap<Element, number>();
  document.addEventListener('scroll', (e) => {
    const t = e.target;
    if (t instanceof Element) scrollMemo.set(t, t.scrollTop);
  }, { capture: true, passive: true });

  function ghost(el: HTMLElement, oldClass: string, kind: OverlayKind): void {
    if (prefersCalm() || !el.parentNode) return;
    /* id сохраняются, чтобы стили по #id применились к копии; оригинал стоит раньше в DOM,
       поэтому getElementById по-прежнему находит его */
    const clone = el.cloneNode(true) as HTMLElement;
    clone.setAttribute('aria-hidden', 'true');
    clone.setAttribute(GHOST_ATTR, '');
    clone.className = oldClass.replace(/(^|\s)hidden(\s|$)/g, ' ');
    if (kind === 'push' || kind === 'story') clone.style.setProperty('z-index', '200', 'important');
    clone.style.pointerEvents = 'none';
    clone.querySelectorAll('video, iframe, audio').forEach((m) => m.remove());
    el.parentNode.insertBefore(clone, el.nextSibling);
    /* прокрутка копии как у оригинала, чтобы она не прыгала наверх */
    const src = el.querySelectorAll('*');
    const dst = clone.querySelectorAll('*');
    for (let i = 0; i < src.length && i < dst.length; i++) {
      const y = scrollMemo.get(src[i]);
      if (y) dst[i].scrollTop = y;
    }
    const out: KeyframeAnimationOptions = { easing: EASE_PUSH, fill: 'forwards' };
    let anim: Animation | null;
    switch (kind) {
      case 'push':
        anim = play(clone, [{ transform: 'translateX(0)' }, { transform: 'translateX(100%)' }], { ...out, duration: 340 });
        play(mainScroller(), [{ transform: 'translateX(-18%)', opacity: 0.92 }, { transform: 'translateX(0)', opacity: 1 }], { duration: 340, easing: EASE_PUSH });
        break;
      case 'sheet':
        anim = play(clone, [{}, { backgroundColor: 'rgba(0,0,0,0)' }], { duration: 300, easing: 'ease-in', fill: 'forwards' });
        play(panelOf(clone), [{ transform: 'translateY(0)' }, { transform: 'translateY(100%)' }], { ...out, duration: 300 });
        break;
      case 'dialog':
        anim = play(clone, [{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: 'ease-in', fill: 'forwards' });
        play(panelOf(clone), [{ transform: 'scale(1)' }, { transform: 'scale(.94)' }], { duration: 180, easing: 'ease-in', fill: 'forwards' });
        break;
      case 'rise':
        anim = play(clone, [{ transform: 'translateY(0)' }, { transform: 'translateY(100%)' }], { ...out, duration: 300 });
        break;
      case 'story':
        anim = play(clone, storyFrames(clone, false), { ...out, duration: 300 });
        break;
      default:
        anim = play(clone, [{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: 'ease-in', fill: 'forwards' });
    }
    const done = () => clone.remove();
    if (anim) { anim.onfinish = done; anim.oncancel = done; }
    window.setTimeout(done, 700);
  }

  /* ---------- переходы между экранами: направление по истории ---------- */
  let history: string[] = ['view-catalog'];
  function viewEntered(el: HTMLElement): void {
    const id = el.id;
    let dir: 'tab' | 'push' | 'back';
    if (history.length > 1 && history[history.length - 2] === id) {
      history.pop();
      dir = 'back';
    } else if (MAIN_VIEWS.has(id)) {
      const fromSub = history.length > 0 && !MAIN_VIEWS.has(history[history.length - 1]);
      dir = fromSub && history.includes(id) ? 'back' : 'tab';
      history = [id];
    } else {
      if (history[history.length - 1] !== id) history.push(id);
      dir = 'push';
    }
    if (prefersCalm()) { play(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 120 }); return; }
    if (dir === 'tab') play(el, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: EASE_OUT });
    else if (dir === 'push') play(el, [{ opacity: 0, transform: 'translateX(28%)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: EASE_PUSH });
    else play(el, [{ opacity: 0, transform: 'translateX(-22%)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: EASE_PUSH });
  }

  new MutationObserver((records) => {
    const seen = new Set<Element>();
    for (const r of records) {
      const el = r.target;
      if (!(el instanceof HTMLElement) || seen.has(el) || el.hasAttribute(GHOST_ATTR)) continue;
      if (!el.id && !/inset-0/.test(el.getAttribute('class') ?? '')) continue;
      const was = hasHidden(r.oldValue);
      const now = el.classList.contains('hidden');
      if (was === now) continue;
      seen.add(el);
      if (isView(el)) { if (!now) viewEntered(el); continue; }
      const kind = overlayKind(el);
      if (!kind) continue;
      if (now) ghost(el, r.oldValue ?? '', kind);
      else enter(el, kind);
    }
  }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });
}

export const isGhost = (el: Element | null): boolean => !!el?.closest(`[${GHOST_ATTR}]`);
