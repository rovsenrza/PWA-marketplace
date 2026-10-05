import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import type { Product } from '../../src/shared/domain/types';
import { decodeText, detectDelimiter, parseCsv } from '../../src/shared/import/csv';
import { findHeaderRow, suggestMapping } from '../../src/shared/import/columns';
import { readCommerceML } from '../../src/shared/import/commerceml';
import { readImportFiles } from '../../src/shared/import/read';
import { applyImport, importedProductId, photoTargets, planImport, toDrafts } from '../../src/shared/import/plan';
import { isPhotoPath, matchPhotos, skuFromPhotoName } from '../../src/shared/import/photos';
import { fixZipName, listArchive } from '../../src/shared/import/archive';
import { createLocalImportRepository } from '../../src/shared/import/repository';
import { zipSync } from 'fflate';
import { memoryStorage } from './support/memory-storage';

/* Windows-1251, как сохраняет 1С: кириллица А–я = 0xC0–0xFF, Ё/ё, № */
function cp1251(text: string): Uint8Array {
  return Uint8Array.from([...text].map((ch) => {
    const c = ch.codePointAt(0)!;
    if (c < 0x80) return c;
    if (c >= 0x410 && c <= 0x44f) return c - 0x410 + 0xc0;
    if (ch === 'Ё') return 0xa8;
    if (ch === 'ё') return 0xb8;
    if (ch === '№') return 0xb9;
    throw new Error(`no cp1251 for ${ch}`);
  }));
}

const ONEC_CSV = [
  'Остатки товаров на складах',
  'Период: сентябрь',
  '',
  'Код;Артикул;Наименование;Цена розн.;Остаток;Ед. изм.;Группа;Штрихкод',
  '00-001;PS-0412;"Смесь Ceresit CM 11; 25 кг";545,00;38;мешок;Сухие смеси;4607077160126',
  '00-002;PS-1120;Саморез по дереву 3,5x35;"1 299,90";12;уп;Крепёж;4607077160133',
  '00-003;;Без артикула;100;1;шт;Прочее;',
  '00-004;PS-0412;Дубль артикула;600;1;шт;Прочее;',
  '00-005;PS-9999;Нет цены;;1;шт;Прочее;',
].join('\r\n');

describe('reading CSV from 1C', () => {
  it('Windows-1251 and UTF-8 are told apart; a BOM decides', () => {
    expect(decodeText(cp1251('Цена')).encoding).toBe('windows-1251');
    expect(decodeText(cp1251('Цена')).text).toBe('Цена');
    expect(decodeText(new TextEncoder().encode('Цена')).encoding).toBe('utf-8');
    expect(decodeText(Uint8Array.from([0xef, 0xbb, 0xbf, 0x41])).text).toBe('A');
  });
  it('delimiter and quotes: ; inside quotes does not split the cell', () => {
    expect(detectDelimiter(ONEC_CSV)).toBe(';');
    const rows = parseCsv(ONEC_CSV);
    expect(rows[4][2]).toBe('Смесь Ceresit CM 11; 25 кг'); // пустая строка файла сохраняется
  });
  it('header under the report title rows; «Артикул» wins over «Код»', async () => {
    const t = await readImportFiles([{ name: 'ostatki.csv', bytes: cp1251(ONEC_CSV) }]);
    expect(t.columns[1]).toBe('Артикул');
    expect(t.firstRow).toBe(5);
    expect(suggestMapping(t.columns, t.rows.slice(0, 5))).toEqual(['skip', 'sku', 'title', 'price', 'stock', 'unit', 'category', 'barcode']);
  });
});

describe('drafts and errors', () => {
  it('a row without an article, a duplicate, without a price; a price with kopecks is read correctly', async () => {
    const t = await readImportFiles([{ name: 'ostatki.csv', bytes: cp1251(ONEC_CSV) }]);
    const { drafts, issues } = toDrafts(t, suggestMapping(t.columns, t.rows));
    expect(drafts.map((d) => [d.sku, d.price, d.stock])).toEqual([['PS-0412', 545, 38], ['PS-1120', 1299.9, 12]]);
    expect(issues.map((i) => [i.row, i.code])).toEqual([[7, 'no_sku'], [8, 'duplicate_sku'], [9, 'no_price']]);
    expect(drafts[0]).toMatchObject({ unit: 'мешок', category: 'Сухие смеси', barcode: '4607077160126', row: 5 });
  });
});

