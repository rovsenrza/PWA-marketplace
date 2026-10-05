import { zipSync } from 'fflate';
import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

/* Импорт из 1С / Excel в панели: настоящий файл → колонки → совпадения → фото → запуск. */

/* Windows-1251, как сохраняет 1С */
function cp1251(text: string): Buffer {
  return Buffer.from([...text].map((ch) => {
    const c = ch.codePointAt(0)!;
    if (c < 0x80) return c;
    if (c >= 0x410 && c <= 0x44f) return c - 0x410 + 0xc0;
    if (ch === 'Ё') return 0xa8;
    if (ch === 'ё') return 0xb8;
    throw new Error(`no cp1251 for ${ch}`);
  }));
}
const csv = (price0412 = '545,00') => cp1251([
  'Остатки товаров на складах',
  '',
  'Код;Артикул;Наименование;Цена розн.;Остаток;Ед. изм.;Группа;Штрихкод',
  `00-001;PS-0412;"Смесь Ceresit CM 11; 25 кг";${price0412};38;мешок;Сухие смеси;4607077160126`,
  '00-002;PS-1120;Саморез по дереву 3,5x35;"1 299,90";12;уп;Крепёж;4607077160133',
  '00-003;;Без артикула;100;1;шт;Прочее;',
  '00-004;PS-0412;Дубль артикула;600;1;шт;Прочее;',
].join('\r\n'));
/* 1×1 PNG */
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

async function openImport(page: Page) {
  await page.setViewportSize({ width: 1280, height: 860 });
  await page.goto('/admin.html');
  await page.waitForFunction(() => typeof (window as any).go === 'function');
  await page.evaluate(() => (window as any).go('import'));
}
const imported = (page: Page) => page.evaluate(() => Object.values(eval('productsDb') as Record<string, any>)
  .filter((p) => String(p.id).startsWith('imp-'))
  .map((p) => ({ sku: p.sku, title: p.title, price: p.price, stock: p.stock, status: p.status, store: p.store, photo: String(p.image).slice(0, 15) }))
  .sort((a, b) => a.sku.localeCompare(b.sku)));

