import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

/* The storefront designer in the shop editor: «Оформление», «Блоки», «Фильтры». Changes are saved into
   shop.storefront by «Сохранить витрину» and reach the app on its next load. */

type Tab = 'Оформление' | 'Блоки' | 'Фильтры' | 'О магазине';
const REQUIRED = ['cover', 'about', 'services', 'catalog', 'addresses', 'managers', 'terms'];
const LABEL: Record<string, string> = { cover: 'Обложка', about: 'О компании', services: 'Услуги', catalog: 'Каталог и фильтры', addresses: 'Адреса, карта и часы', managers: 'Менеджеры', terms: 'Оплата и доставка' };

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (d) => void d.accept());
  return errors;
}
async function openAdmin(page: Page, width = 1440, height = 900): Promise<void> {
  await page.setViewportSize({ width, height });
  await page.goto('/admin.html');
  await page.waitForFunction(() => typeof (window as any).openShopEditor === 'function');
}
const tab = (page: Page, name: Tab) => page.locator('#shop-tabs button', { hasText: name }).click();
async function openDesigner(page: Page, shop: string, name: Tab): Promise<void> {
  await page.evaluate((s) => (window as any).openShopEditor(s), shop);
  await tab(page, name);
}
const body = (page: Page) => page.locator('#shop-body');
const saveShop = (page: Page) => page.locator('#shop-modal').getByRole('button', { name: 'Сохранить витрину' }).click();
const stored = (page: Page, shop: string) => page.evaluate((s) => JSON.parse(localStorage.getItem('meb_shops') || '{}')[s], shop);
const draft = (page: Page) => page.evaluate(() => eval('shopDraft').storefront);