describe('Excel', () => {
  it('.xlsx: the data sheet, the header row, values as text', async () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Номенклатура'], [], ['Артикул', 'Наименование', 'Цена', 'Количество'], ['A-1', 'Грунт 10 л', 780, 5], ['A-2', 'Клей', '1 250,50', 0]]), 'ТДСheet');
    const bytes = new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }));
    const t = await readImportFiles([{ name: 'vygruzka.xlsx', bytes }]);
    expect(t.source).toBe('excel');
    expect(t.columns).toEqual(['Артикул', 'Наименование', 'Цена', 'Количество']);
    const { drafts } = toDrafts(t, suggestMapping(t.columns, t.rows));
    expect(drafts.map((d) => [d.sku, d.price, d.stock])).toEqual([['A-1', 780, 5], ['A-2', 1250.5, 0]]);
  });
});

describe('CommerceML (1C «exchange with a website»)', () => {
  const importXml = `<?xml version="1.0" encoding="UTF-8"?><КоммерческаяИнформация ВерсияСхемы="2.05">
    <Классификатор><Группы><Группа><Ид>g1</Ид><Наименование>Сухие смеси</Наименование></Группа></Группы></Классификатор>
    <Каталог><Товары>
      <Товар><Ид>t1</Ид><Артикул>PS-0412</Артикул><Наименование>Смесь CM 11</Наименование><Группы><Ид>g1</Ид></Группы><ШтрихКод>4607077160126</ШтрихКод><БазоваяЕдиница НаименованиеПолное="Мешок">796</БазоваяЕдиница></Товар>
      <Товар><Ид>t2</Ид><Артикул>PS-1120</Артикул><Наименование>Саморез</Наименование></Товар>
    </Товары></Каталог></КоммерческаяИнформация>`;
  const offersXml = `<КоммерческаяИнформация><ПакетПредложений><Предложения>
      <Предложение><Ид>t1</Ид><Цены><Цена><ЦенаЗаЕдиницу>545.00</ЦенаЗаЕдиницу></Цена></Цены><Количество>38</Количество></Предложение>
      <Предложение><Ид>t2#c1</Ид><Цены><Цена><ЦенаЗаЕдиницу>390</ЦенаЗаЕдиницу></Цена></Цены><Количество>0</Количество></Предложение>
    </Предложения></ПакетПредложений></КоммерческаяИнформация>`;
  it('import.xml + offers.xml → the table; the offer id with a characteristic «t2#c1» is the product t2', () => {
    const t = readCommerceML(importXml, offersXml);
    const { drafts } = toDrafts(t, suggestMapping(t.columns, t.rows));
    expect(drafts.map((d) => [d.sku, d.title, d.price, d.stock, d.category ?? ''])).toEqual([['PS-0412', 'Смесь CM 11', 545, 38, 'Сухие смеси'], ['PS-1120', 'Саморез', 390, 0, '']]);
    expect(drafts[0]).toMatchObject({ unit: 'Мешок', barcode: '4607077160126' });
  });
  it('2.08: prices and stock in separate packages; the retail price type; stock summed over warehouses', () => {
    const prices = `<КоммерческаяИнформация><ПакетПредложений>
      <ТипыЦен><ТипЦены><Ид>opt</Ид><Наименование>Оптовая</Наименование></ТипЦены><ТипЦены><Ид>rozn</Ид><Наименование>Розничная</Наименование></ТипЦены></ТипыЦен>
      <Предложения><Предложение><Ид>t1</Ид><Цены><Цена><ИдТипаЦены>opt</ИдТипаЦены><ЦенаЗаЕдиницу>400</ЦенаЗаЕдиницу></Цена><Цена><ИдТипаЦены>rozn</ИдТипаЦены><ЦенаЗаЕдиницу>545</ЦенаЗаЕдиницу></Цена></Цены></Предложение></Предложения>
    </ПакетПредложений></КоммерческаяИнформация>`;
    const rests = `<КоммерческаяИнформация><ПакетПредложений><Предложения>
      <Предложение><Ид>t1</Ид><Остатки><Остаток><Склад><Ид>s1</Ид><Количество>30</Количество></Склад><Склад><Ид>s2</Ид><Количество>8</Количество></Склад></Остаток></Остатки></Предложение>
      <Предложение><Ид>t3</Ид><Артикул>PS-5</Артикул><Наименование>Только в остатках</Наименование><Остатки><Остаток><Количество>2</Количество></Остаток></Остатки></Предложение>
    </Предложения></ПакетПредложений></КоммерческаяИнформация>`;
    const t = readCommerceML(importXml, [prices, rests]);
    const { drafts, issues } = toDrafts(t, suggestMapping(t.columns, t.rows));
    expect(drafts.map((d) => [d.sku, d.price, d.stock])).toEqual([['PS-0412', 545, 38]]);
    expect(issues.map((i) => i.code)).toEqual(['no_price', 'no_price']); // PS-1120 без цены, PS-5 только в остатках
  });
  it('by files: XML is recognised by content', async () => {
    const enc = new TextEncoder();
    const t = await readImportFiles([{ name: 'offers.xml', bytes: enc.encode(offersXml) }, { name: 'import.xml', bytes: enc.encode(importXml) }]);
    expect(t.source).toBe('commerceml');
    expect(t.rows).toHaveLength(2);
  });
});

