import { test, expect } from './fixtures';

/* The admin panel moderates content from stores and agencies: their data must not turn into markup
   in the administrator's session. All pages of all three roles, plus the editor drawers. */
test('admin panel: XSS sweep across all pages and editors', async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/admin.html');
  await page.waitForFunction(() => typeof (window as any).go === 'function');
  await page.evaluate(() => {
    const evil = (tag: string) => `<img src=x data-xss="${tag}" onerror="(window.__pwned=window.__pwned||[]).push('${tag}')">`;
    const skip = new Set(['id', 'status', 'badge', 'category', 'store', 'image', 'images', 'banner', 'logo', 'video', 'slides', 'kind', 'createdAt', 'bannerFit', 'site', 'telegram', 'max', 'phone', 'email', 'type', 'deal', 'agency']);
    const poison = (obj: any, tag: string) => { for (const k in obj) { const v = obj[k]; if (typeof v === 'string' && !skip.has(k) && !/^https?:|^data:|^#|^\//.test(v)) obj[k] = v + evil(`${tag}.${k}`); } };
    const g = (n: string) => { try { return eval(n); } catch { return undefined; } };
    Object.values(g('productsDb') ?? {}).forEach((p) => poison(p, 'product'));
    Object.values(g('shopsProfileDb') ?? {}).forEach((s) => poison(s, 'shop'));
    (g('storiesData') ?? []).forEach((s: any) => poison(s, 'story'));
    (g('promoData') ?? []).forEach((s: any) => poison(s, 'promo'));
    ((g('demo') ?? {}).listings ?? []).forEach((s: any) => poison(s, 'listing'));
    /* часть товаров — на модерации, чтобы очередь тоже отрисовалась */
    Object.values(g('productsDb') ?? {}).slice(0, 3).forEach((p: any) => { p.status = 'pending'; });
  });
  const leaks: Record<string, string[]> = {};
  let shownAsText = 0;
  const check = async (name: string) => {
    await page.waitForTimeout(100);
    shownAsText += await page.evaluate(() => (document.body.innerText.match(/data-xss=/g) ?? []).length);
    const hits = await page.evaluate(() => [...new Set([...document.querySelectorAll<HTMLElement>('img[data-xss]:not([data-seen])')].map((i) => i.dataset.xss!))]);
    if (hits.length) leaks[name] = hits.sort();
    await page.evaluate(() => document.querySelectorAll('img[data-xss]').forEach((i) => ((i as HTMLElement).dataset.seen = '1')));
  };
  for (const role of ['admin', 'store', 'agency']) {
    await page.evaluate((r) => (window as any).setRole(r), role);
    const pages = await page.evaluate(() => Object.keys(eval('PAGES')));
    for (const p of pages) {
      await page.evaluate((x) => (window as any).go(x), p);
      await check(`${role}/${p}`);
    }
  }
  await page.evaluate(() => (window as any).setRole('admin'));
  const firstProduct = await page.evaluate(() => Object.keys(eval('productsDb'))[0]);
  const firstShop = await page.evaluate(() => Object.keys(eval('shopsProfileDb'))[0]);
  for (const [name, js] of [
    ['editor: product', `openProdEditor(${JSON.stringify(firstProduct)})`],
    ['editor: store', `openShopEditor(${JSON.stringify(firstShop)})`],
    ['editor: story', `openStoryEditor(eval('storiesData')[0].id)`],
  ] as const) {
    await page.evaluate(js);
    await check(name);
    await page.evaluate(() => document.querySelectorAll('.overlay').forEach((o) => o.classList.add('hidden')));
  }
  expect(leaks).toEqual({});
  expect(await page.evaluate(() => (window as any).__pwned ?? [])).toEqual([]);
  /* проверка самой проверки: отравленные данные действительно отрисовались — текстом */
  expect(shownAsText).toBeGreaterThan(20);
  expect(errors).toEqual([]);
});
