import { test, expect } from './fixtures';

/**
 * XSS sweep: every string field of products, stores, companies, vacancies, lifehacks and
 * stories gets a payload, then every screen is visited. A screen is clean if no payload turns
 * into a real element. A new renderer that inserts data unescaped fails this test.
 */
const POISON = () => {
  const evil = (tag: string) => `<img src=x data-xss="${tag}" onerror="(window.__pwned=window.__pwned||[]).push('${tag}')">`;
  /* поля с URL, id и служебными значениями не трогаем: на них завязана логика, а не текст */
  const skip = new Set(['id', 'status', 'badge', 'category', 'store', 'image', 'images', 'banner', 'logo', 'video', 'slides',
    'reSegment', 'kind', 'createdAt', 'bannerFit', 'site', 'telegram', 'max', 'phone', 'email']);
  const poison = (obj: Record<string, unknown>, tag: string) => {
    for (const k in obj) {
      const v = obj[k];
      if (typeof v === 'string' && !skip.has(k) && !/^https?:|^data:|^#|^\/|\.(jpg|png|webp|svg)$/.test(v)) obj[k] = v + evil(`${tag}.${k}`);
    }
  };
  const g = (name: string) => { try { return eval(name); } catch { return undefined; } };
  for (const p of Object.values(g('productsDb') ?? {})) poison(p as never, 'product');
  for (const s of Object.values(g('shopsProfileDb') ?? {})) poison(s as never, 'shop');
  for (const c of Object.values(g('companiesProfileDb') ?? {})) poison(c as never, 'company');
  for (const x of (g('vacanciesDb') ?? []) as never[]) poison(x, 'vacancy');
  for (const x of (g('lifehacksDb') ?? []) as never[]) poison(x, 'lifehack');
  for (const x of (g('storiesData') ?? []) as never[]) poison(x, 'story');
};

const SCREENS: Array<[string, string]> = [
  ['home', "switchTab('catalog');renderProductGrid();renderRecommendations();renderHomeShopPromo();renderStories()"],
  ['catalog', "openProductCatalogFromHome();renderCatalogProducts('')"],
  ['category', "openCategoryProducts('спальня','Для спальни')"],
  ['product page', "openProductModal('prod-2')"],
  ['store showcase', "closeProductModal();openShopCatalogModal('Постройка')"],
  ['directory (stores, companies, specialists, vacancies)', "closeShopCatalogModal();switchTab('directory');switchDirectoryView('shops')"],
  ['lifehacks', "switchDirectoryView('lifehacks')"],
  ['lifehack article', 'openLifehackArticle(publishedLifehacks()[0].id)'],
  ['commercial real estate', "switchDirectoryView('re-commercial')"],
  ['cart', "addToCart('prod-2');switchTab('cart')"],
  ['favourites', "toggleFavorite('prod-4');switchTab('favorites')"],
  ['notifications', 'openNotifications()'],
  ['in-app CRM', "closeNotifications();['renderCrmPromoList','renderCrmStoryList','renderCrmLifehackList','renderCrmShopList','renderCrmProductList','renderAdminModerationList'].forEach(f=>window[f]())"],
];

test('XSS sweep: no screen turns data into markup', async ({ app }) => {
  test.setTimeout(60_000);
  await app.evaluate(POISON);
  const leaks: Record<string, string[]> = {};
  for (const [name, js] of SCREENS) {
    await app.evaluate(() => document.querySelectorAll('img[data-xss]').forEach((i) => ((i as HTMLElement).dataset.seen = '1')));
    await app.evaluate(js);
    await app.waitForTimeout(150);
    const hits = await app.evaluate(() => [...new Set([...document.querySelectorAll<HTMLElement>('img[data-xss]:not([data-seen])')].map((i) => i.dataset.xss!))]);
    if (hits.length) leaks[name] = hits.sort();
  }
  expect(leaks).toEqual({});
  expect(await app.evaluate(() => (window as any).__pwned ?? [])).toEqual([]);
});
