import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import type { Product } from '../../src/shared/domain/types';
import { decodeText, detectDelimiter, parseCsv } from '../../src/shared/import/csv';
import { findHeaderRow, suggestMapping } from '../../src/shared/import/columns';
import { readCommerceML } from '../../src/shared/import/commerceml';
import { readImportFiles } from '../../src/shared/import/read';
import { applyImport, importedProductId, planImport, skuFromPhotoName, toDrafts } from '../../src/shared/import/plan';

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
    const r = applyImport(plan, existing, { photos: new Map([['ps-2000', 'data:image/jpeg;base64,AA']]) });
    expect(r.products[importedProductId(store, 'PS-2000')]).toMatchObject({ status: 'published', image: 'data:image/jpeg;base64,AA' });
  });
});
