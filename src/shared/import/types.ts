/**
 * Product import (1C, Excel, CSV, CommerceML). Pure logic: the same in the browser (check and preview)
 * and on a server (the background job). Order: read the file → table → column mapping →
 * drafts with errors → plan (create / update / unchanged / similar) → apply to the catalogue.
 */
export type ImportField =
  | 'skip' | 'sku' | 'title' | 'price' | 'oldPrice' | 'stock' | 'unit'
  | 'category' | 'barcode' | 'weight' | 'desc' | 'image' | 'brand';

export const IMPORT_FIELD_LABELS: Record<ImportField, string> = {
  skip: 'Не загружать', sku: 'Артикул', title: 'Название', price: 'Цена', oldPrice: 'Старая цена',
  stock: 'Наличие (остаток)', unit: 'Единица измерения', category: 'Категория', barcode: 'Штрихкод',
  weight: 'Характеристика: вес', desc: 'Описание', image: 'Фото (ссылка)', brand: 'Бренд',
};

export type ImportSource = 'csv' | 'excel' | 'commerceml';

/** A file read into a table: column headers and data rows (text as in the file). */
export interface ImportTable {
  source: ImportSource;
  columns: string[];
  rows: string[][];
  /** row number in the file of the first data row (for error messages) */
  firstRow: number;
  encoding?: string;
  sheet?: string;
}

export interface ProductDraft {
  /** row number in the file */
  row: number;
  sku: string;
  title: string;
  price: number;
  oldPrice?: number;
  stock?: number;
  unit?: string;
  category?: string;
  barcode?: string;
  weight?: string;
  desc?: string;
  /** a link to a photo (http/https) */
  image?: string;
  /** the photo's file name or path from the file (CommerceML «Картинка»): matched with the uploaded photos */
  photoRef?: string;
  brand?: string;
}

export type IssueCode = 'no_title' | 'no_price' | 'bad_price' | 'no_sku' | 'duplicate_sku';
export interface RowIssue { row: number; code: IssueCode; value?: string }

export const ISSUE_LABELS: Record<IssueCode, string> = {
  no_title: 'нет названия', no_price: 'нет цены', bad_price: 'цена не распознана',
  no_sku: 'нет артикула — без него товар не узнать при следующей загрузке', duplicate_sku: 'артикул повторяется в файле',
};
