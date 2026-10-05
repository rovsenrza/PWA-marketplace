/**
 * Any supported file → a table. The format is chosen by content, not just the extension.
 * The Excel, XML and unzip libraries load only when such a file comes.
 */
import type { ImportTable } from './types';
import { decodeText, parseCsv } from './csv';
import { findHeaderRow } from './columns';
import { isZipName } from './photos';
import { extractArchive } from './archive';

export interface ImportFileInput { name: string; bytes: Uint8Array }

const isZipLike = (b: Uint8Array) => b[0] === 0x50 && b[1] === 0x4b; // xlsx — это zip
const isOle = (b: Uint8Array) => b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0; // старый .xls

const TABLE_NAME = /\.(xml|csv|txt|xlsx|xls)$/i;
const isServiceName = (name: string) => /(^|\/)__MACOSX\//i.test(name) || /(^|\/)\._/.test(name);

export async function readImportFiles(files: ImportFileInput[]): Promise<ImportTable> {
  /* выгрузка, упакованная в zip: берём из архива таблицы (фото из него — на шаге фото) */
  const zips = files.filter((f) => isZipName(f.name));
  if (zips.length) {
    let inner: ImportFileInput[];
    try {
      inner = (await Promise.all(zips.map((z) => extractArchive(z.bytes, (n) => TABLE_NAME.test(n) && !isServiceName(n))))).flat();
    } catch {
      throw new ImportReadError('Архив повреждён или это не zip');
    }
    inner.push(...files.filter((f) => !isZipName(f.name)));
    if (!inner.length) throw new ImportReadError('В архиве нет таблицы: нужен файл Excel, CSV или выгрузка CommerceML (import.xml, offers.xml)');
    return readImportFiles(inner);
  }
  /* CommerceML: import.xml и/или offers.xml, можно выбрать оба файла сразу */
  const xmls = files.filter((f) => /\.xml$/i.test(f.name)).map((f) => ({ name: f.name, text: decodeText(f.bytes).text }));
  if (xmls.length) {
    const { isCommerceML, readCommerceML } = await import('./commerceml');
    const cml = xmls.filter((x) => isCommerceML(x.text));
    if (!cml.length) throw new ImportReadError('XML-файл не похож на выгрузку CommerceML из 1С');
    /* offers.xml, а с версии 2.08 ещё prices.xml и rests.xml: все пакеты предложений */
    const offers = cml.filter((x) => /<ПакетПредложений[\s>]/.test(x.text)).map((x) => x.text);
    const catalog = cml.find((x) => /<Каталог[\s>]/.test(x.text));
    return readCommerceML(catalog?.text ?? null, offers);
  }
  const f = files[0];
  if (!f) throw new ImportReadError('Файл не выбран');
  if (isZipLike(f.bytes) || isOle(f.bytes) || /\.xlsx?$/i.test(f.name)) return (await import('./excel')).readExcel(f.bytes);
  const { text, encoding } = decodeText(f.bytes);
  const all = parseCsv(text);
  const h = findHeaderRow(all);
  const columns = all[h] ?? [];
  return { source: 'csv', columns, rows: all.slice(h + 1).map((r) => columns.map((_, i) => (r[i] ?? '').trim())), firstRow: h + 2, encoding };
}

export class ImportReadError extends Error {}
