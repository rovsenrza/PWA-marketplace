import { test as base, expect, type Page } from '@playwright/test';

/** The app with onboarding and the PWA install banner skipped. Page errors fail the test. */
export const test = base.extend<{ app: Page }>({
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
