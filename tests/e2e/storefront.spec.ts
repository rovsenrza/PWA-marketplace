import { test, expect } from './fixtures';

async function open(app: import('@playwright/test').Page, name: string) {
  await app.evaluate((store) => (window as any).openStorefront(store), name);
  await expect(app.locator('#storefront:not([data-lg-ghost])')).toBeVisible();
}
const page = '#storefront:not([data-lg-ghost])';

test('three demo stores have their own ink, voice and complete skeleton', async ({ app }) => {
  const themes: string[] = [];
  for (const store of ['Постройка', 'Кухни Дриада', 'Любимый Дом']) {
    await open(app, store);
    await expect(app.locator(`${page} .sf-cover h1`)).toHaveText(store);
    const coverPhoto = app.locator(`${page} .sf-cover__photo`);
    await expect(coverPhoto).toHaveAttribute('src', /^shops-banners\/.+\.jpg$/);
    await expect.poll(() => coverPhoto.evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    const contrasts = await app.locator(`${page} .sf-top button`).evaluateAll((buttons) => {
      const luminance = (colour: string) => {
        const rgb = colour.match(/[\d.]+/g)!.slice(0, 3).map(Number).map((c) => {
          const n = c / 255;
          return n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4;
        });
        return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
      };
      return buttons.map((button) => {
        const style = getComputedStyle(button);
        const a = luminance(style.color), b = luminance(style.backgroundColor);
        return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
      });
    });
    for (const ratio of contrasts) expect(ratio).toBeGreaterThanOrEqual(4.5);
    for (const block of ['catalog', 'about', 'addresses', 'managers', 'terms']) await expect(app.locator(`${page} .sf-${block}`)).toHaveCount(1);
    themes.push(await app.locator(page).evaluate((el) => `${(el as HTMLElement).dataset.voice}|${getComputedStyle(el).getPropertyValue('--sf-ink')}`));
  }
  expect(new Set(themes).size).toBe(3);
});

test('store filters narrow the catalogue and never carry into another store', async ({ app }) => {
  await open(app, 'Постройка');
  const before = await app.locator(`${page} .sf-grid .r-cell`).count();
  await app.locator(`${page} .sf-quick [data-value="Штукатурка"]`).click();
  const after = await app.locator(`${page} .sf-grid .r-cell`).count();
  expect(after).toBeGreaterThan(0); expect(after).toBeLessThan(before);
  await expect(app.locator(`${page} [data-action="sf-filters"]`)).toHaveText('Фильтры (1)');
  await open(app, 'Кухни Дриада');
  await expect(app.locator(`${page} [data-action="sf-filters"]`)).toHaveText('Фильтры (0)');
});

test('the consumption calculator adds exactly seven 30kg plaster bags', async ({ app }) => {
  await open(app, 'Постройка');
  const plaster = await app.evaluate(() => Object.values(eval('productsDb') as Record<string, any>).find((p) => p.store === 'Постройка' && p.attrs?.['Основа'] === 'гипс' && p.attrs?.['Фасовка, кг'] === 30)?.id);
  expect(plaster).toBeTruthy();
  await app.locator('#sf-mix-product').selectOption(plaster);
  await app.locator('#sf-mix-area').fill('20'); await app.locator('#sf-mix-layer').fill('10');
  await expect(app.locator('#sf-mix-result')).toContainText('7 мешков');
  await app.locator('#sf-mix-add').click();
  expect(await app.evaluate((id) => (window as any).getCartItems().find((line: any) => line.productId === id)?.qty, plaster)).toBe(7);
  await expect(app.locator('#sf-cart-count')).toHaveText('7');
});

test('lookbook pins highlight products and their rows open product details above the store', async ({ app }) => {
  await open(app, 'Кухни Дриада');
  const pin = app.locator(`${page} .sf-pin`).first(); const id = await pin.getAttribute('data-product');
  await pin.click();
  const row = app.locator(`${page} [data-pin-product="${id}"]`);
  await expect(row).toHaveClass(/is-on/); await row.click();
  await expect(app.locator('#product-modal:not([data-lg-ghost])')).toBeVisible();
  await expect.poll(() => app.evaluate(() => !!document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.closest('#product-modal'))).toBe(true);
});

test('a store without storefront content still has a cover, products, addresses and payment terms', async ({ app }) => {
  await open(app, 'Кровельщик');
  await expect(app.locator(`${page} .sf-cover h1`)).toHaveText('Кровельщик');
  await expect(app.locator(`${page} .sf-grid .r-cell`)).toHaveCount(1);
  await expect(app.locator(`${page} .sf-addresses`)).toBeAttached();
  await expect(app.locator(`${page} .sf-terms`)).toContainText('приложение платежи не принимает');
});

test('deep links, browser back, range filters and 360px layouts work', async ({ app }) => {
  await app.goto('/index.html#store=' + encodeURIComponent('Постройка'));
  await expect(app.locator(page)).toBeVisible();
  await app.locator(`${page} [data-action="sf-filters"]`).click();
  const range = app.locator(`${page} input[data-filter-key="price"][data-bound="min"]`);
  await range.fill('999999');
  await expect(app.locator('#sf-filter-show')).toHaveText('Показать 0 товаров');
  await app.locator('#sf-filter-show').click(); await expect(app.locator(`${page} .sf-empty`)).toBeVisible();
  await open(app, 'Любимый Дом'); await app.goBack(); await expect(app.locator(`${page} .sf-cover h1`)).toHaveText('Постройка');
  await app.setViewportSize({ width: 360, height: 780 });
  expect(await app.locator(`${page} .sf-scroll`).evaluate((el) => el.scrollWidth - el.clientWidth)).toBe(0);
});