describe('plan and apply', () => {
  const store = 'Постройка';
  const existing: Record<string, Product> = {
    old: { id: 'old', sku: 'PS-0412', title: 'Старое название', price: '520 ₽', store, status: 'published', image: 'a.jpg', stock: 10 },
    same: { id: 'same', sku: 'PS-7000', title: 'Без изменений', price: '100 ₽', store, status: 'published', image: 'b.jpg', stock: 5 },
    twin: { id: 'twin', sku: 'X', title: 'Саморез у соседа', price: '400 ₽', store: 'Стройландия', status: 'published', image: 'twin.jpg', description: 'Описание соседа', barcode: '4607077160133' },
  };
  const drafts = [
    { row: 5, sku: 'ps-0412', title: 'Новое название', price: 545, stock: 38 },
    { row: 6, sku: 'PS-7000', title: 'Без изменений', price: 100, stock: 5 },
    { row: 7, sku: 'PS-1120', title: 'Саморез', price: 1299.9, barcode: '4607077160133' },
    { row: 8, sku: 'PS-2000', title: 'Без фото', price: 50, oldPrice: 70 },
  ];
  it('the same article: only price and stock; the rest is new; barcode match in another store', () => {
    const plan = planImport(drafts, existing, store);
    expect(plan.update).toEqual([{ draft: drafts[0], productId: 'old', price: ['520 ₽', '545 ₽'], stock: [10, 38] }]);
    expect(plan.unchanged.map((u) => u.productId)).toEqual(['same']);
    expect(plan.create.map((d) => d.sku)).toEqual(['PS-1120', 'PS-2000']);
    expect(plan.similar).toEqual([{ draft: drafts[2], productId: 'twin', store: 'Стройландия' }]);
  });
  it('apply: the title is not overwritten; a confirmed twin gives the photo and description; no photo = draft', () => {
    const plan = planImport(drafts, existing, store);
    const r = applyImport(plan, existing, { reuse: new Set([7]), now: 1 });
    expect(r.products.old).toMatchObject({ title: 'Старое название', price: '545 ₽', stock: 38 });
    const screw = r.products[importedProductId(store, 'PS-1120')];
    expect(screw).toMatchObject({ price: '1 299,90 ₽', image: 'twin.jpg', description: 'Описание соседа', status: 'published' });
    const noPhoto = r.products[importedProductId(store, 'PS-2000')];
    expect(noPhoto).toMatchObject({ status: 'draft', image: '', oldPrice: '70 ₽', badge: 'sale' });
    expect([r.created, r.updated, r.withoutPhoto]).toEqual([2, 1, 1]);
    expect(existing.old.price).toBe('520 ₽'); // исходный каталог не изменён
  });
  it('re-import is idempotent: the same ids, nothing to create', () => {
    const first = applyImport(planImport(drafts, existing, store), existing).products;
    const again = planImport(drafts, first, store);
    expect(again.create).toEqual([]);
    expect(Object.keys(applyImport(again, first).products).length).toBe(Object.keys(first).length);
  });
  it('photos by file name: the article, with case and a «_2» suffix ignored', () => {
    expect(skuFromPhotoName('PS-0412.jpg')).toBe('ps-0412');
    expect(skuFromPhotoName('Фото/PS-0412_2.PNG')).toBe('ps-0412');
    const plan = planImport(drafts, existing, store);
    const r = applyImport(plan, existing, { photos: new Map([['ps-2000', ['data:image/jpeg;base64,AA']]]) });
    expect(r.products[importedProductId(store, 'PS-2000')]).toMatchObject({ status: 'published', image: 'data:image/jpeg;base64,AA' });
    expect(r.products[importedProductId(store, 'PS-2000')]).not.toHaveProperty('images');
  });
  it('which products need photos: new ones without a link or a confirmed twin, and the store\'s own without a photo', () => {
    const withDraft = { ...existing, nophoto: { id: 'nophoto', sku: 'PS-3000', title: 'Без фото', price: '10 ₽', store, status: 'draft', image: '', importedAt: 1 } as Product };
    const plan = planImport([...drafts, { row: 9, sku: 'PS-3000', title: 'Без фото', price: 10 }], withDraft, store);
    expect(photoTargets(plan, withDraft).map((t) => t.sku)).toEqual(['PS-1120', 'PS-2000', 'PS-3000']);
    expect(photoTargets(plan, withDraft, new Set([7])).map((t) => t.sku)).toEqual(['PS-2000', 'PS-3000']); // у двойника есть фото
  });
  it('a re-import with photos: an earlier draft without a photo gets it and becomes visible; a gallery from _2', () => {
    const first = applyImport(planImport(drafts, existing, store), existing, { now: 1 }).products;
    const id = importedProductId(store, 'PS-2000');
    expect(first[id].status).toBe('draft');
    const again = planImport(drafts, first, store);
    expect(again.unchanged.map((u) => u.productId)).toContain(id);
    const r = applyImport(again, first, { photos: new Map([['ps-2000', ['data:a', 'data:b']]]), now: 2 });
    expect(r.products[id]).toMatchObject({ status: 'published', image: 'data:a', images: ['data:a', 'data:b'], importedAt: 2 });
    expect([r.photosAttached, r.published, r.created]).toEqual([1, 1, 0]);
    expect(r.products.same).toBe(first.same); // без изменений и с фото — тот же объект
  });
  it('a product deleted in another tab while the import ran is skipped, not a crash', () => {
    const plan = planImport(drafts, existing, store);
    const { old: _gone, ...rest } = existing;
    expect(applyImport(plan, rest).products).not.toHaveProperty('old');
  });
});

