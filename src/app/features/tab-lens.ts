/**
 * Glass lens under the active tab. It follows the class that legacy switchTab() sets
 * and stretches in the direction it travels (scale 1.22 over 0.44 s).
 */
export function initTabLens(): void {
  const bar = document.getElementById('app-tabbar');
  const lens = bar?.querySelector<HTMLElement>('.tab-lens');
  if (!bar || !lens) return;
  let prevX: number | null = null;

  const place = (animate: boolean) => {
    const on = bar.querySelector<HTMLElement>(':scope > button.text-blue-600');
    if (!on?.offsetWidth) { lens.style.opacity = '0'; return; }
    const x = on.offsetLeft, w = on.offsetWidth;
    if (animate && prevX !== null && x !== prevX) {
      lens.style.transformOrigin = x > prevX ? 'left center' : 'right center';
      lens.classList.remove('go');
      void lens.offsetWidth; // перезапуск анимации растяжения
      lens.classList.add('go');
    }
    lens.style.translate = `${x}px 0`;
    lens.style.width = `${w}px`;
    lens.style.opacity = '1';
    prevX = x;
  };

  new MutationObserver(() => place(true)).observe(bar, { subtree: true, attributes: true, attributeFilter: ['class'] });
  window.addEventListener('resize', () => place(false));
  requestAnimationFrame(() => place(false));
}
