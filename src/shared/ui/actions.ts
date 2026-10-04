/**
 * Button actions without inline handlers: the markup carries data-action="name" + data-* parameters,
 * and one document listener calls the registered handler. Ids and other data don't go through
 * JavaScript strings in attributes (onclick="fn('…')"), so they can't break out of them.
 */
type Handler = (el: HTMLElement, event: MouseEvent) => void;
const handlers = new Map<string, Handler>();
let installed = false;

export function registerActions(map: Record<string, Handler>): void {
  for (const [name, fn] of Object.entries(map)) {
    if (handlers.has(name)) throw new Error(`action "${name}" is already registered`);
    handlers.set(name, fn);
  }
  if (installed) return;
  installed = true;
  document.addEventListener('click', (e) => {
    const el = (e.target as Element | null)?.closest<HTMLElement>('[data-action]');
    const fn = el && handlers.get(el.dataset.action ?? '');
    if (!el || !fn || el.closest('[data-lg-ghost]')) return;
    e.preventDefault();
    fn(el, e);
  });
}