describe('photos', () => {
  it('matching: the path from the file first (even inside a folder of the archive), then the article in the name', () => {
    const targets = [{ sku: 'PS-0412' }, { sku: 'PS-1120', photoRef: 'import_files/ab/abcd-1234.jpg' }, { sku: 'Ж-7', photoRef: 'ж7.png' }];
    const m = matchPhotos([
      'Фото/PS-0412_2.jpg', 'Фото/ps-0412.JPG', 'Выгрузка/import_files/ab/abcd-1234.jpg', 'Фото/Ж7.png',
      'Фото/PS-9999.jpg', '__MACOSX/Фото/._PS-0412.jpg', 'Фото/.DS_Store', 'Фото/readme.txt',
    ], targets);
    expect([...m.bySku]).toEqual([
      ['ps-0412', ['Фото/ps-0412.JPG', 'Фото/PS-0412_2.jpg']],
      ['ps-1120', ['Выгрузка/import_files/ab/abcd-1234.jpg']],
      ['ж-7', ['Фото/Ж7.png']],
    ]);
    expect(m.unmatched).toEqual(['Фото/PS-9999.jpg']);
    expect([isPhotoPath('a/b.webp'), isPhotoPath('__MACOSX/a.jpg'), isPhotoPath('a.gif')]).toEqual([true, false, false]);
  });
  it('a «Фото» cell: a link is the photo, a file name waits for the uploaded photos', () => {
    const t = { source: 'csv' as const, columns: ['Артикул', 'Наименование', 'Цена', 'Фото'], firstRow: 2, rows: [['A', 'Товар', '10', 'https://x.ru/a.jpg'], ['B', 'Товар 2', '20', 'import_files/b.jpg']] };
    const { drafts: d } = toDrafts(t, suggestMapping(t.columns, t.rows));
    expect(d.map((x) => [x.image, x.photoRef])).toEqual([['https://x.ru/a.jpg', undefined], [undefined, 'import_files/b.jpg']]);
    const plan = planImport(d, {}, 'S');
    expect(applyImport(plan, {}).products[importedProductId('S', 'B')]).toMatchObject({ image: '', status: 'draft' });
  });
});

