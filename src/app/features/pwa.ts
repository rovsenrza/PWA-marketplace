/**
 * Registers the service worker. Production builds only: in dev there is no sw.js, and the
 * server would answer with HTML (a console error and a worker that intercepts HMR).
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  const go = () => navigator.serviceWorker.register('sw.js').catch(() => { /* офлайн-режим недоступен */ });
  if (document.readyState === 'complete') go();
  else window.addEventListener('load', go, { once: true });
}
