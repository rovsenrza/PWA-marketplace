/**
 * Zip archives: a photo archive, or a 1C export (import.xml, offers.xml, import_files/…) packed as one file.
 * Only the needed entries are decompressed: the names are read first. The unzip library loads on first use.
 */
type Fflate = typeof import('fflate');
let fflate: Promise<Fflate> | undefined;
const lib = () => (fflate ??= import('fflate'));

/**
 * Windows Explorer writes Cyrillic names in CP866 without the UTF-8 flag, and fflate then reads
 * them as Latin-1. Such a name is turned back into bytes and read as UTF-8 (if it is) or CP866.
 */
export function fixZipName(name: string): string {
  if (![...name].some((c) => c.charCodeAt(0) > 127) || [...name].some((c) => c.charCodeAt(0) > 255)) return name;
  const bytes = Uint8Array.from([...name].map((c) => c.charCodeAt(0)));
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { /* не UTF-8 */ }
  try { return new TextDecoder('ibm866').decode(bytes); } catch { return name; }
}

/** Names of the files in the archive (folders and macOS service files excluded). */
export async function listArchive(bytes: Uint8Array): Promise<string[]> {
  const { unzipSync } = await lib();
  const names: string[] = [];
  unzipSync(bytes, { filter: (f) => { if (!f.name.endsWith('/')) names.push(fixZipName(f.name)); return false; } });
  return names.filter((n) => !/(^|\/)__MACOSX\//i.test(n) && !/(^|\/)\._/.test(n));
}

/** The entries whose (fixed) names pass the filter. */
export async function extractArchive(bytes: Uint8Array, keep: (name: string) => boolean): Promise<Array<{ name: string; bytes: Uint8Array }>> {
  const { unzipSync } = await lib();
  const files = unzipSync(bytes, { filter: (f) => !f.name.endsWith('/') && keep(fixZipName(f.name)) });
  return Object.entries(files).map(([name, data]) => ({ name: fixZipName(name), bytes: data }));
}
