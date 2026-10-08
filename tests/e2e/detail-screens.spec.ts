import { test, expect } from './fixtures';

test('fresh profile requires both consents and persists acceptance', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page.locator('#onb-slide-1')).toBeVisible();
  await page.waitForFunction(() => typeof (window as any).showConsent === 'function');
  await page.evaluate(() => { for (let i = 0; i < 6; i++) (window as any).nextSlide(); });
  const button = page.locator('#onb-footer > button');
  await expect(button).toBeDisabled();
  await page.locator('[data-action="consent-document"]').first().click();
  await expect(page.locator('#consent-sheet')).toContainText('Проект соглашения');
  await page.locator('[data-action="consent-document-close"]').click();
  await page.locator('#consent-agreement').check();
  await expect(button).toBeDisabled();
  await page.locator('#consent-cookies').check();
  await expect(button).toBeEnabled();
  await button.click();
  await expect(page.locator('#screen-onboarding')).toBeHidden();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('meb_consent') || '{}').agreement)).toBe(true);
});

test('product store spine opens its storefront', async ({ app }) => {
  await app.evaluate(() => (window as any).openProductModal('prod-2'));
  await expect(app.locator('#pm-technical-table')).not.toBeEmpty();
  await expect(app.locator('#pm-store-services')).toContainText('Доставка');
  await app.locator('.pm-seller').click();
  await expect(app.locator('#storefront')).toBeVisible();
});

test('cart items share one store header with accessible steppers', async ({ app }) => {
  await app.evaluate(() => { (window as any).addToCart('prod-2'); (window as any).addToCart('prod-10'); (window as any).switchTab('cart'); });
  expect(await app.locator('.cart-store-group').count()).toBeGreaterThan(0);
  await app.locator('.cart-qty button[aria-label="Больше"]').first().click();
  await expect(app.locator('.cart-qty span').first()).toHaveText('2');
  await expect(app.locator('.cart-group-foot').first()).toContainText('₽');
});
