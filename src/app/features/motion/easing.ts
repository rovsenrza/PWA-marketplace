/** Motion curves and helpers, shared by every feature. */
export const EASE_PUSH = 'cubic-bezier(.32, .72, 0, 1)'; // кривая навигации iOS
export const EASE_OUT = 'cubic-bezier(.22, 1, .36, 1)';
export const EASE_SPRING = 'cubic-bezier(.34, 1.36, .64, 1)';

const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)');
export const prefersCalm = (): boolean => !!reduced?.matches;

export function play(
  el: Element | null | undefined,
  frames: Keyframe[],
  opts: KeyframeAnimationOptions,
): Animation | null {
  if (!el) return null;
  try {
    return el.animate(frames, { fill: 'none', ...opts });
  } catch {
    return null;
  }
}

export const mainScroller = (): HTMLElement | null => document.getElementById('main-scroll-container');
