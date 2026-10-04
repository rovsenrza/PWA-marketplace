import { test as base, expect, type Page } from '@playwright/test';

/**
 * Hermetic tests: no request leaves for the internet. External images (Unsplash and friends)
 * get a 1-pixel placeholder, styles and fonts an empty response, everything else is aborted.
 * Before, every page waited for ~100 real photos and the parallel suite failed on timeouts.
 * Page-level routes (page.route) take precedence over these, so a test can set up its own network.
 */
const PIXEL = '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>';
const isLocal = (url: URL) => url.hostname === 'localhost' || url.hostname === '127.0.0.1';

export const test = base.extend<{ app: Page }>({
  context: async ({ context }, use) => {
    await context.route((url) => !isLocal(url), (route) => {
      const type = route.request().resourceType();
      if (type === 'image' || type === 'media') return route.fulfill({ status: 200, contentType: 'image/svg+xml', body: PIXEL });
      if (type === 'stylesheet') return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
      if (type === 'font') return route.fulfill({ status: 200, contentType: 'font/woff2', body: '' });
      return route.abort();
    });
    await use(context);
  },
  /** The app with onboarding and the PWA install banner skipped. Page errors fail the test. */
  app: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    /* баннер «Установить приложение» всплывает с задержкой и может перекрыть клик */
    await page.addInitScript(() => localStorage.setItem('pwa_install_dismissed', String(Date.now())));
    await page.goto('/index.html');
    await page.waitForFunction(() => typeof (window as any).switchTab === 'function');
    await page.evaluate(() => { document.getElementById('screen-onboarding')!.style.display = 'none'; });
    await use(page);
    expect(errors, 'page errors').toEqual([]);
  },
});
export { expect };
