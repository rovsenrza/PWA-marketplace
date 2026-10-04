import { test, expect } from './fixtures';

/* Walks the directory and the deeper screens. Catches broken links between domain files:
   any ReferenceError surfaces as a page error, and the fixture fails the test. */
const call = (fn: string, ...args: unknown[]) => `window[${JSON.stringify(fn)}](...${JSON.stringify(args)})`;

test('directory: every section opens', async ({ app }) => {
  await app.evaluate(() => (window as any).switchTab('directory'));
  const sections = ['product_categories', 'shops', 'specialists', 'spec-private', 'spec-companies', 'spectech',
    'landscaping', 'other', 'designers', 'companies', 'jobs', 'calculator', 'realestate', 'lifehacks'];
  for (const id of sections) {
    await app.evaluate(call('switchDirectoryView', id));
    await expect(app.locator(`#subview-${id}`), id).toBeVisible();
    await app.evaluate(call('backToDirectory'));
  }
});

test('calculators: tiles, laminate, plaster, renovation estimate', async ({ app }) => {
  await app.evaluate(() => { (window as any).switchTab('directory'); (window as any).switchDirectoryView('calculator'); });
  for (const title of ['Онлайн Калькулятор Плитки', 'Онлайн Калькулятор Ламинат',
    'Онлайн Калькулятор Штукатурки', 'Онлайн Калькулятор Расчет Работы Ремонта']) {
    await app.evaluate(call('openSpecificCalc', title));
    await expect(app.locator('#subview-specific-calc')).toBeVisible();
  }
  await app.evaluate(call('openSpecificCalc', 'Онлайн Калькулятор Плитки'));
  await app.evaluate(() => (window as any).calculateTile());
});

test('deeper screens: lifehack, special machinery, company, portfolio, vacancy, agency', async ({ app }) => {
  const first = (expr: string) => app.evaluate(expr);
  await app.evaluate(() => { (window as any).switchTab('directory'); (window as any).switchDirectoryView('lifehacks'); });
  const lh = await first('(publishedLifehacks()[0] || {}).id');
  expect(lh, 'lh').toBeTruthy();
  { await app.evaluate(call('openLifehackArticle', lh)); await expect(app.locator('#subview-lifehack-article')).toBeVisible(); }

  await app.evaluate(() => (window as any).switchDirectoryView('spectech'));
  const st = await first("(document.querySelector('[onclick^=\"openSpectechModal(\"]')||{}).getAttribute?.('onclick')");
  expect(st, 'st').toBeTruthy();
  { await app.evaluate(st as string); await expect(app.locator('#spectech-modal')).toBeVisible(); await app.evaluate(call('closeSpectechModal')); }

  await app.evaluate(() => (window as any).switchDirectoryView('companies'));
  const co = await first("(document.querySelector('#subview-companies [onclick^=\"openCompanyCatalogModal(\"]')||{}).getAttribute?.('onclick')");
  expect(co, 'co').toBeTruthy();
  { await app.evaluate(co as string); await expect(app.locator('#company-catalog-modal')).toBeVisible(); await app.evaluate(call('closeCompanyCatalogModal')); }

  await app.evaluate(() => (window as any).switchDirectoryView('designers'));
  const pf = await first("(document.querySelector('[onclick^=\"openPortfolioModal(\"]')||{}).getAttribute?.('onclick')");
  expect(pf, 'pf').toBeTruthy();
  { await app.evaluate(pf as string); await expect(app.locator('#portfolio-modal')).toBeVisible(); await app.evaluate(call('closePortfolioModal')); }

  await app.evaluate(() => (window as any).switchDirectoryView('jobs'));
  const vc = await first("(document.querySelector('[onclick^=\"openVacancyModal(\"]')||{}).getAttribute?.('onclick')");
  expect(vc, 'vc').toBeTruthy();
  { await app.evaluate(vc as string); await expect(app.locator('#vacancy-modal')).toBeVisible(); await app.evaluate(call('closeVacancyModal')); }

  await app.evaluate(() => (window as any).switchDirectoryView('re-agencies'));
  await app.evaluate(call('switchDirectoryView', 're-commercial'));
  await expect(app.locator('#subview-re-commercial')).toBeVisible();
});

test('events app:favorites-changed / app:cart-changed: the recommendations and the bell redraw', async ({ app }) => {
  const id = await app.evaluate(() => document.querySelector('.rec-card')!.getAttribute('onclick')!.match(/'([^']+)'/)![1]);
  await app.evaluate(call('toggleFavorite', id));
  await expect(app.locator('.rec-card .rec-fav.on')).toHaveCount(1);
  await app.evaluate(call('addToCart', id));
  await expect(app.locator('.rec-card .rec-add.in')).toHaveCount(1);
  await app.evaluate(call('removeFromCart', id));
  await expect(app.locator('.rec-card .rec-add.in')).toHaveCount(0);
  /* колокольчик: после изменения корзины есть непрочитанное */
  await app.evaluate(() => localStorage.setItem('meb_notif_seen', '[]'));
  await app.evaluate(call('addToCart', id));
  await expect(app.locator('.lg-bell .lg-dot')).toBeVisible();
  /* на странице товара сердце перекрашивается через тот же слушатель (pmRefreshFav) */
  await app.evaluate(call('openProductModal', 'prod-7'));
  await app.evaluate(call('toggleFavorite', 'prod-7'));
  await expect(app.locator('#pm-fav-btn')).toHaveClass(/text-red-500/);
  await app.evaluate(call('toggleFavorite', 'prod-7'));
  await expect(app.locator('#pm-fav-btn')).not.toHaveClass(/text-red-500/);
});

test('in-app CRM: lists render', async ({ app }) => {
  for (const fn of ['renderCrmPromoList', 'renderCrmStoryList', 'renderCrmOnbList', 'renderCrmLifehackList',
    'renderCrmShopList', 'renderCrmSpecList', 'renderCrmProductList', 'renderAdminModerationList', 'updateAdminStats', 'renderShopOrders', 'renderBuyerOrders']) {
    await app.evaluate(`typeof window[${JSON.stringify(fn)}] === 'function' && window[${JSON.stringify(fn)}]()`);
  }
});