test('admin → storage → app: a new ink and voice, a hidden block and a new filter reach the app’s catalogue', async ({ page, context }) => {
  const errors = collectErrors(page);
  await openAdmin(page);
  await openDesigner(page, 'Любимый Дом', 'Оформление');

  const crimson = body(page).getByRole('button', { name: 'Малиновый, #C2185B' });
  await crimson.click();
  await expect(crimson).toHaveAttribute('aria-pressed', 'true');
  await body(page).getByRole('button', { name: /Современный/ }).click();
  const preview = body(page).locator('.sfp');
  await expect(preview).toHaveAttribute('data-voice', 'modern');
  expect(await preview.evaluate((el) => getComputedStyle(el).getPropertyValue('--sfp-ink').trim())).toBe('#C2185B');
  await expect(body(page).locator('#sfd-ink-note')).toContainText('белые');
  const link = body(page).getByRole('link', { name: 'Открыть витрину в приложении' });
  await expect(link).toHaveAttribute('href', `index.html#store=${encodeURIComponent('Любимый Дом')}`);
  await expect(link).toHaveAttribute('target', '_blank');

  /* the promo once the demo data has one, otherwise the gallery of the furniture preset */
  await tab(page, 'Блоки');
  const hidden = (await body(page).locator('[data-block^="promo"]').count()) ? { type: 'promo', label: 'Акция' } : { type: 'gallery', label: 'Фото и видео' };
  await body(page).getByRole('checkbox', { name: `Показывать на витрине: ${hidden.label}` }).uncheck();
  await expect(body(page).locator('.sfd-brow.is-off')).toHaveCount(1);
  await expect(body(page).locator('.sfd-brow.is-off')).toContainText('Скрыт');

  await tab(page, 'Фильтры');
  await body(page).getByLabel('Своё поле').fill('Коллекция');
  await body(page).getByRole('button', { name: 'Добавить', exact: true }).click();
  await expect(body(page).locator('.sfd-frow', { hasText: 'Поле товара: Коллекция' })).toBeVisible();
  await expect(page.locator('[data-sf="filter"][data-prop="label"]:focus')).toHaveValue('Коллекция');

  await saveShop(page);
  await expect(page.locator('#toast')).toContainText('Витрина сохранена');
  /* the shop list shows the store's spine in its new ink */
  await page.evaluate(() => (window as any).go('shops'));
  const spine = page.locator('.shop-card .spine', { hasText: 'Любимый Дом' });
  expect(await spine.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(194, 24, 91)');

  const app = await context.newPage();
  await app.goto('/index.html');
  await app.waitForFunction(() => typeof (window as any).switchTab === 'function');
  const sf = await app.evaluate(() => (window as any).shopsProfileDb['Любимый Дом'].storefront);
  expect(sf.theme).toMatchObject({ ink: '#C2185B', voice: 'modern' });
  expect(sf.blocks.filter((b: any) => b.type === hidden.type).map((b: any) => b.on)).toEqual([false]);
  expect(sf.filters).toContainEqual({ key: 'Коллекция', label: 'Коллекция', type: 'chips' });
  expect(sf.filters.slice(-1)[0]).toMatchObject({ key: 'price' });
  for (const type of REQUIRED) expect(sf.blocks.find((b: any) => b.type === type)?.on, type).toBe(true);
  expect(sf.blocks.filter((b: any) => b.type === 'cover')).toHaveLength(1);
  expect(errors).toEqual([]);
});

test('changing the store type offers its preset; loading it brings the type’s blocks, filters and look, the ink stays', async ({ page }) => {
  const errors = collectErrors(page);
  await openAdmin(page);
  await openDesigner(page, 'Мебельная фабрика ТриЯ', 'Оформление');
  const ink = (await draft(page)).theme.ink;

  await body(page).getByRole('button', { name: /^Кухни/ }).click();
  const offer = body(page).getByRole('region', { name: 'Набор блоков и фильтров для типа' });
  await expect(offer).toContainText('Загрузить набор для типа «Кухни»?');
  await expect(offer).toContainText('Уберутся: Разделы магазина');
  await offer.getByRole('button', { name: 'Загрузить набор' }).click();
  await expect(offer).toHaveCount(0);
  const sf = await draft(page);
  expect(sf.kind).toBe('kitchens');
  expect(sf.blocks.map((b: any) => b.type)).toEqual(['cover', 'steps', 'catalog', 'gallery', 'services', 'about', 'addresses', 'managers', 'terms']);
  expect(sf.blocks.find((b: any) => b.type === 'steps')).toMatchObject({ example: true });
  expect(sf.filters.map((f: any) => f.label)).toEqual(['Планировка', 'Стиль', 'Фасады', 'Длина', 'Цена']);
  expect(sf.theme).toEqual({ ink, ground: 'black', voice: 'modern', cover: 'full' });

  /* «Не нужно»: only the type changes */
  await body(page).getByRole('button', { name: /^Другое/ }).click();
  await body(page).getByRole('button', { name: 'Не нужно' }).click();
  const after = await draft(page);
  expect(after.kind).toBe('general');
  expect(after.blocks.map((b: any) => b.type)).toEqual(sf.blocks.map((b: any) => b.type));
  await tab(page, 'Блоки');
  await expect(body(page).locator('.sfd-brow', { hasText: 'Как мы работаем' }).locator('.badge', { hasText: 'Пример' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('blocks: the cover stays first; the skeleton moves but is never hidden or deleted; optional blocks are added, edited, deleted', async ({ page }) => {
  const errors = collectErrors(page);
  await openAdmin(page);
  await openDesigner(page, 'Новоселье', 'Блоки');
  const b = body(page);
  await expect(b.getByRole('button', { name: 'Выше: Обложка' })).toBeDisabled();
  await expect(b.getByRole('button', { name: 'Ниже: Обложка' })).toBeDisabled();
  await expect(b.locator('.sfd-brow').nth(1).getByRole('button', { name: /^Выше:/ })).toBeDisabled();
  for (const type of REQUIRED) {
    await expect(b.getByRole('checkbox', { name: `Показывать на витрине: ${LABEL[type]}` })).toBeDisabled();
    await expect(b.getByRole('button', { name: `Удалить блок: ${LABEL[type]}` })).toHaveCount(0);
  }

  const before = (await draft(page)).blocks.map((x: any) => x.type);
  const at = before.indexOf('services');
  await b.getByRole('button', { name: 'Выше: Услуги' }).click();
  await expect(b.getByRole('button', { name: 'Выше: Услуги' })).toBeFocused();
  expect((await draft(page)).blocks.map((x: any) => x.type).indexOf('services')).toBe(at - 1);

  await b.getByRole('button', { name: 'Добавить блок' }).click();
  await b.locator('.sfd-addopt', { hasText: 'Акция' }).click();
  const promo = b.locator('.sfd-brow', { hasText: 'Акция' });
  await expect(promo.locator('.sfd-bpanel')).toBeVisible();
  await promo.getByLabel('Наклейка').fill('−15%');
  await promo.getByLabel('Текст акции').fill('Диваны со скидкой до конца месяца');
  await expect(promo.locator('.sfd-bsum')).toHaveText('Диваны со скидкой до конца месяца');
  const types = (await draft(page)).blocks.map((x: any) => x.type);
  expect(types.slice(types.indexOf('promo') + 1)).toEqual(['about', 'addresses', 'managers', 'terms']);

  await b.getByRole('button', { name: 'Добавить блок' }).click();
  await expect(b.locator('.sfd-addopt', { hasText: 'Фото и видео' })).toBeDisabled();
  await expect(b.locator('.sfd-addopt', { hasText: 'Акция' })).toBeEnabled();
  await b.getByRole('button', { name: 'Удалить блок: Акция' }).click();
  await expect(b.locator('.sfd-brow', { hasText: 'Акция' })).toHaveCount(0);

  await saveShop(page);
  const sf = (await stored(page, 'Новоселье')).storefront;
  expect(sf.blocks.map((x: any) => x.type)).not.toContain('promo');
  expect(sf.blocks.map((x: any) => x.type).indexOf('services')).toBe(at - 1);
  expect(errors).toEqual([]);
});

test('lookbook: a click on the photo puts a pin there; the pin gets a product and is saved inside the photo', async ({ page }) => {
  const errors = collectErrors(page);
  await openAdmin(page);
  await openDesigner(page, 'Любимый Дом', 'Блоки');
  const b = body(page);
  if (!(await b.locator('[data-block^="lookbook"]').count())) {
    await b.getByRole('button', { name: 'Добавить блок' }).click();
    await b.locator('.sfd-addopt', { hasText: 'Образ с товарами' }).click();
  } else {
    await b.getByRole('button', { name: 'Настроить: Образ с товарами' }).first().click();
  }
  const panel = b.locator('.sfd-bpanel');
  await panel.getByLabel('Фото интерьера — ссылка').fill('shops-banners/lyubimyy-dom.jpg');
  const stage = b.locator('.sfd-stage').first();
  /* the photo follows the field once typing pauses (the demo data may already show another photo there) */
  await expect(stage.locator('img')).toHaveAttribute('src', 'shops-banners/lyubimyy-dom.jpg');
  await expect.poll(() => stage.locator('img').evaluate((i) => (i as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  const pinsBefore = await b.locator('.sfd-pinrow').count();
  const box = (await stage.boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.25, box.y + box.height * 0.75);
  await expect(b.locator('.sfd-pinrow')).toHaveCount(pinsBefore + 1);
  const select = b.locator('select[data-sf="pin"]').last();
  await expect(select).toBeFocused();
  await select.selectOption('prod-2');
  const x = b.locator('input[data-sf="pin"][data-prop="x"]').last();
  await x.fill('140');
  await x.press('Tab');
  await expect(x).toHaveValue('100');
  await saveShop(page);
  const look = (await stored(page, 'Любимый Дом')).storefront.blocks.find((x: any) => x.type === 'lookbook');
  expect(look.image).toBe('shops-banners/lyubimyy-dom.jpg');
  expect(look.pins.slice(-1)[0]).toMatchObject({ x: 100, productId: 'prod-2' });
  expect(look.pins.slice(-1)[0].y).toBeCloseTo(75, 0);
  expect(errors).toEqual([]);
});

test('ink by code: a wrong code is refused with the reason, a right one is applied', async ({ page }) => {
  const errors = collectErrors(page);
  await openAdmin(page);
  await openDesigner(page, 'Постройка', 'Оформление');
  const hex = body(page).getByLabel('Свой цвет — код');
  const before = (await draft(page)).theme.ink;
  await hex.fill('#12');
  await hex.press('Tab');
  await expect(body(page).getByRole('alert')).toContainText('Это не код цвета');
  await expect(hex).toHaveAttribute('aria-invalid', 'true');
  expect((await draft(page)).theme.ink).toBe(before);
  await hex.fill('#0f6a3c');
  await expect(body(page).getByRole('alert')).toHaveCount(0);
  expect((await draft(page)).theme.ink).toBe('#0F6A3C');
  expect(await body(page).locator('.sfp').evaluate((el) => getComputedStyle(el).getPropertyValue('--sfp-ink').trim())).toBe('#0F6A3C');
  await expect(body(page).locator('.sfd-swatch[aria-pressed="true"]')).toHaveCount(0);
  await hex.press('Tab');
  await expect(hex).toHaveValue('#0F6A3C');
  expect(errors).toEqual([]);
});

test('a store whose designer was opened but not changed keeps following its category, and saves no storefront', async ({ page }) => {
  const errors = collectErrors(page);
  await openAdmin(page);
  await openDesigner(page, 'Кровельщик', 'Оформление');
  await expect(body(page).getByRole('button', { name: /^Строительные смеси/ })).toHaveAttribute('aria-pressed', 'true');
  await tab(page, 'Блоки');
  await tab(page, 'Фильтры');
  await tab(page, 'О магазине');
  await body(page).getByPlaceholder('Мебель, кухни…').fill('Кухни');
  await tab(page, 'Оформление');
  await expect(body(page).getByRole('button', { name: /^Кухни/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(body(page)).toContainText('Сейчас подобран по категории «Кухни»');
  await saveShop(page);
  const shop = await stored(page, 'Кровельщик');
  expect(shop.category).toBe('Кухни');
  expect(shop).not.toHaveProperty('storefront');
  expect(errors).toEqual([]);
});

test('a damaged saved storefront opens in every tab and panel; saving repairs it', async ({ page }) => {
  const errors = collectErrors(page);
  await openAdmin(page);
  await page.evaluate(() => {
    eval('shopsProfileDb')['Стройландия'].storefront = {
      kind: 'boats', theme: { ink: 'red', ground: 'mud', voice: 42 },
      blocks: [
        { type: 'cover', line: 5 }, { type: 'cover', id: 'c2', line: 'Вторая обложка', image: 7 }, { type: 'bogus' }, 'x', null,
        { type: 'promo', text: 42, sticker: {}, productId: ['a'] }, { type: 'steps', items: [null, 'x', { title: 7 }] },
        { type: 'lookbook', image: 'x.jpg', pins: [{ x: 'a', y: null, productId: 5 }, 'p'] }, { type: 'swatches', items: [{ color: 'nope' }] },
        { type: 'categories', items: [{ label: 5, key: [], value: {} }] }, { type: 'catalog', on: 'false' },
      ],
      filters: 'oops',
    };
  });
  await openDesigner(page, 'Стройландия', 'Оформление');
  await expect(body(page).locator('.sfp')).toBeVisible();
  await tab(page, 'Блоки');
  await expect(body(page).locator('.sfd-brow', { has: page.locator('b', { hasText: /^Обложка$/ }) })).toHaveCount(1);
  for (const label of await body(page).locator('.sfd-brow .sfd-bname > b').allTextContents()) {
    await body(page).getByRole('button', { name: `Настроить: ${label}` }).first().click();
    await expect(body(page).locator('.sfd-bpanel')).toBeVisible();
  }
  await tab(page, 'Фильтры');
  await expect(body(page).locator('.sfd-frow')).toHaveCount(6); // the mixtures preset: Тип, Основа, Фасовка, Применение, Бренд, Цена
  /* one change, and the whole storefront is saved in its repaired form */
  await tab(page, 'Оформление');
  await body(page).getByRole('button', { name: 'Синий, #0067B1' }).click();
  await saveShop(page);
  const sf = (await stored(page, 'Стройландия')).storefront;
  expect(sf.kind).toBe('mixtures');
  expect(sf.theme).toEqual({ ink: '#0067B1', ground: 'stock', voice: 'industrial', cover: 'field' });
  expect(sf.blocks.filter((b: any) => b.type === 'cover')).toEqual([expect.objectContaining({ line: 'Вторая обложка', on: true })]);
  expect(sf.blocks.map((b: any) => b.type)).not.toContain('bogus');
  expect(sf.filters.map((f: any) => f.key)).toEqual(['Тип', 'Основа', 'Фасовка, кг', 'Применение', 'Бренд', 'price']);
  for (const type of REQUIRED) expect(sf.blocks.find((b: any) => b.type === type)?.on, type).toBe(true);
  expect(errors).toEqual([]);
});

test('designer: markup in storefront data and product titles renders as text in every tab and panel', async ({ page }) => {
  const errors = collectErrors(page);
  await openAdmin(page);
  await page.evaluate(() => {
    const evil = (tag: string) => `<img src=x data-xss="${tag}" onerror="(window.__pwned=window.__pwned||[]).push('${tag}')">`;
    const db = eval('productsDb');
    db['prod-2'].title += evil('product.title');
    eval('shopsProfileDb')['Любимый Дом'].storefront = {
      kind: 'furniture', theme: { ink: '#0F6A3C', ground: 'tint', voice: 'classic', cover: 'split' },
      blocks: [
        { type: 'cover', line: evil('cover.line'), image: evil('cover.image'), title: evil('cover.title') },
        { type: 'categories', title: evil('cat.title'), items: [{ label: evil('cat.label'), key: evil('cat.key'), value: evil('cat.value'), image: evil('cat.image') }] },
        { type: 'lookbook', image: evil('look.image'), text: evil('look.text'), pins: [{ x: 10, y: 10, productId: evil('pin.product') }] },
        { type: 'steps', items: [{ title: evil('step.title'), text: evil('step.text') }] },
        { type: 'swatches', items: [{ name: evil('sw.name'), color: evil('sw.color'), image: evil('sw.image'), note: evil('sw.note') }] },
        { type: 'promo', text: evil('promo.text'), sticker: evil('promo.sticker'), productId: evil('promo.product'), image: evil('promo.image') },
        { type: 'about', text: evil('about.text') }, { type: 'gallery', id: evil('gallery.id') },
      ],
      filters: [{ key: evil('filter.key'), label: evil('filter.label'), type: 'chips', unit: evil('filter.unit') }, { key: 'price', label: 'Цена', type: 'range', unit: '₽' }],
    };
    eval('shopsProfileDb')['Любимый Дом'].filters = [{ name: evil('old.filter'), type: 'Список', vals: [] }];
  });
  await openDesigner(page, 'Любимый Дом', 'Оформление');
  await tab(page, 'Блоки');
  for (const label of await body(page).locator('.sfd-brow .sfd-bname > b').allTextContents()) {
    await body(page).getByRole('button', { name: `Настроить: ${label}` }).first().click();
    expect(await page.locator('#shop-body img[data-xss]').count(), label).toBe(0);
  }
  await body(page).getByRole('button', { name: 'Добавить блок' }).click();
  await tab(page, 'Фильтры');
  await tab(page, 'Оформление');
  expect(await page.locator('img[data-xss]').count()).toBe(0);
  expect(await page.evaluate(() => (window as any).__pwned ?? [])).toEqual([]);
  /* the payload is really on screen, as text */
  await tab(page, 'Фильтры');
  await expect(body(page)).toContainText('data-xss="filter.key"');
  await expect(body(page)).toContainText('data-xss="old.filter"');
  await expect(body(page).locator('[data-sf="filter"][data-prop="label"]').first()).toHaveValue(/data-xss="filter\.label"/);
  await page.evaluate(() => (window as any).go('shops'));
  expect(await page.locator('img[data-xss]').count()).toBe(0);
  expect(errors).toEqual([]);
});

test('designer at phone width: every tab fits without sideways scrolling', async ({ page }) => {
  const errors = collectErrors(page);
  await openAdmin(page, 390, 844);
  await page.evaluate(() => (window as any).openShopEditor('Строительные материалы ТЦ ДОМ'));
  for (const name of ['Оформление', 'Блоки', 'Фильтры'] as const) {
    await tab(page, name);
    if (name === 'Блоки') await body(page).getByRole('button', { name: 'Настроить: Обложка' }).click();
    const overflow = await page.evaluate(() => {
      const bodyEl = document.getElementById('shop-body')!;
      return { page: document.documentElement.scrollWidth - window.innerWidth, editor: bodyEl.scrollWidth - bodyEl.clientWidth };
    });
    expect(overflow, name).toEqual({ page: 0, editor: 0 });
  }
  expect(errors).toEqual([]);
});
