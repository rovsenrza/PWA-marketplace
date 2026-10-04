/** Any supported file → a table. The format is chosen by content, not just the extension. */
import type { ImportTable } from './types';
import { decodeText, parseCsv } from './csv';
import { findHeaderRow } from './columns';
import { isCommerceML, readCommerceML } from './commerceml';
import { readExcel } from './excel';

export interface ImportFileInput { name: string; bytes: Uint8Array }

const isZipLike = (b: Uint8Array) => b[0] === 0x50 && b[1] === 0x4b; // xlsx — это zip
const isOle = (b: Uint8Array) => b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0; // старый .xls

export async function readImportFiles(files: ImportFileInput[]): Promise<ImportTable> {
  /* CommerceML: import.xml и/или offers.xml, можно выбрать оба файла сразу */
  const xmls = files.filter((f) => /\.xml$/i.test(f.name)).map((f) => ({ name: f.name, text: decodeText(f.bytes).text }));
  if (xmls.length) {
    const cml = xmls.filter((x) => isCommerceML(x.text));
    if (!cml.length) throw new ImportReadError('XML-файл не похож на выгрузку CommerceML из 1С');
    const offers = cml.find((x) => /<ПакетПредложений[\s>]/.test(x.text));
    const catalog = cml.find((x) => /<Каталог[\s>]/.test(x.text));
    return readCommerceML(catalog?.text ?? null, offers?.text ?? null);
  }
  const f = files[0];
  if (!f) throw new ImportReadError('Файл не выбран');
  if (isZipLike(f.bytes) || isOle(f.bytes) || /\.xlsx?$/i.test(f.name)) return readExcel(f.bytes);
  const { text, encoding } = decodeText(f.bytes);
  const all = parseCsv(text);
  const h = findHeaderRow(all);
  const columns = all[h] ?? [];
  return { source: 'csv', columns, rows: all.slice(h + 1).map((r) => columns.map((_, i) => (r[i] ?? '').trim())), firstRow: h + 2, encoding };
}

export class ImportReadError extends Error {}
