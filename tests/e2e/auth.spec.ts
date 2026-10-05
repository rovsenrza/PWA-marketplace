import { test, expect } from './fixtures';

const signIn = async (app: import('@playwright/test').Page, login: string, password: string) => {
  await app.evaluate(() => { (window as any).switchTab('profile'); (window as any).switchAuthTab('login'); });
  await app.fill('#login-phone', login);
  await app.fill('#login-password', password);
  await app.evaluate(() => (window as any).submitLogin());
};
const legacyState = (app: import('@playwright/test').Page) =>
  app.evaluate(() => { const s = eval('state'); return { auth: s.isAuthenticated, role: s.userRole, shop: s.currentShop }; });

test('administrator demo sign-in: the admin dashboard; sign-out resets the role (it used to stay admin)', async ({ app }) => {
  await signIn(app, 'admin', 'x');
  await expect(app.locator('#dash-admin')).toBeVisible();
  expect(await legacyState(app)).toEqual({ auth: true, role: 'admin', shop: '' });
  await app.evaluate(() => (window as any).logout());
  await expect(app.locator('#profile-unauth')).toBeVisible();
  expect(await legacyState(app)).toEqual({ auth: false, role: 'user', shop: '' });
});

test('store: the cabinet of its own store; buyer: a short password is refused', async ({ app }) => {
  await signIn(app, 'shop2', 'x');
  await expect(app.locator('#dash-shop')).toBeVisible();
  expect(await legacyState(app)).toMatchObject({ role: 'shop', shop: 'Кухни Дриада' });
  await app.evaluate(() => (window as any).logout());
  await signIn(app, '+7 (900) 123-45-67', '123');
  await expect(app.locator('#sms-toast-msg')).toHaveText('Пароль минимум 6 символов');
  expect(await legacyState(app)).toMatchObject({ auth: false });
});

test('«Показать / Скрыть»: the label matches the state (it used to be swapped)', async ({ app }) => {
  await app.evaluate(() => (window as any).switchTab('profile'));
  const btn = app.locator('#form-login button[onclick^="togglePassword"]');
  await btn.click();
  await expect(app.locator('#login-password')).toHaveAttribute('type', 'text');
  await expect(btn).toHaveText('Скрыть');
  await btn.click();
  await expect(app.locator('#login-password')).toHaveAttribute('type', 'password');
  await expect(btn).toHaveText('Показать');
});

test('avatar letter: a store signing in after a buyer gets its own letter, not the buyer\'s', async ({ app }) => {
  await signIn(app, '+7 (900) 123-45-67', 'secret12');
  await app.evaluate(() => { (window as any).openBuyerEditor(); });
  await app.fill('#buyer-edit-name', 'Анна Смирнова');
  await app.evaluate(() => (window as any).saveBuyerCard());
  await expect(app.locator('#user-avatar-letter')).toHaveText('А');
  await app.evaluate(() => (window as any).logout());
  await signIn(app, 'shop', 'x');
  await expect(app.locator('#user-avatar-letter')).toHaveText('Л'); // «Любимый Дом»
});
