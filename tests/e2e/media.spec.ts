import { test, expect } from './fixtures';

/* A large «photo» generated in the page itself (4000×3000 JPEG of noise compresses badly,
   like a camera photo) and put into the file input through DataTransfer, as if the user picked it.
   The file doesn't leave the browser: shipping megabytes to the test process is expensive. */
const pickPhoto = (app: import('@playwright/test').Page, selector: string) => app.evaluate(async (sel) => {
  /* шум 1000×750, растянутый «кубиками» до 4000×3000: сжимается плохо, а считается в 16 раз быстрее */
  const small = document.createElement('canvas'); small.width = 1000; small.height = 750;
  const sctx = small.getContext('2d')!;
  const img = sctx.createImageData(1000, 750);
  for (let i = 0; i < img.data.length; i += 4) { img.data[i] = Math.random() * 255; img.data[i + 1] = Math.random() * 255; img.data[i + 2] = Math.random() * 255; img.data[i + 3] = 255; }
  sctx.putImageData(img, 0, 0);
  const c = document.createElement('canvas'); c.width = 4000; c.height = 3000;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(small, 0, 0, 4000, 3000);
  const blob: Blob = await new Promise((r) => c.toBlob((b) => r(b!), 'image/jpeg', 0.95));
  const input = document.querySelector<HTMLInputElement>(sel)!;
  const dt = new DataTransfer();
  dt.items.add(new File([blob], 'photo.jpg', { type: 'image/jpeg' }));
  input.files = dt.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  return blob.size;
}, selector);

test('store banner: a 4000×3000 photo fits the 350 KB budget and is still there after a reload', async ({ app }) => {
  test.setTimeout(60_000);
  await app.evaluate(() => (window as any).openShopEditor('Постройка'));
  const original = await pickPhoto(app, 'input[onchange="handleShopBannerUpload(event)"]');
  expect(original).toBeGreaterThan(1_500_000);
  await expect.poll(() => app.evaluate(() => (document.getElementById('shop-editor-banner') as HTMLInputElement).value.slice(0, 23))).toBe('data:image/jpeg;base64,');
  const info = await app.evaluate(async () => {
    const url = (document.getElementById('shop-editor-banner') as HTMLInputElement).value;
    const im = new Image(); im.src = url; await im.decode();
    return { w: im.naturalWidth, h: im.naturalHeight, kb: Math.round(url.length * 0.75 / 1024) };
  });
  /* шум — худший случай для сжатия: укладываемся в бюджет баннера (350 КБ), стороны — не больше 1600 */
  expect(info.w).toBeLessThanOrEqual(1600);
  expect(info.w / info.h).toBeCloseTo(4 / 3, 2);
  expect(info.kb).toBeLessThanOrEqual(350);
  await app.evaluate(() => (window as any).saveShopFromEditor());
  await app.reload();
  await app.waitForFunction(() => typeof (window as any).switchTab === 'function');
  await app.waitForLoadState('load');
  expect(await app.evaluate(() => String(eval('shopsProfileDb')['Постройка'].banner).slice(0, 11))).toBe('data:image/');
});

test('story video over 2.5 MB is refused with an explanation', async ({ app }) => {
  await app.evaluate(() => (window as any).openStoryEditor());
  await app.locator('#story-editor-files').setInputFiles({ name: 'big.mp4', mimeType: 'video/mp4', buffer: Buffer.alloc(3 * 1024 * 1024, 1) });
  await expect(app.locator('#sms-toast-msg')).toContainText('Файл слишком большой');
  expect(await app.evaluate(() => eval('storyEditorSlides').length)).toBe(0);
});