describe('zip archives', () => {
  /* Проводник Windows пишет кириллицу в CP866 без флага UTF-8; fflate читает такое имя как Latin-1 */
  const cp866 = (s: string) => Uint8Array.from([...s].map((ch) => {
    const c = ch.codePointAt(0)!;
    if (c < 0x80) return c;
    if (c >= 0x410 && c <= 0x42f) return c - 0x410 + 0x80;
    if (c >= 0x430 && c <= 0x43f) return c - 0x430 + 0xa0;
    if (c >= 0x440 && c <= 0x44f) return c - 0x440 + 0xe0;
    throw new Error(ch);
  }));
  const latin1 = (b: Uint8Array) => String.fromCharCode(...b);
  it('a Cyrillic name: CP866 or UTF-8 read as Latin-1 is turned back', () => {
    expect(fixZipName(latin1(cp866('Фото/Смесь_2.jpg')))).toBe('Фото/Смесь_2.jpg');
    expect(fixZipName(latin1(new TextEncoder().encode('Фото/PS-1.jpg')))).toBe('Фото/PS-1.jpg');
    expect(fixZipName('Фото/PS-1.jpg')).toBe('Фото/PS-1.jpg'); // уже правильное имя не трогаем
    expect(fixZipName('photo/ps-1.jpg')).toBe('photo/ps-1.jpg');
  });
  it('a zipped 1C export: the tables are read from the archive; photos are listed for later', async () => {
    const enc = new TextEncoder();
    const zip = zipSync({
      'webdata/import.xml': enc.encode(`<КоммерческаяИнформация><Каталог><Товары><Товар><Ид>t1</Ид><Артикул>A-1</Артикул><Наименование>Смесь</Наименование><Картинка>import_files/aa/t1.jpg</Картинка></Товар></Товары></Каталог></КоммерческаяИнформация>`),
      'webdata/offers.xml': enc.encode(`<КоммерческаяИнформация><ПакетПредложений><Предложения><Предложение><Ид>t1</Ид><Цены><Цена><ЦенаЗаЕдиницу>545</ЦенаЗаЕдиницу></Цена></Цены><Количество>3</Количество></Предложение></Предложения></ПакетПредложений></КоммерческаяИнформация>`),
      'webdata/import_files/aa/t1.jpg': new Uint8Array([0xff, 0xd8, 0xff]),
      '__MACOSX/webdata/._import.xml': new Uint8Array([0]),
    });
    const t = await readImportFiles([{ name: 'Выгрузка.zip', bytes: zip }]);
    expect(t.source).toBe('commerceml');
    const { drafts: d } = toDrafts(t, suggestMapping(t.columns, t.rows));
    expect(d).toMatchObject([{ sku: 'A-1', title: 'Смесь', price: 545, stock: 3, photoRef: 'import_files/aa/t1.jpg' }]);
    const photos = (await listArchive(zip)).filter(isPhotoPath);
    expect([...matchPhotos(photos, [{ sku: 'A-1', photoRef: d[0].photoRef }]).bySku]).toEqual([['a-1', ['webdata/import_files/aa/t1.jpg']]]);
  });
  it('an archive without a table is a clear error', async () => {
    const zip = zipSync({ 'photo.jpg': new Uint8Array([1]) });
    await expect(readImportFiles([{ name: 'a.zip', bytes: zip }])).rejects.toThrow('В архиве нет таблицы');
  });
});

describe('what the import remembers', () => {
  it('the mapping per store and file layout; unknown fields are skipped; history newest first', () => {
    const storage = memoryStorage();
    const repo = createLocalImportRepository(storage);
    repo.rememberMapping('Постройка', 'артикул|цена', ['sku', 'price']);
    expect(repo.mapping('Постройка', 'артикул|цена')).toEqual(['sku', 'price']);
    expect(repo.mapping('Другой', 'артикул|цена')).toBeNull();
    storage.setItem('meb_import_mappings', JSON.stringify({ [JSON.stringify(['S', 'x'])]: { mapping: ['sku', 'evil'], at: 1 } }));
    expect(repo.mapping('S', 'x')).toEqual(['sku', 'skip']);
    const rec = (id: string) => ({ id, file: 'f.csv', store: 'S', source: 'csv' as const, at: 1, rows: 1, created: 1, updated: 0, published: 1, withoutPhoto: 0, issues: 0 });
    repo.record(rec('a')); repo.record(rec('b'));
    expect(createLocalImportRepository(storage).history().map((h) => h.id)).toEqual(['b', 'a']);
  });
});
