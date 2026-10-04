/** CSV from 1C and Excel: encoding (UTF-8 or Windows-1251), delimiter (; , tab |), quotes per RFC 4180. */

/** Bytes → text. A BOM decides; otherwise strict UTF-8, and if it doesn't fit, Windows-1251 (as 1C saves). */
export function decodeText(bytes: Uint8Array): { text: string; encoding: string } {
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) return { text: new TextDecoder('utf-8').decode(bytes.subarray(3)), encoding: 'utf-8' };
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return { text: new TextDecoder('utf-16le').decode(bytes.subarray(2)), encoding: 'utf-16le' };
  try {
    return { text: new TextDecoder('utf-8', { fatal: true }).decode(bytes), encoding: 'utf-8' };
  } catch {
    return { text: new TextDecoder('windows-1251').decode(bytes), encoding: 'windows-1251' };
  }
}

/** Splits one CSV record taking quotes into account ("" inside quotes = a quote). */
function splitRecords(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else quoted = false;
      } else cell += c;
    } else if (c === '"' && cell === '') quoted = true;
    else if (c === delimiter) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

/** The delimiter with the most consistent number of columns across the first lines. */
export function detectDelimiter(text: string): string {
  const sample = text.split(/\r?\n/).filter((l) => l.trim()).slice(0, 20).join('\n');
  let best = ';';
  let bestScore = -1;
  for (const d of [';', ',', '\t', '|']) {
    const counts = splitRecords(sample, d).map((r) => r.length).filter((n) => n > 1);
    if (!counts.length) continue;
    const mode = counts.sort((a, b) => counts.filter((x) => x === b).length - counts.filter((x) => x === a).length)[0];
    const score = counts.filter((n) => n === mode).length * mode;
    if (score > bestScore) { bestScore = score; best = d; }
  }
  return best;
}

/** Records of the file, empty ones included, so row numbers in the report match the file. */
export function parseCsv(text: string, delimiter = detectDelimiter(text)): string[][] {
  const rows = splitRecords(text.replace(/^\uFEFF/, ''), delimiter);
  while (rows.length && rows[rows.length - 1].every((c) => c.trim() === '')) rows.pop();
  return rows;
}