test('1C file in Windows-1251 → columns → report → photos → run; a re-import updates only price and stock', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openImport(page);
  await expect(page.locator('#content .empty', { hasText: 'Загрузок ещё не было' })).toBeVisible();
  await page.selectOption('select[data-import-store]', 'Постройка');
  await page.setInputFiles('input[data-import-input="file"]', { name: 'Остатки_Постройка.csv', mimeType: 'text/csv', buffer: csv() });
  await expect(page.locator('#content .file-pill')).toContainText('4 строки · 8 колонок · CSV, Windows-1251');

  await page.getByRole('button', { name: 'Дальше: колонки' }).click();
  const field = (col: string) => page.locator('#content .map-row', { has: page.locator('.map-src b', { hasText: new RegExp(`^${col}$`) }) }).locator('select');
  await expect(field('Артикул')).toHaveValue('sku');
  await expect(field('Код')).toHaveValue('skip'); // «Артикул» сильнее «Кода»
  await expect(field('Наименование')).toHaveValue('title');
  await expect(field('Цена розн\\.')).toHaveValue('price');
  /* одно поле — одна колонка: «Код» как артикул снимает его с «Артикула» */
  await field('Код').selectOption('sku');
  await expect(field('Артикул')).toHaveValue('skip');
  await field('Артикул').selectOption('sku');
  await expect(field('Код')).toHaveValue('skip');

  await page.getByRole('button', { name: 'Дальше: совпадения' }).click();
  await expect(page.locator('#content .sumrows')).toContainText('2новых товара');
  await expect(page.locator('#content .sumrows')).toContainText('2строки пропустим из-за ошибок');
  await expect(page.locator('#content .imp-row', { hasText: 'Строка 6' })).toContainText('нет артикула');
  await expect(page.locator('#content .imp-row', { hasText: 'Строка 7' })).toContainText('артикул повторяется');

  await page.getByRole('button', { name: 'Дальше: фото' }).click();
  await expect(page.locator('#content .lead')).toContainText('У 2 товаров нет фото');
  await page.setInputFiles('input[data-import-input="photos"]', [
    { name: 'PS-0412.png', mimeType: 'image/png', buffer: PNG },
    { name: 'НЕТ-ТАКОГО.png', mimeType: 'image/png', buffer: PNG },
  ]);
  await expect(page.locator('#content .file-pill')).toContainText('1 товар получил фото · 1 фото без товара с таким артикулом');
  await expect(page.locator('#content b.num')).toHaveText('1 из 2');
  await expect(page.locator('#content .note.warn')).toContainText('1 товар останется без фото');

  await page.getByRole('button', { name: 'Дальше', exact: true }).click();
  await expect(page.locator('#content .sumrows')).toContainText('1появятся в каталоге сразу');
  await expect(page.locator('#content .sumrows')).toContainText('1сохранятся без фото');
  await page.getByRole('button', { name: 'Запустить импорт' }).click();
  await expect(page.locator('#content .note[role=status]')).toContainText('Импорт для «Постройка» завершён.');
  await expect(page.locator('#content .lrow.cols-imports')).toHaveCount(1);
  await expect(page.locator('#content .lrow.cols-imports')).toContainText('Остатки_Постройка.csv');

  expect(await imported(page)).toEqual([
    { sku: 'PS-0412', title: 'Смесь Ceresit CM 11; 25 кг', price: '545 ₽', stock: 38, status: 'published', store: 'Постройка', photo: 'data:image/jpeg' },
    { sku: 'PS-1120', title: 'Саморез по дереву 3,5x35', price: '1 299,90 ₽', stock: 12, status: 'draft', store: 'Постройка', photo: '' },
  ]);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('meb_products')!));
  expect(Object.keys(stored).filter((id) => id.startsWith('imp-'))).toHaveLength(2);

  /* повторная выгрузка: новая цена, переименованный товар в файле — меняются только цена и остаток */
  await page.evaluate(() => { const p = Object.values(eval('productsDb') as Record<string, any>).find((x) => x.sku === 'PS-0412'); p.title = 'Название из карточки'; });
  await page.setInputFiles('input[data-import-input="file"]', { name: 'Остатки_Постройка.csv', mimeType: 'text/csv', buffer: csv('600,00') });
  await page.getByRole('button', { name: 'Дальше: колонки' }).click();
  await expect(page.locator('#content .badge', { hasText: 'Как в прошлый раз' }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Дальше: совпадения' }).click();
  await expect(page.locator('#content .sumrows')).toContainText('1уже есть у «Постройка»: обновим только цену и остаток');
  await expect(page.locator('#content .imp-row', { hasText: '→' })).toContainText('545 ₽ → 600 ₽');
  await expect(page.locator('#content .sumrows')).toContainText('0новых товаров');
  await page.getByRole('button', { name: 'Дальше: фото' }).click();
  await page.getByRole('button', { name: 'Дальше', exact: true }).click();
  await page.getByRole('button', { name: 'Запустить импорт' }).click();
  await expect(page.locator('#content .lrow.cols-imports')).toHaveCount(2);
  const after = await imported(page);
  expect(after).toHaveLength(2); // без дублей
  expect(after[0]).toMatchObject({ sku: 'PS-0412', title: 'Название из карточки', price: '600 ₽', status: 'published' });

  /* приложение покупателя видит опубликованный товар, а черновик без фото — нет */
  await page.goto('/index.html');
  await page.waitForFunction(() => typeof (window as any).switchTab === 'function');
  const app = await page.evaluate(() => Object.values(eval('productsDb') as Record<string, any>).filter((p) => String(p.id).startsWith('imp-')).map((p) => [p.sku, p.status, p.price]));
  expect(app.sort()).toEqual([['PS-0412', 'published', '600 ₽'], ['PS-1120', 'draft', '1 299,90 ₽']]);
  expect(errors).toEqual([]);
});

test('does not fit the browser: nothing changes, and the reason is said plainly', async ({ page }) => {
  await openImport(page);
  await page.evaluate(() => {
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k: string, v: string) {
      if (k === 'meb_products') { const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; }
      return set.call(this, k, v);
    };
  });
  await page.setInputFiles('input[data-import-input="file"]', { name: 'big.csv', mimeType: 'text/csv', buffer: csv() });
  await page.getByRole('button', { name: 'Дальше: колонки' }).click();
  await page.getByRole('button', { name: 'Дальше: совпадения' }).click();
  await page.getByRole('button', { name: 'Дальше: фото' }).click();
  await page.getByRole('button', { name: 'Дальше', exact: true }).click();
  await page.getByRole('button', { name: 'Запустить импорт' }).click();
  await expect(page.locator('#content [role=alert]')).toContainText('Не поместилось в память браузера');
  await expect(page.locator('#content [role=alert]')).toContainText('Ничего не изменилось');
  expect(await imported(page)).toEqual([]);
  expect(await page.evaluate(() => localStorage.getItem('meb_imports'))).toBeNull();
});

