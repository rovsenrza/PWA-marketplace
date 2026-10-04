/** Excel (.xlsx and the old .xls from 1C) via SheetJS. Loaded only when the import is opened. */
import type { ImportTable } from './types';
import { findHeaderRow } from './columns';

export async function readExcel(bytes: Uint8Array): Promise<ImportTable> {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(bytes, { type: 'array', cellDates: false, dense: true });
  /* лист с данными: тот, где больше заполненных строк (в выгрузках бывают пустые служебные листы).
     Пустые строки сохраняются, а номер считается от начала листа: в отчёте — строка как в Excel */
  const filled = (rows: string[][]) => rows.filter((r) => r.some((c) => c !== '')).length;
  let best: { name: string; rows: string[][]; offset: number } | null = null;
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    const offset = ws['!ref'] ? XLSX.utils.decode_range(ws['!ref']).s.r : 0;
    const rows = (XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '', blankrows: true }) as unknown[][])
      .map((r) => r.map((c) => String(c ?? '').trim()));
    if (!best || filled(rows) > filled(best.rows)) best = { name, rows, offset };
  }
  if (!best || !filled(best.rows)) return { source: 'excel', columns: [], rows: [], firstRow: 1 };
  const h = findHeaderRow(best.rows);
  const columns = best.rows[h];
  const rows = best.rows.slice(h + 1);
  return { source: 'excel', columns, rows: rows.map((r) => columns.map((_, i) => r[i] ?? '')), firstRow: best.offset + h + 2, sheet: best.name };
}
