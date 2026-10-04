import { test, expect } from './fixtures';

async function register(app: import('@playwright/test').Page, name: string) {
  await app.evaluate(() => { (window as any).switchTab('profile'); (window as any).switchAuthTab('register'); });
  await app.fill('#reg-name', name);
  await app.locator('#reg-phone').pressSequentially('9001112233');
  await app.fill('#reg-password', 'secret1');
  await app.fill('#reg-password2', 'secret1');
  await app.evaluate(() => (window as any).submitRegister());
}

test('profile: editing → saving → after reload; a whitespace-only name does not break the card', async ({ app }) => {
  /* редактор карточки доступен после входа */
  await register(app, 'Гость');
  await app.evaluate(() => (window as any).openBuyerEditor());
  await app.fill('#buyer-edit-name', '  Анна Петрова ');
  await app.fill('#buyer-edit-city', 'Тамбов');
  await app.evaluate(() => (window as any).saveBuyerCard());
  await expect(app.locator('#buyer-view-name')).toHaveText('Анна Петрова');
  await expect(app.locator('#user-avatar-letter')).toHaveText('А');
  await app.reload();
  await app.waitForFunction(() => typeof (window as any).switchTab === 'function');
  expect(await app.evaluate(() => (window as any).buyerProfile.city)).toBe('Тамбов');
  /* раньше '   '.trim()[0].toUpperCase() падал */
  await app.evaluate(() => { (window as any).buyerProfile = { name: '   ' }; (window as any).renderBuyerCard(); });
  await expect(app.locator('#user-avatar-letter')).toHaveText('П');
});

test('registration (auth.js assigns buyerProfile whole) lands in the store', async ({ app }) => {
  await register(app, 'Иван Иванов');
  expect(await app.evaluate(() => (window as any).buyerProfile.name)).toBe('Иван Иванов');
  await expect(app.locator('#buyer-view-name')).toHaveText('Иван Иванов');
});