test('a zipped CommerceML export: photos are taken from the same archive', async ({ page }) => {
  await openImport(page);
  const enc = new TextEncoder();
  const zip = zipSync({
    'webdata/import.xml': enc.encode(`<?xml version="1.0" encoding="UTF-8"?><КоммерческаяИнформация ВерсияСхемы="2.05">
      <Классификатор><Группы><Группа><Ид>g1</Ид><Наименование>Кровля</Наименование></Группа></Группы></Классификатор>
      <Каталог><Товары>
        <Товар><Ид>t1</Ид><Артикул>KR-1</Артикул><Наименование>Металлочерепица</Наименование><Группы><Ид>g1</Ид></Группы><Картинка>import_files/a1/t1.png</Картинка></Товар>
        <Товар><Ид>t2</Ид><Артикул>KR-2</Артикул><Наименование>Саморез кровельный</Наименование></Товар>
      </Товары></Каталог></КоммерческаяИнформация>`),
    'webdata/offers.xml': enc.encode(`<КоммерческаяИнформация><ПакетПредложений><Предложения>
      <Предложение><Ид>t1</Ид><Цены><Цена><ЦенаЗаЕдиницу>690</ЦенаЗаЕдиницу></Цена></Цены><Количество>100</Количество></Предложение>
      <Предложение><Ид>t2#c1</Ид><Цены><Цена><ЦенаЗаЕдиницу>9.50</ЦенаЗаЕдиницу></Цена></Цены><Количество>5000</Количество></Предложение>
    </Предложения></ПакетПредложений></КоммерческаяИнформация>`),
    'webdata/import_files/a1/t1.png': new Uint8Array(PNG),
    'webdata/import_files/KR-2.png': new Uint8Array(PNG),
  });
  await page.selectOption('select[data-import-store]', 'Кровельщик');
  await page.setInputFiles('input[data-import-input="file"]', { name: 'webdata.zip', mimeType: 'application/zip', buffer: Buffer.from(zip) });
  await expect(page.locator('#content .file-pill')).toContainText('CommerceML');
  await page.getByRole('button', { name: 'Дальше: колонки' }).click();
  await page.getByRole('button', { name: 'Дальше: совпадения' }).click();
  await expect(page.locator('#content .sumrows')).toContainText('2новых товара');
  await page.getByRole('button', { name: 'Дальше: фото' }).click();
  await expect(page.locator('#content .lead')).toContainText('папка import_files');
  await page.getByRole('button', { name: /Взять фото из архива «webdata\.zip» \(2\)/ }).click();
  await expect(page.locator('#content .file-pill')).toContainText('2 товара получили фото');
  await page.getByRole('button', { name: 'Дальше', exact: true }).click();
  await expect(page.locator('#content .sumrows')).toContainText('2появятся в каталоге сразу');
  await page.getByRole('button', { name: 'Запустить импорт' }).click();
  const got = await imported(page);
  expect(got.map((p) => [p.sku, p.price, p.stock, p.status, p.photo.slice(0, 10)])).toEqual([
    ['KR-1', '690 ₽', 100, 'published', 'data:image'],
    ['KR-2', '9,50 ₽', 5000, 'published', 'data:image'],
  ]);
  expect(await page.evaluate(() => Object.values(eval('productsDb') as Record<string, any>).find((p) => p.sku === 'KR-1').category)).toBe('кровля');
});

test('import screens: column names, values and a neighbour store\'s product never become markup', async ({ page }) => {
  await openImport(page);
  const evil = (tag: string) => `<img src=x data-xss="${tag}" onerror="(window.__pwned=window.__pwned||[]).push('${tag}')">`;
  await page.evaluate((e) => {
    (eval('productsDb') as Record<string, any>).twin = { id: 'twin', sku: 'T', title: `Сосед ${e}`, price: '1 ₽', store: 'Стройландия', status: 'published', image: 'x.jpg', barcode: '4600000000001' };
  }, evil('twin.title'));
  const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const file = Buffer.from([
    `Артикул;Наименование;Цена;Штрихкод;${q(`Заметки ${evil('header')}`)}`,
    `${q(`A-1${evil('sku')}`)};${q(`Товар ${evil('title')}`)};100;4600000000001;${q(evil('value'))}`,
    `B-2;${q(`Без цены ${evil('issue')}`)};;;x`,
  ].join('\n'), 'utf8');
  await page.setInputFiles('input[data-import-input="file"]', { name: `evil${evil('file').replace(/[\\/]/g, '')}.csv`, mimeType: 'text/csv', buffer: file });
  const leaks: string[] = [];
  const check = async () => {
    leaks.push(...await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('img[data-xss]')].map((i) => i.dataset.xss!)));
  };
  await check();
  await page.getByRole('button', { name: 'Дальше: колонки' }).click();
  await check();
  await page.getByRole('button', { name: 'Дальше: совпадения' }).click();
  await expect(page.locator('#content .match-row')).toContainText('Сосед <img');
  await check();
  await page.getByRole('button', { name: 'Это он' }).click();
  await page.getByRole('button', { name: 'Дальше: фото' }).click();
  await check();
  await page.getByRole('button', { name: 'Дальше', exact: true }).click();
  await check();
  await page.getByRole('button', { name: 'Запустить импорт' }).click();
  await check();
  expect(leaks).toEqual([]);
  expect(await page.evaluate(() => (window as any).__pwned ?? [])).toEqual([]);
  /* похожий товар подтверждён: его фото подставилось новому */
  expect(await page.evaluate(() => Object.values(eval('productsDb') as Record<string, any>).find((p) => String(p.sku).startsWith('A-1'))?.image)).toBe('x.jpg');
});
