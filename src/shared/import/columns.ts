/** Columns: finding the header row and suggesting a mapping «file column → product field». */
import type { ImportField } from './types';

const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]+/g, ' ').trim();

/** Header names as they occur in 1C, Excel, store spreadsheets. Order matters: the first match wins. */
const ALIASES: Array<[ImportField, string[]]> = [
  ['sku', ['артикул', 'арт', 'код товара', 'sku', 'vendor code', 'код']],
  ['barcode', ['штрихкод', 'штрих код', 'шк', 'ean', 'barcode', 'gtin']],
  ['oldPrice', ['старая цена', 'цена до скидки', 'зачеркнутая цена']],
  ['price', ['цена', 'цена розн', 'цена розничная', 'розничная цена', 'цена продажи', 'price', 'стоимость']],
  ['stock', ['остаток', 'остатки', 'количество', 'кол во', 'наличие', 'в наличии', 'stock', 'qty']],
  ['unit', ['ед изм', 'единица', 'единица измерения', 'базовая единица', 'unit']],
  ['category', ['группа', 'номенклатурная группа', 'категория', 'раздел', 'вид номенклатуры', 'родитель', 'category']],
  ['brand', ['бренд', 'производитель', 'марка', 'brand']],
  ['weight', ['вес', 'вес кг', 'масса', 'weight']],
  ['desc', ['описание', 'полное описание', 'description']],
  ['image', ['фото', 'картинка', 'изображение', 'ссылка на фото', 'image', 'photo', 'url фото']],
  ['title', ['наименование', 'номенклатура', 'название', 'товар', 'полное наименование', 'наименование товара', 'name', 'title']],
];

/** Field and match strength (0 = the most exact alias). «Артикул» is stronger than «Код». */
export function matchHeader(header: string): { field: ImportField; rank: number } {
  const h = norm(header);
  if (!h) return { field: 'skip', rank: Infinity };
  for (const [field, names] of ALIASES) {
    const i = names.indexOf(h);
    if (i >= 0) return { field, rank: i };
  }
  for (const [field, names] of ALIASES) {
    const i = names.findIndex((n) => n.length > 3 && h.startsWith(n));
    if (i >= 0) return { field, rank: 100 + i };
  }
  return { field: 'skip', rank: Infinity };
}

export const fieldForHeader = (header: string): ImportField => matchHeader(header).field;

/**
 * Header row: the first of the first 15 where at least two cells are recognised (1C reports put
 * a title and the period above the table). If there's none, the first non-empty row.
 */
export function findHeaderRow(rows: string[][]): number {
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    if (rows[i].filter((c) => fieldForHeader(c) !== 'skip').length >= 2) return i;
  }
  return Math.max(0, rows.findIndex((r) => r.some((c) => c.trim())));
}

/**
 * Mapping by headers. Each field goes to the column with the strongest match (with «Код» and «Артикул»
 * both present, the article is «Артикул»); an unrecognised column of 12–14 digit numbers is a barcode.
 */
export function suggestMapping(columns: string[], sample: string[][]): ImportField[] {
  const out: ImportField[] = columns.map(() => 'skip');
  const best = new Map<ImportField, { col: number; rank: number }>();
  columns.forEach((col, i) => {
    let { field, rank } = matchHeader(col);
    if (field === 'skip') {
      const values = sample.map((r) => (r[i] ?? '').trim()).filter(Boolean);
      if (values.length && values.every((v) => /^\d{12,14}$/.test(v))) { field = 'barcode'; rank = 500; }
    }
    if (field === 'skip') return;
    const cur = best.get(field);
    if (!cur || rank < cur.rank) best.set(field, { col: i, rank });
  });
  for (const [field, { col }] of best) out[col] = field;
  return out;
}

/** A layout «fingerprint» (headers): to remember the mapping per store and file kind. */
export const layoutKey = (columns: string[]): string => columns.map(norm).join('|');
